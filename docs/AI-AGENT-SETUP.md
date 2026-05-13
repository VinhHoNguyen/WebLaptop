# AI Agent Chatbot - Tư Vấn Laptop

Hệ thống AI Agent cho phép khách hàng hỏi trực tiếp về sản phẩm laptop và nhận được gợi ý thông minh dựa trên ngân sách, danh mục, hoặc so sánh sản phẩm.

## Quy Trình Hoạt Động

```
Khách hỏi (Front-end)
        ↓
    Webhook n8n
        ↓
   AI Agent
        ↓
      Nhận context catalog từ front-end
        ↓
  Call Tools (Search, Compare, Details)
        ↓
  Product API → Lấy dữ liệu
        ↓
   Format Response
        ↓
Trả về Front-end + Hiển thị
```

## Cài Đặt n8n

### 1. Import Workflow

1. Mở n8n instance: `http://your-n8n.com`
2. Tạo workflow mới
3. Menu → Import → Chọn file `n8n-ai-agent-workflow.json`

### 2. Cấu Hình Credentials

**OpenAI API:**
```
1. Vào Credentials
2. New → OpenAI
3. Paste API key từ https://platform.openai.com/api-keys
```

Hoặc dùng model khác:
- Anthropic Claude: Tương tự, lấy key từ claude.ai
- Google Gemini: Key từ ai.google.dev
- Llama (local): Không cần key

### 3. Cấu Hình API Integration

Nếu Product API yêu cầu authentication, thêm HTTP Request node:

```javascript
// Code node
const productApi = $env.PRODUCT_API_URL || 'http://localhost:3002';
return { productApi };
```

RAG endpoint có sẵn trong catalog service:

```bash
GET /products/rag/context?q=<user_question>&k=8
```

Trong n8n, bạn có thể dùng HTTP Request node để gọi endpoint này trước AI node, sau đó đưa `relevantProducts` vào prompt.

### 4. Test Webhook

```bash
curl -X POST http://localhost:5678/webhook/laptop-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "1000000 mua được laptop gì?",
    "history": [],
    "context": {
      "totalProducts": 120,
      "relevantProducts": []
    }
  }'
```

Kết quả dự kiến:
```json
{
  "answer": "Dưới 1 triệu, tôi gợi ý 3 mẫu:\n\n1. Campus Lite 15 - 549.000 ₫\n   - Student laptop, CPU Intel i5, RAM 8GB, SSD 256GB\n   - Tốt cho học tập và công việc văn phòng\n\n2. ApexBook 14 Air - 799.000 ₫\n   - Ultrabook mỏng nhẹ, CPU i7, RAM 16GB\n   - Pinch cho du lịch, công việc di động\n\n3. FlexGo 13 2-in-1 - 899.000 ₫\n   - Có thể gập lại thành tablet\n   - Tích hợp bút stylus\n   - Phù hợp cho người sáng tạo"
}
```

## Cấu Hình Front-end

### 1. Thêm Environment Variable

File `.env.local` hoặc `.env.production`:

```bash
VITE_N8N_CHAT_WEBHOOK_URL=https://your-n8n-instance.com/webhook/laptop-chat
```

### 2. Restart Dev Server

```bash
npm --prefix front-end run dev
```

### 3. Test Chat

Mở http://localhost:5174, click nút "💬 Chat", thử nhập:
- "1000000 mua được laptop gì?"
- "Gợi ý gaming laptop"
- "So sánh Titan Pro và Vortex RTX"

## Ví Dụ Hội Thoại

### Scenario 1: Tìm kiếm theo ngân sách

```
👤 User: 1000000 mua được laptop gì?

🤖 Agent:
Dưới 1 triệu VND, tôi gợi ý 3 mẫu tốt nhất:

1️⃣ Campus Lite 15 - 549.000 ₫
   ✓ Thương hiệu: Dell
   ✓ CPU: Intel Core i5-1135G7
   ✓ RAM: 8GB DDR4
   ✓ Lưu trữ: SSD 256GB
   ✓ Tồn kho: 25 cái
   → Phù hợp cho sinh viên, học tập

2️⃣ ApexBook 14 Air - 799.000 ₫
   ✓ Thương hiệu: ASUS
   ✓ CPU: Intel Core i7-1195G7
   ✓ RAM: 16GB DDR4
   ✓ Lưu trữ: SSD 512GB
   ✓ Tồn kho: 18 cái
   → Mỏng nhẹ, mạnh, tốt cho công việc

3️⃣ FlexGo 13 2-in-1 - 899.000 ₫
   ✓ Thương hiệu: Lenovo
   ✓ CPU: Intel Core i5-1125G7
   ✓ RAM: 8GB DDR4
   ✓ Lưu trữ: SSD 512GB
   ✓ Tồn kho: 10 cái
   → 2-in-1, có thể gập lại như tablet

Bạn muốn biết chi tiết về mẫu nào không?
```

### Scenario 2: Tìm kiếm theo danh mục

