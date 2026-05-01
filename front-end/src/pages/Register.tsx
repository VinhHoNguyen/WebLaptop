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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        alert(responseData?.message || "Đăng ký thất bại");
        return;
      }

      console.log("Đăng ký thành công");
      window.location.href = "/login";
    } catch (error) {
      console.error("Error:", error);
    }
  }
  return (
    <div className="bg-img">
      <div className="registerContent">
        <header>Đăng ký</header>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col">
              <h6>Họ</h6>
            </div>
            <div className="col">
              <h6>Tên</h6>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <div className="field">
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Họ"
                  onChange={(event) => setFirstName(event.target.value)}
                ></input>
              </div>
            </div>
            <div className="col">
              <div className="field">
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Tên"
                  onChange={(event) => setLastName(event.target.value)}
                ></input>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <h6>Email</h6>
            </div>
            <div className="col">
              <h6>Số điện thoại</h6>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <div className="field">
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="Email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                ></input>
              </div>
            </div>
            <div className="col">
              <div className="field">
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Số điện thoại"
                  name="phone"
                  onChange={(event) => setPhoneNumber(event.target.value)}
                ></input>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <h6>Mật khẩu</h6>
            </div>
            <div className="col">
              <h6>Xác nhận mật khẩu</h6>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <div className="field">
                <input
                  type="password"
                  className="form-control"
                  required
                  placeholder="Mật khẩu"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                ></input>
              </div>
            </div>
            <div className="col">
              <div className="field">
                <input
                  type="password"
                  className="form-control"
                  required
                  placeholder="Xác nhận mật khẩu"
                  onChange={(event) => setconfPassword(event.target.value)}
                ></input>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <h6>Tuổi</h6>
            </div>
            <div className="col">
              <h6>Giới tính</h6>
            </div>
          </div>

          <div className="row">
            <div className="col">
              <div className="field">
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Tuổi"
                  name="age"
                  onChange={(event) => setAge(event.target.value)}
                ></input>
              </div>
            </div>
            <div className="col">
              <div className="field">
                <select
                  name="gender"
                  className="form-control"
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                  required
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
          </div>
          <div className="field space">
            <input type="submit" value="Đăng ký" />
          </div>
        </form>
        <div className="signup space">
          Đã có tài khoản?
          <a href="/">Đăng nhập</a>
        </div>
      </div>
    </div>
  );
}

export default Register;