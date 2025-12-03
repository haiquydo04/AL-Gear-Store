const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

// Import models
const Role = require('../models/Role');
const Account = require('../models/Account');
const UserProfile = require('../models/UserProfile');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const GuestCart = require('../models/GuestCart');
const GuestCartItem = require('../models/GuestCartItem');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Report = require('../models/Report');
const ChatbotLog = require('../models/ChatbotLog');
const RolePermission = require('../models/RolePermission');

// Vietnamese mock data
const vietnameseNames = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung',
  'Hoàng Văn Đức', 'Vũ Thị Em', 'Đặng Văn Phong', 'Bùi Thị Hương',
  'Đỗ Văn Hùng', 'Ngô Thị Lan', 'Lý Văn Minh', 'Võ Thị Nga',
  'Phan Văn Oanh', 'Trương Thị Phương', 'Đinh Văn Quang', 'Lưu Thị Quỳnh',
  'Mai Văn Sơn', 'Hồ Thị Thanh', 'Tôn Văn Tuấn', 'Chu Thị Uyên'
];

const vietnameseAddresses = [
  '123 Đường Lê Lợi, Quận 1, TP.HCM',
  '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
  '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
  '321 Đường Võ Văn Tần, Quận 3, TP.HCM',
  '654 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
  '987 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
  '147 Đường Nguyễn Trãi, Quận 1, TP.HCM',
  '258 Đường Lý Tự Trọng, Quận 1, TP.HCM',
  '369 Đường Pasteur, Quận 3, TP.HCM',
  '741 Đường Nam Kỳ Khởi Nghĩa, Quận 3, TP.HCM',
  '852 Đường Hai Bà Trưng, Quận 1, TP.HCM',
  '963 Đường Đồng Khởi, Quận 1, TP.HCM',
  '159 Đường Nguyễn Đình Chiểu, Quận 3, TP.HCM',
  '357 Đường Lê Văn Việt, Quận 9, TP.HCM',
  '468 Đường Phạm Văn Đồng, Quận Thủ Đức, TP.HCM'
];

const productNames = {
  laptop: [
    'Laptop Dell XPS 13', 'Laptop MacBook Pro M2', 'Laptop ASUS ROG Strix',
    'Laptop HP Pavilion', 'Laptop Lenovo ThinkPad', 'Laptop Acer Predator',
    'Laptop MSI Gaming', 'Laptop Razer Blade', 'Laptop Surface Pro',
    'Laptop Samsung Galaxy Book', 'Laptop LG Gram', 'Laptop Huawei MateBook'
  ],
  phone: [
    'iPhone 15 Pro Max', 'Samsung Galaxy S24 Ultra', 'Xiaomi 14 Pro',
    'OPPO Find X7', 'Vivo X100 Pro', 'OnePlus 12', 'Google Pixel 8 Pro',
    'Huawei P60 Pro', 'Realme GT 5 Pro', 'Nothing Phone 2',
    'Sony Xperia 1 V', 'Motorola Edge 40 Pro'
  ],
  computer: [
    'PC Gaming Intel i9 RTX 4090', 'PC Workstation AMD Ryzen 9',
    'PC Mini ITX Intel i7', 'PC All-in-One Dell', 'PC Tower HP',
    'PC Gaming AMD Ryzen 7', 'PC Intel NUC', 'PC ASUS ROG',
    'PC Lenovo ThinkCentre', 'PC Acer Aspire', 'PC MSI Trident',
    'PC Corsair One'
  ],
  accessory: [
    'Bàn phím cơ Logitech MX', 'Chuột không dây Razer', 'Tai nghe Sony WH-1000XM5',
    'Loa JBL Charge 5', 'Ổ cứng SSD Samsung 1TB', 'USB 3.0 SanDisk 128GB',
    'Webcam Logitech C920', 'Microphone Blue Yeti', 'Bàn phím cơ Keychron',
    'Chuột gaming SteelSeries', 'Tai nghe gaming HyperX', 'Loa Bluetooth Anker'
  ]
};

const productDescriptions = {
  laptop: 'Laptop hiện đại với hiệu năng mạnh mẽ, màn hình sắc nét, pin lâu, phù hợp cho công việc và giải trí.',
  phone: 'Điện thoại thông minh với camera chuyên nghiệp, chip xử lý mạnh, màn hình AMOLED, pin lớn và sạc nhanh.',
  computer: 'Máy tính để bàn hiệu năng cao, phù hợp cho gaming và làm việc chuyên nghiệp với card đồ họa mạnh.',
  accessory: 'Phụ kiện công nghệ chất lượng cao, tương thích với nhiều thiết bị, thiết kế đẹp và bền bỉ.'
};

