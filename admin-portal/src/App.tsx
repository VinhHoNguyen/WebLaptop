import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_BASE_URLS, fetchJson } from "./config/api";

type Role = "Admin" | "Moderator" | "User";
type UserStatus = "Active" | "Inactive";
type AdminTab = "users" | "products";

type ApiUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  phone?: string;
  gender?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiProduct = {
  _id: string;
  name?: string;
  description?: string;
  category?: string;
  image?: string;
  price?: number;
};

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  age: number | null;
  phone: string;
  gender: string;
  role: Role;
  status: UserStatus;
  joined: string;
  updatedAt: string;
  initials: string;
};

type ProductRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
};

type EditFormState = {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  phone: string;
  gender: string;
  role: Role;
  status: UserStatus;
};

type CreateFormState = EditFormState & {
  password: string;
};

const PAGE_SIZE = 8;
const PRODUCT_PAGE_SIZE = 8;
const roleFilters: Array<Role | "All Roles"> = ["All Roles", "Admin", "Moderator", "User"];
const statusFilters: Array<UserStatus | "All Statuses"> = ["All Statuses", "Active", "Inactive"];

const normalizeRole = (role?: string): Role => {
  if (role === "Admin" || role === "Moderator" || role === "User") {
    return role;
  }
  return "User";
};

const normalizeStatus = (status?: string): UserStatus => {
  if (status === "Active" || status === "Inactive") {
    return status;
  }
  return "Active";
};

const toInitials = (firstName: string, lastName: string, email: string) => {
  const f = firstName.trim();
  const l = lastName.trim();
  if (f || l) {
    return `${f.slice(0, 1)}${l.slice(0, 1)}`.toUpperCase() || "US";
  }
  return email.slice(0, 2).toUpperCase() || "US";
};

const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

const mapApiUser = (user: ApiUser): UserRow => {
  const firstName = user.firstName?.trim() || "";
  const lastName = user.lastName?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Unknown User";
  const email = user.email || "no-email";

  return {
    id: user._id,
    firstName,
    lastName,
    fullName,
    email,
    age: typeof user.age === "number" ? user.age : null,
    phone: user.phone || "",
    gender: user.gender || "",
    role: normalizeRole(user.role),
    status: normalizeStatus(user.status),
    joined: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
    initials: toInitials(firstName, lastName, email),
  };
};

const toEditState = (user: UserRow): EditFormState => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  age: user.age === null ? "" : String(user.age),
  phone: user.phone,
  gender: user.gender,
  role: user.role,
  status: user.status,
});

const mapApiProduct = (product: ApiProduct): ProductRow => ({
  id: product._id,
  name: product.name?.trim() || "Untitled Product",
  description: product.description?.trim() || "",
  category: product.category?.trim() || "Uncategorized",
  price: typeof product.price === "number" ? product.price : 0,
  image: product.image?.trim() || "",
});

const formatVnd = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const createFormInitialState = (): CreateFormState => ({
  firstName: "",
  lastName: "",
  email: "",
  age: "",
  phone: "",
  gender: "",
  role: "User",
  status: "Active",
  password: "",
});

