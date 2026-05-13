import "../Style/profile.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Fragment, useEffect, useMemo, useState } from "react";
import { API_BASE_URLS } from "../config/api";
import { formatVnd } from "../utils/currency";
import CartsLocal, { type LocalCartItem } from "../utils/cartLocal";

type ProductDetails = {
  image?: string;
  name?: string;
  description?: string;
  category?: string;
  price?: number | string;
  stock?: number;
  specs?: {
    brand?: string;
    cpu?: string;
    gpu?: string;
    ramGb?: number;
    storageGb?: number;
    display?: string;
  };
};

function ProductInfo() {
  const [inputValue, setInputValue] = useState<ProductDetails>({});
  const [selectedImage, setSelectedImage] = useState<string | undefined>();
  const productID = localStorage.getItem("productID");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URLS.product}/products/${productID}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        const payload = await response.json();
        const product = payload?.data ?? payload;
        console.log(product);
        setInputValue(product);
        setSelectedImage(product?.image);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []);

  const onSubmithandler = async () => {
    const stockValue = Number.isFinite(Number(inputValue.stock)) ? Number(inputValue.stock) : null;
    if (stockValue !== null && stockValue <= 0) {
      alert("Sản phẩm đã hết hàng");
      return;
    }

    const productId = String(productID || inputValue._id || inputValue.id || "").trim();
    if (!productId) {
      alert("Không thể thêm sản phẩm này vào giỏ hàng");
      return;
    }

    const cartItem: LocalCartItem = {
      id_cart: Date.now().toString(),
      id_product: productId,
      name_product: inputValue.name || "",
      price_product: Number(inputValue.price ?? 0),
      count: 1,
      image: inputValue.image,
      size: "default",
    };

    try {
      await CartsLocal.addProduct(cartItem);
      alert("Đã thêm vào giỏ hàng");
    } catch (error) {
      console.error("Error:", error);
      alert("Không thể thêm vào giỏ hàng");
    }
  };

  const stockValue = Number.isFinite(Number(inputValue.stock)) ? Number(inputValue.stock) : null;
  const isOutOfStock = stockValue !== null && stockValue <= 0;
  const stockLabel = stockValue === null
    ? "Tồn kho: Đang cập nhật"
    : stockValue > 0
      ? `Tồn kho: ${stockValue}`
      : "Hết hàng";

  const galleryImages = useMemo(() => {
    const images = [inputValue.image, inputValue.image, inputValue.image].filter(Boolean) as string[];
    return images.length > 0 ? images : [];
  }, [inputValue.image]);

  const specsList = [
    { label: "Hãng", value: inputValue.specs?.brand ?? "-" },
    { label: "CPU", value: inputValue.specs?.cpu ?? "-" },
    { label: "GPU", value: inputValue.specs?.gpu ?? "-" },
    { label: "RAM", value: inputValue.specs?.ramGb ? `${inputValue.specs.ramGb} GB` : "-" },
    { label: "Lưu trữ", value: inputValue.specs?.storageGb ? `${inputValue.specs.storageGb} GB` : "-" },
    { label: "Màn hình", value: inputValue.specs?.display ?? "-" },
  ];

  return (
    <Fragment>
      <div className="widt">
        <div className="row">
          <div className="col-lg-12">
            <div className="page-content">
              <div className="row">
                <div className="col-lg-12">
                  <div className="main-profile ">
                    <div className="row">
                      <div className="col-lg-5">
                        <div className="product-gallery">
                          <div className="product-image-frame">
                            <img src={selectedImage ?? inputValue.image} alt={inputValue.name ?? ""} />
                          </div>
                          {galleryImages.length > 0 && (
                            <div className="gallery-thumbs">
                              {galleryImages.map((image, index) => (
                                <button
                                  key={`${image}-${index}`}
                                  type="button"
                                  className={`thumb ${selectedImage === image ? "active" : ""}`}
                                  onClick={() => setSelectedImage(image)}
                                >
                                  <img src={image} alt={`${inputValue.name ?? ""} ${index + 1}`} />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-lg-7 align-self-center">
                        <div className="product-detail-card">
                          <div className="product-header">
                            <div>
                              <h4>{inputValue.name}</h4>
                              <p className="product-category">Danh mục: {inputValue.category ?? "-"}</p>
                              <p className={`product-stock${isOutOfStock ? " out" : ""}`}>{stockLabel}</p>
                            </div>
                            <div className="product-price">{formatVnd(inputValue.price)}</div>
                          </div>
                          <p className="product-description">{inputValue.description}</p>
                          <div className="main-button">
                            <button
                              className={`searchButton add-cart${isOutOfStock ? " is-disabled" : ""}`}
                              type="button"
                              onClick={onSubmithandler}
                              disabled={isOutOfStock}
                            >
                              {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
                            </button>
                          </div>
                          <div className="specs-panel">
                            <h5>Thông số kỹ thuật</h5>
                            <ul>
                              {specsList.map((spec) => (
                                <li key={spec.label}>
                                  {spec.label} <span>{spec.value}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default ProductInfo;
