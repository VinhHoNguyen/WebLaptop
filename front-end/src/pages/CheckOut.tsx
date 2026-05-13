import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import "../Style/CheckOut.css";
import CouponAPI from "../api/CouponAPI";
import DetailOrderAPI from "../api/DetailOrderAPI";
import NoteAPI from "../api/NoteAPI";
import OrderAPI from "../api/OrderAPI";
import MoMo from "../component/MoMo";
import { API_BASE_URLS } from "../config/api";
import { changeCount } from "../redux/actions/countActions";
import type { RootState } from "../redux/store";
import { ensureUserSession } from "../utils/auth";
import { formatVnd } from "../utils/currency";
import { getCartKey, type LocalCartItem } from "../utils/cartLocal";

type CheckoutForm = {
  fullname: string;
  phone: string;
  email: string;
  address: string;
};

function CheckOut() {
  const [orderID, setOrderID] = useState("");
  const [carts, setCarts] = useState<LocalCartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [triggerMomo, setTriggerMomo] = useState(false);
  const [loadOrder, setLoadOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "momo" | "">("");
  const [paymentError, setPaymentError] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");
  const [errorAddress, setErrorAddress] = useState(false);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [shippingPrice, setShippingPrice] = useState(0);
  const [accountInfo, setAccountInfo] = useState({ fullname: "", phone: "", email: "" });
  const [useOtherRecipient, setUseOtherRecipient] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: {
      fullname: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const information = watch();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const countChange = useSelector((state: RootState) => state.Count.isLoad);

  const socket = useMemo(
    () => io(API_BASE_URLS.socket, { transports: ["websocket"], autoConnect: false }),
    []
  );

  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    ensureUserSession();

    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE_URLS.user}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          const fullname = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
          const phone = data.phone || "";
          const email = data.email || "";
          setAccountInfo({ fullname, phone, email });
          setValue("fullname", fullname);
          setValue("phone", phone);
          setValue("email", email);
        })
        .catch(() => {});
    }

    const storedShipping = Number(localStorage.getItem("price") || 0);
    if (storedShipping) {
      setShippingPrice(storedShipping);
    }

    const cartKey = getCartKey();
    const cached = localStorage.getItem(cartKey);
    if (cached) {
      try {
        setCarts(JSON.parse(cached) as LocalCartItem[]);
      } catch {
        localStorage.removeItem(cartKey);
      }
    }

    const fetchCartFromServer = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URLS.cart}/cart`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const data = payload?.data ?? payload ?? {};
        const products = Array.isArray(data.products)
          ? data.products
          : Array.isArray(data.Products)
            ? data.Products
            : [];
        const items = products.map((product: any) => ({
          id_cart: product._id,
          id_product: product._id,
          name_product: product.name,
          price_product: Number(product.price || 0),
          count: Number(product.count ?? 1),
          image: product.image,
          size: "default",
        }));

        setCarts(items);
        localStorage.setItem(cartKey, JSON.stringify(items));
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchCartFromServer();
  }, []);

  useEffect(() => {
    let sumPrice = carts.reduce((sum, item) => sum + Number(item.price_product) * Number(item.count), 0);
    let currentDiscount = 0;

    const couponRaw = localStorage.getItem("coupon");
    if (couponRaw) {
      try {
        const coupon = JSON.parse(couponRaw) as { promotion?: string | number };
        const promotion = Number(coupon.promotion || 0);
        if (promotion > 0) {
          currentDiscount = (sumPrice * promotion) / 100;
        }
      } catch {
        currentDiscount = 0;
      }
    }

    const total = sumPrice - currentDiscount + Number(shippingPrice || 0);
    setDiscount(currentDiscount);
    setTotalPrice(total);
    localStorage.setItem("total_price", String(total));
  }, [carts, shippingPrice]);

  const handlerCheckDistance = () => {
    const mapElement = document.getElementById("to_places") as HTMLInputElement | null;
    const mapAddressValue = mapElement?.value?.trim() || "";
    const selectedAddress = mapAddressValue || searchAddress.trim();

    if (!selectedAddress) {
      setErrorAddress(true);
      return;
    }

    const kilo = document.getElementById("in_kilo")?.textContent?.trim() || "";
    const durationText = document.getElementById("duration_text")?.textContent?.trim() || "";
    const priceText = document.getElementById("price_shipping")?.textContent?.trim() || "";

    const priceValue = Number(priceText.replace(/[^0-9]/g, "")) || 0;

    setDistance(kilo);
    setDuration(durationText);
    setShippingPrice(priceValue);
    localStorage.setItem("price", String(priceValue));

    setSearchAddress(selectedAddress);
    setValue("address", selectedAddress, { shouldValidate: true });
    setErrorAddress(false);
  };

  const handlerCheckout = async (data: CheckoutForm) => {
    if (carts.length === 0) {
      alert("Giỏ hàng đang trống");
      return;
    }

    if (!paymentMethod) {
      setPaymentError(true);
      return;
    }

    if (!data.address) {
      setErrorAddress(true);
      alert("Vui lòng nhập địa chỉ và bấm 'Tính phí' để xác nhận!");
      return;
    }

    setPaymentError(false);

    if (paymentMethod === "momo") {
      localStorage.setItem("information", JSON.stringify(data));
      localStorage.setItem("total_price", String(totalPrice));
      localStorage.setItem("price", String(shippingPrice));

      const newOrderId = `ORDER${Date.now()}`;
      setOrderID(newOrderId);
      setTriggerMomo(true);
      return;
    }

    setLoadOrder(true);

    try {
      if (localStorage.getItem("id_coupon")) {
        await CouponAPI.updateCoupon(localStorage.getItem("id_coupon") || "");
      }

      const responseDelivery = await NoteAPI.post_note({
        fullname: data.fullname,
        phone: data.phone,
      });

      const userId = sessionStorage.getItem("id_user") || "";
      const dataOrder = {
        id_user: userId,
        address: data.address,
        total: totalPrice,
        status: "1",
        pay: false,
        id_payment: "6086709cdc52ab1ae999e882",
        id_note: responseDelivery?._id,
        feeship: shippingPrice,
        id_coupon: localStorage.getItem("id_coupon") || "",
        create_time: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      };

      const responseOrder = await OrderAPI.post_order(dataOrder);
      const cartKey = getCartKey();
      const cartRaw = localStorage.getItem(cartKey);
      const dataCarts = cartRaw ? (JSON.parse(cartRaw) as LocalCartItem[]) : [];

      for (let i = 0; i < dataCarts.length; i += 1) {
        const dataDetailOrder = {
          id_order: responseOrder?._id,
          id_product: dataCarts[i].id_product,
          name_product: dataCarts[i].name_product,
          price_product: dataCarts[i].price_product,
          count: dataCarts[i].count,
          size: dataCarts[i].size,
        };

        await DetailOrderAPI.post_detail_order(dataDetailOrder);
      }

      socket.emit("send_order", "Có người vừa đặt hàng");

      localStorage.removeItem("information");
      localStorage.removeItem("total_price");
      localStorage.removeItem("price");
      localStorage.removeItem("id_coupon");
      localStorage.removeItem("coupon");
      localStorage.setItem(cartKey, JSON.stringify([]));

      dispatch(changeCount(countChange));
      navigate("/success");
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Không thể đặt hàng. Vui lòng thử lại");
    } finally {
      setLoadOrder(false);
    }
  };

  const totalDisplay = useMemo(() => formatVnd(totalPrice), [totalPrice]);

  const toggleRecipient = () => {
    if (!useOtherRecipient) {
      setValue("fullname", "");
      setValue("phone", "");
      setValue("email", "");
    } else {
      setValue("fullname", accountInfo.fullname);
      setValue("phone", accountInfo.phone);
      setValue("email", accountInfo.email);
    }
    setUseOtherRecipient((prev) => !prev);
  };

  return (
    <div>
      {loadOrder && (
        <div className="wrapper_loader">
          <div className="loader"></div>
        </div>
      )}

      <div className="breadcrumb-area">
        <div className="container">
          <div className="breadcrumb-content">
            <ul>
              <li>
                <a href="/">Trang chủ</a>
              </li>
              <li className="active">Thanh toán</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="row">
          <div className="col-lg-6 col-12 pb-5">
            <form onSubmit={handleSubmit(handlerCheckout)}>
              <div className="checkbox-form">
                <h3>Thông tin người nhận</h3>
                <div className="row">
                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <label>
                        Họ và tên <span className="required">*</span>
                      </label>
                      <input
                        placeholder="Nhập họ tên"
                        type="text"
                        {...register("fullname", { required: true })}
                      />
                      {errors.fullname && <span className="field-error">* Vui lòng nhập họ tên</span>}
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <label>
                        Số điện thoại <span className="required">*</span>
                      </label>
                      <input
                        placeholder="Nhập số điện thoại"
                        type="text"
                        {...register("phone", { required: true })}
                      />
                      {errors.phone && <span className="field-error">* Vui lòng nhập số điện thoại</span>}
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <label>
                        Email <span className="required">*</span>
                      </label>
                      <input
                        placeholder="Nhập email"
                        type="email"
                        {...register("email", { required: true })}
                      />
                      {errors.email && <span className="field-error">* Vui lòng nhập email</span>}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        style={{ width: "100%", marginBottom: 8 }}
                        onClick={toggleRecipient}
                      >
                        {useOtherRecipient ? "← Dùng thông tin tài khoản của tôi" : "Gửi cho người nhận khác →"}
                      </button>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <label>
                        Tìm kiếm địa chỉ <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="to_places"
                        placeholder="Nhập địa chỉ giao hàng"
                        value={searchAddress}
                        onChange={(event) => setSearchAddress(event.target.value)}
                      />
                      {errorAddress && (
                        <span className="field-error">* Vui lòng nhập địa chỉ và bấm 'Tính phí'</span>
                      )}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <button
                        type="button"
                        className="btn btn-dark"
                        style={{ width: "100%", marginBottom: "20px" }}
                        onClick={handlerCheckDistance}
                      >
                        Kiểm tra địa chỉ &amp; Tính phí Ship
                      </button>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <label className="address-label">Địa chỉ nhận hàng (Chính thức):</label>
                      <input
                        type="text"
                        {...register("address", { required: true })}
                        value={information.address || ""}
                        readOnly
                        style={{
                          backgroundColor: information.address ? "#e8f5e9" : "#fff",
                          fontWeight: "bold",
                          color: "#2d3436",
                          border: "1px solid #27ae60",
                        }}
                        placeholder="Địa chỉ sẽ hiện ở đây sau khi tính phí..."
                      />
                      {errors.address && <span className="field-error">* Chưa xác nhận địa chỉ</span>}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <label>Phương tiện vận chuyển</label>
                      <select id="travel_mode" name="travel_mode" className="form-control">
                        <option value="DRIVING">Xe máy / Ô tô</option>
                      </select>
                    </div>
                  </div>

                  {(distance || duration || shippingPrice > 0) && (
                    <div className="col-md-12">
                      <div className="shipping-summary">
                        <div>
                          <strong>Khoảng cách:</strong> {distance || "Đang cập nhật"}
                        </div>
                        <div>
                          <strong>Thời gian:</strong> {duration || "Đang cập nhật"}
                        </div>
                        <div>
                          <strong>Phí vận chuyển:</strong> <span className="shipping-price">{formatVnd(shippingPrice)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div id="result" className="hide">
                    <div>
                      <label id="in_kilo"></label>
                    </div>
                    <div>
                      <label id="duration_text"></label>
                    </div>
                    <div>
                      <label id="price_shipping"></label>
                    </div>
                    <input id="destination" type="hidden" name="destination" />
                  </div>

                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <div className="order-button-payment">
                        <input value="Đặt hàng" type="submit" style={{ width: "100%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="col-lg-6 col-12">
            <div className="your-order">
              <h3>Đơn hàng của bạn</h3>
              <div className="your-order-table table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="cart-product-name" style={{ width: "60%" }}>
                        Sản phẩm
                      </th>
                      <th className="cart-product-total" style={{ textAlign: "right" }}>
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {carts.map((value: LocalCartItem) => (
                      <tr className="cart_item" key={value.id_cart}>
                        <td className="cart-product-name">
                          <div className="order-item-row">
                            {value.image && (
                              <img
                                src={value.image}
                                alt={value.name_product}
                                className="order-item-image"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                            <div>
                              <div>{value.name_product}</div>
                              <strong className="product-quantity">Số lượng: {value.count}</strong>
                            </div>
                          </div>
                        </td>
                        <td className="cart-product-total" style={{ textAlign: "right", verticalAlign: "middle" }}>
                          <span className="amount">
                            {formatVnd(Number(value.price_product) * Number(value.count))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="cart-subtotal">
                      <th>Phí vận chuyển</th>
                      <td style={{ textAlign: "right" }}>
                        <span className="amount">{formatVnd(shippingPrice)}</span>
                      </td>
                    </tr>
                    <tr className="cart-subtotal">
                      <th>Giảm giá</th>
                      <td style={{ textAlign: "right" }}>
                        <span className="amount discount">-{formatVnd(discount)}</span>
                      </td>
                    </tr>
                    <tr className="order-total">
                      <th>Tổng cộng</th>
                      <td style={{ textAlign: "right" }}>
                        <strong>
                          <span className="amount total">{totalDisplay}</span>
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="payment-method">
                <h4>
                  Phương thức thanh toán <span className="required">*</span>
                </h4>
                {paymentError && <p className="field-error">* Vui lòng chọn phương thức thanh toán</p>}
                <div className="payment-accordion">
                  <div id="accordion">
                    <div
                      className={`card ${paymentMethod === "cod" ? "active" : ""}`}
                      onClick={() => {
                        setPaymentMethod("cod");
                        setTriggerMomo(false);
                        setPaymentError(false);
                      }}
                    >
                      <div className="card-header">
                        <h5 className="panel-title mb-0">
                          <label className="payment-label">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cod"
                              checked={paymentMethod === "cod"}
                              onChange={() => {
                                setPaymentMethod("cod");
                                setTriggerMomo(false);
                                setPaymentError(false);
                              }}
                            />
                            <span className="payment-icon">💵</span>
                            <span>Thanh toán khi nhận hàng (COD)</span>
                          </label>
                        </h5>
                      </div>
                    </div>

                    <div
                      className={`card momo ${paymentMethod === "momo" ? "active" : ""}`}
                      onClick={() => {
                        setPaymentMethod("momo");
                        setPaymentError(false);
                      }}
                    >
                      <div className="card-header">
                        <h5 className="panel-title mb-0">
                          <label className="payment-label">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="momo"
                              checked={paymentMethod === "momo"}
                              onChange={() => {
                                setPaymentMethod("momo");
                                setPaymentError(false);
                              }}
                            />
                            <img
                              src="https://homepage.momocdn.net/img/logo-momo.png"
                              alt="MoMo"
                              className="momo-logo"
                            />
                            <span>Ví MoMo</span>
                          </label>
                        </h5>
                      </div>
                      {paymentMethod === "momo" && (
                        <div className="card-body">
                          {errors.fullname || errors.phone || errors.email ? (
                            <p className="field-error">Vui lòng kiểm tra lại thông tin!</p>
                          ) : (
                            <div className="momo-body">
                              <img
                                src="https://homepage.momocdn.net/img/logo-momo.png"
                                width="80"
                                alt="MoMo"
                              />
                              <p>Thanh toán an toàn qua ví MoMo</p>
                              {triggerMomo && orderID && totalPrice > 0 && (
                                <MoMo orderID={orderID} total={totalPrice} />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckOut;
