import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import "../Style/CheckOut.css";
import CouponAPI from "../api/CouponAPI";
import DetailOrderAPI from "../api/DetailOrderAPI";
import OrderAPI from "../api/OrderAPI";
import MoMo from "../component/MoMo";
import { API_BASE_URLS } from "../config/api";
import { changeCount } from "../redux/actions/countActions";
import type { RootState } from "../redux/store";
import { ensureUserSession } from "../utils/auth";
import { formatVnd } from "../utils/currency";
import CartsLocal, { getCartKey, type LocalCartItem } from "../utils/cartLocal";

type CheckoutForm = {
  fullname: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
};

type LocationOption = {
  code: number;
  name: string;
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
  const [shippingPrice, setShippingPrice] = useState(30000);
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [wards, setWards] = useState<LocationOption[]>([]);
  const [addressLoading, setAddressLoading] = useState({
    province: false,
    district: false,
    ward: false,
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: {
      fullname: "",
      phone: "",
      province: "",
      district: "",
      ward: "",
      street: "",
    },
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const countChange = useSelector((state: RootState) => state.Count.isLoad);
  const provinceValue = watch("province");
  const districtValue = watch("district");

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
    let isActive = true;

    const loadProvinces = async () => {
      setAddressLoading((prev) => ({ ...prev, province: true }));
      try {
        const response = await fetch("https://provinces.open-api.vn/api/p/");
        if (!response.ok) {
          throw new Error("Unable to fetch provinces");
        }
        const data = (await response.json()) as LocationOption[];
        if (!isActive) return;
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setProvinces(sorted);
      } catch (error) {
        console.error("Failed to load provinces:", error);
      } finally {
        if (isActive) {
          setAddressLoading((prev) => ({ ...prev, province: false }));
        }
      }
    };

    loadProvinces();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    ensureUserSession();

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

        const data = (await response.json()) as { Products?: any[] };
        const items = (data.Products || []).map((product) => ({
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

  const handlerCheckout = async (data: CheckoutForm) => {
    if (carts.length === 0) {
      alert("Giỏ hàng đang trống");
      return;
    }

    if (!paymentMethod) {
      setPaymentError(true);
      return;
    }

    if (!data.province || !data.district || !data.ward || !data.street?.trim()) {
      alert("Vui lòng chọn đủ tỉnh/thành, quận/huyện, phường/xã và nhập số nhà.");
      return;
    }

    const provinceName = provinces.find((item) => String(item.code) === data.province)?.name || data.province;
    const districtName = districts.find((item) => String(item.code) === data.district)?.name || data.district;
    const wardName = wards.find((item) => String(item.code) === data.ward)?.name || data.ward;
    const fullAddress = [data.street, wardName, districtName, provinceName]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(", ");

    setPaymentError(false);

    if (paymentMethod === "momo") {
      localStorage.setItem("information", JSON.stringify({ ...data, address: fullAddress }));
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

      const userId = sessionStorage.getItem("id_user") || "";
      const dataOrder = {
        id_user: userId,
        address: fullAddress,
        total: totalPrice,
        status: "1",
        pay: false,
        id_payment: "6086709cdc52ab1ae999e882",
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

      await CartsLocal.clearCart();

      socket.emit("send_order", "Có người vừa đặt hàng");

      localStorage.removeItem("information");
      localStorage.removeItem("total_price");
      localStorage.removeItem("price");
      localStorage.removeItem("id_coupon");
      localStorage.removeItem("coupon");
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

  useEffect(() => {
    let isActive = true;
    setValue("district", "");
    setValue("ward", "");
    setDistricts([]);
    setWards([]);

    if (!provinceValue) {
      return () => {
        isActive = false;
      };
    }

    const loadDistricts = async () => {
      setAddressLoading((prev) => ({ ...prev, district: true }));
      try {
        const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceValue}?depth=2`);
        if (!response.ok) {
          throw new Error("Unable to fetch districts");
        }
        const data = (await response.json()) as { districts?: LocationOption[] };
        if (!isActive) return;
        const list = data?.districts || [];
        const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
        setDistricts(sorted);
      } catch (error) {
        console.error("Failed to load districts:", error);
      } finally {
        if (isActive) {
          setAddressLoading((prev) => ({ ...prev, district: false }));
        }
      }
    };

    loadDistricts();

    return () => {
      isActive = false;
    };
  }, [provinceValue, setValue]);

  useEffect(() => {
    let isActive = true;
    setValue("ward", "");
    setWards([]);

    if (!districtValue) {
      return () => {
        isActive = false;
      };
    }

    const loadWards = async () => {
      setAddressLoading((prev) => ({ ...prev, ward: true }));
      try {
        const response = await fetch(`https://provinces.open-api.vn/api/d/${districtValue}?depth=2`);
        if (!response.ok) {
          throw new Error("Unable to fetch wards");
        }
        const data = (await response.json()) as { wards?: LocationOption[] };
        if (!isActive) return;
        const list = data?.wards || [];
        const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
        setWards(sorted);
      } catch (error) {
        console.error("Failed to load wards:", error);
      } finally {
        if (isActive) {
          setAddressLoading((prev) => ({ ...prev, ward: false }));
        }
      }
    };

    loadWards();

    return () => {
      isActive = false;
    };
  }, [districtValue, setValue]);

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
                        Tỉnh/Thành phố <span className="required">*</span>
                      </label>
                      <select {...register("province", { required: true })}>
                        <option value="">
                          {addressLoading.province ? "Đang tải tỉnh/thành..." : "Chọn tỉnh/thành phố"}
                        </option>
                        {provinces.map((province) => (
                          <option key={province.code} value={province.code}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                      {errors.province && <span className="field-error">* Vui lòng chọn tỉnh/thành</span>}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <label>
                        Quận/Huyện <span className="required">*</span>
                      </label>
                      <select
                        {...register("district", { required: true })}
                        disabled={!provinceValue || addressLoading.district}
                      >
                        <option value="">
                          {addressLoading.district ? "Đang tải quận/huyện..." : "Chọn quận/huyện"}
                        </option>
                        {districts.map((district) => (
                          <option key={district.code} value={district.code}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                      {errors.district && <span className="field-error">* Vui lòng chọn quận/huyện</span>}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <label>
                        Phường/Xã <span className="required">*</span>
                      </label>
                      <select
                        {...register("ward", { required: true })}
                        disabled={!districtValue || addressLoading.ward}
                      >
                        <option value="">
                          {addressLoading.ward ? "Đang tải phường/xã..." : "Chọn phường/xã"}
                        </option>
                        {wards.map((ward) => (
                          <option key={ward.code} value={ward.code}>
                            {ward.name}
                          </option>
                        ))}
                      </select>
                      {errors.ward && <span className="field-error">* Vui lòng chọn phường/xã</span>}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="checkout-form-list">
                      <label>
                        Tên đường, tòa nhà, số nhà <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 155 Sư Vạn Hạnh, tòa nhà A"
                        {...register("street", { required: true })}
                      />
                      {errors.street && <span className="field-error">* Vui lòng nhập số nhà</span>}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="shipping-summary">
                      <div>
                        <strong>Phí vận chuyển cố định:</strong> <span className="shipping-price">{formatVnd(shippingPrice)}</span>
                      </div>
                    </div>
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
                    {carts.map((value) => (
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
                          {errors.fullname || errors.phone || errors.province || errors.district || errors.ward || errors.street ? (
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
