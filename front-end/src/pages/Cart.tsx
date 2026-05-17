import { Fragment, useCallback, useEffect, useState } from "react";

import "../Style/Cart.css";
import { API_BASE_URLS } from "../config/api";
import { formatVnd } from "../utils/currency";
import { ensureUserSession } from "../utils/auth";
import CartsLocal from "../utils/cartLocal";

type CartProduct = {
  _id?: string;
  id?: string;
  name?: string;
  image?: string;
  category?: string;
  price?: number | string;
  count?: number;
  quantity?: number;
};

const getProductId = (product: CartProduct) =>
  String(product._id ?? product.id ?? "").trim();

function Cart() {
  const [cartData, setCartData] = useState<{ total: number; products: CartProduct[] }>({
    total: 0,
    products: [],
  });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập để xem giỏ hàng");
      window.location.href = "/login";
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URLS.cart}/cart`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        setCartData({ total: 0, products: [] });
        return;
      }

      const payload = await response.json();
      const data = payload?.data ?? payload ?? { total: 0, products: [] };
      const products: CartProduct[] = Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.Products)
          ? data.Products
          : [];
      setCartData({
        total: Number(data.total || 0),
        products,
      });
    } catch (error) {
      console.error("Error:", error);
      setCartData({ total: 0, products: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    ensureUserSession();
    fetchCart();
  }, [fetchCart]);

  const handleAuthError = (error: unknown) => {
    const code = (error as { code?: string })?.code;
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (code === "AUTH_REQUIRED" || status === 401) {
      localStorage.removeItem("token");
      alert("Vui lòng đăng nhập để cập nhật giỏ hàng");
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  const onIncrement = async (product: CartProduct) => {
    const productId = getProductId(product);
    if (!productId) return;
    setBusyId(productId);
    try {
      await CartsLocal.incrementProduct(productId);
      await fetchCart();
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error("Error:", error);
        alert("Không thể cập nhật giỏ hàng");
      }
    } finally {
      setBusyId(null);
    }
  };

  const onDecrement = async (product: CartProduct) => {
    const productId = getProductId(product);
    if (!productId) return;
    setBusyId(productId);
    try {
      await CartsLocal.decrementProduct(productId);
      await fetchCart();
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error("Error:", error);
        alert("Không thể cập nhật giỏ hàng");
      }
    } finally {
      setBusyId(null);
    }
  };

  const onRemove = async (product: CartProduct) => {
    const productId = getProductId(product);
    if (!productId) return;
    if (!window.confirm("Xóa sản phẩm này khỏi giỏ hàng?")) return;
    setBusyId(productId);
    try {
      await CartsLocal.removeProduct(productId);
      await fetchCart();
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error("Error:", error);
        alert("Không thể xóa sản phẩm khỏi giỏ hàng");
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Fragment>
      <div className="backgrounds">
        <div className="spacefo2">
          <div className="cart-page">
            <div className="cart-page-container">
              <div className="cart-page-header">
                <h2 className="cart-header-text">Giỏ hàng của bạn</h2>
              </div>
              <div className="cart-page-table">
                <table className="cart-table-product">
                  <thead>
                    <tr className="cart-table-header">
                      <th className="cart-table-img">Hình ảnh</th>
                      <th className="cart-table-desktop cart-table-payment">Tên sản phẩm</th>
                      <th className="cart-table-desktop cart-table-size">Danh mục</th>
                      <th className="cart-table-qty">Số lượng</th>
                      <th className="cart-table-size right-text-mobile">Giá</th>
                      <th className="cart-table-size">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                          Đang tải giỏ hàng...
                        </td>
                      </tr>
                    ) : cartData.products.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                          Giỏ hàng trống
                        </td>
                      </tr>
                    ) : (
                      cartData.products.map((product) => {
                        const name = product.name ?? "";
                        const image = product.image ?? "";
                        const category = product.category ?? "-";
                        const count = Number(product.count ?? product.quantity ?? 1);
                        const price = Number(product.price ?? 0);
                        const productId = getProductId(product);
                        const isBusy = busyId === productId;
                        return (
                          <tr className="cart-table-content" key={productId}>
                            <td className="cart-table-image-info">
                              <img src={image} alt="Hình ảnh sản phẩm" />
                            </td>
                            <td className="bold-text">{name}</td>
                            <td>{category}</td>
                            <td className="cart-table-qty">
                              <div className="cart-qty-controls">
                                <button
                                  type="button"
                                  className="cart-qty-btn"
                                  onClick={() => onDecrement(product)}
                                  disabled={isBusy}
                                  aria-label="Giảm số lượng"
                                >
                                  −
                                </button>
                                <span className="cart-qty-value">{count}</span>
                                <button
                                  type="button"
                                  className="cart-qty-btn"
                                  onClick={() => onIncrement(product)}
                                  disabled={isBusy}
                                  aria-label="Tăng số lượng"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td>{formatVnd(price * count)}</td>
                            <td>
                              <button
                                type="button"
                                className="cart-remove-btn"
                                onClick={() => onRemove(product)}
                                disabled={isBusy}
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="cart-table-bill">
                <div className="bill-total bold-text">{formatVnd(cartData.total)}</div>
              </div>
              <div className="cart-header-footer">
                <a href="/checkout">
                  <button className="cart-header-cta red-bg" type="button">
                    Tiến hành thanh toán
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
export default Cart;
