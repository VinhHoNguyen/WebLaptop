import { useState, useEffect, useCallback } from "react";
import "../Style/OrderHistory.css";
import OrderAPI from "../api/OrderAPI";
import DetailOrderAPI from "../api/DetailOrderAPI";
import {
  getSimStatus,
  markOrderCancelled,
  STATUS_LABELS,
} from "../utils/orderLocal";
import { formatVnd } from "../utils/currency";

type DetailItem = {
  id: string;
  id_product: string;
  name_product: string;
  price_product: number;
  count: number;
  size: string;
  image?: string | null;
};

type DBOrder = {
  id: string;
  address: string;
  total: number;
  feeship: number;
  status: string;
  create_time: string;
};

type OrderRow = DBOrder & {
  items: DetailItem[];
};

function OrderHistory() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const userId = sessionStorage.getItem("id_user") || "";

  const loadOrders = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const res = await OrderAPI.get_order(userId);
      const list: DBOrder[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      const withItems = await Promise.all(
        list.map(async (order) => {
          try {
            const detailRes = await DetailOrderAPI.get_detail_order(order.id);
            const items: DetailItem[] = Array.isArray(detailRes?.data)
              ? detailRes.data
              : Array.isArray(detailRes)
              ? detailRes
              : [];
            return { ...order, items };
          } catch {
            return { ...order, items: [] };
          }
        })
      );
      setOrders(withItems);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Re-render every second so simulated status updates live
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (orderId: string) => {
    markOrderCancelled(orderId);
    setTick((t) => t + 1);
    try {
      await OrderAPI.cancel_order_user(orderId);
    } catch {
      // best-effort; local state already updated
    }
  };

  if (loading) {
    return (
      <div className="order-history-page">
        <div className="container">
          <h1>Lịch sử đơn hàng</h1>
          <div className="order-history-empty">
            <p>Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <div className="container">
        <h1>Lịch sử đơn hàng</h1>

        {orders.length === 0 ? (
          <div className="order-history-empty">
            <p>Chưa có đơn hàng nào</p>
            <a href="/">Mua sắm ngay</a>
          </div>
        ) : (
          <div className="order-list">
            {orders.map((order) => {
              const { status, cancelled } = getSimStatus(order.id);
              const canCancel = !cancelled && status <= 2;

              return (
                <div
                  key={order.id}
                  className={`order-card${cancelled ? " cancelled" : ""}`}
                >
                  {/* Header */}
                  <div className="order-card-header">
                    <div className="order-card-meta">
                      <span className="order-id">
                        Đơn #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="order-date">{order.create_time}</span>
                    </div>
                    <div className="order-card-status-area">
                      <span
                        className={`order-status-badge status-${
                          cancelled ? "cancelled" : status
                        }`}
                      >
                        {cancelled ? "Đã hủy" : STATUS_LABELS[status]}
                      </span>
                      {canCancel && (
                        <button
                          className="order-cancel-btn"
                          onClick={() => handleCancel(order.id)}
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  {order.items.length > 0 && (
                    <div className="order-card-items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-item-row">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name_product}
                              className="order-item-img"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <span className="order-item-name">
                            {item.name_product}
                          </span>
                          <span className="order-item-qty">x{item.count}</span>
                          <span className="order-item-price">
                            {formatVnd(
                              Number(item.price_product) * Number(item.count)
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="order-card-footer">
                    <span className="order-address">{order.address}</span>
                    <div className="order-total">
                      <span>Tổng: </span>
                      <strong>{formatVnd(order.total)}</strong>
                    </div>
                  </div>

                  {/* Status progress track */}
                  {!cancelled && (
                    <div className="order-status-track">
                      {([1, 2, 3, 4] as const).map((s) => (
                        <div
                          key={s}
                          className={`order-track-step${status >= s ? " done" : ""}${
                            status === s ? " current" : ""
                          }`}
                        >
                          <div className="track-dot" />
                          <div className="track-label">{STATUS_LABELS[s]}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;
