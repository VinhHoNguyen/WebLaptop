import "./Footer.css";

function Footer() {
  return (
    <div className="footer">
      <div className="footer-static-middle">
        <div className="container">
          <div className="footer-logo-wrap pt-50 pb-35">
            <div className="row">
              <div className="col-lg-4 col-md-6">
                <div className="footer-info">
                  <h3 className="footer-block-title">Thông tin liên hệ</h3>
                </div>
                <ul className="des">
                  <li>
                    <span>Địa chỉ: </span>
                    828 Sư Vạn Hạnh, Quận 10, TP.HCM
                  </li>
                  <li>
                    <span>Điện thoại: </span>
                    <a href="tel:0763557366">0763557366</a>
                  </li>
                  <li>
                    <span>Email: </span>
                    <a href="mailto:tienkim9920@gmail.com">tienkim9920@gmail.com</a>
                  </li>
                </ul>
              </div>
              <div className="col-lg-2 col-md-3 col-sm-6">
                <div className="footer-block">
                  <h3 className="footer-block-title">Sản phẩm</h3>
                  <ul>
                    <li>
                      <a href="#">Giảm giá</a>
                    </li>
                    <li>
                      <a href="#">Sản phẩm mới</a>
                    </li>
                    <li>
                      <a href="#">Bán chạy</a>
                    </li>
                    <li>
                      <a href="#">Liên hệ</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-2 col-md-3 col-sm-6">
                <div className="footer-block">
                  <h3 className="footer-block-title">Công ty</h3>
                  <ul>
                    <li>
                      <a href="#">Giao hàng</a>
                    </li>
                    <li>
                      <a href="#">Điều khoản</a>
                    </li>
                    <li>
                      <a href="#">Giới thiệu</a>
                    </li>
                    <li>
                      <a href="#">Liên hệ</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="footer-newsletter">
                  <h4>Đăng ký nhận thông tin</h4>
                  <form
                    action="#"
                    method="post"
                    id="mc-embedded-subscribe-form"
                    name="mc-embedded-subscribe-form"
                    className="footer-subscribe-form validate"
                    target="_blank"
                  >
                    <div id="mc_embed_signup_scroll">
                      <div id="mc-form" className="mc-form subscribe-form form-group">
                        <input
                          id="mc-email"
                          type="email"
                          autoComplete="off"
                          placeholder="Nhập email để nhận thông tin"
                        />
                        <button className="btn" id="mc-submit">
                          Đăng ký
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
