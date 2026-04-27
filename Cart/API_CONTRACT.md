# Cart Service - API Contract

## Base URL
```
http://localhost:3003/cart        (Local)
http://cart-service:3002/cart     (K8s)
```

## Authentication
Tất cả endpoints yêu cầu header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📍 Endpoints

### 1. GET /cart - Lấy toàn bộ cart
**Description**: Lấy danh sách sản phẩm và tổng giá cart của user

**Request**:
```http
GET /cart HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "iPhone 15",
        "price": 999,
        "quantity": 2,
        "image": "https://example.com/iphone.jpg",
        "subtotal": 1998
      },
      {
        "productId": "507f1f77bcf86cd799439012",
        "name": "iPad Pro",
        "price": 1299,
        "quantity": 1,
        "image": "https://example.com/ipad.jpg",
        "subtotal": 1299
      }
    ],
    "total": 3297,
    "count": 2
  }
}
```

**Response 503 Service Unavailable** (Product service down):
```json
{
  "success": false,
  "message": "Product service unavailable. Please try again later.",
  "error": "connect ECONNREFUSED 127.0.0.1:3002"
}
```

---

### 2. POST /cart/:productId - Thêm sản phẩm vào cart
**Description**: Thêm 1 sản phẩm vào cart hoặc tăng số lượng nếu đã tồn tại

**Request**:
```http
POST /cart/507f1f77bcf86cd799439011 HTTP/1.1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

{
  "quantity": 2
}
```

**Response 201 Created**:
```json
{
  "success": true,
  "message": "Product added to cart",
  "data": {
    "cartId": "507f191e810c19729de860ea",
    "productId": "507f1f77bcf86cd799439011",
    "quantity": 2
  }
}
```

**Response 404 Not Found** (Product không tồn tại):
```json
{
  "success": false,
  "message": "Product not found or Product service unavailable"
}
```

**Response 400 Bad Request** (Quantity không hợp lệ):
```json
{
  "success": false,
  "message": "Invalid quantity. Must be a positive number."
}
```

---

### 3. PUT /cart/:productId - Cập nhật số lượng
**Description**: Cập nhật số lượng sản phẩm trong cart. Nếu quantity <= 0 thì xóa khỏi cart

**Request**:
```http
PUT /cart/507f1f77bcf86cd799439011 HTTP/1.1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

{
  "quantity": 5
}
```

**Response 200 OK** (Cập nhật thành công):
```json
{
  "success": true,
  "message": "Cart item updated",
  "data": {
    "cartId": "507f191e810c19729de860ea",
    "productId": "507f1f77bcf86cd799439011",
    "quantity": 5
  }
}
```

**Response 200 OK** (Xóa vì quantity <= 0):
```json
{
  "success": true,
  "message": "Product removed from cart",
  "data": {
    "removed": true,
    "productId": "507f1f77bcf86cd799439011"
  }
}
```

**Response 404 Not Found** (Item không tồn tại trong cart):
```json
{
  "success": false,
  "message": "Cart item not found"
}
```

---

### 4. DELETE /cart/:productId - Xóa sản phẩm khỏi cart
**Description**: Xóa 1 sản phẩm hoàn toàn khỏi cart

**Request**:
```http
DELETE /cart/507f1f77bcf86cd799439011 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Product removed from cart",
  "data": {
    "productId": "507f1f77bcf86cd799439011"
  }
}
```

**Response 404 Not Found** (Item không tồn tại):
```json
{
  "success": false,
  "message": "Cart item not found"
}
```

---

### 5. DELETE /cart/checkout - Thanh toán (xóa toàn bộ cart)
**Description**: Xóa tất cả sản phẩm trong cart (sau khi thanh toán)

**Request**:
```http
DELETE /cart/checkout HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Checkout completed",
  "data": {
    "deletedCount": 3
  }
}
```

---

## 📦 Request/Response Format

### Success Response Format
```json
{
  "success": true,
  "message": "...",          // Optional
  "data": {
    // Endpoint-specific data
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Technical error details"    // Optional
}
```

---

## ⏱️ Timeout & Retry Behavior

- **Request timeout**: 5 giây (khi gọi Product service)
- **Automatic retries**: 3 lần nếu Product service không trả lời
- **Retry delay**: 1 giây giữa các lần thử

Nếu Product service vẫn không phản hồi sau 3 lần:
- Response 503 Service Unavailable
- Không lưu dữ liệu cart nếu không xác minh được sản phẩm

---

## 🔑 HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | OK - Request thành công |
| 201 | Created - Resource tạo thành công |
| 400 | Bad Request - Request không hợp lệ |
| 404 | Not Found - Resource không tồn tại |
| 500 | Internal Server Error - Lỗi server |
| 503 | Service Unavailable - Product service lỗi |

---

## 📝 Query Parameters

Hiện tại không có query parameters. Tất cả tham số truyền qua:
- **Path params**: `/:productId`
- **Request body**: `{ "quantity": 2 }`

---

## 🧪 Example Usage (cURL)

```bash
# 1. Lấy cart
curl -X GET http://localhost:3003/cart \
  -H "Authorization: Bearer TOKEN"

# 2. Thêm sản phẩm
curl -X POST http://localhost:3003/cart/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"quantity": 2}'

# 3. Cập nhật số lượng
curl -X PUT http://localhost:3003/cart/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"quantity": 5}'

# 4. Xóa sản phẩm
curl -X DELETE http://localhost:3003/cart/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer TOKEN"

# 5. Checkout
curl -X DELETE http://localhost:3003/cart/checkout \
  -H "Authorization: Bearer TOKEN"
```

---

## 📌 Notes

- **Payload thống nhất**: Sử dụng `quantity` (không phải `count`) cho tất cả endpoints
- **Idempotent**: Có thể retry request mà không lo bị duplicate
- **No direct DB access**: Cart service không đọc Product DB, luôn gọi Product service qua HTTP
- **Service resilience**: Retry + timeout tránh treo khi Product service lỗi