```
👤 User: Gợi ý laptop gaming tốt nhất

🤖 Agent:
Cho gaming, tôi gợi ý 2 mẫu mạnh nhất:

1️⃣ Vortex RTX 17 - 2.299.000 ₫
   ✓ GPU: NVIDIA RTX 4070
   ✓ CPU: Intel i9-13900HX
   ✓ RAM: 32GB DDR5
   ✓ Màn hình: 17" 144Hz
   ✓ Tồn kho: 4 cái
   → TOP game AAA, streaming, 3D rendering

2️⃣ Titan Pro 16 - 1.799.000 ₫
   ✓ GPU: NVIDIA RTX 4060
   ✓ CPU: Intel i7-13650HX
   ✓ RAM: 16GB DDR5
   ✓ Màn hình: 16" 120Hz
   ✓ Tồn kho: 6 cái
   → Cân bằng giá/hiệu năng, phù hợp gaming casual

Vortex mạnh hơn nhưng Titan rẻ hơn. Ngân sách của bạn là bao nhiêu?
```

### Scenario 3: So sánh

```
👤 User: So sánh Nova Studio với Vortex RTX

🤖 Agent:
Bảng so sánh chi tiết:

┌─────────────────┬──────────────────┬─────────────────┐
│ Thông số        │ Nova Studio 15   │ Vortex RTX 17   │
├─────────────────┼──────────────────┼─────────────────┤
│ Giá             │ 1.499.000 ₫      │ 2.299.000 ₫     │
│ CPU             │ Intel i9-12900H  │ Intel i9-13900H │
│ GPU             │ RTX 3080 Ti      │ RTX 4070        │
│ RAM             │ 32GB DDR5        │ 32GB DDR5       │
│ Màn hình        │ 15" 120Hz        │ 17" 144Hz       │
│ Trọng lượng     │ 1.8kg            │ 2.4kg           │
│ Pin             │ 8 giờ            │ 6 giờ           │
│ Lý tưởng cho    │ Đồ họa, 3D       │ Gaming, Stream  │
└─────────────────┴──────────────────┴─────────────────┘

💡 Kết luận:
- Nova tốt hơn cho design/rendering (GPU mạnh, nhẹ)
- Vortex tốt hơn cho gaming (màn hình 144Hz, CPU mới)
- Nova rẻ hơn 800k

Bạn dùng cho việc gì chính?
```

## Environment Variables

### n8n Server

```bash
# Database (nếu dùng)
DB_TYPE=postgres
DB_POSTGRES_HOST=localhost
DB_POSTGRES_USER=n8n
DB_POSTGRES_PASSWORD=xxx
DB_POSTGRES_DATABASE=n8n

# API Keys
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_GEMINI_API_KEY=xxx

# Product API
PRODUCT_API_URL=http://localhost:3002
PRODUCT_API_KEY=optional

# n8n Settings
N8N_HOST=0.0.0.0
N8N_PORT=5678
WEBHOOK_URL=https://your-domain.com
```

### Front-end

```bash
# .env.local
VITE_N8N_CHAT_WEBHOOK_URL=https://n8n.your-domain.com/webhook/laptop-chat
VITE_USER_API_URL=http://localhost:3001
VITE_PRODUCT_API_URL=http://localhost:3002
```

## Troubleshooting

### Chat không kết nối

**Kiểm tra 1: Webhook URL**
```bash
# Mở DevTools → Console
fetch('https://your-n8n.com/webhook/laptop-chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'test'})
}).then(r => r.json()).then(console.log)
```

**Kiểm tra 2: n8n logs**
```bash
# SSH vào n8n server
docker logs n8n_container_name | tail -100

# Hoặc check n8n UI → Execution history
```

**Kiểm tra 3: CORS**
Nếu gặp lỗi CORS, thêm CORS header vào n8n:
```javascript
// Trong n8n Webhook node → Advanced
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
}
```

### Agent không trả lời

- Kiểm tra API key OpenAI/Gemini có còn hạn không
- Kiểm tra product API có kết nối được không
- Xem n8n execution logs chi tiết

## Deployment

### Docker Compose (nếu có)

```yaml
version: '3.9'
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - WEBHOOK_URL=https://n8n.your-domain.com
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  n8n_data:
```

### Deploy n8n to Cloud

**Railway.app:**
```bash
# 1. Link GitHub repo
# 2. Set environment variables
# 3. Deploy
```

**Render.com:**
```bash
docker build -t n8n-custom .
docker push your-registry/n8n-custom
# Deploy từ container registry
```

## Bảo Mật

✅ **Không commit:**
- API keys (OpenAI, Gemini, etc.)
- Database passwords
- Webhook URLs (nếu private)

✅ **Lưu trong:**
- Environment variables của server
- n8n Credentials (encrypted)
- GitHub Secrets (nếu dùng CI/CD)

✅ **Giới hạn truy cập:**
- Webhook chỉ có thể POST từ frontend domain
- Thêm rate limiting để tránh abuse
- Log tất cả requests

## Support

Nếu gặp vấn đề:
1. Kiểm tra [n8n docs](https://docs.n8n.io)
2. Xem n8n community forum
3. Kiểm tra OpenAI API status
4. Review n8n execution logs chi tiết
