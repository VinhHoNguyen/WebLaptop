import "../Style/CheckOut.css";

function OrderSuccess() {
  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-icon success">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="status-title">Đặt hàng thành công!</h1>
        <p className="status-desc">
          <span className="status-thank">Cảm ơn bạn đã mua hàng tại LapSinhVien.</span><br/>
          Đơn hàng đang được xử lý — vui lòng kiểm tra email để xem chi tiết.
        </p>
        <div className="status-actions">
          <a href="/" className="status-btn primary">Quay trở lại trang chủ</a>
          <a href="/history" className="status-btn secondary">Xem đơn hàng</a>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
