import "../Style/profile.css";
import "bootstrap/dist/css/bootstrap.min.css";
import data from "../data.json";
import clip1 from "../assets/clip-01.jpg";
import clip2 from "../assets/clip-02.jpg";
import clip3 from "../assets/clip-03.jpg";
import clip4 from "../assets/clip-04.jpg";
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
      }).then((response) => {
        if (response.ok) {
          response.json().then((data) => {
            setUser(data);
          });
        } else {
          window.location.href = "/login";
        }
      });
    } else {
      window.location.href = "/login";
    }
  }, []);


  // var image = profile;
  // if (data.gender === "female") {
  //   image = profileg;
  // }
  return (
    <Fragment>
      <div className="widt">
        <div className="row">
          <div className="col-lg-12">
            <div className="page-content">
              <div className="row">
                <div className="col-lg-12">
                  <div className="main-profile">
                    <div className="row">
                      <div className="col-lg-4">
                        {/* Render user profile image here */}
                        <img src={user.gender === "female" ? profileg : profile} alt="Ảnh hồ sơ" />
                      </div>
                      <div className="col-lg-4 align-self-center">
                        <div className="main-info header-text">
                          <h1 id="firstname">{user.firstName}</h1>
                          <h5 id="lastname">{user.lastName}</h5>
                          <p>
                            {`Mình là ${user.firstName ?? "bạn"}, yêu công nghệ và thích khám phá những chiếc laptop mới. Cùng tìm chiếc máy phù hợp nhé!`}
                          </p>
                          <div className="main-border-button">
                            <a href="#">Cập nhật</a>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4 align-self-center">
                        <ul>
                          <li>
                            Email <span>{user.email}</span>
                          </li>
                          <li>
                            Tuổi <span>{user.age}</span>
                          </li>
                          <li>
                            Số điện thoại <span>{user.phone}</span>
                          </li>
                          <li>
                            Bộ sưu tập <span>29</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* Rest of the JSX code */}
                    {/* ... */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
export default Profile;
