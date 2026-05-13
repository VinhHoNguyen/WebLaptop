import { Fragment, useState } from "react";
import "../Style/Login.css";
import { API_BASE_URLS } from "../config/api";
import { decodeJwt } from "../utils/auth";
function Login() {


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URLS.user}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password })
      });
  
      if (response.ok) {
        console.log("Login successful");
        const token = await response.json();
        localStorage.setItem("token", token);

        const payload = decodeJwt(token);
        if (payload?.user) {
          localStorage.setItem("user", JSON.stringify(payload.user));
          if (payload.user.id) {
            sessionStorage.setItem("id_user", payload.user.id);
          }
        }

        window.location.href = "/";
      } else {
        alert("Sai email hoặc mật khẩu");
        window.location.href = "/login";
        console.log("Login failed");
      }
    } catch (error) {
      console.error("Error:", error);
    }


  }
  return (
    <Fragment>
      <div className="bg-img">
        <div className="content">
          <header>Đăng nhập</header>
          <form onSubmit={handleSubmit}>
            <h4 className="fieldHeader">Email</h4>
            <div className="field">
              <span className="person"> </span>
              <input
                id="email"
                name="email"
                type="text"
                required
                placeholder="Email hoặc tên đăng nhập"
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              ></input>
            </div>
            <h4 className="fieldHeader space">Mật khẩu</h4>
            <div className="field space">
              <span className="password"></span>
              <input
                id="password"
                name="password"
                type="password"
                className="pass-key"
                required
                placeholder="Mật khẩu"
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              ></input>
              <span className="show">HIỆN</span>
            </div>
            <div className="field space">
              <input type="submit" value="ĐĂNG NHẬP" />
            </div>
          </form>
          <div className="signup space">
            Chưa có tài khoản?
            <a href="/register">Đăng ký ngay</a>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default Login;
