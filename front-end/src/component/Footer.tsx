import "../Style/Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-glow" />

      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-mark">⬡</span>
            <span className="footer-logo-name">LaptopStore</span>
          </div>
          <p className="footer-tagline">
            Nền tảng mua sắm laptop & phụ kiện công nghệ chuyên nghiệp tại Việt Nam.
          </p>

          {/* Bộ Công Thương badge */}
          <a
            href="http://online.gov.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-bct-link"
            title="Đã thông báo Bộ Công Thương"
          >
            <img
              src="/LogoCongThuong.png"
              alt="Đã thông báo Bộ Công Thương"
              className="footer-bct-badge"
            />
          </a>
        </div>

        {/* Navigation links */}
        <div className="footer-section">
          <h4 className="footer-heading">Danh mục</h4>
          <ul className="footer-links">
            <li><a href="/">Trang chủ</a></li>
            <li><a href="/?category=laptop">Laptop</a></li>
            <li><a href="/?category=peripheral">Phụ kiện</a></li>
            <li><a href="/?category=hardware">Linh kiện</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Hỗ trợ</h4>
          <ul className="footer-links">
            <li><a href="/history">Lịch sử đơn hàng</a></li>
            <li><a href="/profile">Tài khoản của tôi</a></li>
            <li><a href="#">Chính sách đổi trả</a></li>
            <li><a href="#">Hướng dẫn mua hàng</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Liên hệ</h4>
          <ul className="footer-links footer-contact">
            <li>
              <span className="footer-icon">📍</span>
              <span>123 Đường Lê Lợi, TP.HCM</span>
            </li>
            <li>
              <span className="footer-icon">📞</span>
              <span>1800 1234 (miễn phí)</span>
            </li>
            <li>
              <span className="footer-icon">✉️</span>
              <span>support@laptopstore.vn</span>
            </li>
            <li>
              <span className="footer-icon">🕐</span>
              <span>8:00 – 22:00 hàng ngày</span>
            </li>
          </ul>

          <div className="footer-socials">
            <a href="#" aria-label="Facebook" className="footer-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="#" aria-label="TikTok" className="footer-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.18 8.18 0 0 0 4.78 1.52V6.8a4.85 4.85 0 0 1-1.01-.11z" />
              </svg>
            </a>
            <a href="#" aria-label="YouTube" className="footer-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="var(--bg)" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-copy">
          © {currentYear} LaptopStore Vietnam. Bảo lưu mọi quyền.
        </p>
        <div className="footer-legal">
          <a href="#">Điều khoản sử dụng</a>
          <span className="footer-divider">·</span>
          <a href="#">Chính sách bảo mật</a>
          <span className="footer-divider">·</span>
          <a href="#">Cookie</a>
        </div>
      </div>
    </footer>
  );
}
