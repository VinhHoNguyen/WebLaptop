import "../Style/CheckOut.css";

function OrderSuccess() {
  return (
    <div className="container fix_order">
      <div className="success-card">
        <div className="success-badge">✓</div>
        <h1>Đặt hàng thành công</h1>
        <p>Cảm ơn bạn đã mua hàng! Đơn sẽ được xử lý trong thời gian sớm nhất.</p>
        <a className="success-home" href="/">
          Quay về trang chủ
        </a>
      </div>
    </div>
  );
}

export default OrderSuccess;
