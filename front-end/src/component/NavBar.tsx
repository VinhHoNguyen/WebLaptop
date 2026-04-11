import "../Style/NavBar.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import handleSearch from "../pages/Home";
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
                  <img
                    src="/logo-lapsinhvien.png"
                    alt="Lapsinhvien"
                    className="logo-image"
                  />
                </a>
                <div className="search-input">
                  {/* <form id="search" onSubmit={handleSearch}>
                    <input
                      type="text"
                      placeholder="Type Something"
                      id="searchText"
                      name="searchKeyword"
                    />
                    <i className="fa fa-search"></i>
                  </form> */}
                </div>
                <ul className="nav">
                  <li>
                    <a href="/" className="active">
                      Trang chủ
                    </a>
                  </li>

                  {/* <li>
                    <a href="/checkout">checkout</a>
                  </li> */}
                  <li>
                    <a href="/cart">Giỏ hàng</a>
                  </li>
                  <li>
                    <a href="/login">Đăng nhập</a>
                  </li>
                  <li>
                    <a href="/profile">
                      Hồ sơ <img src="src\assets\profile-header.jpg" alt="Ảnh hồ sơ" />
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
