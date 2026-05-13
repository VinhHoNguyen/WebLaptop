import "../Style/NavBar.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import profileHeaderImg from "../assets/profile-header.jpg";

function NavBar() {
  const [activeLink, setActiveLink] = useState("home");

  const handleLinkClick = (name: string) => {
    setActiveLink(name);
  };

  return (
    <header className="header-area header-sticky">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <nav className="main-nav">
              <a href="/" className="logo">
                <div className="logo-mark">sv</div>
                <div className="logo-wordmark">
                  <span>Lap</span>
                  <span>SinhVien</span>
                </div>
              </a>
              <div className="search-input"></div>
              <ul className="nav">
                <li>
                  <a href="/" className="active" onClick={() => handleLinkClick("home")}>
                    Trang chủ
                  </a>
                </li>
                <li className="nav-cart">
                  <a href="/cart" title="Giỏ hàng">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </a>
                </li>
                <li>
                  <a href="/login">Đăng nhập</a>
                </li>
                <li>
                  <a href="/profile">
                    Hồ sơ <img src={profileHeaderImg} alt="Ảnh hồ sơ" />
                  </a>
                </li>
              </ul>
              <a className="menu-trigger">
                <span>Danh mục</span>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

export default NavBar;
