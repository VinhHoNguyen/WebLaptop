import { useState } from "react";
import "../Style/Login.css";
import { API_BASE_URLS } from "../config/api";
import { decodeJwt } from "../utils/auth";
import CartsLocal from "../utils/cartLocal";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URLS.user}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const token = await response.json();
        localStorage.setItem("token", token);

        const payload = decodeJwt(token);
        if (payload?.user) {
          localStorage.setItem("user", JSON.stringify(payload.user));
          if (payload.user.id) sessionStorage.setItem("id_user", payload.user.id);
        }

        try { await CartsLocal.syncWithServer(); } catch {}
        window.location.href = "/";
      } else {
        alert("Sai email hoặc mật khẩu");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <a href="/" className="login-logo">
          <div className="login-logo-mark">SV</div>
          <span>LapSinhVien</span>
        </a>

        <h1 className="login-title">Đăng nhập</h1>
        <p className="login-subtitle">Chào mừng trở lại! Đăng nhập để tiếp tục mua sắm.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="text"
              required
              placeholder="Nhập email của bạn"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Mật khẩu</label>
            <div className="login-password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Nhập mật khẩu"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit">
            Đăng nhập
          </button>
        </form>

        <p className="login-footer">
          Chưa có tài khoản?{" "}
          <a href="/register">Đăng ký ngay</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
