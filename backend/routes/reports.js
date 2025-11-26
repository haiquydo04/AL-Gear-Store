const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');
const { authenticate, authorize } = require('../middleware/auth');

// Get all reports (Manager/Admin only)
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'manager') {
      query.manager_id = req.user.userId;
    }

    const reports = await Report.find(query)
      .populate('manager_id', 'full_name')
      .sort({ created_at: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy báo cáo', error: error.message });
  }
});

// Generate sales report
router.post('/generate', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { report_type, report_period } = req.body;

    // Calculate date range based on report type and period
    let startDate, endDate;
    const now = new Date();
    
    switch (report_type) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = now;
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const orders = await Order.find({
      order_date: { $gte: startDate, $lt: endDate },
      status: { $ne: 'cancelled' }
    });

    const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = orders.length;

    // Get top products
    const orderDetails = await OrderDetail.find({
      order_id: { $in: orders.map(o => o._id) }
    }).populate('product_id');

    const productSales = {};
    orderDetails.forEach(detail => {
      const productId = detail.product_id._id.toString();
      if (!productSales[productId]) {
        productSales[productId] = {
          product: detail.product_id,
          quantity: 0,
          revenue: 0
        };
      }
      productSales[productId].quantity += detail.quantity;
      productSales[productId].revenue += detail.quantity * detail.price;
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const report = await Report.create({
      manager_id: req.user.userId,
      report_type,
      report_period: report_period || `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      total_sales: totalSales
    });

    res.json({
      message: 'Tạo báo cáo thành công',
      report,
      statistics: {
        totalSales,
        totalOrders,
        topProducts,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo báo cáo', error: error.message });
  }
});

// Get report by ID
router.get('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('manager_id', 'full_name');

    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    }

    // Check permission
    if (req.user.role === 'manager' && report.manager_id._id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy báo cáo', error: error.message });
  }
});

module.exports = router;


