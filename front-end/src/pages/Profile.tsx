import "../Style/profile.css";
import "bootstrap/dist/css/bootstrap.min.css";
import profile from "../assets/profile.jpg";
import profileg from "../assets/profileGirl.jpg";
import { useState, useEffect, Fragment } from "react";
import { API_BASE_URLS } from "../config/api";

type UserProfile = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number | string;
  phone?: string;
  gender?: string;
};

type EditableFields = {
  firstName: string;
  lastName: string;
  age: string;
  phone: string;
  gender: string;
};

const toEditable = (u: UserProfile): EditableFields => ({
  firstName: u.firstName ?? "",
  lastName: u.lastName ?? "",
  age: u.age === undefined || u.age === null ? "" : String(u.age),
  phone: u.phone ?? "",
  gender: u.gender ?? "male",
});

function Profile() {
  const [user, setUser] = useState<UserProfile>({});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableFields>(toEditable({}));
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch(`${API_BASE_URLS.user}/users/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (res.ok) {
        res.json().then((data: UserProfile) => {
          setUser(data);
          setForm(toEditable(data));
        });
      } else {
        window.location.href = "/login";
      }
    });
  }, []);

  const genderLabel =
    user.gender === "female" ? "Nữ" : user.gender === "male" ? "Nam" : user.gender ?? "—";

  const infoItems = [
    { label: "Email", value: user.email ?? "—" },
    { label: "Tuổi", value: user.age ?? "—" },
    { label: "Số điện thoại", value: user.phone ?? "—" },
    { label: "Giới tính", value: genderLabel },
  ];

  const onChange = (field: keyof EditableFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setForm(toEditable(user));
    setErrorMsg(null);
    setEditing(false);
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    const userId = user.id ?? user._id;
    if (!token || !userId) {
      setErrorMsg("Phiên đăng nhập không hợp lệ");
      return;
    }

    const trimmedFirst = form.firstName.trim();
    const trimmedLast = form.lastName.trim();
    const trimmedPhone = form.phone.trim();
    const ageNum = form.age === "" ? null : Number(form.age);

    if (!trimmedFirst || !trimmedLast) {
      setErrorMsg("Họ và tên không được để trống");
      return;
    }
    if (!trimmedPhone) {
      setErrorMsg("Số điện thoại không được để trống");
      return;
    }
    if (ageNum !== null && (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120)) {
      setErrorMsg("Tuổi phải nằm trong khoảng 1 - 120");
      return;
    }

    setErrorMsg(null);
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URLS.user}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: trimmedFirst,
          lastName: trimmedLast,
          age: ageNum,
          phone: trimmedPhone,
          gender: form.gender,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setErrorMsg(payload?.message || "Cập nhật thất bại");
        return;
      }

      const updated: UserProfile = await response.json();
      setUser(updated);
      setForm(toEditable(updated));
      setEditing(false);
      alert("Cập nhật hồ sơ thành công");
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg("Không thể cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

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
                {!editing && (
                  <button
                    type="button"
                    className="profile-edit-btn"
                    onClick={() => setEditing(true)}
                  >
                    Cập nhật hồ sơ
                  </button>
                )}
              </div>
            </div>

            {/* ── Info grid (view mode) ── */}
            {!editing && (
              <div className="profile-info-grid">
                {infoItems.map((item) => (
                  <div className="profile-info-item" key={item.label}>
                    <span className="profile-info-label">{item.label}</span>
                    <span className="profile-info-value">{String(item.value)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Edit form ── */}
            {editing && (
              <form
                className="profile-edit-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <div className="profile-edit-grid">
                  <div className="profile-edit-field">
                    <label>Họ</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => onChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="profile-edit-field">
                    <label>Tên</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => onChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="profile-edit-field">
                    <label>Email</label>
                    <input type="email" value={user.email ?? ""} disabled />
                  </div>
                  <div className="profile-edit-field">
                    <label>Tuổi</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={form.age}
                      onChange={(e) => onChange("age", e.target.value)}
                    />
                  </div>
                  <div className="profile-edit-field">
                    <label>Số điện thoại</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => onChange("phone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="profile-edit-field">
                    <label>Giới tính</label>
                    <select
                      value={form.gender}
                      onChange={(e) => onChange("gender", e.target.value)}
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                {errorMsg && <div className="profile-edit-error">{errorMsg}</div>}

                <div className="profile-edit-actions">
                  <button
                    type="button"
                    className="profile-edit-btn secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="profile-edit-btn" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default Profile;
