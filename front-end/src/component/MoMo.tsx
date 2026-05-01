import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URLS } from "../config/api";

type MoMoProps = {
  orderID: string;
  total: number;
};

function MoMo({ orderID, total }: MoMoProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [called, setCalled] = useState(false);

  useEffect(() => {
    if (!orderID || !total || total <= 0 || called) {
      return;
    }

    setCalled(true);
    setLoading(true);

    axios
      .post(`${API_BASE_URLS.payment}/api/Payment/momo/create`, {
        orderID,
        total,
      })
      .then((response) => {
        setLoading(false);

        if (response.data?.resultCode !== 0) {
          setError(true);
          setTimeout(() => {
            setError(false);
            setCalled(false);
          }, 3000);
          return;
        }

        const payUrl = response.data?.payUrl;
        if (payUrl && payUrl !== "null") {
          localStorage.setItem("momoOrderId", response.data?.orderId || orderID);
          localStorage.setItem("originalOrderId", orderID);
          window.location.href = payUrl;
        } else {
          setError(true);
          setTimeout(() => {
            setError(false);
            setCalled(false);
          }, 3000);
        }
      })
      .catch((error) => {
        console.error("MoMo API Error:", error);
        setLoading(false);
        setError(true);
        setTimeout(() => {
          setError(false);
          setCalled(false);
        }, 3000);
      });
  }, [orderID, total, called]);

  return (
    <div>
      {loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div className="spinner-border text-danger" role="status">
            <span className="sr-only">Đang xử lý...</span>
          </div>
          <p style={{ marginTop: "10px", color: "#666" }}>Đang kết nối với MoMo...</p>
        </div>
      )}
      {error && (
        <div className="modal_success">
          <div className="group_model_success pt-3">
            <div className="text-center p-2">
              <i className="fa fa-bell fix_icon_bell" style={{ fontSize: "40px", color: "#fff", backgroundColor: "#f84545" }}></i>
            </div>
            <h4 className="text-center p-3" style={{ color: "#fff" }}>
              Lỗi thanh toán MoMo! Vui lòng thử lại.
            </h4>
          </div>
        </div>
      )}
    </div>
  );
}

export default MoMo;
