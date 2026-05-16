import "../Style/profile.css";
import "bootstrap/dist/css/bootstrap.min.css";
import profile from "../assets/profile.jpg";
import profileg from "../assets/profileGirl.jpg";
import { useState, useEffect, Fragment } from "react";
import { API_BASE_URLS } from "../config/api";

type UserProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number | string;
  phone?: string;
  gender?: string;
};

function Profile() {
  const [user, setUser] = useState<UserProfile>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE_URLS.user}/users/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
        if (res.ok) {
          res.json().then((data) => setUser(data));
        } else {
          window.location.href = "/login";
        }
      });
    } else {
      window.location.href = "/login";
    }
  }, []);

  const genderLabel =
    user.gender === "female" ? "Nữ" : user.gender === "male" ? "Nam" : user.gender ?? "—";

  const infoItems = [
    { label: "Email", value: user.email ?? "—" },
    { label: "Tuổi", value: user.age ?? "—" },
    { label: "Số điện thoại", value: user.phone ?? "—" },
    { label: "Giới tính", value: genderLabel },
  ];

  return (
    <Fragment>
      <div className="profile-page">
        <div className="container">
          <div className="profile-card">
            {/* ── Top: avatar + name ── */}
            <div className="profile-top">
              <div className="profile-avatar-wrap">
                <img
                  src={user.gender === "female" ? profileg : profile}
                  alt="Ảnh hồ sơ"
                  className="profile-avatar-img"
                />
              </div>

              <div className="profile-name-block">
                <span className="profile-badge">Thành viên</span>
                <h1 className="profile-fullname">
                  {user.firstName ?? ""} {user.lastName ?? ""}
                </h1>
                <p className="profile-bio">
                  {`Mình là ${user.firstName ?? "bạn"}, yêu công nghệ và thích khám phá những chiếc laptop mới. Cùng tìm chiếc máy phù hợp nhé!`}
                </p>
                <button className="profile-edit-btn">Cập nhật hồ sơ</button>
              </div>
            </div>

            {/* ── Info grid ── */}
            <div className="profile-info-grid">
              {infoItems.map((item) => (
                <div className="profile-info-item" key={item.label}>
                  <span className="profile-info-label">{item.label}</span>
                  <span className="profile-info-value">{String(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default Profile;
