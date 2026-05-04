# n8n Setup Quick Guide

## Sau khi n8n khởi động:

### 1️⃣ Mở n8n UI
```
http://localhost:5678
```

### 2️⃣ Tạo Credentials cho LLM

API key không để trong front-end. Bạn chỉ cần tạo credential đúng provider trong n8n.

**Nếu bạn dùng Gemini API key:**
- Vào Credentials (mũi tên ▼ bên cạnh user icon)
- Create new → Google Gemini / Google Generative AI
- Paste API key của bạn vào đây

**Nếu bạn dùng provider khác:**
- OpenAI: https://platform.openai.com/api-keys
- Groq Cloud: https://console.groq.com
- Ollama (Local, không cần key): https://ollama.ai

### 3️⃣ Import Workflow

**Option A: Copy-Paste Workflow JSON**
1. New Workflow
2. Menu → Import from JSON
3. Paste content từ `docs/n8n-ai-agent-workflow.json`
4. Save

**Option B: Setup Manual (3 nodes)**

**Node 1: Webhook Trigger**
- Name: "Webhook"
- Type: Webhook
- Method: POST
- Path: `/webhook/laptop-chat`

**Node 2: AI Agent**
- Type: `@n8n/n8n-nodes-langchain.agent`
- `promptType`: `define`
- `text`: `={{ $json.message }}`
- `options.systemMessage`: mô tả cách trả lời của agent

**Node 3: Connect Gemini**
- Type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`
- Credential: `googlePalmApi`
- Model: `models/gemini-3.1-flash-lite`

Kết nối `Connect Gemini` vào `AI Agent` qua cổng `ai_languageModel`.

**Node 4: Response**
- Type: Respond to Webhook
- Body: `{{ { answer: $json.text } }}`

Front-end sẽ gọi `VITE_N8N_CHAT_WEBHOOK_URL`; nếu không set, nó sẽ mặc định trỏ tới `http://localhost:5678/webhook/laptop-chat`.

### 4️⃣ Test Webhook

Mở PowerShell/Terminal:

```bash
curl -X POST http://localhost:5678/webhook/laptop-chat `
  -H "Content-Type: application/json" `
  -d '{
    "message": "1000000 mua được laptop gì?",
    "history": []
  }'
```

Expected response:
```json
{
  "answer": "Dưới 1 triệu, tôi gợi ý..."
}
```

### 5️⃣ Kết nối n8n với Product API (Tùy chọn)

Nếu muốn agent gọi tools để tìm sản phẩm:

1. Thêm HTTP node để call product API
2. Setup URL: `http://localhost:3002/products`
3. Kết nối vào AI Agent

### Troubleshooting

**n8n không chạy:**
```bash
# Check if running on port 5678
netstat -ano | findstr :5678

# Kill old process
taskkill /PID <PID> /F

# Start again
npx n8n start
```

**Chat không kết nối:**
```bash
# Test webhook
curl -X POST http://localhost:5678/webhook/laptop-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[]}'

# Check DevTools Console (F12)
# Look for network error details
```

**Reload Frontend (sau khi .env.local thay đổi):**
```bash
npm --prefix front-end run dev
# Hoặc close terminal, mở lại
```
