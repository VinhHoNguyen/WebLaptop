import React, { useState, useRef, useEffect } from "react";
import { API_BASE_URLS } from "../config/api";
import { formatVnd } from "../utils/currency";
import { getUserFromToken } from "../utils/auth";
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
  productIds?: string[];
  hasProducts?: boolean;
  data?: unknown;
}

const CHAT_SESSION_STORAGE_KEY = "webgame-chat-session-id";
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "http://localhost:3005";

const getChatSessionId = () => {
  const existing = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, generated);
  return generated;
};

const createMessage = (role: ChatRole, content: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
});

const parseProductsFromResponse = (data: ChatResponse): Product[] => {
  if (Array.isArray(data.products)) return data.products;
  const candidateText = [data.answer, data.text, data.message].filter(Boolean).join("\n");
  if (!candidateText) return [];
  try {
    const parsed = JSON.parse(candidateText);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is Product => Boolean(item?.name && item?.price));
    }
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as ChatResponse).products)) {
      return (parsed as ChatResponse).products || [];
    }
  } catch (_error) {}
  return [];
};

const formatProductSpecs = (product: Product) => {
  const specs = product.specs;
  if (!specs) return [];
  return [
    specs.brand ? `Hãng: ${specs.brand}` : null,
    specs.cpu ? `CPU: ${specs.cpu}` : null,
    typeof specs.ramGb === "number" ? `RAM: ${specs.ramGb}GB` : null,
    typeof specs.storageGb === "number" ? `SSD: ${specs.storageGb}GB` : null,
  ].filter(Boolean) as string[];
};

// Render dòng text có thể chứa link
const renderLine = (line: string, index: number) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = line.split(urlRegex);
  return (
    <p key={index}>
      {parts.map((part, j) =>
        urlRegex.test(part) ? (
          <a
            key={j}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#667eea", textDecoration: "underline", fontWeight: 500 }}
          >
            🔗 Xem sản phẩm
          </a>
        ) : (
          <span key={j}>{part}</span>
        )
      )}
    </p>
  );
};

// MongoDB helpers
const loadHistoryFromDB = async (userId: string): Promise<ChatMessage[] | null> => {
  try {
    const res = await fetch(`${CHAT_API_URL}/api/chat/${userId}`);
    const data = await res.json();
    if (data.success && data.data.length > 0) {
      return data.data.map((m: { role: string; content: string }) =>
        createMessage(m.role as ChatRole, m.content)
      );
    }
  } catch {}
  return null;
};

const saveMessagesToDB = async (userId: string, messages: { role: string; content: string }[]) => {
  try {
    await fetch(`${CHAT_API_URL}/api/chat/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch {}
};

const deleteHistoryFromDB = async (userId: string) => {
  try {
    await fetch(`${CHAT_API_URL}/api/chat/${userId}`, { method: "DELETE" });
  } catch {}
};

export default function ChatBubble() {
  const user = getUserFromToken();
  const userName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null
    : null;
  const userId = user?.id ?? null;
  const token = localStorage.getItem("token") ?? "";

  const getWelcomeMessage = () => {
    if (userName) {
      return `Xin chào ${userName}! 👋 Tôi là AI tư vấn laptop của LaptopStore.\nTôi có thể giúp gì cho bạn hôm nay?`;
    }
    return "Xin chào! 👋 Tôi là AI tư vấn laptop. Bạn có thể hỏi:\n- 'Laptop gaming dưới 20 triệu?'\n- 'So sánh Titan Pro và Vortex RTX'\n- 'Xem giỏ hàng của tôi'\n\nHãy cho tôi biết nhu cầu của bạn!";
  };

  const [sessionId] = useState(() => getChatSessionId());
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("assistant", getWelcomeMessage()),
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!userId || !isOpen) return;
    loadHistoryFromDB(userId).then((history) => {
      if (history && history.length > 0) setMessages(history);
    });
  }, [isOpen, userId]);

  const clearHistory = async () => {
    if (userId) {
      await deleteHistoryFromDB(userId);
      localStorage.removeItem(`chat-history-${userId}`);
    }
    setMessages([createMessage("assistant", getWelcomeMessage())]);
    setRecommendedProducts([]);
  };

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
        setMessages((prev) => [...prev, createMessage("assistant", "❌ Lỗi: Webhook chưa được cấu hình.")]);
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
          token,
          userName: userName ?? "",
          userId: userId ?? "",
        }).toString(),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const responseText = await response.text();
      let data: ChatResponse;
      try {
        data = JSON.parse(responseText) as ChatResponse;
      } catch {
        data = { answer: responseText };
      }

      const assistantText = data.answer || data.text || data.message || responseText;
      const products = parseProductsFromResponse(data);

      setMessages((prev) => [...prev, createMessage("assistant", assistantText)]);
      setRecommendedProducts(products.slice(0, 3));

      if (userId) {
        saveMessagesToDB(userId, [
          { role: "user", content: messageText },
          { role: "assistant", content: assistantText },
        ]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(errorMsg);
      setMessages((prev) => [...prev, createMessage("assistant", "Lỗi kết nối")]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="chat-assistant-shell" style={{ display: "flex" }}>
          <div className="chat-assistant-panel" role="dialog" aria-label="Chat tư vấn laptop">

            {/* Header */}
            <div className="chat-assistant-header">
              <div>
                <p className="chat-assistant-kicker">AI Agent</p>
                <h3>Tư Vấn Laptop</h3>
                {userName && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: 0 }}>
                    👤 {userName}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                {userId && (
                  <button
                    type="button"
                    onClick={clearHistory}
                    style={{
                      background: "none",
                      border: "1px solid rgba(255,255,255,0.4)",
                      color: "rgba(255,255,255,0.8)",
                      cursor: "pointer",
                      fontSize: 11,
                      borderRadius: 4,
                      padding: "2px 8px",
                    }}
                  >
                    Xóa lịch sử
                  </button>
                )}
                <button
                  type="button"
                  className="chat-assistant-close"
                  onClick={() => setIsOpen(false)}
                  aria-label="Đóng chat"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-assistant-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-assistant-message message-${msg.role}`}>
                  {msg.role === "assistant" && <span className="message-avatar">🤖</span>}
                  <div className="message-content">
                    {msg.content.split("\n").map((line, i) => renderLine(line, i))}
                  </div>
                </div>
              ))}

              {recommendedProducts.length > 0 && (
                <div className="chat-product-list">
                  {recommendedProducts.map((p, i) => (
                    <div key={i} className="chat-product-card">
                      <div className="chat-product-name">{p.name}</div>
                      <div className="chat-product-price">{formatVnd(p.price)}</div>
                      <div className="chat-product-specs">
                        {formatProductSpecs(p).join(" · ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="chat-assistant-message message-assistant">
                  <span className="message-avatar">🤖</span>
                  <div className="message-content"><p>Đang xử lý...</p></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              className="chat-assistant-form"
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            >
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

            {error && (
              <p className="chat-assistant-error">
                ⚠️ <span>{error}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="💬 Chat hỗ trợ"
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
        {isOpen ? "✕" : "💬"}
      </button>
    </>
  );
}
