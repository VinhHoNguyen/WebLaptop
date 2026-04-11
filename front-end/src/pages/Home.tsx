import React, { Fragment, useEffect, useMemo, useState } from "react";
import "../Style/home.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Card from "../component/card";
import { API_BASE_URLS } from "../config/api";

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
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
      } else {
        console.log("Không thể tải sản phẩm");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleLinkClick = (productID: any) => {
    localStorage.setItem("productID", productID);
    window.location.href = `/productinfo/${productID}`;
  };

  const handleAddToCart = (productID: string, stock?: number | null) => {
    const normalizedStock = Number.isFinite(Number(stock)) ? Number(stock) : null;
    if (normalizedStock !== null && normalizedStock <= 0) {
      alert("Sản phẩm đã hết hàng");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API_BASE_URLS.cart}/cart/${productID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          alert("Đã thêm vào giỏ hàng");
          return;
        }
        window.location.href = "/login";
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = event.target.value;
    setSelectedOption(selectedCategory);
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
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
      if (specs.brand) {
        brands.add(String(specs.brand));
      }
      if (specs.cpu) {
        cpus.add(String(specs.cpu));
      }
      if (specs.gpu) {
        gpus.add(String(specs.gpu));
      }
      if (specs.display) {
        displays.add(String(specs.display));
      }
      if (Number.isFinite(Number(specs.ramGb))) {
        rams.add(Number(specs.ramGb));
      }
      if (Number.isFinite(Number(specs.storageGb))) {
        storages.add(Number(specs.storageGb));
      }
      if (Number.isFinite(Number(product?.price))) {
        prices.add(Number(product.price));
      }
    });

    const toSortedArray = (values: Set<string>) => Array.from(values).sort((a, b) => a.localeCompare(b));
    const toSortedNumbers = (values: Set<number>) => Array.from(values).sort((a, b) => a - b);

    return {
      brands: toSortedArray(brands),
      cpus: toSortedArray(cpus),
      gpus: toSortedArray(gpus),
      displays: toSortedArray(displays),
      rams: toSortedNumbers(rams),
      storages: toSortedNumbers(storages),
      prices: toSortedNumbers(prices),
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
      const matchesCategory = selectedOption === "all" || product.category === selectedOption;
      if (!matchesCategory) {
        return false;
      }

      const nameValue = String(product.name ?? "").toLowerCase();
      const descriptionValue = String(product.description ?? "").toLowerCase();
      const matchesKeyword = !keyword || nameValue.includes(keyword) || descriptionValue.includes(keyword);
      if (!matchesKeyword) {
        return false;
      }

      const priceValue = typeof product.price === "number" ? product.price : Number(product.price);
      if (minPriceValue !== undefined && priceValue < minPriceValue) {
        return false;
      }
      if (maxPriceValue !== undefined && priceValue > maxPriceValue) {
        return false;
      }

      const specs = product.specs ?? {};
      const brandValue = String(specs.brand ?? "").toLowerCase();
      const cpuValue = String(specs.cpu ?? "").toLowerCase();
      const gpuValue = String(specs.gpu ?? "").toLowerCase();
      const displayValue = String(specs.display ?? "").toLowerCase();

      if (brand && !brandValue.includes(brand)) {
        return false;
      }
      if (cpu && !cpuValue.includes(cpu)) {
        return false;
      }
      if (gpu && !gpuValue.includes(gpu)) {
        return false;
      }
      if (display && !displayValue.includes(display)) {
        return false;
      }

      const ramValue = Number(specs.ramGb ?? 0);
      const storageValue = Number(specs.storageGb ?? 0);
      if (minRamValue !== undefined && ramValue < minRamValue) {
        return false;
      }
      if (minStorageValue !== undefined && storageValue < minStorageValue) {
        return false;
      }

      return true;
    });

    if (sortBy === "price-asc") {
      return results.slice().sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (sortBy === "price-desc") {
      return results.slice().sort((a, b) => Number(b.price) - Number(a.price));
    }
    if (sortBy === "name") {
      return results.slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }
    return results;
  }, [
    data,
    selectedOption,
    searchKeyword,
    brandFilter,
    cpuFilter,
    gpuFilter,
    displayFilter,
    minPrice,
    maxPrice,
    minRam,
    minStorage,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pagedData = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <Fragment>
      <div className="wid">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="page-content">
                <div className="most-popular">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="heading-section inline">
                        <h4 className="section-title">
                          Sản phẩm <span className="section-accent">nổi bật</span>
                        </h4>
                        <div className="selct">
                          <select
                            value={selectedOption}
                            onChange={handleSelectChange}
                          >
                            <option value="all">Tất cả</option>
                            <option value="Ultrabook">Mỏng nhẹ (Ultrabook)</option>
                            <option value="Gaming">Gaming</option>
                            <option value="Creator">Đồ họa (Creator)</option>
                            <option value="Business">Doanh nghiệp</option>
                            <option value="2-in-1">2-in-1</option>
                            <option value="Student">Học tập</option>
                            <option value="Everyday">Phổ thông</option>
                            <option value="Workstation">Workstation</option>
                          </select>
                          <input
                            className="newSearch"
                            type="text"
                            id="searchText"
                            name="searchKeyword"
                            placeholder="Tìm kiếm"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                          />
                          <button className="searchButton" onClick={handleSearch} aria-label="Tìm kiếm">
                            <i className="fa fa-search" aria-hidden="true"></i>
                          </button>
                          <button
                            className="searchButton secondary"
                            type="button"
                            onClick={() => setAdvancedOpen((prev) => !prev)}
                          >
                            Lọc
                          </button>

                        </div>
                      </div>
                                      {advancedOpen && (
                        <div className="advanced-panel">
                          <div className="filters-grid">
                            <div className="filter-field">
                              <label>Hãng</label>
                                              <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                                <option value="">Tất cả</option>
                                                {filterOptions.brands.map((option) => (
                                                  <option key={option} value={option}>
                                                    {option}
                                                  </option>
                                                ))}
                                              </select>
                            </div>
                            <div className="filter-field">
                              <label>CPU</label>
                                              <select value={cpuFilter} onChange={(e) => setCpuFilter(e.target.value)}>
                                <option value="">Tất cả</option>
                                                {filterOptions.cpus.map((option) => (
                                                  <option key={option} value={option}>
                                                    {option}
                                                  </option>
                                                ))}
                                              </select>
                            </div>
                            <div className="filter-field">
                              <label>GPU</label>
                                              <select value={gpuFilter} onChange={(e) => setGpuFilter(e.target.value)}>
                                <option value="">Tất cả</option>
                                                {filterOptions.gpus.map((option) => (
                                                  <option key={option} value={option}>
                                                    {option}
                                                  </option>
                                                ))}
                                              </select>
                            </div>
                            <div className="filter-field">
                              <label>Màn hình</label>
                                              <select value={displayFilter} onChange={(e) => setDisplayFilter(e.target.value)}>
                                <option value="">Tất cả</option>
                                                {filterOptions.displays.map((option) => (
                                                  <option key={option} value={option}>
                                                    {option}
                                                  </option>
                                                ))}
                                              </select>
                            </div>
                            <div className="filter-field">
                              <label>Giá thấp nhất</label>
                                              <select value={minPrice} onChange={(e) => setMinPrice(e.target.value)}>
                                <option value="">Tất cả</option>
                                                {filterOptions.prices.map((option) => (
                                                  <option key={option} value={option}>
                                                    {option}
                                                  </option>
                                                ))}
                                              </select>
                            </div>
                            <div className="filter-field">
                              <label>Giá cao nhất</label>
                                              <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
                                <option value="">Tất cả</option>
                                                {filterOptions.prices.map((option) => (
                                                  <option key={option} value={option}>
                                                    {option}
                                                  </option>
                                                ))}
                                              </select>
                            </div>
                            <div className="filter-field">
                              <label>RAM tối thiểu (GB)</label>
                                              <select value={minRam} onChange={(e) => setMinRam(e.target.value)}>
                                <option value="">Tất cả</option>
                                                {filterOptions.rams.map((option) => (
                                                  <option key={option} value={option}>
                                                    {option}
                                                  </option>
                                                ))}
                                              </select>
                            </div>
                            <div className="filter-field">
                              <label>Lưu trữ tối thiểu (GB)</label>
                                              <select value={minStorage} onChange={(e) => setMinStorage(e.target.value)}>
                                <option value="">Tất cả</option>
                                                {filterOptions.storages.map((option) => (
                                                  <option key={option} value={option}>
                                                    {option}
                                                  </option>
                                                ))}
                                              </select>
                            </div>
                            <div className="filter-field">
                              <label>Sắp xếp</label>
                              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="relevance">Liên quan</option>
                                <option value="price-asc">Giá: Thấp đến cao</option>
                                <option value="price-desc">Giá: Cao đến thấp</option>
                                <option value="name">Tên A-Z</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="row product-grid">
                        {pagedData.map(
                          (product: any) => (
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
                                onAddToCart={() => handleAddToCart(product._id, product.stock)}
                              />
                            </div>
                          )
                        )}
                      </div>
                      <div className="pagination-bar">
                        <button
                          type="button"
                          className="page-btn"
                          disabled={page === 1}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        >
                          Trước
                        </button>
                        {pageNumbers.map((pageNumber) => (
                          <button
                            type="button"
                            key={pageNumber}
                            className={`page-btn ${page === pageNumber ? "active" : ""}`}
                            onClick={() => setPage(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="page-btn"
                          disabled={page === totalPages}
                          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        >
                          Sau
                        </button>
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

export default Home;
