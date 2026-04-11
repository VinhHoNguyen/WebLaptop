import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProductInfo from "./pages/ProductInfo";
import Register from "./pages/Register";
import { Fragment } from "react";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import CheckOut from "./pages/CheckOut";
import OrderFail from "./pages/OrderFail";
import OrderHistory from "./pages/OrderHistory";
import OrderMomo from "./pages/OrderMomo";
import OrderSuccess from "./pages/OrderSuccess";
import Admin from "./pages/Admin";
import NavBar from "./component/NavBar";
function App() {
  return (
    <Fragment>
      <NavBar />
      <Router>
        <Routes>
          <Route index path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/productInfo/:productId" element={<ProductInfo />} />
          <Route path="/productinfo/:productId" element={<ProductInfo />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<CheckOut />} />
          <Route path="/success" element={<OrderSuccess />} />
          <Route path="/fail" element={<OrderFail />} />
          <Route path="/momo" element={<OrderMomo />} />
          <Route path="/history" element={<OrderHistory />} />
        </Routes>
      </Router>
    </Fragment>
  );
}
export default App;
