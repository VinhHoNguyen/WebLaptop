export type KeyStatus = 'available' | 'used' | 'revoked';

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
  platform: string;
  status: string;
  price: number;
  salePrice?: number;
  image: string;
  trailerUrl?: string;
  screenshots: string[];
  minSpec?: string;
  recSpec?: string;
  keys: GameKey[];
  soldCount: number;
};

export type AdminOrderItem = {
  productName: string;
  price: number;
  count?: number;
  keySent?: string;
};

export type AdminOrder = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  total: number;
  status: string;
  items: AdminOrderItem[];
  purchasedAt: string;
  buyerIp?: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  purchasedGames: number;
  topupCount: number;
  role: "Owner" | "Manager" | "Support";
  permissions: {
    canViewOrders: boolean;
    canRefund: boolean;
    canEditPrice: boolean;
    canManageUsers: boolean;
  };
};

export type AdminTab = 'dashboard' | 'products' | 'orders' | 'users';
