import type { AdminOrder, SupportTicket, AdminUser } from './types';

export const seedOrders: AdminOrder[] = [
  {
    orderId: 'ORD-1001',
    customerName: 'Nguyen Van A',
    customerEmail: 'nguyenvana@example.com',
    paymentMethod: 'MoMo',
    total: 259000,
    status: 'Success',
    items: [
      { productName: 'Apex Legends', price: 129500, keySent: 'APEX-KEY-001' },
      { productName: 'Overwatch 2', price: 129500, keySent: 'OW2-KEY-001' },
    ],
    purchasedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    buyerIp: '192.168.1.1',
  },
  {
    orderId: 'ORD-1002',
    customerName: 'Tran Thi B',
    customerEmail: 'tranthib@example.com',
    paymentMethod: 'Credit Card',
    total: 199000,
    status: 'Success',
    items: [
      { productName: 'Counter-Strike 2', price: 199000, keySent: 'CS2-KEY-001' },
    ],
    purchasedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    buyerIp: '192.168.1.2',
  },
];

export const seedTickets: SupportTicket[] = [
  {
    id: 'TICK-1',
    subject: 'Cannot redeem key',
    createdAt: new Date().toISOString(),
  },
];

export const seedUsers: AdminUser[] = [
  {
    id: 'U-1',
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '0123456789',
    walletBalance: 500000,
    purchasedGames: 5,
    topupCount: 3,
    role: 'Owner',
    permissions: {
      canViewOrders: true,
      canRefund: true,
      canEditPrice: true,
      canManageUsers: true,
    },
  },
  {
    id: 'U-2',
    name: 'Manager User',
    email: 'manager@example.com',
    phone: '0987654321',
    walletBalance: 200000,
    purchasedGames: 3,
    topupCount: 2,
    role: 'Manager',
    permissions: {
      canViewOrders: true,
      canRefund: true,
      canEditPrice: true,
      canManageUsers: false,
    },
  },
  {
    id: 'U-3',
    name: 'Support Staff',
    email: 'support@example.com',
    phone: '0555555555',
    walletBalance: 0,
    purchasedGames: 0,
    topupCount: 0,
    role: 'Support',
    permissions: {
      canViewOrders: true,
      canRefund: false,
      canEditPrice: false,
      canManageUsers: false,
    },
  },
];
