import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import "../Style/CheckOut.css";
import CouponAPI from "../api/CouponAPI";
import DetailOrderAPI from "../api/DetailOrderAPI";
import OrderAPI from "../api/OrderAPI";
import { changeCount } from "../redux/actions/countActions";
import type { RootState } from "../redux/store";
import CartsLocal, { getCartKey, type LocalCartItem } from "../utils/cartLocal";

function OrderMomo() {
  const [note, setNote] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const countChange = useSelector((state: RootState) => state.Count.isLoad);

  useEffect(() => {
    const informationRaw = localStorage.getItem("information");
    if (!informationRaw) {
      navigate("/");
      return;
    }

    const information = JSON.parse(informationRaw) as {
      fullname: string;
      phone: string;
      address: string;
    };

    const total = Number(localStorage.getItem("total_price") || 0);
    const price = Number(localStorage.getItem("price") || 0);

    const fetchData = async () => {
      const params = new URLSearchParams(window.location.search);
      const resultCode = params.get("resultCode");
      const message = params.get("message");

      if (resultCode === "0") {
        if (localStorage.getItem("id_coupon")) {
          await CouponAPI.updateCoupon(localStorage.getItem("id_coupon") || "");
        }

        const userId = sessionStorage.getItem("id_user") || "";
        const dataOrder = {
          id_user: userId,
          address: information.address,
          total: total,
          status: "1",
          pay: true,
          id_payment: "60c05c3adae4bef7b3d55fbf",
          feeship: price,
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
        localStorage.removeItem("information");
        localStorage.removeItem("total_price");
        localStorage.removeItem("price");
        localStorage.removeItem("id_coupon");
        localStorage.removeItem("coupon");
        localStorage.removeItem("momoOrderId");
        localStorage.removeItem("originalOrderId");

        dispatch(changeCount(countChange));
        setTimeout(() => {
          navigate("/history");
        }, 2500);

        setNote("Thanh toán MoMo thành công!");
      } else {
        setNote(`Thanh toán MoMo thất bại: ${message || "Vui lòng thử lại"}`);
      }
    };

    fetchData();
  }, [countChange, dispatch, navigate]);

  return (
    <div className="container fix_order">
      <h1>{note}</h1>
      <span style={{ fontSize: "1.1rem" }}>Vui lòng kiểm tra lại thông tin!</span>
    </div>
  );
}

export default OrderMomo;