const origins = ['Việt Nam', 'Singapore', 'Malaysia', 'Trung Quốc', 'Mỹ', 'Nhật Bản', 'Hàn Quốc'];

const makeProductCode = (prefix, index) => `${prefix}${String(index + 1).padStart(3, '0')}`;

const reviewComments = [
  'Sản phẩm rất tốt, đúng như mô tả!',
  'Giao hàng nhanh, đóng gói cẩn thận.',
  'Chất lượng vượt mong đợi, rất hài lòng.',
  'Sản phẩm đẹp nhưng giá hơi cao.',
  'Tốt nhưng cần cải thiện thêm một số chi tiết.',
  'Rất ưng ý, sẽ mua lại lần sau.',
  'Sản phẩm tốt, phù hợp với nhu cầu.',
  'Đóng gói đẹp, sản phẩm nguyên vẹn.',
  'Dịch vụ chăm sóc khách hàng tốt.',
  'Sản phẩm chất lượng, giá cả hợp lý.',
  'Mua được sản phẩm tốt với giá rẻ.',
  'Đáng đồng tiền bỏ ra, rất hài lòng.'
];

const chatbotMessages = [
  { message: 'Xin chào, bạn có thể giúp tôi không?', response: 'Xin chào! Tôi có thể giúp bạn tìm sản phẩm, trả lời câu hỏi về sản phẩm, hoặc hỗ trợ đặt hàng. Bạn cần hỗ trợ gì?' },
  { message: 'Bạn có laptop nào tốt không?', response: 'Chúng tôi có nhiều dòng laptop chất lượng như Dell XPS, MacBook Pro, ASUS ROG. Bạn muốn xem laptop nào?' },
  { message: 'Giá iPhone 15 Pro Max là bao nhiêu?', response: 'iPhone 15 Pro Max có giá từ 30.000.000 VNĐ. Bạn có muốn xem chi tiết sản phẩm không?' },
  { message: 'Làm sao để đặt hàng?', response: 'Bạn có thể thêm sản phẩm vào giỏ hàng và thanh toán. Hoặc đăng ký tài khoản để được hỗ trợ tốt hơn.' },
  { message: 'Bạn có chính sách đổi trả không?', response: 'Chúng tôi có chính sách đổi trả trong vòng 7 ngày nếu sản phẩm còn nguyên vẹn và có hóa đơn.' },
  { message: 'Sản phẩm có bảo hành không?', response: 'Tất cả sản phẩm đều có bảo hành chính hãng từ 12-24 tháng tùy sản phẩm.' },
  { message: 'Bạn ship hàng ở đâu?', response: 'Chúng tôi giao hàng toàn quốc, miễn phí ship cho đơn hàng trên 500.000 VNĐ.' },
  { message: 'Có thể trả góp không?', response: 'Có, chúng tôi hỗ trợ trả góp 0% lãi suất qua các ngân hàng đối tác.' }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/al_gear_store');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Role.deleteMany({});
    await Account.deleteMany({});
    await UserProfile.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await Cart.deleteMany({});
    await CartItem.deleteMany({});
    await GuestCart.deleteMany({});
    await GuestCartItem.deleteMany({});
    await Order.deleteMany({});
    await OrderDetail.deleteMany({});
    await Report.deleteMany({});
    await ChatbotLog.deleteMany({});
    await RolePermission.deleteMany({});

    // 1. Seed Roles
    console.log('📝 Seeding Roles...');
    const roles = await Role.insertMany([
      { role_name: 'admin', description: 'Quản trị viên hệ thống' },
      { role_name: 'manager', description: 'Quản lý cửa hàng' },
      { role_name: 'customer', description: 'Khách hàng' },
      { role_name: 'guest', description: 'Khách vãng lai' }
    ]);
    console.log(`✅ Created ${roles.length} roles`);

    // 2. Seed Role Permissions
    console.log('📝 Seeding Role Permissions...');
    const permissions = [
      'manage_users', 'manage_products', 'manage_categories', 'manage_orders',
      'manage_reviews', 'view_reports', 'manage_reports', 'chatbot_access'
    ];
    const rolePermissions = [];
    for (const role of roles) {
      for (const perm of permissions) {
        let isAllowed = false;
        if (role.role_name === 'admin') {
          isAllowed = true;
        } else if (role.role_name === 'manager') {
          isAllowed = ['manage_products', 'manage_categories', 'manage_orders', 'manage_reviews', 'view_reports', 'manage_reports', 'chatbot_access'].includes(perm);
        } else if (role.role_name === 'customer') {
          isAllowed = ['chatbot_access'].includes(perm);
        }
        rolePermissions.push({ role_id: role._id, permission_key: perm, is_allowed: isAllowed });
      }
    }
    await RolePermission.insertMany(rolePermissions);
    console.log(`✅ Created ${rolePermissions.length} role permissions`);

    // 3. Seed Accounts and User Profiles
    console.log('📝 Seeding Accounts and User Profiles...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    const accounts = [];
    const userProfiles = [];

    // Admin account
    const adminAccount = await Account.create({
      username: 'admin',
      password: hashedPassword,
      role_id: roles.find(r => r.role_name === 'admin')._id,
      status: 'active'
    });
    const adminProfile = await UserProfile.create({
      account_id: adminAccount._id,
      full_name: 'Nguyễn Văn Admin',
      email: 'admin@algearstore.com',
      phone: '0901234567',
      address: vietnameseAddresses[0]
    });
    accounts.push(adminAccount);
    userProfiles.push(adminProfile);

    // Manager accounts (3 managers)
    for (let i = 0; i < 3; i++) {
      const managerAccount = await Account.create({
        username: `manager${i + 1}`,
        password: hashedPassword,
        role_id: roles.find(r => r.role_name === 'manager')._id,
        status: 'active'
      });
      const managerProfile = await UserProfile.create({
        account_id: managerAccount._id,
        full_name: vietnameseNames[i + 1],
        email: `manager${i + 1}@algearstore.com`,
        phone: `090${1000000 + i}`,
        address: vietnameseAddresses[i + 1]
      });
      accounts.push(managerAccount);
      userProfiles.push(managerProfile);
    }

    // Customer accounts (15 customers)
    for (let i = 0; i < 15; i++) {
      const customerAccount = await Account.create({
        username: `customer${i + 1}`,
        password: hashedPassword,
        role_id: roles.find(r => r.role_name === 'customer')._id,
        status: 'active'
      });
      const customerProfile = await UserProfile.create({
        account_id: customerAccount._id,
        full_name: vietnameseNames[i + 4],
        email: `customer${i + 1}@gmail.com`,
        phone: `091${1000000 + i}`,
        address: vietnameseAddresses[i + 4] || vietnameseAddresses[i % vietnameseAddresses.length]
      });
      accounts.push(customerAccount);
      userProfiles.push(customerProfile);
    }

    console.log(`✅ Created ${accounts.length} accounts and ${userProfiles.length} user profiles`);

    // 4. Seed Categories
    console.log('📝 Seeding Categories...');
    const categories = await Category.insertMany([
      { category_name: 'Laptop', code: 'LAPTOP', description: 'Máy tính xách tay các loại' },
      { category_name: 'Điện thoại', code: 'PHONE', description: 'Smartphone và điện thoại di động' },
      { category_name: 'Máy tính', code: 'PC', description: 'Máy tính để bàn và PC' },
      { category_name: 'Phụ kiện', code: 'ACCESS', description: 'Phụ kiện công nghệ và linh kiện' }
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // 5. Seed Products (at least 10 per category)
    console.log('📝 Seeding Products...');
    const products = [];
    const managers = userProfiles.filter(p => {
      const account = accounts.find(a => a._id.toString() === p.account_id.toString());
      return account && account.role_id.toString() === roles.find(r => r.role_name === 'manager')._id.toString();
    });

    // Laptop products
    for (let i = 0; i < 12; i++) {
      const product = await Product.create({
        category_id: categories.find(c => c.category_name === 'Laptop')._id,
        manager_id: managers[i % managers.length]._id,
        code: makeProductCode('LAP', i),
        name: productNames.laptop[i],
        short_description: 'Laptop cao cấp tối ưu cho công việc và giải trí',
        description: productDescriptions.laptop,
        details: 'CPU Intel thế hệ mới, RAM 16GB, SSD NVMe, màn hình 2K, Wi-Fi 6E',
        price: 15000000 + (i * 2000000),
        stock: Math.floor(Math.random() * 50) + 10,
        warranty_months: 24,
        origin: origins[i % origins.length],
        image_url: `https://picsum.photos/400/300?random=${i + 1}`
      });
      products.push(product);
    }

    // Phone products
    for (let i = 0; i < 12; i++) {
      const product = await Product.create({
        category_id: categories.find(c => c.category_name === 'Điện thoại')._id,
        manager_id: managers[i % managers.length]._id,
        code: makeProductCode('PHN', i),
        name: productNames.phone[i],
        short_description: 'Smartphone flagship camera AI',
        description: productDescriptions.phone,
        details: 'Màn AMOLED 120Hz, camera 50MP, chipset 4nm, sạc nhanh 65W',
        price: 10000000 + (i * 1500000),
        stock: Math.floor(Math.random() * 50) + 10,
        warranty_months: 18,
        origin: origins[(i + 2) % origins.length],
        image_url: `https://picsum.photos/400/300?random=${i + 20}`
      });
      products.push(product);
    }

    // Computer products
    for (let i = 0; i < 12; i++) {
      const product = await Product.create({
        category_id: categories.find(c => c.category_name === 'Máy tính')._id,
        manager_id: managers[i % managers.length]._id,
        code: makeProductCode('PC', i),
        name: productNames.computer[i],
        short_description: 'PC gaming/workstation lắp sẵn',
        description: productDescriptions.computer,
        details: 'Card RTX 40 series, PSU 80+ Gold, tản nhiệt nước AIO, case ARGB',
        price: 20000000 + (i * 3000000),
        stock: Math.floor(Math.random() * 30) + 5,
        warranty_months: 36,
        origin: 'Việt Nam',
        image_url: `https://picsum.photos/400/300?random=${i + 40}`
      });
      products.push(product);
    }

    // Accessory products
    for (let i = 0; i < 12; i++) {
      const product = await Product.create({
        category_id: categories.find(c => c.category_name === 'Phụ kiện')._id,
        manager_id: managers[i % managers.length]._id,
        code: makeProductCode('ACC', i),
        name: productNames.accessory[i],
        short_description: 'Phụ kiện chính hãng cho hệ sinh thái AL',
        description: productDescriptions.accessory,
        details: 'Bảo hành chính hãng, tương thích đa nền tảng, hỗ trợ đổi mới 1-1',
        price: 500000 + (i * 200000),
        stock: Math.floor(Math.random() * 100) + 20,
        warranty_months: 12,
        origin: origins[(i + 3) % origins.length],
        image_url: `https://picsum.photos/400/300?random=${i + 60}`
      });
      products.push(product);
    }

    console.log(`✅ Created ${products.length} products`);

    // 6. Seed Reviews (at least 10)
    console.log('📝 Seeding Reviews...');
    const customers = userProfiles.filter(p => {
      const account = accounts.find(a => a._id.toString() === p.account_id.toString());
      return account && account.role_id.toString() === roles.find(r => r.role_name === 'customer')._id.toString();
    });

    const reviews = [];
    for (let i = 0; i < 30; i++) {
      const review = await Review.create({
        product_id: products[Math.floor(Math.random() * products.length)]._id,
        user_id: customers[Math.floor(Math.random() * customers.length)]._id,
        rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
        comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date in last 90 days
      });
      reviews.push(review);
    }
    console.log(`✅ Created ${reviews.length} reviews`);

    // 7. Seed Carts and Cart Items (FIXED: avoid duplicate cart_id+product_id)
    console.log('📝 Seeding Carts...');
    const carts = [];
    for (let i = 0; i < 10; i++) {
      const cart = await Cart.create({
        user_id: customers[i]._id,
        total_price: 0
      });
      carts.push(cart);

      // Add items to cart
      const numItems = Math.floor(Math.random() * 5) + 1;
      let totalPrice = 0;

      // Use a Set to avoid duplicate product in the same cart
      const usedProducts = new Set();

      for (let j = 0; j < numItems; j++) {
        let product;
        // pick a product that's not already used in this cart
        let attempts = 0;
        do {
          product = products[Math.floor(Math.random() * products.length)];
          attempts++;
          // safety: if we've attempted many times and products list is small, break to avoid infinite loop
          if (attempts > products.length * 2) break;
        } while (usedProducts.has(product._id.toString()));

        // mark as used
        usedProducts.add(product._id.toString());

        const quantity = Math.floor(Math.random() * 3) + 1;
        const subtotal = product.price * quantity;
        totalPrice += subtotal;

        await CartItem.create({
          cart_id: cart._id,
          product_id: product._id,
          quantity: quantity,
          subtotal: subtotal
        });
      }

      cart.total_price = totalPrice;
      await cart.save();
    }
    console.log(`✅ Created ${carts.length} carts`);

    // 8. Seed Guest Carts
    console.log('📝 Seeding Guest Carts...');
    const guestCarts = [];
    for (let i = 0; i < 10; i++) {
      const guestCart = await GuestCart.create({
        session_id: `session_${i + 1}_${Date.now()}`,
        total_price: 0,
        expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      guestCarts.push(guestCart);

      const numItems = Math.floor(Math.random() * 4) + 1;
      let totalPrice = 0;
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        const subtotal = product.price * quantity;
        totalPrice += subtotal;

        await GuestCartItem.create({
          guest_cart_id: guestCart._id,
          product_id: product._id,
          quantity: quantity,
          subtotal: subtotal
        });
      }
      guestCart.total_price = totalPrice;
      await guestCart.save();
    }
    console.log(`✅ Created ${guestCarts.length} guest carts`);

    // 9. Seed Orders and Order Details
    console.log('📝 Seeding Orders...');
    const orders = [];
    const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const paymentMethods = ['cash', 'credit_card', 'bank_transfer', 'e_wallet'];
    const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    for (let i = 0; i < 20; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const numItems = Math.floor(Math.random() * 5) + 1;
      let totalAmount = 0;
      const orderDetails = [];

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = product.price;
        totalAmount += price * quantity;
        orderDetails.push({ product, quantity, price });
      }

      const order = await Order.create({
        user_id: customer._id,
        total_amount: totalAmount,
        order_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        payment_status: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
        shipping_name: customer.full_name,
        shipping_phone: customer.phone || '0900000000',
        shipping_address: customer.address || 'TP. HCM'
      });
      orders.push(order);

      for (const detail of orderDetails) {
        await OrderDetail.create({
          order_id: order._id,
          product_id: detail.product._id,
          quantity: detail.quantity,
          price: detail.price
        });
      }
    }
    console.log(`✅ Created ${orders.length} orders`);

    // 10. Seed Reports
    console.log('📝 Seeding Reports...');
    const reports = [];
    const reportTypes = ['daily', 'weekly', 'monthly', 'yearly'];
    for (let i = 0; i < 15; i++) {
      const report = await Report.create({
        manager_id: managers[Math.floor(Math.random() * managers.length)]._id,
        report_type: reportTypes[Math.floor(Math.random() * reportTypes.length)],
        report_period: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
        total_sales: Math.floor(Math.random() * 500000000) + 10000000,
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      });
      reports.push(report);
    }
    console.log(`✅ Created ${reports.length} reports`);

    // 11. Seed Chatbot Logs
    console.log('📝 Seeding Chatbot Logs...');
    const chatbotLogs = [];
    for (let i = 0; i < 25; i++) {
      const isCustomer = Math.random() > 0.3;
      const log = await ChatbotLog.create({
        user_id: isCustomer ? customers[Math.floor(Math.random() * customers.length)]._id : null,
        session_id: `session_${i + 1}_${Date.now()}`,
        message: chatbotMessages[Math.floor(Math.random() * chatbotMessages.length)].message,
        response: chatbotMessages[Math.floor(Math.random() * chatbotMessages.length)].response,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
      chatbotLogs.push(log);
    }
    console.log(`✅ Created ${chatbotLogs.length} chatbot logs`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Roles: ${roles.length}`);
    console.log(`   - Accounts: ${accounts.length}`);
    console.log(`   - User Profiles: ${userProfiles.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log(`   - Carts: ${carts.length}`);
    console.log(`   - Guest Carts: ${guestCarts.length}`);
    console.log(`   - Orders: ${orders.length}`);
    console.log(`   - Reports: ${reports.length}`);
    console.log(`   - Chatbot Logs: ${chatbotLogs.length}`);
    console.log('\n🔑 Default login credentials:');
    console.log('   Admin: username=admin, password=123456');
    console.log('   Manager: username=manager1, password=123456');
    console.log('   Customer: username=customer1, password=123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
