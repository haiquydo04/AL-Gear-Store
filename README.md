# AL Gear Store - MERN E-commerce Website

Website thương mại điện tử bán các sản phẩm công nghệ (laptop, điện thoại, máy tính, phụ kiện) được xây dựng bằng MERN Stack (MongoDB, Express, React, Node.js).

## Tính năng

### Vai trò và quyền hạn

- **Admin**: Quản lý danh mục, sản phẩm, đánh giá, tài khoản người dùng
- **Manager/Seller**: Quản lý sản phẩm, danh mục, đánh giá, khách hàng, đơn hàng, báo cáo
- **Customer**: Tìm kiếm sản phẩm, xem chi tiết, thêm vào giỏ hàng, xem đơn hàng, đăng nhập, thanh toán, xóa sản phẩm trong giỏ hàng, đánh giá sản phẩm, quản lý thông tin cá nhân, Chatbot AI
- **Guest**: Tìm kiếm sản phẩm, xem danh mục, xem sản phẩm, thêm vào giỏ hàng tạm, xem giỏ hàng, Chatbot AI, đăng ký tài khoản

## Cấu trúc dự án

```
AL Gear Store/
├── backend/
│   ├── models/          # MongoDB models (15 collections)
│   ├── routes/          # Express routes
│   ├── middleware/      # Authentication & authorization
│   ├── config/          # Database configuration
│   ├── scripts/         # Seed scripts
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Auth)
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## Cài đặt và chạy

### Yêu cầu

- Node.js (v14 trở lên)
- MongoDB (local hoặc MongoDB Atlas)
- npm hoặc yarn

### Backend

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` (copy từ `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/al_gear_store
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

4. Chạy seed script để tạo dữ liệu mẫu:
```bash
npm run seed
```

5. Khởi động server:
```bash
npm run dev
```

Backend sẽ chạy tại `http://localhost:5000`

### Frontend

1. Di chuyển vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Khởi động development server:
```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

## Tài khoản demo

Sau khi chạy seed script, bạn có thể đăng nhập với các tài khoản sau:

- **Admin**: 
  - Username: `admin`
  - Password: `123456`

- **Manager**: 
  - Username: `manager1`
  - Password: `123456`

- **Customer**: 
  - Username: `customer1`
  - Password: `123456`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `POST /api/auth/activate` - Kích hoạt tài khoản mới
- `POST /api/auth/forgot-password` - Gửi yêu cầu quên mật khẩu
- `POST /api/auth/reset-password` - Xác nhận token và nhận mật khẩu mới
- `POST /api/auth/change-password` - Đổi mật khẩu khi đã đăng nhập

### Products
- `GET /api/products` - Lấy danh sách sản phẩm (có filter, search, pagination)
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm (Manager/Admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Manager/Admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (Admin)

### Categories
- `GET /api/categories` - Lấy danh sách danh mục (hỗ trợ search theo tên/mã)
- `POST /api/categories` - Tạo danh mục (Manager/Admin) với ràng buộc mã code duy nhất
- `PUT /api/categories/:id` - Cập nhật danh mục (Manager/Admin)
- `DELETE /api/categories/:id` - Xóa danh mục (Admin, chỉ khi chưa gắn sản phẩm)

### Cart
- `GET /api/cart` - Lấy giỏ hàng của user
- `POST /api/cart/items` - Thêm sản phẩm vào giỏ hàng
- `PUT /api/cart/items/:id` - Cập nhật số lượng
- `DELETE /api/cart/items/:id` - Xóa sản phẩm khỏi giỏ hàng

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `POST /api/orders` - Tạo đơn hàng từ giỏ hàng
- `PATCH /api/orders/:id/status` - Cập nhật trạng thái đơn hàng (Manager/Admin)
- `POST /api/orders/:id/cancel` - Khách hàng hủy đơn trước khi xác nhận

### Reviews
- `GET /api/reviews/product/:productId` - Lấy đánh giá của sản phẩm
- `POST /api/reviews` - Tạo đánh giá
- `PUT /api/reviews/:id` - Cập nhật đánh giá
- `DELETE /api/reviews/:id` - Xóa đánh giá
- `GET /api/reviews/admin` - Danh sách đánh giá cho quản trị (search theo nội dung/sản phẩm/người dùng)
- `PATCH /api/reviews/:id/toggle-visibility` - Ẩn/hiện đánh giá

### Chatbot
- `POST /api/chatbot/chat` - Gửi tin nhắn đến chatbot
- `GET /api/chatbot/logs` - Lấy lịch sử chat

### Users (Admin)
- `GET /api/users` - Danh sách tài khoản (hỗ trợ search & filter vai trò)
- `POST /api/users` - Tạo tài khoản mới
- `PATCH /api/users/:id/status` - Cập nhật trạng thái hoặc vai trò
- `DELETE /api/users/:id` - Xóa tài khoản chưa kích hoạt

## Database Schema

Hệ thống sử dụng 15 collections:

1. **role** - Vai trò người dùng
2. **account** - Tài khoản đăng nhập
3. **user_profile** - Thông tin người dùng
4. **category** - Danh mục sản phẩm
5. **product** - Sản phẩm
6. **review** - Đánh giá sản phẩm
7. **cart** - Giỏ hàng của user
8. **cart_item** - Sản phẩm trong giỏ hàng
9. **guest_cart** - Giỏ hàng của khách
10. **guest_cart_item** - Sản phẩm trong giỏ hàng khách
11. **orders** - Đơn hàng
12. **order_detail** - Chi tiết đơn hàng
13. **report** - Báo cáo
14. **chatbot_log** - Log chatbot
15. **role_permission** - Quyền của vai trò

## Tính năng AI (cho tương lai)

- Nhận diện và phân loại sản phẩm từ hình ảnh
- Gợi ý sản phẩm dựa trên hành vi người dùng
- Chatbot AI trả lời tự động về sản phẩm (đã có cơ bản)
- Lưu log tất cả tương tác AI vào `chatbot_log`

## Công nghệ sử dụng

### Backend
- Node.js
- Express.js
- MongoDB với Mongoose
- JWT Authentication
- bcryptjs cho password hashing

### Frontend
- React.js
- React Router
- Axios
- Vite

## License

MIT




