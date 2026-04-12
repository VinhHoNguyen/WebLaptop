import { Fragment, useEffect, useState } from "react";

import "../Style/Cart.css";
import CartAPI from "../api/CartAPI";
import { formatVnd } from "../utils/currency";

type CartProduct = {
  _id: string;
  name: string;
  category?: string;
  image?: string;
  price: number;
  count?: number;
};

type CartData = {
  total: number;
  Products: CartProduct[];
};
function Cart() {
  const [cartData, setCartData] = useState<CartData>({ total: 0, Products: [] });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCartData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/login";
        console.log("Token not found");
        return;
      }

      const data = await CartAPI.Get_Cart();
      setCartData(data);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log("Invalid token");
      } else {
        console.error("Error:", error);
      }
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  const updateQuantity = async (productId: string, nextCount: number) => {
    if (updatingId === productId) {
      return;
    }

    setUpdatingId(productId);

    try {
      await CartAPI.Update_Cart_Item(productId, nextCount);
      await fetchCartData();
    } catch (error) {
      console.error("Error updating cart:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    if (updatingId === productId) {
      return;
    }

    setUpdatingId(productId);

    try {
      await CartAPI.Remove_From_Cart(productId);
      await fetchCartData();
    } catch (error) {
      console.error("Error removing from cart:", error);
    } finally {
      setUpdatingId(null);
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
                      <th className="cart-table-desktop cart-table-payment">
                        Tên sản phẩm
                      </th>
                      <th className="cart-table-desktop cart-table-size">
                        Danh mục
                      </th>
                      <th className="cart-table-qty">Số lượng</th>
                      <th className="cart-table-size right-text-mobile">Giá</th>
                      <th className="cart-table-actions">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartData.Products.length === 0 ? (
                      <tr className="cart-table-content">
                        <td className="cart-empty" colSpan={6}>
                          Giỏ hàng đang trống.
                        </td>
                      </tr>
                    ) : (
                      cartData.Products.map((product) => {
                        const count = Number(product.count ?? 1);
                        const isUpdating = updatingId === product._id;

                        return (
                          <tr className="cart-table-content" key={product._id}>
                            <td className="cart-table-image-info">
                              <img src={product.image} alt="Hình ảnh sản phẩm" />
                            </td>
                            <td className="bold-text">{product.name}</td>
                            <td>{product.category || "-"}</td>
                            <td className="cart-table-qty">
                              <div className="cart-qty-control">
                                <button
                                  type="button"
                                  className="cart-qty-btn"
                                  onClick={() => updateQuantity(product._id, count - 1)}
                                  disabled={isUpdating || count <= 1}
                                >
                                  -
                                </button>
                                <span className="cart-qty-value">{count}</span>
                                <button
                                  type="button"
                                  className="cart-qty-btn"
                                  onClick={() => updateQuantity(product._id, count + 1)}
                                  disabled={isUpdating}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="right-text-mobile">{formatVnd(product.price)}</td>
                            <td className="cart-table-actions">
                              <button
                                type="button"
                                className="cart-remove-btn"
                                onClick={() => handleRemove(product._id)}
                                disabled={isUpdating}
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
