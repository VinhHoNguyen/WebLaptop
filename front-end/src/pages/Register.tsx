import "../Style/Register.css";
import { useState } from "react";
import { API_BASE_URLS } from "../config/api";

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("male");
  const [password, setPassword] = useState("");
  const [confpassword, setconfPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confpassword) {
      alert("Mật khẩu không trùng khớp");
      return;
    }

    try {
      const payload = {
        email,
        password,
        firstName,
        lastName,
        age: age ? Number(age) : undefined,
        phone,
        gender,
      };

      const response = await fetch(`${API_BASE_URLS.user}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        alert(responseData?.message || "Đăng ký thất bại");
        return;
      }

      window.location.href = "/login";
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <a href="/" className="register-logo">
          <div className="register-logo-mark">SV</div>
          <span>LapSinhVien</span>
        </a>

        <h1 className="register-title">Tạo tài khoản</h1>
        <p className="register-subtitle">Điền thông tin bên dưới để bắt đầu mua sắm.</p>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-row">
            <div className="register-field">
              <label>Họ</label>
              <input
                type="text"
                required
                placeholder="Họ"
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="register-field">
              <label>Tên</label>
              <input
                type="text"
                required
                placeholder="Tên"
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="register-row">
            <div className="register-field">
              <label>Email</label>
              <input
                type="email"
                required
                placeholder="Email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="register-field">
              <label>Số điện thoại</label>
              <input
                type="text"
                required
                placeholder="Số điện thoại"
                name="phone"
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="register-row">
            <div className="register-field">
              <label>Mật khẩu</label>
              <input
                type="password"
                required
                placeholder="Mật khẩu"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="register-field">
              <label>Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                placeholder="Nhập lại mật khẩu"
                onChange={(e) => setconfPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="register-row">
            <div className="register-field">
              <label>Tuổi</label>
              <input
                type="number"
                required
                placeholder="Tuổi"
                name="age"
                min="1"
                max="120"
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="register-field">
              <label>Giới tính</label>
              <select
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <button type="submit" className="register-submit">
            Tạo tài khoản
          </button>
        </form>

        <p className="register-footer">
          Đã có tài khoản?{" "}
          <a href="/login">Đăng nhập</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
