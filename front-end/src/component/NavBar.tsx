import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import "../Style/NavBar.css";
import profileMale from "../assets/profile.jpg";
import profileFemale from "../assets/profileGirl.jpg";
import OrderAPI from "../api/OrderAPI";
import CartsLocal, { getCartKey, type LocalCartItem } from "../utils/cartLocal";
import {
  getSimStatus,
  markOrderCancelled,
  STATUS_LABELS,
} from "../utils/orderLocal";
import { formatVnd } from "../utils/currency";
import { getUserFromToken } from "../utils/auth";
import type { RootState } from "../redux/store";

type DBOrder = {
  id: string;
  address: string;
  total: number;
  feeship: number;
  status: string;
  create_time: string;
};

const hasToken = () => typeof window !== "undefined" && !!localStorage.getItem("token");

function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(hasToken);
  const [username, setUsername] = useState("");
  const [avatarSrc, setAvatarSrc] = useState(profileMale);
  const [showGreeting, setShowGreeting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartPanelOpen, setCartPanelOpen] = useState(false);
  const [cartTab, setCartTab] = useState<"cart" | "orders">("cart");
  const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [tick, setTick] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartPanelRef = useRef<HTMLDivElement>(null);

  const countChange = useSelector((state: RootState) => state.Count.isLoad);

  const refreshCart = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const serverCart = await CartsLocal.fetchFromServer();
        setCartItems(serverCart);
        return;
      } catch {
        // fall through to local cache
      }
    }
    const cartKey = getCartKey();
    const raw = localStorage.getItem(cartKey);
    try {
      setCartItems(raw ? (JSON.parse(raw) as LocalCartItem[]) : []);
    } catch {
      setCartItems([]);
    }
  };

  const fetchOrders = async () => {
    const userId = sessionStorage.getItem("id_user");
    if (!userId) { setOrders([]); return; }
    try {
      const res = await OrderAPI.get_order(userId);
      const list: DBOrder[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setOrders(list);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    const loggedIn = !!localStorage.getItem("token");
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      const user = getUserFromToken();
      if (user) {
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
        setUsername(name || user.email || "");
        setAvatarSrc(user.gender === "female" ? profileFemale : profileMale);
        setShowGreeting(true);
      }
    }
    refreshCart();
  }, [countChange]);

  // Re-render every second while panel shows orders (for live status)
  useEffect(() => {
    if (!cartPanelOpen || cartTab !== "orders") return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [cartPanelOpen, cartTab]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (cartPanelRef.current && !cartPanelRef.current.contains(e.target as Node)) {
        setCartPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("id_user");
    window.location.href = "/login";
  };

  const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markOrderCancelled(orderId);
    setTick((t) => t + 1);
    try {
      await OrderAPI.cancel_order_user(orderId);
    } catch {
      // best-effort
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.count, 0);
  const activeOrderCount = orders.filter((o) => {
    const { cancelled, status } = getSimStatus(o.id);
    return !cancelled && status < 4;
  }).length;
  const badgeCount = totalCartCount + activeOrderCount;

  void tick;

  return (
    <header className="header-area header-sticky">
      <div className="container">
        <nav className="main-nav">

          {/* ── Logo ── */}
          <a href="/" className="logo">
            <div className="logo-mark">sv</div>
            <div className="logo-wordmark">
              <span>Lap</span>
              <span>SinhVien</span>
            </div>
          </a>

          {/* ── Actions ── */}
          <div className="nav-actions">

            {/* Cart + Orders panel */}
            <div className="nav-cart-wrapper" ref={cartPanelRef}>
              <button
                className="nav-action-btn nav-cart-btn"
                title="Giỏ hàng & Đơn hàng"
                onClick={() => {
                  const opening = !cartPanelOpen;
                  setCartPanelOpen(opening);
                  if (opening) { refreshCart(); fetchOrders(); }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18" height="18"
                  viewBox="0 0 24 24"
                  fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {badgeCount > 0 && (
                  <span className="nav-cart-badge">{badgeCount}</span>
                )}
              </button>

              {cartPanelOpen && (
                <div className="nav-cart-panel">
                  <div className="nav-cart-panel-tabs">
                    <button
                      className={`nav-cart-panel-tab${cartTab === "cart" ? " active" : ""}`}
                      onClick={() => setCartTab("cart")}
                    >
                      Giỏ hàng
                      {totalCartCount > 0 && <span className="tab-count">{totalCartCount}</span>}
                    </button>
                    <button
                      className={`nav-cart-panel-tab${cartTab === "orders" ? " active" : ""}`}
                      onClick={() => { setCartTab("orders"); fetchOrders(); }}
                    >
                      Đơn hàng
                      {activeOrderCount > 0 && <span className="tab-count">{activeOrderCount}</span>}
                    </button>
                  </div>

                  <div className="nav-cart-panel-body">
                    {cartTab === "cart" ? (
                      cartItems.length === 0 ? (
                        <div className="nav-panel-empty">Giỏ hàng trống</div>
                      ) : (
                        <>
                          <div className="nav-cart-items-list">
                            {cartItems.slice(0, 5).map((item) => (
                              <div key={item.id_cart} className="nav-cart-item">
                                {item.image ? (
                                  <img src={item.image} alt={item.name_product}
                                    className="nav-cart-item-img"
                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                  />
                                ) : (
                                  <div className="nav-cart-item-img nav-cart-item-img-placeholder" />
                                )}
                                <div className="nav-cart-item-info">
                                  <span className="nav-cart-item-name">{item.name_product}</span>
                                  <span className="nav-cart-item-meta">
                                    x{item.count} · {formatVnd(item.price_product * item.count)}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {cartItems.length > 5 && (
                              <div className="nav-panel-more">+{cartItems.length - 5} sản phẩm khác</div>
                            )}
                          </div>
                          <div className="nav-cart-panel-footer">
                            <a href="/cart" className="nav-panel-btn secondary">Xem giỏ hàng</a>
                            <a href="/checkout" className="nav-panel-btn primary">Thanh toán</a>
                          </div>
                        </>
                      )
                    ) : orders.length === 0 ? (
                      <div className="nav-panel-empty">Chưa có đơn hàng nào</div>
                    ) : (
                      <>
                        <div className="nav-orders-list">
                          {orders.slice(0, 4).map((order) => {
                            const { status, cancelled } = getSimStatus(order.id);
                            const canCancel = !cancelled && status <= 2;
                            return (
                              <div key={order.id} className="nav-order-item">
                                <div className="nav-order-item-top">
                                  <span className="nav-order-id">#{order.id.slice(-6).toUpperCase()}</span>
                                  <span className="nav-order-date">{order.create_time}</span>
                                </div>
                                <div className="nav-order-item-bottom">
                                  <span className={`nav-order-status nav-order-status-${cancelled ? "cancelled" : status}`}>
                                    {cancelled ? "Đã hủy" : STATUS_LABELS[status]}
                                  </span>
                                  <span className="nav-order-total">{formatVnd(order.total)}</span>
                                </div>
                                {canCancel && (
                                  <button className="nav-order-cancel-btn"
                                    onClick={(e) => handleCancelOrder(order.id, e)}>
                                    Hủy đơn
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="nav-cart-panel-footer">
                          <a href="/history" className="nav-panel-btn secondary full">Xem tất cả đơn hàng</a>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isLoggedIn && (
              <a href="/login" className="nav-action-btn nav-login-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16" height="16"
                  viewBox="0 0 24 24"
                  fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Đăng nhập</span>
              </a>
            )}

            {/* Profile avatar + greeting bubble */}
            {isLoggedIn && (
            <div className="nav-profile-wrapper" ref={dropdownRef}>
              <button
                className="nav-action-btn nav-profile-btn"
                title="Hồ sơ"
                onClick={() => setDropdownOpen((v) => !v)}
              >
                <img src={avatarSrc} alt="Hồ sơ" />
              </button>

              {/* Speech bubble greeting — shows then fades away */}
              {isLoggedIn && username && showGreeting && (
                <div
                  className="nav-greeting-bubble"
                  onAnimationEnd={() => setShowGreeting(false)}
                >
                  Xin chào, <strong>{username}</strong> 👋
                  <span className="nav-greeting-bubble-tail" />
                </div>
              )}

              {isLoggedIn && dropdownOpen && (
                <div className="nav-profile-dropdown">
                  <a href="/profile" className="nav-dropdown-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Hồ sơ
                  </a>
                  <button className="nav-dropdown-item nav-logout-item" onClick={handleLogout}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
            )}
          </div>

          <a className="menu-trigger"><span>Menu</span></a>
        </nav>
      </div>
    </header>
  );
}

export default NavBar;
