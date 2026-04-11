import { Fragment, useEffect, useMemo, useState } from "react";
import "../Style/Admin.css";
import { API_BASE_URLS } from "../config/api";
import { seedOrders, seedTickets, seedUsers } from "../admin/mockData";
import type {
  AdminOrder,
  AdminProduct,
  AdminTab,
  AdminUser,
  GameKey,
  KeyStatus,
  SupportTicket,
} from "../admin/types";

type ProductFormState = {
  name: string;
  description: string;
  category: string;
  platform: "PC" | "PS5" | "Xbox";
  status: "In Stock" | "Out of Stock";
  price: string;
  salePrice: string;
  image: string;
  trailerUrl: string;
  screenshots: string;
  minSpec: string;
  recSpec: string;
  keys: string;
};

type ProductApiItem = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  image?: string;
  price?: number;
};

const toCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  category: "Action",
  platform: "PC",
  status: "In Stock",
  price: "",
  salePrice: "",
  image: "",
  trailerUrl: "",
  screenshots: "",
  minSpec: "",
  recSpec: "",
  keys: "",
};

function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>(seedOrders);
  const [tickets] = useState<SupportTicket[]>(seedTickets);
  const [users, setUsers] = useState<AdminUser[]>(seedUsers);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState({
    category: "all",
    platform: "all",
    status: "all",
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormState>(emptyForm);

  useEffect(() => {
    void fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setProductLoading(true);
    setProductError(null);

    try {
      const response = await fetch(`${API_BASE_URLS.product}/products`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setProducts([]);
        setProductError(`Khong tai duoc danh sach game (HTTP ${response.status}).`);
        return;
      }

      const data = (await response.json()) as ProductApiItem[];

      if (!Array.isArray(data)) {
        setProducts([]);
        setProductError("Du lieu tu Product service khong dung dinh dang danh sach.");
        return;
      }

      const normalized = data.map((item): AdminProduct => {
        const keySeed: GameKey[] = Array.from({ length: 5 }, (_, idx) => ({
          code: `${item.name.slice(0, 3).toUpperCase()}-${idx + 1}K-${item._id.slice(-4)}`,
          status: "available",
        }));

        return {
          id: `local-${item._id}`,
          backendId: item._id,
          name: item.name,
          description: item.description ?? "",
          category: item.category ?? "Action",
          platform: "PC",
          status: "In Stock",
          price: item.price ?? 0,
          salePrice: undefined,
          image: item.image ?? "",
          trailerUrl: "",
          screenshots: [],
          minSpec: "CPU i5 / RAM 8GB / GTX 1050",
          recSpec: "CPU i7 / RAM 16GB / RTX 3060",
          keys: keySeed,
          soldCount: 0,
        };
      });

      setProducts(normalized);
    } catch (error) {
      console.error(error);
      setProducts([]);
      setProductError("Khong ket noi duoc Product service. Vui long kiem tra backend/CORS.");
    } finally {
      setProductLoading(false);
    }
  };

  const revenue = useMemo(() => {
    return orders
      .filter((order) => order.status === "Success")
      .reduce((sum, order) => sum + order.total, 0);
  }, [orders]);

  const newOrders = useMemo(() => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    return orders.filter((order) => {
      return now.getTime() - new Date(order.purchasedAt).getTime() <= oneDay;
    }).length;
  }, [orders]);

  const weeklyGrowth = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const series = labels.map((label, index) => {
      return {
        label,
        value: 250000 + index * 130000 + (index % 2 === 0 ? 110000 : 70000),
      };
    });

    return series;
  }, []);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; sold: number; revenue: number }>();

    orders.forEach((order) => {
      if (order.status !== "Success") {
        return;
      }

      order.items.forEach((item) => {
        const current = map.get(item.productName);
        if (current) {
          current.sold += 1;
          current.revenue += item.price;
        } else {
          map.set(item.productName, {
            name: item.productName,
            sold: 1,
            revenue: item.price,
          });
        }
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [orders]);

  const recentActivities = useMemo(() => {
    const fromOrders = orders.slice(0, 5).map((order) => ({
      id: order.orderId,
      text: `Order ${order.orderId} - ${order.status}`,
      time: new Date(order.purchasedAt).toLocaleString("vi-VN"),
    }));

    const fromTickets = tickets.slice(0, 3).map((ticket) => ({
      id: ticket.id,
      text: `Ticket ${ticket.id} - ${ticket.subject}`,
      time: new Date(ticket.createdAt).toLocaleString("vi-VN"),
    }));

    return [...fromOrders, ...fromTickets].sort((a, b) => {
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
  }, [orders, tickets]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const byCategory = productFilter.category === "all" || product.category === productFilter.category;
      const byPlatform = productFilter.platform === "all" || product.platform === productFilter.platform;
      const byStatus = productFilter.status === "all" || product.status === productFilter.status;
      return byCategory && byPlatform && byStatus;
    });
  }, [products, productFilter]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingProductId(null);
  };

  const buildKeys = (raw: string): GameKey[] => {
    return raw
      .split(/\r?\n/)
      .map((key) => key.trim())
      .filter(Boolean)
      .map((code) => ({
        code,
        status: "available" as KeyStatus,
      }));
  };

  const handleProductSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized: AdminProduct = {
      id: editingProductId ?? `new-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      platform: formData.platform,
      status: formData.status,
      price: Number(formData.price || "0"),
      salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
      image: formData.image.trim(),
      trailerUrl: formData.trailerUrl.trim(),
      screenshots: formData.screenshots
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      minSpec: formData.minSpec,
      recSpec: formData.recSpec,
      keys: buildKeys(formData.keys),
      soldCount: 0,
    };

    if (!normalized.name) {
      alert("Vui long nhap ten game");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingProductId) {
        setProducts((prev) =>
          prev.map((product) => (product.id === editingProductId ? { ...product, ...normalized } : product)),
        );
      } else {
        const response = await fetch(`${API_BASE_URLS.product}/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: normalized.name,
            description: normalized.description,
            category: normalized.category,
            image: normalized.image,
            price: normalized.salePrice ?? normalized.price,
          }),
        });

        if (response.ok) {
          const created = (await response.json()) as { _id: string };
          normalized.backendId = created._id;
          normalized.id = `local-${created._id}`;
        }

        setProducts((prev) => [normalized, ...prev]);
      }

      resetForm();
    } catch (error) {
      console.error(error);
      alert("Khong the luu game, vui long thu lai");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditProduct = (product: AdminProduct) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      platform: product.platform,
      status: product.status,
      price: String(product.price),
      salePrice: product.salePrice ? String(product.salePrice) : "",
      image: product.image,
      trailerUrl: product.trailerUrl ?? "",
      screenshots: product.screenshots.join(", "),
      minSpec: product.minSpec,
      recSpec: product.recSpec,
      keys: product.keys.map((key) => key.code).join("\n"),
    });
  };

  const updateKeyStatus = (productId: string, code: string, status: KeyStatus) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        return {
          ...product,
          keys: product.keys.map((key) => {
            if (key.code !== code) {
              return key;
            }

            return {
              ...key,
              status,
            };
          }),
        };
      }),
    );
  };

  const handleRefund = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.orderId !== orderId) {
          return order;
        }

        return {
          ...order,
          status: "Refunded",
        };
      }),
    );
  };

  const updateUserRole = (userId: string, role: AdminUser["role"]) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) {
          return user;
        }

        if (role === "Support") {
          return {
            ...user,
            role,
            permissions: {
              canViewOrders: true,
              canRefund: false,
              canEditPrice: false,
              canManageUsers: false,
            },
          };
        }

        if (role === "Manager") {
          return {
            ...user,
            role,
            permissions: {
              canViewOrders: true,
              canRefund: true,
              canEditPrice: true,
              canManageUsers: false,
            },
          };
        }

        return {
          ...user,
          role,
          permissions: {
            canViewOrders: true,
            canRefund: true,
            canEditPrice: true,
            canManageUsers: true,
          },
        };
      }),
    );
  };

  return (
    <Fragment>
      <main className="admin-page">
        <section className="admin-topbar">
          <div>
            <p className="admin-eyebrow">Admin Portal</p>
            <h1>WebGame Control Center</h1>
            <p className="admin-sub">Quan ly toan bo san pham, don hang va nguoi dung tren mot man hinh.</p>
          </div>
          <div className="admin-kpi-quick">
            <div>
              <span>Revenue</span>
              <strong>{toCurrency(revenue)}</strong>
            </div>
            <div>
              <span>Orders (24h)</span>
              <strong>{newOrders}</strong>
            </div>
            <div>
              <span>New Users</span>
              <strong>{users.length}</strong>
            </div>
          </div>
        </section>

        <section className="admin-tabs">
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
          <button className={activeTab === "products" ? "active" : ""} onClick={() => setActiveTab("products")}>Game Management</button>
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>Orders</button>
          <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>Users & Permissions</button>
        </section>

        {activeTab === "dashboard" && (
          <section className="admin-content-grid">
            <article className="panel panel-chart">
              <div className="panel-title-row">
                <h2>Doanh so theo tuan</h2>
                <span>Cap nhat theo ngay</span>
              </div>
              <div className="chart-bars">
                {weeklyGrowth.map((point) => (
                  <div key={point.label} className="chart-item">
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{ height: `${Math.max(18, Math.round((point.value / 1400000) * 100))}%` }}
                      />
                    </div>
                    <p>{point.label}</p>
                    <small>{Math.round(point.value / 1000)}k</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-title-row">
                <h2>Hoat dong gan day</h2>
              </div>
              <ul className="admin-list">
                {recentActivities.map((activity) => (
                  <li key={activity.id}>
                    <div>
                      <strong>{activity.text}</strong>
                      <span>{activity.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article className="panel">
              <div className="panel-title-row">
                <h2>Top game ban chay</h2>
              </div>
              <ul className="admin-list">
                {topProducts.length === 0 && <li>Chua co du lieu ban hang.</li>}
                {topProducts.map((product) => (
                  <li key={product.name}>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.sold} ban ra</span>
                    </div>
                    <strong>{toCurrency(product.revenue)}</strong>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        )}

        {activeTab === "products" && (
          <section className="admin-content-stack">
            <article className="panel">
              <div className="panel-title-row">
                <h2>{editingProductId ? "Sua game" : "Them game moi"}</h2>
              </div>
              <form className="admin-form" onSubmit={handleProductSubmit}>
                <div className="form-grid">
                  <label>
                    Ten game
                    <input
                      value={formData.name}
                      onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={formData.category}
                      onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                    >
                      <option>Action</option>
                      <option>RPG</option>
                      <option>Indie</option>
                      <option>Adventure</option>
                      <option>Shooter</option>
                      <option>Open World</option>
                      <option>Simulation</option>
                    </select>
                  </label>
                  <label>
                    Platform
                    <select
                      value={formData.platform}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          platform: event.target.value as ProductFormState["platform"],
                        }))
                      }
                    >
                      <option value="PC">PC</option>
                      <option value="PS5">PS5</option>
                      <option value="Xbox">Xbox</option>
                    </select>
                  </label>
                  <label>
                    Trang thai
                    <select
                      value={formData.status}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: event.target.value as ProductFormState["status"],
                        }))
                      }
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </label>
                  <label>
                    Gia goc
                    <input
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Gia khuyen mai
                    <input
                      type="number"
                      min={0}
                      value={formData.salePrice}
                      onChange={(event) => setFormData((prev) => ({ ...prev, salePrice: event.target.value }))}
                    />
                  </label>
                  <label>
                    Link image
                    <input
                      value={formData.image}
                      onChange={(event) => setFormData((prev) => ({ ...prev, image: event.target.value }))}
                    />
                  </label>
                  <label>
                    Trailer (YouTube)
                    <input
                      value={formData.trailerUrl}
                      onChange={(event) => setFormData((prev) => ({ ...prev, trailerUrl: event.target.value }))}
                    />
                  </label>
                </div>

                <label>
                  Mo ta
                  <textarea
                    value={formData.description}
                    onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                  />
                </label>

                <div className="form-grid">
                  <label>
                    Screenshots (tach boi dau phay)
                    <textarea
                      value={formData.screenshots}
                      onChange={(event) => setFormData((prev) => ({ ...prev, screenshots: event.target.value }))}
                      rows={2}
                    />
                  </label>
                  <label>
                    Danh sach key/account (moi dong 1 key)
                    <textarea
                      value={formData.keys}
                      onChange={(event) => setFormData((prev) => ({ ...prev, keys: event.target.value }))}
                      rows={2}
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    Cau hinh toi thieu
                    <textarea
                      value={formData.minSpec}
                      onChange={(event) => setFormData((prev) => ({ ...prev, minSpec: event.target.value }))}
                      rows={2}
                    />
                  </label>
                  <label>
                    Cau hinh de nghi
                    <textarea
                      value={formData.recSpec}
                      onChange={(event) => setFormData((prev) => ({ ...prev, recSpec: event.target.value }))}
                      rows={2}
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Dang luu..." : editingProductId ? "Cap nhat" : "Them game"}
                  </button>
                  {editingProductId && (
                    <button type="button" className="btn-ghost" onClick={resetForm}>
                      Huy sua
                    </button>
                  )}
                </div>
              </form>
            </article>

            <article className="panel">
              <div className="panel-title-row">
                <h2>Danh sach game</h2>
              </div>

              <div className="filters-row">
                <select
                  value={productFilter.category}
                  onChange={(event) => setProductFilter((prev) => ({ ...prev, category: event.target.value }))}
                >
                  <option value="all">Tat ca category</option>
                  <option value="Action">Action</option>
                  <option value="RPG">RPG</option>
                  <option value="Indie">Indie</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Shooter">Shooter</option>
                  <option value="Open World">Open World</option>
                  <option value="Simulation">Simulation</option>
                </select>
                <select
                  value={productFilter.platform}
                  onChange={(event) => setProductFilter((prev) => ({ ...prev, platform: event.target.value }))}
                >
                  <option value="all">Tat ca platform</option>
                  <option value="PC">PC</option>
                  <option value="PS5">PS5</option>
                  <option value="Xbox">Xbox</option>
                </select>
                <select
                  value={productFilter.status}
                  onChange={(event) => setProductFilter((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="all">Tat ca trang thai</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Game</th>
                      <th>Category</th>
                      <th>Platform</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th>Promo</th>
                      <th>Keys</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productLoading && (
                      <tr>
                        <td colSpan={8}>Dang tai danh sach game tu Product service...</td>
                      </tr>
                    )}
                    {!productLoading && productError && (
                      <tr>
                        <td colSpan={8}>{productError}</td>
                      </tr>
                    )}
                    {!productLoading && !productError && filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={8}>Chua co san pham nao tu API.</td>
                      </tr>
                    )}
                    {filteredProducts.map((product) => {
                      const availableKeys = product.keys.filter((key) => key.status === "available").length;
                      return (
                        <tr key={product.id}>
                          <td>
                            <div className="cell-product">
                              <img src={product.image || "/vite.svg"} alt={product.name} />
                              <div>
                                <strong>{product.name}</strong>
                                <p>{product.description.slice(0, 56)}</p>
                              </div>
                            </div>
                          </td>
                          <td>{product.category}</td>
                          <td>{product.platform}</td>
                          <td>
                            <span className={`badge ${product.status === "In Stock" ? "ok" : "warn"}`}>{product.status}</span>
                          </td>
                          <td>{toCurrency(product.price)}</td>
                          <td>{product.salePrice ? toCurrency(product.salePrice) : "-"}</td>
                          <td>{availableKeys}/{product.keys.length}</td>
                          <td>
                            <button className="btn-inline" onClick={() => startEditProduct(product)}>Edit</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="key-manager">
                <h3>Quan ly key/account</h3>
                {filteredProducts.slice(0, 2).map((product) => (
                  <div key={product.id} className="key-product-card">
                    <p>{product.name}</p>
                    <div className="key-list">
                      {product.keys.map((key) => (
                        <div key={key.code} className="key-item">
                          <code>{key.code}</code>
                          <select
                            value={key.status}
                            onChange={(event) => updateKeyStatus(product.id, key.code, event.target.value as KeyStatus)}
                          >
                            <option value="available">available</option>
                            <option value="sold">sold</option>
                            <option value="revoked">revoked</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeTab === "orders" && (
          <section className="admin-content-grid order-layout">
            <article className="panel">
              <div className="panel-title-row">
                <h2>Danh sach don hang</h2>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ma don</th>
                      <th>Khach hang</th>
                      <th>Tong tien</th>
                      <th>Thanh toan</th>
                      <th>Trang thai</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.orderId}>
                        <td>{order.orderId}</td>
                        <td>{order.customerName}</td>
                        <td>{toCurrency(order.total)}</td>
                        <td>{order.paymentMethod}</td>
                        <td>
                          <span className={`badge ${order.status === "Success" ? "ok" : order.status === "Pending" ? "pending" : "warn"}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn-inline" onClick={() => setSelectedOrder(order)}>Detail</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel">
              <div className="panel-title-row">
                <h2>Chi tiet don hang</h2>
              </div>
              {!selectedOrder && <p>Chon mot don hang de xem key da gui, thoi gian giao dich va IP.</p>}
              {selectedOrder && (
                <div className="order-detail">
                  <p><strong>Order:</strong> {selectedOrder.orderId}</p>
                  <p><strong>Khach:</strong> {selectedOrder.customerName} ({selectedOrder.customerEmail})</p>
                  <p><strong>Thoi gian:</strong> {new Date(selectedOrder.purchasedAt).toLocaleString("vi-VN")}</p>
                  <p><strong>Buyer IP:</strong> {selectedOrder.buyerIp}</p>
                  <p><strong>Trang thai:</strong> {selectedOrder.status}</p>

                  <h4>Game keys da gui</h4>
                  <ul className="admin-list">
                    {selectedOrder.items.map((item) => (
                      <li key={`${selectedOrder.orderId}-${item.keySent}`}>
                        <div>
                          <strong>{item.productName}</strong>
                          <span>{toCurrency(item.price)}</span>
                        </div>
                        <code>{item.keySent}</code>
                      </li>
                    ))}
                  </ul>

                  <button
                    className="btn-danger"
                    disabled={selectedOrder.status === "Refunded"}
                    onClick={() => handleRefund(selectedOrder.orderId)}
                  >
                    {selectedOrder.status === "Refunded" ? "Da refund" : "Refund + Thu hoi key"}
                  </button>
                </div>
              )}
            </article>
          </section>
        )}

        {activeTab === "users" && (
          <section className="admin-content-stack">
            <article className="panel">
              <div className="panel-title-row">
                <h2>Danh sach khach hang / nhan vien</h2>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ten</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>So du vi</th>
                      <th>Lich su</th>
                      <th>Role</th>
                      <th>Permissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>{toCurrency(user.walletBalance)}</td>
                        <td>
                          {user.purchasedGames} game / {user.topupCount} lan nap
                        </td>
                        <td>
                          <select value={user.role} onChange={(event) => updateUserRole(user.id, event.target.value as AdminUser["role"])}>
                            <option value="Owner">Owner</option>
                            <option value="Manager">Manager</option>
                            <option value="Support">Support</option>
                          </select>
                        </td>
                        <td>
                          <div className="permission-list">
                            <span className={user.permissions.canViewOrders ? "on" : "off"}>View Orders</span>
                            <span className={user.permissions.canRefund ? "on" : "off"}>Refund</span>
                            <span className={user.permissions.canEditPrice ? "on" : "off"}>Edit Price</span>
                            <span className={user.permissions.canManageUsers ? "on" : "off"}>Manage Users</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}
      </main>
    </Fragment>
  );
}

export default Admin;
