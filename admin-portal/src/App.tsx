import { useEffect, useMemo, useState } from "react";

type AdminPage = "dashboard" | "products";

type ProductStatus = "Active" | "Low Stock" | "Inactive";

type ProductRow = {
  id: string;
  image: string;
  name: string;
  category: string;
  stock: number;
  status: ProductStatus;
  price: number;
};

type OrderRow = {
  id: string;
  customer: string;
  status: "Completed" | "Pending" | "Shipped" | "Cancelled" | "Processing";
  amount: number;
};

const kpiCards = [
  { title: "Total Users", value: "12,450", delta: "5.2% This Month", tone: "blue" },
  { title: "New Orders", value: "1,234", delta: "3.8% This Week", tone: "green" },
  { title: "Earnings", value: "$8,750", delta: "12.5% This Month", tone: "orange" },
  { title: "Support Tickets", value: "68", delta: "Pending", tone: "red" },
] as const;

const orders: OrderRow[] = [
  { id: "#10245", customer: "John Doe", status: "Completed", amount: 150 },
  { id: "#10244", customer: "Anna Smith", status: "Pending", amount: 89 },
  { id: "#10243", customer: "Michael Brown", status: "Shipped", amount: 210 },
  { id: "#10242", customer: "Linda Nguyen", status: "Cancelled", amount: 45 },
  { id: "#10241", customer: "David Wilson", status: "Processing", amount: 120 },
];

const topProducts = [
  ["Smartphone", "1,230 Sales"],
  ["Laptop", "980 Sales"],
  ["Headphones", "835 Sales"],
  ["Smart Watch", "652 Sales"],
] as const;

const activities = [
  ["David added a new product", "10 mins ago"],
  ["Anna updated an order", "30 mins ago"],
  ["John replied to a support ticket", "1 hour ago"],
  ["Michael registered a new user", "2 hours ago"],
] as const;

const messages = [
  ["Alice", "Need help with my order."],
  ["Steve", "How to reset my password?"],
  ["Karen", "Please check the inventory."],
] as const;

function App() {
  const [page, setPage] = useState<AdminPage>("dashboard");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:3002/products", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      const normalized = data.map((item: any): ProductRow => {
        const stock = item.stock ?? 50;
        const status: ProductStatus = stock === 0 ? "Inactive" : stock < 10 ? "Low Stock" : "Active";
        const imageAbbr = (item.name || "")
          .split(" ")
          .slice(0, 2)
          .map((w: string) => w[0].toUpperCase())
          .join("");

        return {
          id: item._id || `p-${Date.now()}`,
          image: imageAbbr || "P",
          name: item.name || "Unknown",
          category: item.category || "Laptop",
          stock: stock,
          status: status,
          price: item.price || 0,
        };
      });

      setProducts(normalized);
      setTotalProducts(normalized.length);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const pageTitle = useMemo(() => {
    return page === "dashboard" ? "Welcome back, Admin!" : "Products";
  }, [page]);

  return (
    <div className="admin-root">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo" />
          <span>AdminPanel</span>
        </div>

        <nav className="menu">
          <button className={page === "dashboard" ? "menu-item active" : "menu-item"} onClick={() => setPage("dashboard")}>
            Dashboard
          </button>
          <button className={page === "products" ? "menu-item active" : "menu-item"} onClick={() => setPage("products")}>
            Products
          </button>
          <button className="menu-item" disabled>
            Users
          </button>
          <button className="menu-item" disabled>
            Orders
          </button>
          <button className="menu-item" disabled>
            Settings
          </button>
        </nav>

        <button className="logout">Logout</button>
      </aside>

      <main className="content">
        <header className="topbar">
          <h1>{pageTitle}</h1>
          <div className="topbar-user">
            <div className="alert-dot" />
            <span>Admin</span>
            <div className="avatar">A</div>
          </div>
        </header>

        {page === "dashboard" ? <DashboardView /> : <ProductsView rows={products} total={totalProducts} />}
      </main>
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
            <h3>Sales Overview</h3>
            <div className="tabs">
              <button className="tab active">Monthly</button>
              <button className="tab">Weekly</button>
              <button className="tab">Daily</button>
            </div>
          </div>
          <svg viewBox="0 0 600 220" className="chart" role="img" aria-label="Sales chart">
            <polyline points="20,170 100,120 180,95 260,130 340,140 420,115 500,58 580,42" className="line blue" />
            <polyline points="20,185 100,150 180,125 260,155 340,165 420,145 500,110 580,85" className="line green" />
          </svg>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Recent Orders</h3>
          </div>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>
                    <span className={`pill ${order.status.toLowerCase()}`}>{order.status}</span>
                  </td>
                  <td>${order.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>

      <div className="grid-three">
        <article className="panel">
          <div className="panel-header">
            <h3>Top Products</h3>
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
            <h3>Latest Activity</h3>
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
            <h3>Messages</h3>
          </div>
          <ul className="message-list">
            {messages.map((message) => (
              <li key={message[0]}>
                <b>{message[0]}:</b> {message[1]}
              </li>
            ))}
          </ul>
          <button className="btn-view">View All</button>
        </article>
      </div>
    </section>
  );
}

function ProductsView({ rows, total }: { rows: ProductRow[]; total: number }) {
  return (
    <section className="products-page">
      <div className="panel search-wrap">
        <h2>Products</h2>
        <input placeholder="Search product..." />
      </div>

      <div className="panel toolbar">
        <div className="toolbar-left">
          <input placeholder="Search product..." />
          <select defaultValue="All Categories">
            <option>All Categories</option>
          </select>
          <select defaultValue="All Statuses">
            <option>All Statuses</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-secondary">+ Add Product</button>
          <button className="btn-primary">+ Add Product</button>
        </div>
      </div>

      <article className="panel products-table-wrap">
        <div className="table-title">Showing {rows.length} of {total} Products</div>
        <table className="products-table">
          <thead>
            <tr>
              <th></th>
              <th>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input type="checkbox" aria-label={`Select ${row.name}`} />
                </td>
                <td>
                  <div className="thumb">{row.image}</div>
                </td>
                <td>{row.name}</td>
                <td>{row.category}</td>
                <td>{row.stock}</td>
                <td>
                  <span className={`pill ${row.status.toLowerCase().replace(" ", "-")}`}>{row.status}</span>
                </td>
                <td>${row.price.toFixed(2)}</td>
                <td>
                  <div className="actions">Edit | Del | More</div>
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

export default App;
