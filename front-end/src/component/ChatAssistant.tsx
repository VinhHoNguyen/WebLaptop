import { useEffect, useRef, useState } from "react";
import { API_BASE_URLS } from "../config/api";
import { formatVnd } from "../utils/currency";
import "../Style/ChatAssistant.css";
import {
  createMessage,
  parseProductsFromResponse,
  formatProductSpecs,
  Product,
  ChatResponse,
} from "../utils/chatHelpers";
import { ChatMessage } from "../utils/chatHelpers";

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "assistant",
      "Xin chào! 👋 Tôi là AI tư vấn laptop. Bạn có thể hỏi:\n- 'Tôi có 1 triệu, mua được laptop gì?'\n- 'Laptop gaming dưới 2 triệu?'\n- 'So sánh Titan Pro và Vortex RTX'\n\nHãy cho tôi biết nhu cầu của bạn!"
    ),
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    const userMessage = createMessage("user", messageText);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
    setRecommendedProducts([]);

    try {
      const webhookUrl = API_BASE_URLS.n8nChat;
      if (!webhookUrl) {
        setError("Webhook chưa được cấu hình (VITE_N8N_CHAT_WEBHOOK_URL)");
        setMessages((prev) => [
          ...prev,
          createMessage("assistant", "❌ Lỗi: Webhook chưa được cấu hình."),
        ]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as ChatResponse;
      const assistantText =
        data.answer || data.text || data.message || JSON.stringify(data);
      const products = parseProductsFromResponse(data);

      setMessages((prev) => [...prev, createMessage("assistant", assistantText)]);
      setRecommendedProducts(products.slice(0, 3));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        createMessage(
          "assistant",
          `❌ Lỗi kết nối: ${errorMsg}\n\nHãy kiểm tra:\n1. Webhook URL có đúng?\n2. n8n server có chạy không?\n3. Thử lại sau ít phút.`
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-assistant-shell">
      {isOpen && (
        <div className="chat-assistant-panel" role="dialog" aria-label="Chat tư vấn laptop">
          <div className="chat-assistant-header">
            <div>
              <p className="chat-assistant-kicker">AI Agent</p>
              <h3>Tư Vấn Laptop</h3>
            </div>
            <button
              type="button"
              className="chat-assistant-close"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng chat"
            >
              ✕
            </button>
          </div>

          <div className="chat-assistant-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-assistant-message message-${msg.role}`}
              >
                {msg.role === "assistant" && <span className="message-avatar">🤖</span>}
                <div className="message-content">
                  {msg.content.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {recommendedProducts.length > 0 && (
              <div className="chat-product-list">
                <p className="chat-product-title">Sản phẩm gợi ý</p>
                {recommendedProducts.map((product, index) => (
                  <article key={product.id ?? `${product.name}-${index}`} className="chat-product-card">
                    <div className="chat-product-card-header">
                      <div>
                        <h4>{product.name}</h4>
                        {product.category && <p>{product.category}</p>}
                      </div>
                      <div className="chat-product-price">{formatVnd(product.price)}</div>
                    </div>
                    {formatProductSpecs(product).length > 0 && (
                      <ul className="chat-product-specs">
                        {formatProductSpecs(product).map((spec) => (
                          <li key={spec}>{spec}</li>
                        ))}
                      </ul>
                    )}
                    {typeof product.stock === "number" && (
                      <p className="chat-product-stock">Tồn kho: {product.stock}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
            {isLoading && (
              <div className="chat-assistant-message message-assistant">
                <span className="message-avatar">🤖</span>
                <div className="message-content">
                  <p>Đang xử lý...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="chat-assistant-form"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              disabled={isLoading}
              aria-label="Nhập tin nhắn"
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "..." : "Gửi"}
            </button>
          </form>

          {error && <p className="chat-assistant-error">⚠️ {error}</p>}
        </div>
      )}

      <button
        type="button"
        className="chat-assistant-launcher"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Ẩn chat" : "Mở chat"}
      >
        {isOpen ? "❌" : "💬 Chat"}
      </button>
    </div>
  );
};

export default ChatAssistant;
