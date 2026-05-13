import React, { useState, useRef, useEffect } from "react";
import { API_BASE_URLS } from "../config/api";
import { formatVnd } from "../utils/currency";
import "../Style/ChatAssistant.css";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface Product {
  id?: number;
  name: string;
  price: number;
  category?: string;
  stock?: number | null;
  specs?: {
    brand?: string;
    cpu?: string;
    ramGb?: number;
    storageGb?: number;
  };
}

interface ChatResponse {
  answer?: string;
  text?: string;
  message?: string;
  products?: Product[];
  data?: unknown;
}

const CHAT_SESSION_STORAGE_KEY = "webgame-chat-session-id";

const getChatSessionId = () => {
  const existingSessionId = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  const generatedSessionId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, generatedSessionId);
  return generatedSessionId;
};

const createMessage = (role: ChatRole, content: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
});

const parseProductsFromResponse = (data: ChatResponse): Product[] => {
  if (Array.isArray(data.products)) {
    return data.products;
  }
  const candidateText = [data.answer, data.text, data.message].filter(Boolean).join("\n");
  if (!candidateText) {
    return [];
  }
  try {
    const parsed = JSON.parse(candidateText);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is Product => Boolean(item?.name && item?.price));
    }
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as ChatResponse).products)) {
      return (parsed as ChatResponse).products || [];
    }
  } catch (_error) {
    return [];
  }
  return [];
};

const formatProductSpecs = (product: Product) => {
  const specs = product.specs;
  if (!specs) {
    return [];
  }
  return [
    specs.brand ? `Hãng: ${specs.brand}` : null,
    specs.cpu ? `CPU: ${specs.cpu}` : null,
    typeof specs.ramGb === "number" ? `RAM: ${specs.ramGb}GB` : null,
    typeof specs.storageGb === "number" ? `SSD: ${specs.storageGb}GB` : null,
  ].filter(Boolean) as string[];
};

export default function ChatBubble() {
  const [sessionId] = useState(() => getChatSessionId());
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
      const chatHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      const webhookUrl = API_BASE_URLS.n8nChat;
      if (!webhookUrl) {
        setError("Webhook chưa được cấu hình");
        setMessages((prev) => [
          ...prev,
          createMessage("assistant", "❌ Lỗi: Webhook chưa được cấu hình."),
        ]);
        setIsLoading(false);
        return;
      }
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({
          sessionId,
          message: messageText,
          history: JSON.stringify(chatHistory),
        }).toString(),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as ChatResponse;
      const assistantText = data.answer || data.text || data.message || JSON.stringify(data);
      const products = parseProductsFromResponse(data);
      setMessages((prev) => [...prev, createMessage("assistant", assistantText)]);
      setRecommendedProducts(products.slice(0, 3));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", `❌ Lỗi kết nối: ${errorMsg}`),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="chat-assistant-shell" style={{ display: "flex" }}>
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
                <div key={msg.id} className={`chat-assistant-message message-${msg.role}`}>
                  {msg.role === "assistant" && <span className="message-avatar">🤖</span>}
                  <div className="message-content">
                    {msg.content.split("\n").map((line, i) => (<p key={i}>{line}</p>))}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-assistant-message message-assistant">
                  <span className="message-avatar">🤖</span>
                  <div className="message-content"><p>Đang xử lý...</p></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-assistant-form" onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi..."
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? "..." : "Gửi"}
              </button>
            </form>
            {error && <p className="chat-assistant-error">⚠️ {error}</p>}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          zIndex: 9999,
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none",
          fontSize: "28px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        💬
      </button>
    </>
  );
}
