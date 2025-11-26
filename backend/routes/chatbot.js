const express = require('express');
const router = express.Router();
const ChatbotLog = require('../models/ChatbotLog');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { optionalAuth } = require('../middleware/auth');

// Simple chatbot response (can be enhanced with AI in the future)
const getChatbotResponse = async (message) => {
  const lowerMessage = message.toLowerCase();

  // Product search
  if (lowerMessage.includes('laptop') || lowerMessage.includes('máy tính xách tay')) {
    const products = await Product.find({
      $or: [
        { name: { $regex: 'laptop', $options: 'i' } },
        { name: { $regex: 'máy tính', $options: 'i' } }
      ]
    }).limit(3);
    return `Chúng tôi có ${products.length} sản phẩm laptop. Bạn có muốn xem chi tiết không?`;
  }

  if (lowerMessage.includes('điện thoại') || lowerMessage.includes('phone') || lowerMessage.includes('smartphone')) {
    const products = await Product.find({
      $or: [
        { name: { $regex: 'điện thoại', $options: 'i' } },
        { name: { $regex: 'iphone', $options: 'i' } },
        { name: { $regex: 'samsung', $options: 'i' } }
      ]
    }).limit(3);
    return `Chúng tôi có nhiều dòng điện thoại như iPhone, Samsung, Xiaomi. Bạn muốn xem sản phẩm nào?`;
  }

  // Price questions
  if (lowerMessage.includes('giá') || lowerMessage.includes('price')) {
    return 'Giá sản phẩm được hiển thị trên trang chi tiết. Bạn có thể tìm kiếm sản phẩm để xem giá cụ thể.';
  }

  // Shipping questions
  if (lowerMessage.includes('giao hàng') || lowerMessage.includes('ship') || lowerMessage.includes('vận chuyển')) {
    return 'Chúng tôi giao hàng toàn quốc, miễn phí ship cho đơn hàng trên 500.000 VNĐ. Thời gian giao hàng từ 2-5 ngày.';
  }

  // Payment questions
  if (lowerMessage.includes('thanh toán') || lowerMessage.includes('payment') || lowerMessage.includes('trả góp')) {
    return 'Chúng tôi hỗ trợ thanh toán bằng tiền mặt, thẻ tín dụng, chuyển khoản và ví điện tử. Có hỗ trợ trả góp 0% lãi suất.';
  }

  // Warranty questions
  if (lowerMessage.includes('bảo hành') || lowerMessage.includes('warranty')) {
    return 'Tất cả sản phẩm đều có bảo hành chính hãng từ 12-24 tháng tùy sản phẩm. Bạn có thể đổi trả trong vòng 7 ngày nếu sản phẩm còn nguyên vẹn.';
  }

  // Return/Exchange questions
  if (lowerMessage.includes('đổi trả') || lowerMessage.includes('return') || lowerMessage.includes('hoàn trả')) {
    return 'Chúng tôi có chính sách đổi trả trong vòng 7 ngày nếu sản phẩm còn nguyên vẹn, có hóa đơn và không bị hỏng do lỗi người dùng.';
  }

  // Greeting
  if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello') || lowerMessage.includes('chào')) {
    return 'Xin chào! Tôi có thể giúp bạn tìm sản phẩm, trả lời câu hỏi về sản phẩm, hoặc hỗ trợ đặt hàng. Bạn cần hỗ trợ gì?';
  }

  // Help
  if (lowerMessage.includes('giúp') || lowerMessage.includes('help') || lowerMessage.includes('hỗ trợ')) {
    return 'Tôi có thể giúp bạn:\n- Tìm kiếm sản phẩm\n- Trả lời câu hỏi về giá, bảo hành, giao hàng\n- Hỗ trợ đặt hàng\nBạn muốn biết gì?';
  }

  // Default response
  return 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi về sản phẩm, giá cả, giao hàng, thanh toán, hoặc bảo hành. Tôi sẽ cố gắng giúp bạn!';
};

// Chat with chatbot
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!message || !session_id) {
      return res.status(400).json({ message: 'Thiếu thông tin message hoặc session_id' });
    }

    const response = await getChatbotResponse(message);

    // Log the interaction
    await ChatbotLog.create({
      user_id: req.user?.userId || null,
      session_id,
      message,
      response
    });

    res.json({ response });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi chatbot', error: error.message });
  }
});

// Get chatbot logs (for future AI training)
router.get('/logs', optionalAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      query.user_id = req.user.userId;
    } else {
      query.session_id = req.query.session_id;
    }

    const logs = await ChatbotLog.find(query)
      .sort({ created_at: -1 })
      .limit(50);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy log chatbot', error: error.message });
  }
});

module.exports = router;