function App() {
  const [adminName, setAdminName] = useState("Admin");
  const [token, setToken] = useState(() => localStorage.getItem("admin_user_token") || "");
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || "/");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "All Roles">("All Roles");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "All Statuses">("All Statuses");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);

  const [viewingUser, setViewingUser] = useState<UserRow | null>(null);
  const [creatingUser, setCreatingUser] = useState<CreateFormState | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const isAuthenticated = Boolean(token.trim());

  const navigate = (path: string, replace = false) => {
    if (window.location.pathname !== path) {
      if (replace) {
        window.history.replaceState({}, "", path);
      } else {
        window.history.pushState({}, "", path);
      }
    }
    setCurrentPath(path);
  };

  useEffect(() => {
    localStorage.setItem("admin_user_token", token);
  }, [token]);

  useEffect(() => {
    const syncPath = () => setCurrentPath(window.location.pathname || "/");
    window.addEventListener("popstate", syncPath);

    if ((window.location.pathname || "/") === "/") {
      navigate("/login", true);
    } else {
      syncPath();
    }

    return () => {
      window.removeEventListener("popstate", syncPath);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated && currentPath !== "/login") {
      navigate("/login", true);
      return;
    }

    if (isAuthenticated && currentPath !== "/admin") {
      navigate("/admin", true);
    }
  }, [isAuthenticated, currentPath]);

  const loadUsers = async () => {
    if (!token) {
      setUsers([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [profileResult, usersResult] = await Promise.allSettled([
        fetchJson<ApiUser>(`${API_BASE_URLS.user}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchJson<ApiUser[]>(`${API_BASE_URLS.user}/users/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileResult.status === "fulfilled") {
        const firstName = profileResult.value.firstName || "";
        const lastName = profileResult.value.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) {
          setAdminName(fullName);
        } else if (profileResult.value.email) {
          setAdminName(profileResult.value.email);
        }
      }

      if (usersResult.status === "fulfilled") {
        setUsers(usersResult.value.map(mapApiUser));
      } else {
        throw usersResult.reason;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      if (message.includes("not authorized") || message.includes("401")) {
        setToken("");
        setUsers([]);
        setError(null);
        setLoginError("Session expired or invalid token. Please login again.");
        navigate("/login", true);
        return;
      }

      setUsers([]);
      setError("Unable to load users. Check User service status and CORS settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [token]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    setProductPage(1);
  }, [productSearch]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "All Roles" && user.role !== roleFilter) {
        return false;
      }
      if (statusFilter !== "All Statuses" && user.status !== statusFilter) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return (
        user.fullName.toLowerCase().includes(keyword)
        || user.email.toLowerCase().includes(keyword)
        || user.phone.toLowerCase().includes(keyword)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedUsers = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);

  const filteredProducts = useMemo(() => {
    const keyword = productSearch.trim().toLowerCase();
    if (!keyword) {
      return products;
    }

    return products.filter((product) => (
      product.name.toLowerCase().includes(keyword)
      || product.category.toLowerCase().includes(keyword)
      || product.description.toLowerCase().includes(keyword)
    ));
  }, [products, productSearch]);

  const productPageCount = Math.max(1, Math.ceil(filteredProducts.length / PRODUCT_PAGE_SIZE));
  const currentProductPage = Math.min(productPage, productPageCount);
  const productPageStart = (currentProductPage - 1) * PRODUCT_PAGE_SIZE;
  const pagedProducts = filteredProducts.slice(productPageStart, productPageStart + PRODUCT_PAGE_SIZE);

  useEffect(() => {
    setSelected((prev) => prev.filter((id) => pagedUsers.some((user) => user.id === id)));
  }, [pagedUsers]);

  const loadProducts = async () => {
    setProductLoading(true);
    setProductError(null);

    try {
      const productList = await fetchJson<ApiProduct[]>(`${API_BASE_URLS.product}/products`);
      if (!Array.isArray(productList)) {
        throw new Error("Invalid product list response");
      }
      setProducts(productList.map(mapApiProduct));
    } catch {
      setProducts([]);
      setProductError("Unable to load products. Check Product service status and CORS settings.");
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    if (!token || activeTab !== "products") {
      return;
    }
    void loadProducts();
  }, [token, activeTab]);

  const allInPageSelected = pagedUsers.length > 0 && pagedUsers.every((user) => selected.includes(user.id));

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setLoginError("Email and password are required.");
      return;
    }

    setLoggingIn(true);
    setLoginError(null);
    setActionMessage(null);

    try {
      const accessToken = await fetchJson<string>(`${API_BASE_URLS.user}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
        }),
      });
      setToken(accessToken);
      setAuthPassword("");
      navigate("/admin", true);
    } catch {
      setLoginError("Login failed. Please verify email/password from User service.");
    } finally {
      setLoggingIn(false);
    }
  };

  const toggleCurrentPageSelection = () => {
    if (allInPageSelected) {
      setSelected((prev) => prev.filter((id) => !pagedUsers.some((user) => user.id === id)));
      return;
    }

    const next = new Set(selected);
    pagedUsers.forEach((user) => next.add(user.id));
    setSelected(Array.from(next));
  };

  const toggleSingleSelection = (id: string) => {
    if (selected.includes(id)) {
      setSelected((prev) => prev.filter((item) => item !== id));
      return;
    }
    setSelected((prev) => [...prev, id]);
  };

  const openViewUser = async (id: string) => {
    if (!token) {
      setActionMessage("Please login before viewing user details.");
      return;
    }

    setActionLoadingId(id);
    setActionMessage(null);

    try {
      const user = await fetchJson<ApiUser>(`${API_BASE_URLS.user}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewingUser(mapApiUser(user));
    } catch {
      setActionMessage("Unable to load user details.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditUser = (user: UserRow) => {
    setEditingUser(user);
    setEditForm(toEditState(user));
    setActionMessage(null);
  };

  const openCreateUser = () => {
    setCreatingUser(createFormInitialState());
    setActionMessage(null);
  };

  const submitCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!creatingUser || !token) {
      setActionMessage("Missing form data or token to create user.");
      return;
    }

    if (!creatingUser.email.trim() || !creatingUser.password.trim() || !creatingUser.firstName.trim() || !creatingUser.lastName.trim()) {
      setActionMessage("First name, last name, email and password are required.");
      return;
    }

    setActionLoadingId("create");
    setActionMessage(null);

    try {
      const payload: Record<string, string | number> = {
        firstName: creatingUser.firstName.trim(),
        lastName: creatingUser.lastName.trim(),
        email: creatingUser.email.trim(),
        password: creatingUser.password,
        phone: creatingUser.phone.trim(),
        gender: creatingUser.gender.trim(),
        role: creatingUser.role,
        status: creatingUser.status,
      };

      const ageNumber = Number(creatingUser.age);
      if (creatingUser.age.trim() && Number.isFinite(ageNumber)) {
        payload.age = ageNumber;
      }

      await fetchJson<{ id: string; role: string; status: string }>(`${API_BASE_URLS.user}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setCreatingUser(null);
      setActionMessage("User created successfully.");
      await loadUsers();
    } catch {
      setActionMessage("Unable to create user. Check required fields and backend validation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const submitEditUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingUser || !editForm || !token) {
      setActionMessage("Missing user or token to update.");
      return;
    }

    setActionLoadingId(editingUser.id);
    setActionMessage(null);

    try {
      const payload: Record<string, string | number> = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        gender: editForm.gender.trim(),
        role: editForm.role,
        status: editForm.status,
      };

      const ageNumber = Number(editForm.age);
      if (editForm.age.trim() && Number.isFinite(ageNumber)) {
        payload.age = ageNumber;
      }

      const updated = await fetchJson<ApiUser>(`${API_BASE_URLS.user}/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const mapped = mapApiUser(updated);
      setUsers((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setViewingUser((prev) => (prev && prev.id === mapped.id ? mapped : prev));
      setEditingUser(null);
      setEditForm(null);
      setActionMessage("User updated successfully.");
    } catch {
      setActionMessage("Unable to update user. Check backend validation rules.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const deleteUser = async (id: string) => {
    if (!token) {
      setActionMessage("Please login before deleting a user.");
      return;
    }

    const confirmed = window.confirm("Delete this user permanently?");
    if (!confirmed) {
      return;
    }

    setActionLoadingId(id);
    setActionMessage(null);

    try {
      await fetchJson<{ message: string; id: string }>(`${API_BASE_URLS.user}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => prev.filter((item) => item.id !== id));
      setSelected((prev) => prev.filter((item) => item !== id));
      setViewingUser((prev) => (prev?.id === id ? null : prev));
      setEditingUser((prev) => (prev?.id === id ? null : prev));
      setEditForm((prev) => (editingUser?.id === id ? null : prev));
      setActionMessage("User deleted successfully.");
    } catch {
      setActionMessage("Unable to delete user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUsers([]);
    setSelected([]);
    setViewingUser(null);
    setEditingUser(null);
    setEditForm(null);
    setError(null);
    setLoginError(null);
    setActionMessage("Da dang xuat thanh cong.");
    localStorage.removeItem("admin_user_token");
    navigate("/login", true);
  };

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <section className="login-card">
          <h1>Admin Portal Login</h1>
          <p>Dang nhap truoc de vao trang admin va su dung day du chuc nang.</p>
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
            />
            <button type="submit" className="primary-btn" disabled={loggingIn}>
              {loggingIn ? "Logging in..." : "Login"}
            </button>
          </form>
          {loginError ? <div className="inline-error">{loginError}</div> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" />
          <span>AdminPanel</span>
        </div>

        <nav className="sidebar-menu">
          <button type="button" className="menu-btn">Dashboard</button>
          <button
            type="button"
            className={`menu-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button type="button" className="menu-btn">Orders</button>
          <button
            type="button"
            className={`menu-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Products
          </button>
          <button type="button" className="menu-btn">Analytics</button>
          <button type="button" className="menu-btn">Settings</button>
        </nav>

        <button
          type="button"
          className="menu-btn logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <h1>{activeTab === "users" ? "Users" : "Products"}</h1>
          <div className="topbar-right">
            <div className="admin-profile">
              <span>{adminName}</span>
              <div className="avatar">{toInitials(adminName, "", adminName)}</div>
            </div>
            <button type="button" className="ghost-btn logout-top" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <section className="content-area">
          <div className="breadcrumb">Dashboard / <strong>{activeTab === "users" ? "Users" : "Products"}</strong></div>
          {error ? <div className="inline-error">{error}</div> : null}
          {productError && activeTab === "products" ? <div className="inline-error">{productError}</div> : null}
          {actionMessage ? <div className="inline-info">{actionMessage}</div> : null}

          {activeTab === "users" ? (
          <>
          <section className="panel heading-panel">
            <h2>Users</h2>
            <div className="search-holder">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </section>

          <section className="panel table-panel">
            <div className="table-toolbar">
              <div className="toolbar-left">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as Role | "All Roles")}>
                  {roleFilters.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as UserStatus | "All Statuses")}
                >
                  {statusFilters.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="toolbar-right">
                <button type="button" className="ghost-btn" disabled={selected.length === 0}>Bulk Actions</button>
                <button type="button" className="primary-btn" onClick={openCreateUser}>+ Add User</button>
              </div>
            </div>

            <div className="table-meta">
              <span>
                Showing {pagedUsers.length} of {filteredUsers.length} users
              </span>
              <div className="pager-mini">
                <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                  Prev
                </button>
                <button type="button" onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))} disabled={currentPage === pageCount}>
                  Next
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" checked={allInPageSelected} onChange={toggleCurrentPageSelection} />
                    </th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="empty-row">Loading users from API...</td>
                    </tr>
                  ) : null}

                  {!loading && pagedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-row">No users found for current filters.</td>
                    </tr>
                  ) : null}

                  {!loading
                    ? pagedUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selected.includes(user.id)}
                              onChange={() => toggleSingleSelection(user.id)}
                            />
                          </td>
                          <td>
                            <div className="name-cell">
                              <div className="avatar small">{user.initials}</div>
                              <span>{user.fullName}</span>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>
                            <span className={user.status === "Active" ? "status active" : "status inactive"}>{user.status}</span>
                          </td>
                          <td>{user.joined}</td>
                          <td>
                            <div className="actions">
                              <button type="button" onClick={() => openEditUser(user)} disabled={actionLoadingId === user.id}>Edit</button>
                              <button type="button" onClick={() => openViewUser(user.id)} disabled={actionLoadingId === user.id}>View</button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => deleteUser(user.id)}
                                disabled={actionLoadingId === user.id}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button type="button" onClick={() => setPage(1)} disabled={currentPage === 1}>First</button>
              <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                Prev
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={pageNumber === currentPage ? "active" : ""}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={currentPage === pageCount}
              >
                Next
              </button>
              <button type="button" onClick={() => setPage(pageCount)} disabled={currentPage === pageCount}>Last</button>
            </div>
          </section>
          </>
          ) : (
          <>
          <section className="panel heading-panel">
            <h2>Products</h2>
            <div className="search-holder">
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
              />
            </div>
          </section>

          <section className="panel table-panel">
            <div className="table-meta">
              <span>
                Showing {pagedProducts.length} of {filteredProducts.length} products
              </span>
              <div className="pager-mini">
                <button type="button" onClick={() => setProductPage((prev) => Math.max(1, prev - 1))} disabled={currentProductPage === 1}>
                  Prev
                </button>
                <button type="button" onClick={() => setProductPage((prev) => Math.min(productPageCount, prev + 1))} disabled={currentProductPage === productPageCount}>
                  Next
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {productLoading ? (
                    <tr>
                      <td colSpan={4} className="empty-row">Loading products from API...</td>
                    </tr>
                  ) : null}

                  {!productLoading && pagedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-row">No products found for current filters.</td>
                    </tr>
                  ) : null}

                  {!productLoading
                    ? pagedProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className="name-cell">
                              <div className="avatar small">PR</div>
                              <span>{product.name}</span>
                            </div>
                          </td>
                          <td>{product.category}</td>
                          <td>{formatVnd(product.price)}</td>
                          <td>{product.id}</td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button type="button" onClick={() => setProductPage(1)} disabled={currentProductPage === 1}>First</button>
              <button type="button" onClick={() => setProductPage((prev) => Math.max(1, prev - 1))} disabled={currentProductPage === 1}>
                Prev
              </button>
              {Array.from({ length: productPageCount }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={pageNumber === currentProductPage ? "active" : ""}
                  onClick={() => setProductPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setProductPage((prev) => Math.min(productPageCount, prev + 1))}
                disabled={currentProductPage === productPageCount}
              >
                Next
              </button>
              <button type="button" onClick={() => setProductPage(productPageCount)} disabled={currentProductPage === productPageCount}>Last</button>
            </div>
          </section>
          </>
          )}
        </section>
      </main>

      {viewingUser ? (
        <div className="modal-backdrop" onClick={() => setViewingUser(null)}>
          <article className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>User Details</h3>
            <div className="modal-grid">
              <p><strong>Name:</strong> {viewingUser.fullName}</p>
              <p><strong>Email:</strong> {viewingUser.email}</p>
              <p><strong>Role:</strong> {viewingUser.role}</p>
              <p><strong>Status:</strong> {viewingUser.status}</p>
              <p><strong>Age:</strong> {viewingUser.age ?? "-"}</p>
              <p><strong>Phone:</strong> {viewingUser.phone || "-"}</p>
              <p><strong>Gender:</strong> {viewingUser.gender || "-"}</p>
              <p><strong>Joined:</strong> {viewingUser.joined}</p>
              <p><strong>Updated:</strong> {viewingUser.updatedAt}</p>
              <p><strong>ID:</strong> {viewingUser.id}</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setViewingUser(null)}>Close</button>
            </div>
          </article>
        </div>
      ) : null}

      {editingUser && editForm ? (
        <div className="modal-backdrop" onClick={() => { setEditingUser(null); setEditForm(null); }}>
          <article className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>Edit User</h3>
            <form className="edit-form" onSubmit={submitEditUser}>
              <label>
                First Name
                <input
                  value={editForm.firstName}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, firstName: event.target.value } : prev))}
                />
              </label>
              <label>
                Last Name
                <input
                  value={editForm.lastName}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, lastName: event.target.value } : prev))}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
                />
              </label>
              <label>
                Age
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, age: event.target.value } : prev))}
                />
              </label>
              <label>
                Phone
                <input
                  value={editForm.phone}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, phone: event.target.value } : prev))}
                />
              </label>
              <label>
                Gender
                <input
                  value={editForm.gender}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, gender: event.target.value } : prev))}
                />
              </label>
              <label>
                Role
                <select
                  value={editForm.role}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, role: event.target.value as Role } : prev))}
                >
                  <option value="Admin">Admin</option>
                  <option value="Moderator">Moderator</option>
                  <option value="User">User</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={editForm.status}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, status: event.target.value as UserStatus } : prev))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setEditingUser(null);
                    setEditForm(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={actionLoadingId === editingUser.id}>
                  {actionLoadingId === editingUser.id ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      {creatingUser ? (
        <div className="modal-backdrop" onClick={() => setCreatingUser(null)}>
          <article className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>Add User</h3>
            <form className="edit-form" onSubmit={submitCreateUser}>
              <label>
                First Name
                <input
                  value={creatingUser.firstName}
                  onChange={(event) => setCreatingUser((prev) => (prev ? { ...prev, firstName: event.target.value } : prev))}
                />
              </label>
              <label>
                Last Name
                <input
                  value={creatingUser.lastName}
                  onChange={(event) => setCreatingUser((prev) => (prev ? { ...prev, lastName: event.target.value } : prev))}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={creatingUser.email}
                  onChange={(event) => setCreatingUser((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={creatingUser.password}
                  onChange={(event) => setCreatingUser((prev) => (prev ? { ...prev, password: event.target.value } : prev))}
                />
              </label>
              <label>
                Age
                <input
                  type="number"
                  value={creatingUser.age}
                  onChange={(event) => setCreatingUser((prev) => (prev ? { ...prev, age: event.target.value } : prev))}
                />
              </label>
              <label>
                Phone
                <input
                  value={creatingUser.phone}
                  onChange={(event) => setCreatingUser((prev) => (prev ? { ...prev, phone: event.target.value } : prev))}
                />
              </label>
              <label>
                Gender
                <input
                  value={creatingUser.gender}
                  onChange={(event) => setCreatingUser((prev) => (prev ? { ...prev, gender: event.target.value } : prev))}
                />
              </label>
              <label>
                Role
                <select
                  value={creatingUser.role}
                  onChange={(event) => setCreatingUser((prev) => (prev ? { ...prev, role: event.target.value as Role } : prev))}
                >
                  <option value="Admin">Admin</option>
                  <option value="Moderator">Moderator</option>
                  <option value="User">User</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={creatingUser.status}
                  onChange={(event) => setCreatingUser((prev) => (prev ? { ...prev, status: event.target.value as UserStatus } : prev))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setCreatingUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={actionLoadingId === "create"}>
                  {actionLoadingId === "create" ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </div>
  );
}

export default App;
