const resolveBaseUrl = (value: string | undefined, fallback: string) => {
  return (value?.trim() || fallback).replace(/\/+$/, "");
};

export const API_BASE_URLS = {
  user: resolveBaseUrl(import.meta.env.VITE_USER_API_URL, "http://localhost:3001"),
  product: resolveBaseUrl(import.meta.env.VITE_PRODUCT_API_URL, "http://localhost:3002"),
  cart: resolveBaseUrl(import.meta.env.VITE_CART_API_URL, "http://localhost:3003"),
  payment: resolveBaseUrl(import.meta.env.VITE_PAYMENT_API_URL, "http://localhost:3004"),
  socket: resolveBaseUrl(import.meta.env.VITE_SOCKET_URL, "http://localhost:3004"),
};