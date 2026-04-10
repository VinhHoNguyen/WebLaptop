export type AdminTab = "dashboard" | "products" | "orders" | "users";

export type ProductPlatform = "PC" | "PS5" | "Xbox";

export type ProductStatus = "In Stock" | "Out of Stock";

export type KeyStatus = "available" | "sold" | "revoked";

export type OrderStatus = "Pending" | "Success" | "Failed" | "Refunded";

export type UserRole = "Owner" | "Manager" | "Support";

export type GameKey = {
  code: string;
  status: KeyStatus;
};

export type AdminProduct = {
  id: string;
  backendId?: string;
  name: string;
  description: string;
  category: string;
  platform: ProductPlatform;
  status: ProductStatus;
  price: number;
  salePrice?: number;
  image: string;
  trailerUrl?: string;
  screenshots: string[];
  minSpec: string;
  recSpec: string;
  keys: GameKey[];
  soldCount: number;
};

export type AdminOrderItem = {
  productName: string;
  price: number;
  keySent: string;
};

export type AdminOrder = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentMethod: "Wallet" | "Banking" | "Momo";
  status: OrderStatus;
  purchasedAt: string;
  buyerIp: string;
  items: AdminOrderItem[];
};

export type SupportTicket = {
  id: string;
  subject: string;
  createdAt: string;
};

export type UserPermissions = {
  canViewOrders: boolean;
  canRefund: boolean;
  canEditPrice: boolean;
  canManageUsers: boolean;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  purchasedGames: number;
  topupCount: number;
  role: UserRole;
  permissions: UserPermissions;
};
