import "../Style/CheckOut.css";

function OrderFail() {
  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-icon fail">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <h1 className="status-title">Đặt hàng thất bại!</h1>
        <p className="status-desc">
          Đã xảy ra lỗi trong quá trình đặt hàng.<br/>
          Vui lòng kiểm tra lại thông tin và thử lại.
        </p>
        <div className="status-actions">
          <a href="/checkout" className="status-btn primary">Thử lại</a>
          <a href="/" className="status-btn secondary">Về trang chủ</a>
        </div>
      </div>
    </div>
  );
}

export default OrderFail;
