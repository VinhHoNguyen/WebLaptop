import { Fragment, useEffect, useState } from "react";

import "../Style/Cart.css";
import { API_BASE_URLS } from "../config/api";
import { formatVnd } from "../utils/currency";
import { getCartKey, type LocalCartItem } from "../utils/cartLocal";
import { ensureUserSession } from "../utils/auth";
function Cart() {

  const [cartData, setCartData] = useState<{ total: number; products: any[] }>({ total: 0, products: [] });

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        ensureUserSession();
        const token = localStorage.getItem("token");

        const loadLocalCart = () => {
          const cartKey = getCartKey();
          const cached = localStorage.getItem(cartKey);
          const localItems = cached ? (JSON.parse(cached) as LocalCartItem[]) : [];
          const total = localItems.reduce(
            (sum, item) => sum + Number(item.price_product || 0) * Number(item.count || 0),
            0
          );
          setCartData({ total, products: localItems });
        };

        if (!token) {
          loadLocalCart();
          return;
        }

        const response = await fetch(`${API_BASE_URLS.cart}/cart`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
          },
        });

        if (response.ok) {
          console.log("Welcome to cart");
          const payload = await response.json();
          const data = payload?.data ?? payload ?? { total: 0, products: [] };
          const products = Array.isArray(data.products)
            ? data.products
            : Array.isArray(data.Products)
              ? data.Products
              : [];
          setCartData({
            total: Number(data.total || 0),
            products,
          });
        } else {
          // Check if token is invalid (e.g., expired or unauthorized)
          if (response.status === 401) {
            console.log("Invalid token");
            localStorage.removeItem("token");
            loadLocalCart();
          } else {
            console.log("Failed to fetch cart data");
            loadLocalCart();
          }
        }
      } catch (error) {
        console.error("Error:", error);
        const token = localStorage.getItem("token");
        if (!token) {
          const cartKey = getCartKey();
          const cached = localStorage.getItem(cartKey);
          const localItems = cached ? (JSON.parse(cached) as LocalCartItem[]) : [];
          const total = localItems.reduce(
            (sum, item) => sum + Number(item.price_product || 0) * Number(item.count || 0),
            0
          );
          setCartData({ total, products: localItems });
        }
      }
    };

    fetchCartData();
  }, []);

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
                      <th className="cart-table-size right-text-mobile">
                        Giá
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    
                  {cartData.products.map((product: any) => {
                    const name = product.name ?? product.name_product ?? "";
                    const image = product.image ?? product.img1 ?? product.thumbnail ?? "";
                    const category = product.category ?? "-";
                    const count = product.count ?? product.quantity ?? 1;
                    const price = Number(product.price ?? product.price_product ?? 0);
                    const key = product._id || product.id_cart || product.id_product;
                    return (
                    <tr className="cart-table-content" key={key}>
                      <td className="cart-table-image-info">
                        <img src={image} alt="Hình ảnh sản phẩm"/>
                      </td>
                      <td className="bold-text">{name}</td>
                      <td>{category}</td>
                      <td className="cart-table-qty">{count}</td>
                      <td>{formatVnd(price)}</td>
                    </tr>
                    );
                  })}

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
