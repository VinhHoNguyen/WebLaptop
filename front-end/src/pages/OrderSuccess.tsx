import "../Style/CheckOut.css";

function OrderSuccess() {
  return (
    <div className="container fix_order">
      <h1>Bạn đã đặt hàng thành công</h1>
      <span style={{ fontSize: "1.1rem" }}>Vui lòng kiểm tra email!</span>
    </div>
  );
}

export default OrderSuccess;
