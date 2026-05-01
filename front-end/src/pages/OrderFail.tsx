import "../Style/CheckOut.css";

function OrderFail() {
  return (
    <div className="container fix_order">
      <h1>Bạn đã đặt hàng thất bại</h1>
      <span style={{ fontSize: "1.1rem" }}>Vui lòng kiểm tra lại thông tin!</span>
    </div>
  );
}

export default OrderFail;
