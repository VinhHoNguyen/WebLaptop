import type { AdminOrder, AdminUser, SupportTicket } from "./types";

export const seedOrders: AdminOrder[] = [
  {
    orderId: "ORD-240401-001",
    customerName: "Nguyen Van A",
    customerEmail: "a@example.com",
    total: 499000,
    paymentMethod: "Momo",
    status: "Success",
    purchasedAt: "2026-04-08T08:31:00.000Z",
    buyerIp: "14.226.18.22",
    items: [
      {
        productName: "Apex Legends Pack",
        price: 499000,
        keySent: "APX-4K2M-8Q1Z",
      },
    ],
  },
  {
    orderId: "ORD-240402-014",
    customerName: "Tran Thi B",
    customerEmail: "b@example.com",
    total: 899000,
    paymentMethod: "Wallet",
    status: "Pending",
    purchasedAt: "2026-04-09T03:12:00.000Z",
    buyerIp: "27.74.199.19",
    items: [
      {
        productName: "Forza Horizon Ultimate",
        price: 899000,
        keySent: "FHU-1C9T-7K8W",
      },
    ],
  },
  {
    orderId: "ORD-240402-023",
    customerName: "Le Van C",
    customerEmail: "c@example.com",
    total: 1299000,
    paymentMethod: "Banking",
    status: "Success",
    purchasedAt: "2026-04-09T06:45:00.000Z",
    buyerIp: "113.181.4.90",
    items: [
      {
        productName: "Cyber Runner 2077",
        price: 1299000,
        keySent: "CYB-9L3P-2J6H",
      },
    ],
  },
];

export const seedTickets: SupportTicket[] = [
  {
    id: "TKT-1001",
    subject: "Missing game key after payment",
    createdAt: "2026-04-09T04:02:00.000Z",
  },
  {
    id: "TKT-1002",
    subject: "Request refund for duplicate purchase",
    createdAt: "2026-04-08T16:17:00.000Z",
  },
  {
    id: "TKT-1003",
    subject: "Cannot activate key on Steam",
    createdAt: "2026-04-08T09:12:00.000Z",
  },
];

export const seedUsers: AdminUser[] = [
  {
    id: "u-owner-01",
    name: "Owner Account",
    email: "owner@webgame.local",
    phone: "0900000001",
    walletBalance: 5000000,
    purchasedGames: 0,
    topupCount: 0,
    role: "Owner",
    permissions: {
      canViewOrders: true,
      canRefund: true,
      canEditPrice: true,
      canManageUsers: true,
    },
  },
  {
    id: "u-manager-02",
    name: "Manager Account",
    email: "manager@webgame.local",
    phone: "0900000002",
    walletBalance: 2000000,
    purchasedGames: 3,
    topupCount: 2,
    role: "Manager",
    permissions: {
      canViewOrders: true,
      canRefund: true,
      canEditPrice: true,
      canManageUsers: false,
    },
  },
  {
    id: "u-support-03",
    name: "Support Account",
    email: "support@webgame.local",
    phone: "0900000003",
    walletBalance: 850000,
    purchasedGames: 5,
    topupCount: 4,
    role: "Support",
    permissions: {
      canViewOrders: true,
      canRefund: false,
      canEditPrice: false,
      canManageUsers: false,
    },
  },
];
