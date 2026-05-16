import React, { Fragment, useEffect, useMemo, useState } from "react";
import "../Style/home.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Card from "../component/card";
import { API_BASE_URLS } from "../config/api";
import CartsLocal, { type LocalCartItem } from "../utils/cartLocal";

const CATEGORIES = [
  { value: "all", label: "Tất cả" },
  { value: "Ultrabook", label: "Mỏng nhẹ" },
  { value: "Gaming", label: "Gaming" },
  { value: "Creator", label: "Đồ họa" },
  { value: "Business", label: "Doanh nghiệp" },
  { value: "2-in-1", label: "2-in-1" },
  { value: "Student", label: "Học tập" },
  { value: "Everyday", label: "Phổ thông" },
  { value: "Workstation", label: "Workstation" },
];

function Home() {
  const [data, setData] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState("");
  const [cpuFilter, setCpuFilter] = useState("");
  const [gpuFilter, setGpuFilter] = useState("");
  const [displayFilter, setDisplayFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRam, setMinRam] = useState("");
  const [minStorage, setMinStorage] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE_URLS.product}/products`, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const jsonData = await response.json();
        const products = Array.isArray(jsonData)
          ? jsonData
          : Array.isArray(jsonData?.data)
            ? jsonData.data
            : [];
        setData(products);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleLinkClick = (productID: any) => {
    localStorage.setItem("productID", productID);
    window.location.href = `/productinfo/${productID}`;
  };

  const handleAddToCart = async (product: any) => {
    const normalizedStock = Number.isFinite(Number(product?.stock)) ? Number(product.stock) : null;
    if (normalizedStock !== null && normalizedStock <= 0) {
      alert("Sản phẩm đã hết hàng");
      return;
    }
    const productId = String(product?._id || product?.id || "").trim();
    if (!productId) {
      alert("Không thể thêm sản phẩm này vào giỏ hàng");
      return;
    }
    const cartItem: LocalCartItem = {
      id_cart: Date.now().toString(),
      id_product: productId,
      name_product: product?.name || "",
      price_product: Number(product?.price ?? 0),
      count: 1,
      image: product?.image,
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

  const filterOptions = useMemo(() => {
    const brands = new Set<string>();
    const cpus = new Set<string>();
    const gpus = new Set<string>();
    const displays = new Set<string>();
    const rams = new Set<number>();
    const storages = new Set<number>();
    const prices = new Set<number>();

    data.forEach((product) => {
      const specs = product?.specs ?? {};
      if (specs.brand) brands.add(String(specs.brand));
      if (specs.cpu) cpus.add(String(specs.cpu));
      if (specs.gpu) gpus.add(String(specs.gpu));
      if (specs.display) displays.add(String(specs.display));
      if (Number.isFinite(Number(specs.ramGb))) rams.add(Number(specs.ramGb));
      if (Number.isFinite(Number(specs.storageGb))) storages.add(Number(specs.storageGb));
      if (Number.isFinite(Number(product?.price))) prices.add(Number(product.price));
    });

    const toSorted = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b));
    const toSortedNum = (s: Set<number>) => Array.from(s).sort((a, b) => a - b);

    return {
      brands: toSorted(brands),
      cpus: toSorted(cpus),
      gpus: toSorted(gpus),
      displays: toSorted(displays),
      rams: toSortedNum(rams),
      storages: toSortedNum(storages),
      prices: toSortedNum(prices),
    };
  }, [data]);

  const filteredData = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    const brand = brandFilter.trim().toLowerCase();
    const cpu = cpuFilter.trim().toLowerCase();
    const gpu = gpuFilter.trim().toLowerCase();
    const display = displayFilter.trim().toLowerCase();
    const minPriceValue = minPrice ? Number(minPrice) : undefined;
    const maxPriceValue = maxPrice ? Number(maxPrice) : undefined;
    const minRamValue = minRam ? Number(minRam) : undefined;
    const minStorageValue = minStorage ? Number(minStorage) : undefined;

    const results = data.filter((product: any) => {
      if (selectedOption !== "all" && product.category !== selectedOption) return false;
      const nameVal = String(product.name ?? "").toLowerCase();
      const descVal = String(product.description ?? "").toLowerCase();
      if (keyword && !nameVal.includes(keyword) && !descVal.includes(keyword)) return false;
      const price = typeof product.price === "number" ? product.price : Number(product.price);
      if (minPriceValue !== undefined && price < minPriceValue) return false;
      if (maxPriceValue !== undefined && price > maxPriceValue) return false;
      const specs = product.specs ?? {};
      if (brand && !String(specs.brand ?? "").toLowerCase().includes(brand)) return false;
      if (cpu && !String(specs.cpu ?? "").toLowerCase().includes(cpu)) return false;
      if (gpu && !String(specs.gpu ?? "").toLowerCase().includes(gpu)) return false;
      if (display && !String(specs.display ?? "").toLowerCase().includes(display)) return false;
      if (minRamValue !== undefined && Number(specs.ramGb ?? 0) < minRamValue) return false;
      if (minStorageValue !== undefined && Number(specs.storageGb ?? 0) < minStorageValue) return false;
      return true;
    });

    if (sortBy === "price-asc") return results.slice().sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === "price-desc") return results.slice().sort((a, b) => Number(b.price) - Number(a.price));
    if (sortBy === "name") return results.slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return results;
  }, [data, selectedOption, searchKeyword, brandFilter, cpuFilter, gpuFilter, displayFilter, minPrice, maxPrice, minRam, minStorage, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pagedData = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <Fragment>
      <div className="wid">
        {/* ── Hero ── */}
        <div className="home-hero">
          <div className="container">
            <span className="home-hero-eyebrow">LapSinhVien Store</span>
            <h1 className="home-hero-title">Laptop cho mọi nhu cầu</h1>
            <p className="home-hero-sub">Tìm chiếc máy hoàn hảo với giá tốt nhất cho sinh viên</p>
            <div className="home-search-bar">
              <input
                className="home-search-input"
                type="text"
                placeholder="Tìm kiếm tên laptop, thương hiệu..."
                value={searchKeyword}
                onChange={(e) => { setSearchKeyword(e.target.value); setPage(1); }}
                onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              />
              <button
                className="home-search-btn"
                onClick={() => setPage(1)}
                aria-label="Tìm kiếm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Tìm
              </button>
            </div>
          </div>
        </div>

        <div className="container">
          {/* ── Category Pills ── */}
          <div className="category-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={`cat-pill${selectedOption === cat.value ? " active" : ""}`}
                onClick={() => { setSelectedOption(cat.value); setPage(1); }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* ── Filter Toolbar ── */}
          <div className="filter-toolbar">
            <span className="filter-count">
              {filteredData.length} sản phẩm
            </span>
            <div className="filter-toolbar-right">
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="relevance">Liên quan</option>
                <option value="price-asc">Giá: Thấp → Cao</option>
                <option value="price-desc">Giá: Cao → Thấp</option>
                <option value="name">Tên A-Z</option>
              </select>
              <button
                className={`filter-toggle-btn${advancedOpen ? " active" : ""}`}
                type="button"
                onClick={() => setAdvancedOpen((p) => !p)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                {advancedOpen ? "Ẩn lọc" : "Bộ lọc"}
              </button>
            </div>
          </div>

          {/* ── Advanced Filters ── */}
          {advancedOpen && (
            <div className="advanced-panel">
              <div className="filters-grid">
                <div className="filter-field">
                  <label>Hãng</label>
                  <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                    <option value="">Tất cả</option>
                    {filterOptions.brands.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="filter-field">
                  <label>CPU</label>
                  <select value={cpuFilter} onChange={(e) => setCpuFilter(e.target.value)}>
                    <option value="">Tất cả</option>
                    {filterOptions.cpus.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="filter-field">
                  <label>GPU</label>
                  <select value={gpuFilter} onChange={(e) => setGpuFilter(e.target.value)}>
                    <option value="">Tất cả</option>
                    {filterOptions.gpus.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="filter-field">
                  <label>Màn hình</label>
                  <select value={displayFilter} onChange={(e) => setDisplayFilter(e.target.value)}>
                    <option value="">Tất cả</option>
                    {filterOptions.displays.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="filter-field">
                  <label>Giá thấp nhất</label>
                  <select value={minPrice} onChange={(e) => setMinPrice(e.target.value)}>
                    <option value="">Tất cả</option>
                    {filterOptions.prices.map((o) => <option key={o} value={o}>{o.toLocaleString("vi-VN")}₫</option>)}
                  </select>
                </div>
                <div className="filter-field">
                  <label>Giá cao nhất</label>
                  <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
                    <option value="">Tất cả</option>
                    {filterOptions.prices.map((o) => <option key={o} value={o}>{o.toLocaleString("vi-VN")}₫</option>)}
                  </select>
                </div>
                <div className="filter-field">
                  <label>RAM tối thiểu (GB)</label>
                  <select value={minRam} onChange={(e) => setMinRam(e.target.value)}>
                    <option value="">Tất cả</option>
                    {filterOptions.rams.map((o) => <option key={o} value={o}>{o} GB</option>)}
                  </select>
                </div>
                <div className="filter-field">
                  <label>Lưu trữ tối thiểu (GB)</label>
                  <select value={minStorage} onChange={(e) => setMinStorage(e.target.value)}>
                    <option value="">Tất cả</option>
                    {filterOptions.storages.map((o) => <option key={o} value={o}>{o} GB</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Product Grid ── */}
          <div className="most-popular">
            <div className="row product-grid">
              {pagedData.length === 0 ? (
                <div className="col-12" style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
                  <p style={{ fontSize: "16px" }}>Không tìm thấy sản phẩm phù hợp</p>
                </div>
              ) : (
                pagedData.map((product: any) => (
                  <div
                    className="col-lg-3 col-sm-6"
                    onClick={() => handleLinkClick(product._id)}
                    style={{ cursor: "pointer" }}
                    key={product._id}
                  >
                    <Card
                      name={product.name}
                      price={product.price}
                      imgsrc={product.image}
                      category={product.category}
                      stock={product.stock}
                      onAddToCart={() => handleAddToCart(product)}
                    />
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  type="button"
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Trước
                </button>
                {pageNumbers.map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`page-btn${page === n ? " active" : ""}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default Home;
