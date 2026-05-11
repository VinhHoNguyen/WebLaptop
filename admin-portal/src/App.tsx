import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { API_BASE_URLS, fetchJson } from "./config/api";

type AdminPage = "dashboard" | "products" | "users";

type AdminUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
  status?: string | null;
};

type AdminSession = {
  token: string;
  user: AdminUser;
  issuedAt: number;
  expiresAt: number;
};

type ProductStatus = "active" | "low-stock" | "inactive";

type ProductRow = {
  id: string;
  image: string;
  imageUrl: string;
  name: string;
  description: string;
  category: string;
  stock: number;
  status: ProductStatus;
  price: number;
  specs: Record<string, unknown> | null;
};

type CreateProductInput = {
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  stock: number;
  specs?: Record<string, unknown> | null;
};

type UserStatus = "Active" | "Inactive";
type UserRole = "Admin" | "User";

type UserRow = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  phone?: string | null;
  gender?: string | null;
  role?: UserRole | string | null;
  status?: UserStatus | string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CreateUserInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  phone: string;
  gender?: string | null;
  role: string;
  status: string;
};

type ProductFormState = {
  name: string;
  price: string;
  description: string;
  category: string;
  image: string;
  stock: string;
  specs: string;
};

type UserFormState = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: string;
  phone: string;
  gender: string;
  role: string;
  status: string;
};

type OrderStatus = "completed" | "pending" | "shipped" | "cancelled" | "processing";

type OrderRow = {
  id: string;
  customer: string;
  status: OrderStatus;
  amount: number;
};

const ADMIN_SESSION_KEY = "admin_session";
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Đang bán",
  "low-stock": "Sắp hết hàng",
  inactive: "Hết hàng",
};

const USER_STATUS_LABELS: Record<string, string> = {
  Active: "Đang hoạt động",
  Inactive: "Đã khóa",
};

const USER_ROLE_LABELS: Record<string, string> = {
  Admin: "Quản trị",
  User: "Người dùng",
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  completed: "Hoàn tất",
  pending: "Chờ xử lý",
  shipped: "Đang giao",
  cancelled: "Đã hủy",
  processing: "Đang xử lý",
};

const kpiCards = [
  { title: "Tổng người dùng", value: "12.450", delta: "Tháng này +5,2%", tone: "blue" },
  { title: "Đơn hàng mới", value: "1.234", delta: "Tuần này +3,8%", tone: "green" },
  { title: "Doanh thu", value: "8.750.000 ₫", delta: "Tháng này +12,5%", tone: "orange" },
  { title: "Hỗ trợ", value: "68", delta: "Đang chờ", tone: "red" },
] as const;

const orders: OrderRow[] = [
  { id: "#10245", customer: "John Doe", status: "completed", amount: 150000 },
  { id: "#10244", customer: "Anna Smith", status: "pending", amount: 89000 },
  { id: "#10243", customer: "Michael Brown", status: "shipped", amount: 210000 },
  { id: "#10242", customer: "Linda Nguyen", status: "cancelled", amount: 45000 },
  { id: "#10241", customer: "David Wilson", status: "processing", amount: 120000 },
];

const topProducts = [
  ["Điện thoại", "1.230 lượt bán"],
  ["Laptop", "980 lượt bán"],
  ["Tai nghe", "835 lượt bán"],
  ["Đồng hồ thông minh", "652 lượt bán"],
] as const;

const activities = [
  ["David thêm sản phẩm mới", "10 phút trước"],
  ["Anna cập nhật đơn hàng", "30 phút trước"],
  ["John phản hồi yêu cầu hỗ trợ", "1 giờ trước"],
  ["Michael đăng ký người dùng mới", "2 giờ trước"],
] as const;

const messages = [
  ["Alice", "Cần hỗ trợ về đơn hàng."],
  ["Steve", "Làm sao để đổi mật khẩu?"],
  ["Karen", "Vui lòng kiểm tra tồn kho."],
] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

const emptyProductForm: ProductFormState = {
  name: "",
  price: "",
  description: "",
  category: "",
  image: "",
  stock: "",
  specs: "",
};

const emptyUserForm: UserFormState = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  age: "",
  phone: "",
  gender: "",
  role: "User",
  status: "Active",
};

const isAdminRole = (role?: string | null) => {
  return String(role || "").trim().toLowerCase() === "admin";
};

const looksGarbled = (value: string) => {
  return value.includes("�") || /\?{2,}/.test(value);
};

const formatAdminName = (user: AdminUser) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (fullName && !looksGarbled(fullName)) {
    return fullName;
  }
  return user.email || "Quản trị";
};

const formatUserName = (user: UserRow) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email || "(Chưa đặt tên)";
};

const readSessionFromStorage = (storage: Storage): AdminSession | null => {
  const raw = storage.getItem(ADMIN_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    const issuedAt = Number(parsed.issuedAt);
    const expiresAt = Number(parsed.expiresAt);
    const token = String(parsed.token || "").trim();
    const user = parsed.user as AdminUser | undefined;

    if (!token || !user || !user.id || !user.email) {
      storage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) {
      storage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    if (expiresAt <= Date.now()) {
      storage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return { token, user, issuedAt, expiresAt };
  } catch (_error) {
    storage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
};

const loadSession = (): AdminSession | null => {
  return readSessionFromStorage(localStorage) || readSessionFromStorage(sessionStorage);
};

const saveSession = (session: AdminSession, remember: boolean) => {
  const storage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;
  storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  otherStorage.removeItem(ADMIN_SESSION_KEY);
};

const clearSession = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
};

const fetchCurrentUser = async (token: string) => {
  return fetchJson<AdminUser>(`${API_BASE_URLS.user}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

function App() {
  const [page, setPage] = useState<AdminPage>("dashboard");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      setIsAuthReady(true);
      return;
    }

    const validate = async () => {
      try {
        const user = await fetchCurrentUser(session.token);
        if (!isAdminRole(user.role)) {
          throw new Error("Tài khoản không có quyền quản trị.");
        }
        setAdminSession({ ...session, user });
      } catch (_error) {
        clearSession();
        setAdminSession(null);
      } finally {
        setIsAuthReady(true);
      }
    };

    void validate();
  }, []);

  useEffect(() => {
    if (!adminSession) {
      return;
    }

    const remaining = adminSession.expiresAt - Date.now();
    if (remaining <= 0) {
      clearSession();
      setAdminSession(null);
      return;
    }

    const timer = window.setTimeout(() => {
      clearSession();
      setAdminSession(null);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [adminSession]);

  useEffect(() => {
    if (!adminSession) {
      setProducts([]);
      setTotalProducts(0);
      return;
    }

    fetchProducts();
  }, [adminSession]);

  useEffect(() => {
    if (!adminSession) {
      setUsers([]);
      setTotalUsers(0);
      return;
    }

    if (page === "users") {
      fetchUsers();
    }
  }, [adminSession, page]);

  const fetchProducts = async () => {
    try {
      const payload = await fetchJson<any>(`${API_BASE_URLS.product}/products`);
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      const normalized = data.map((item: any): ProductRow => {
        const stock = item.stock ?? 50;
        const status: ProductStatus = stock === 0 ? "inactive" : stock < 10 ? "low-stock" : "active";
        const imageAbbr = (item.name || "")
          .split(" ")
          .slice(0, 2)
          .map((w: string) => w[0].toUpperCase())
          .join("");

        return {
          id: item._id || `p-${Date.now()}`,
          image: imageAbbr || "P",
          imageUrl: item.image || "",
          name: item.name || "Chưa rõ",
          description: item.description || "",
          category: item.category || "Laptop",
          stock: stock,
          status: status,
          price: Number(item.price ?? 0),
          specs: item.specs ?? null,
        };
      });

      setProducts(normalized);
      setTotalProducts(normalized.length);
    } catch (error) {
      console.error("Không thể tải sản phẩm:", error);
    }
  };

  const fetchUsers = async () => {
    if (!adminSession) {
      return;
    }

    try {
      const payload = await fetchJson<any>(`${API_BASE_URLS.user}/users/all`, {
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
        },
      });
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      const normalized = data.map((item: any): UserRow => ({
        id: item.id || item._id || "",
        email: item.email || "",
        firstName: item.firstName ?? null,
        lastName: item.lastName ?? null,
        age: typeof item.age === "number" ? item.age : item.age ? Number(item.age) : null,
        phone: item.phone ?? null,
        gender: item.gender ?? null,
        role: item.role ?? "User",
        status: item.status ?? "Active",
        createdAt: item.createdAt ?? null,
        updatedAt: item.updatedAt ?? null,
      }));

      setUsers(normalized);
      setTotalUsers(normalized.length);
    } catch (error) {
      console.error("Không thể tải danh sách người dùng:", error);
    }
  };

  const createProduct = async (input: CreateProductInput) => {
    await fetchJson(`${API_BASE_URLS.product}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    await fetchProducts();
  };

  const updateProduct = async (id: string, input: CreateProductInput) => {
    await fetchJson(`${API_BASE_URLS.product}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await fetchJson(`${API_BASE_URLS.product}/products/${id}`, {
      method: "DELETE",
    });
    await fetchProducts();
  };

  const createUser = async (input: CreateUserInput) => {
    await fetchJson(`${API_BASE_URLS.user}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    await fetchUsers();
  };

  const updateUser = async (id: string, input: Omit<CreateUserInput, "password">) => {
    if (!adminSession) {
      return;
    }

    await fetchJson(`${API_BASE_URLS.user}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminSession.token}`,
      },
      body: JSON.stringify(input),
    });
    await fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!adminSession) {
      return;
    }

    await fetchJson(`${API_BASE_URLS.user}/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminSession.token}`,
      },
    });
    await fetchUsers();
  };

  const handleLogin = async (email: string, password: string, remember: boolean) => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      throw new Error("Vui lòng nhập email và mật khẩu.");
    }

    let token: string;
    try {
      token = await fetchJson<string>(`${API_BASE_URLS.user}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err || "");
      // Map technical errors to friendly messages for users
      if (/database|unknown database|ECONNREFUSED|connect ECONNREFUSED/i.test(msg)) {
        throw new Error("Đã xảy ra lỗi kết nối với dịch vụ xác thực. Vui lòng thử lại sau hoặc liên hệ quản trị hệ thống.");
      }
      if (/401|wrong email|wrong password|wrong email or password/i.test(msg)) {
        throw new Error("Email hoặc mật khẩu không đúng.");
      }
      throw new Error("Đăng nhập thất bại. Vui lòng thử lại.");
    }

    let user: AdminUser;
    try {
      user = await fetchCurrentUser(token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err || "");
      if (/database|unknown database|ECONNREFUSED|connect ECONNREFUSED/i.test(msg)) {
        throw new Error("Đã xảy ra lỗi kết nối với dịch vụ người dùng. Vui lòng thử lại sau hoặc liên hệ quản trị hệ thống.");
      }
      throw new Error("Không thể lấy thông tin người dùng. Vui lòng thử lại.");
    }
    if (!isAdminRole(user.role)) {
      throw new Error("Tài khoản không có quyền quản trị.");
    }

    const now = Date.now();
    const session: AdminSession = {
      token,
      user,
      issuedAt: now,
      expiresAt: now + ADMIN_SESSION_TTL_MS,
    };
    saveSession(session, remember);
    setAdminSession(session);
  };

  const handleLogout = () => {
    clearSession();
    setAdminSession(null);
  };

  const pageTitle = useMemo(() => {
    if (page === "dashboard") {
      return "Chào mừng, quản trị viên!";
    }
    if (page === "users") {
      return "Người dùng";
    }
    return "Sản phẩm";
  }, [page]);

  if (!isAuthReady) {
    return (
      <div className="login-page">
        <div className="panel login-card">
          <div className="login-brand">
            <div className="brand-logo" />
            <div>
              <div className="login-title">Trang quản trị</div>
              <div className="login-sub">Đang kiểm tra phiên đăng nhập...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!adminSession) {
    return <LoginView onLogin={handleLogin} />;
  }

  const displayName = formatAdminName(adminSession.user);
  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="admin-root">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo" />
          <span>Quản trị</span>
        </div>

        <nav className="menu">
          <button className={page === "dashboard" ? "menu-item active" : "menu-item"} onClick={() => setPage("dashboard")}>
            Tổng quan
          </button>
          <button className={page === "products" ? "menu-item active" : "menu-item"} onClick={() => setPage("products")}>
            Sản phẩm
          </button>
          <button className={page === "users" ? "menu-item active" : "menu-item"} onClick={() => setPage("users")}>
            Người dùng
          </button>
          <button className="menu-item" disabled>
            Đơn hàng
          </button>
          <button className="menu-item" disabled>
            Cài đặt
          </button>
        </nav>

        <button className="logout" type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main className="content">
        <header className="topbar">
          <h1>{pageTitle}</h1>
          <div className="topbar-user">
            <div className="alert-dot" />
            <span>{displayName}</span>
            <div className="avatar">{avatarLetter}</div>
          </div>
        </header>

        {page === "dashboard" ? (
          <DashboardView />
        ) : page === "users" ? (
          <UsersView
            rows={users}
            total={totalUsers}
            onCreateUser={createUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        ) : (
          <ProductsView
            rows={products}
            total={totalProducts}
            onCreateProduct={createProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
          />
        )}
      </main>
    </div>
  );
}

function LoginView({
  onLogin,
}: {
  onLogin: (email: string, password: string, remember: boolean) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await onLogin(email, password, remember);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="panel login-card">
        <div className="login-brand">
          <div className="brand-logo" />
          <div>
            <div className="login-title">Trang quản trị</div>
            <div className="login-sub">Đăng nhập để tiếp tục</div>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Nhập email"
              autoComplete="email"
              required
            />
          </label>
          <label className="login-field">
            <span>Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              required
            />
          </label>

          <label className="login-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Ghi nhớ đăng nhập
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="login-actions">
            <button className="btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </div>
        </form>

        <div className="login-hint">Dùng tài khoản quản trị đã được tạo trong hệ thống.</div>
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <section className="dashboard">
      <div className="kpi-grid">
        {kpiCards.map((item) => (
          <article key={item.title} className={`kpi-card ${item.tone}`}>
            <p>{item.title}</p>
            <h2>{item.value}</h2>
            <span>{item.delta}</span>
          </article>
        ))}
      </div>

      <div className="grid-two">
        <article className="panel large">
          <div className="panel-header">
            <h3>Tổng quan doanh thu</h3>
            <div className="tabs">
              <button className="tab active">Theo tháng</button>
              <button className="tab">Theo tuần</button>
              <button className="tab">Theo ngày</button>
            </div>
          </div>
          <svg viewBox="0 0 600 220" className="chart" role="img" aria-label="Biểu đồ doanh thu">
            <polyline points="20,170 100,120 180,95 260,130 340,140 420,115 500,58 580,42" className="line blue" />
            <polyline points="20,185 100,150 180,125 260,155 340,165 420,145 500,110 580,85" className="line green" />
          </svg>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Đơn hàng gần đây</h3>
          </div>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Trạng thái</th>
                <th>Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>
                    <span className={`pill ${order.status.toLowerCase()}`}>{ORDER_STATUS_LABELS[order.status]}</span>
                  </td>
                  <td>{formatCurrency(order.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>

      <div className="grid-three">
        <article className="panel">
          <div className="panel-header">
            <h3>Sản phẩm bán chạy</h3>
          </div>
          <ul className="list">
            {topProducts.map((item) => (
              <li key={item[0]}>
                <span>{item[0]}</span>
                <small>{item[1]}</small>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Hoạt động gần đây</h3>
          </div>
          <ul className="list">
            {activities.map((activity) => (
              <li key={activity[0]}>
                <span>{activity[0]}</span>
                <small>{activity[1]}</small>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Tin nhắn</h3>
          </div>
          <ul className="message-list">
            {messages.map((message) => (
              <li key={message[0]}>
                <b>{message[0]}:</b> {message[1]}
              </li>
            ))}
          </ul>
          <button className="btn-view">Xem tất cả</button>
        </article>
      </div>
    </section>
  );
}

function ProductsView({
  rows,
  total,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
}: {
  rows: ProductRow[];
  total: number;
  onCreateProduct: (input: CreateProductInput) => Promise<void>;
  onUpdateProduct: (id: string, input: CreateProductInput) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(emptyProductForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(() => {
    const unique = new Set(rows.map((row) => row.category).filter(Boolean));
    return ["all", ...Array.from(unique)];
  }, [rows]);

  const statuses = useMemo(() => {
    const unique = new Set(rows.map((row) => row.status));
    return ["all", ...Array.from(unique)];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (selectedCategory !== "all" && row.category !== selectedCategory) {
        return false;
      }

      if (selectedStatus !== "all" && row.status !== selectedStatus) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        row.name.toLowerCase().includes(keyword) ||
        row.category.toLowerCase().includes(keyword)
      );
    });
  }, [rows, query, selectedCategory, selectedStatus]);

  const handleInputChange = (field: keyof ProductFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setFormMode("create");
    setEditingId(null);
    setFormError("");
    setFormState(emptyProductForm);
  };

  const openCreateForm = () => {
    setFormMode("create");
    setEditingId(null);
    setFormError("");
    setFormState(emptyProductForm);
    setIsFormOpen(true);
  };

  const openEditForm = (row: ProductRow) => {
    setFormMode("edit");
    setEditingId(row.id);
    setFormError("");
    setFormState({
      name: row.name,
      price: Number.isFinite(row.price) ? String(row.price) : "",
      description: row.description || "",
      category: row.category || "",
      image: row.imageUrl || "",
      stock: Number.isFinite(row.stock) ? String(row.stock) : "",
      specs: row.specs ? JSON.stringify(row.specs, null, 2) : "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (row: ProductRow) => {
    const confirmed = window.confirm(`Xóa sản phẩm "${row.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await onDeleteProduct(row.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Xóa sản phẩm thất bại.";
      window.alert(message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!formState.name.trim()) {
      setFormError("Tên sản phẩm là bắt buộc.");
      return;
    }

    const price = Number(formState.price);
    if (!Number.isFinite(price) || price < 0) {
      setFormError("Giá phải là số không âm hợp lệ.");
      return;
    }

    const stock = Number(formState.stock || 0);
    if (!Number.isFinite(stock) || stock < 0) {
      setFormError("Tồn kho phải là số không âm hợp lệ.");
      return;
    }

    let specs: Record<string, unknown> | null = null;
    if (formState.specs.trim()) {
      try {
        specs = JSON.parse(formState.specs);
      } catch (_error) {
        setFormError("Thông số phải là JSON hợp lệ.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formState.name.trim(),
        price: price,
        description: formState.description.trim(),
        category: formState.category.trim(),
        image: formState.image.trim(),
        stock: stock,
        specs,
      };

      if (formMode === "edit" && editingId) {
        await onUpdateProduct(editingId, payload);
      } else {
        await onCreateProduct(payload);
      }
      handleFormClose();
    } catch (error) {
      const fallbackMessage = formMode === "edit" ? "Cập nhật sản phẩm thất bại." : "Tạo sản phẩm thất bại.";
      setFormError(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="products-page">
      <div className="panel search-wrap">
        <h2>Sản phẩm</h2>
        <input
          placeholder="Tìm sản phẩm..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="panel toolbar">
        <div className="toolbar-left">
          <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
            <option value="all">Tất cả danh mục</option>
            {categories
              .filter((category) => category !== "all")
              .map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
          </select>
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            {statuses
              .filter((status) => status !== "all")
              .map((status) => (
                <option key={status} value={status}>
                  {PRODUCT_STATUS_LABELS[status as ProductStatus] ?? status}
                </option>
              ))}
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" type="button" onClick={openCreateForm}>
            + Thêm sản phẩm
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="modal-backdrop" role="presentation" onClick={handleFormClose}>
          <div className="panel modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{formMode === "edit" ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</h3>
              <button className="icon-button" type="button" onClick={handleFormClose} aria-label="Đóng">
                ×
              </button>
            </div>
            <form className="product-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Tên sản phẩm</span>
                  <input value={formState.name} onChange={handleInputChange("name")} placeholder="Tên sản phẩm" required />
                </label>
                <label className="form-field">
                  <span>Danh mục</span>
                  <input value={formState.category} onChange={handleInputChange("category")} placeholder="Danh mục" />
                </label>
                <label className="form-field">
                  <span>Giá (VND)</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formState.price}
                    onChange={handleInputChange("price")}
                    placeholder="Giá"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Tồn kho</span>
                  <input
                    type="number"
                    min="0"
                    value={formState.stock}
                    onChange={handleInputChange("stock")}
                    placeholder="Tồn kho"
                  />
                </label>
                <label className="form-field">
                  <span>Link ảnh</span>
                  <input value={formState.image} onChange={handleInputChange("image")} placeholder="https://..." />
                </label>
                <label className="form-field form-field-wide">
                  <span>Mô tả</span>
                  <textarea value={formState.description} onChange={handleInputChange("description")} placeholder="Mô tả ngắn" />
                </label>
                <label className="form-field form-field-wide">
                  <span>Thông số (JSON)</span>
                  <textarea
                    value={formState.specs}
                    onChange={handleInputChange("specs")}
                    placeholder='Ví dụ: {"cpu":"Intel i7", "ramGb": 16}'
                  />
                </label>
              </div>
              {formError && <div className="form-error">{formError}</div>}
              <div className="form-actions">
                <button className="btn-secondary" type="button" onClick={handleFormClose} disabled={isSubmitting}>
                  Hủy
                </button>
                <button className="btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? formMode === "edit"
                      ? "Đang cập nhật..."
                      : "Đang lưu..."
                    : formMode === "edit"
                      ? "Cập nhật"
                      : "Lưu sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <article className="panel products-table-wrap">
        <div className="table-title">Hiển thị {filteredRows.length} / {total} sản phẩm</div>
        <table className="products-table">
          <thead>
            <tr>
              <th></th>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Tồn kho</th>
              <th>Trạng thái</th>
              <th>Giá</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input type="checkbox" aria-label={`Chọn ${row.name}`} />
                </td>
                <td>
                  <div className="thumb">{row.image}</div>
                </td>
                <td>{row.name}</td>
                <td>{row.category}</td>
                <td>{row.stock}</td>
                <td>
                  <span className={`pill ${row.status.toLowerCase().replace(" ", "-")}`}>
                    {PRODUCT_STATUS_LABELS[row.status]}
                  </span>
                </td>
                <td>{formatCurrency(row.price)}</td>
                <td>
                  <div className="actions">
                    <button className="action-link" type="button" onClick={() => openEditForm(row)}>
                      Sửa
                    </button>
                    <button className="action-link danger" type="button" onClick={() => handleDelete(row)}>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pager">
          <button className="page-item">1</button>
          <button className="page-item">2</button>
          <button className="page-item">3</button>
          <button className="page-item">4</button>
        </div>
      </article>
    </section>
  );
}

function UsersView({
  rows,
  total,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}: {
  rows: UserRow[];
  total: number;
  onCreateUser: (input: CreateUserInput) => Promise<void>;
  onUpdateUser: (id: string, input: Omit<CreateUserInput, "password">) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<UserFormState>(emptyUserForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = useMemo(() => {
    const unique = new Set(rows.map((row) => String(row.role || "User")).filter(Boolean));
    return ["all", ...Array.from(unique)];
  }, [rows]);

  const statuses = useMemo(() => {
    const unique = new Set(rows.map((row) => String(row.status || "Active")).filter(Boolean));
    return ["all", ...Array.from(unique)];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      const role = String(row.role || "User");
      const status = String(row.status || "Active");

      if (selectedRole !== "all" && role !== selectedRole) {
        return false;
      }

      if (selectedStatus !== "all" && status !== selectedStatus) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const name = formatUserName(row).toLowerCase();
      const email = String(row.email || "").toLowerCase();
      const phone = String(row.phone || "").toLowerCase();

      return name.includes(keyword) || email.includes(keyword) || phone.includes(keyword);
    });
  }, [rows, query, selectedRole, selectedStatus]);

  const handleInputChange = (field: keyof UserFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setFormMode("create");
    setEditingId(null);
    setFormError("");
    setFormState(emptyUserForm);
  };

  const openCreateForm = () => {
    setFormMode("create");
    setEditingId(null);
    setFormError("");
    setFormState(emptyUserForm);
    setIsFormOpen(true);
  };

  const openEditForm = (row: UserRow) => {
    setFormMode("edit");
    setEditingId(row.id);
    setFormError("");
    setFormState({
      email: row.email || "",
      password: "",
      firstName: row.firstName || "",
      lastName: row.lastName || "",
      age: row.age != null ? String(row.age) : "",
      phone: row.phone || "",
      gender: row.gender || "",
      role: String(row.role || "User"),
      status: String(row.status || "Active"),
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (row: UserRow) => {
    const confirmed = window.confirm(`Xóa người dùng "${formatUserName(row)}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await onDeleteUser(row.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Xóa người dùng thất bại.";
      window.alert(message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!formState.email.trim()) {
      setFormError("Email là bắt buộc.");
      return;
    }

    if (formMode === "create" && !formState.password.trim()) {
      setFormError("Mật khẩu là bắt buộc.");
      return;
    }

    if (!formState.firstName.trim() || !formState.lastName.trim()) {
      setFormError("Họ và tên là bắt buộc.");
      return;
    }

    const age = Number(formState.age);
    if (!Number.isFinite(age) || age <= 0) {
      setFormError("Tuổi phải là số hợp lệ.");
      return;
    }

    if (!formState.phone.trim()) {
      setFormError("Số điện thoại là bắt buộc.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateUserInput = {
        email: formState.email.trim(),
        password: formState.password.trim(),
        firstName: formState.firstName.trim(),
        lastName: formState.lastName.trim(),
        age,
        phone: formState.phone.trim(),
        gender: formState.gender.trim() || null,
        role: formState.role.trim() || "User",
        status: formState.status.trim() || "Active",
      };

      if (formMode === "edit" && editingId) {
        const { password: _password, ...updatePayload } = payload;
        await onUpdateUser(editingId, updatePayload);
      } else {
        await onCreateUser(payload);
      }

      handleFormClose();
    } catch (error) {
      const fallbackMessage = formMode === "edit" ? "Cập nhật người dùng thất bại." : "Tạo người dùng thất bại.";
      setFormError(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="users-page">
      <div className="panel search-wrap">
        <h2>Người dùng</h2>
        <input
          placeholder="Tìm người dùng..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="panel toolbar">
        <div className="toolbar-left">
          <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
            <option value="all">Tất cả vai trò</option>
            {roles
              .filter((role) => role !== "all")
              .map((role) => (
                <option key={role} value={role}>
                  {USER_ROLE_LABELS[role] ?? role}
                </option>
              ))}
          </select>
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            {statuses
              .filter((status) => status !== "all")
              .map((status) => (
                <option key={status} value={status}>
                  {USER_STATUS_LABELS[status] ?? status}
                </option>
              ))}
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" type="button" onClick={openCreateForm}>
            + Thêm người dùng
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="modal-backdrop" role="presentation" onClick={handleFormClose}>
          <div className="panel modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{formMode === "edit" ? "Cập nhật người dùng" : "Thêm người dùng"}</h3>
              <button className="icon-button" type="button" onClick={handleFormClose} aria-label="Đóng">
                ×
              </button>
            </div>
            <form className="user-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={handleInputChange("email")}
                    placeholder="email@domain.com"
                    required
                  />
                </label>
                {formMode === "create" && (
                  <label className="form-field">
                    <span>Mật khẩu</span>
                    <input
                      type="password"
                      value={formState.password}
                      onChange={handleInputChange("password")}
                      placeholder="Mật khẩu"
                      required
                    />
                  </label>
                )}
                <label className="form-field">
                  <span>Họ</span>
                  <input
                    value={formState.lastName}
                    onChange={handleInputChange("lastName")}
                    placeholder="Họ"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Tên</span>
                  <input
                    value={formState.firstName}
                    onChange={handleInputChange("firstName")}
                    placeholder="Tên"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Tuổi</span>
                  <input
                    type="number"
                    min="1"
                    value={formState.age}
                    onChange={handleInputChange("age")}
                    placeholder="Tuổi"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Số điện thoại</span>
                  <input
                    value={formState.phone}
                    onChange={handleInputChange("phone")}
                    placeholder="Số điện thoại"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Giới tính</span>
                  <input
                    value={formState.gender}
                    onChange={handleInputChange("gender")}
                    placeholder="Nam / Nữ / Khác"
                  />
                </label>
                <label className="form-field">
                  <span>Vai trò</span>
                  <select value={formState.role} onChange={handleInputChange("role")}>
                    <option value="Admin">Quản trị</option>
                    <option value="User">Người dùng</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Trạng thái</span>
                  <select value={formState.status} onChange={handleInputChange("status")}>
                    <option value="Active">Đang hoạt động</option>
                    <option value="Inactive">Đã khóa</option>
                  </select>
                </label>
              </div>
              {formError && <div className="form-error">{formError}</div>}
              <div className="form-actions">
                <button className="btn-secondary" type="button" onClick={handleFormClose} disabled={isSubmitting}>
                  Hủy
                </button>
                <button className="btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? formMode === "edit"
                      ? "Đang cập nhật..."
                      : "Đang lưu..."
                    : formMode === "edit"
                      ? "Cập nhật"
                      : "Lưu người dùng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <article className="panel products-table-wrap">
        <div className="table-title">Hiển thị {filteredRows.length} / {total} người dùng</div>
        <table className="products-table">
          <thead>
            <tr>
              <th></th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Số điện thoại</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const roleKey = String(row.role || "User");
              const statusKey = String(row.status || "Active");
              const statusClass = statusKey.toLowerCase() === "active" ? "active" : "inactive";
              const roleClass = roleKey.toLowerCase();

              return (
                <tr key={row.id}>
                  <td>
                    <input type="checkbox" aria-label={`Chọn ${formatUserName(row)}`} />
                  </td>
                  <td>{formatUserName(row)}</td>
                  <td>{row.email}</td>
                  <td>
                    <span className={`pill role-${roleClass}`}>
                      {USER_ROLE_LABELS[roleKey] ?? roleKey}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${statusClass}`}>
                      {USER_STATUS_LABELS[statusKey] ?? statusKey}
                    </span>
                  </td>
                  <td>{row.phone || "-"}</td>
                  <td>
                    <div className="actions">
                      <button className="action-link" type="button" onClick={() => openEditForm(row)}>
                        Sửa
                      </button>
                      <button className="action-link danger" type="button" onClick={() => handleDelete(row)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="pager">
          <button className="page-item">1</button>
          <button className="page-item">2</button>
          <button className="page-item">3</button>
          <button className="page-item">4</button>
        </div>
      </article>
    </section>
  );
}

export default App;
