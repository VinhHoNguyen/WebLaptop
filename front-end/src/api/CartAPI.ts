import axios from "axios";
import { API_BASE_URLS } from "../config/api";

const cartClient = axios.create({
  baseURL: API_BASE_URLS.cart,
  headers: {
    "content-type": "application/json",
  },
});

cartClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

cartClient.interceptors.response.use(
  (response) => {
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },
  (error) => {
    throw error;
  }
);

export type CartItemPayload = {
  id_product: string;
  name_product?: string;
  price_product?: number;
  count?: number;
  image?: string;
  size?: string;
};

const CartAPI = {
  Get_Cart: () => {
    const url = "/cart";
    return cartClient.get(url);
  },

  Get_Cart_Count: async () => {
    const data = await cartClient.get("/cart");
    const products = Array.isArray(data?.Products) ? data.Products : [];
    return products.length;
  },

  Add_To_Cart: (data: CartItemPayload) => {
    const productId = data.id_product;
    const url = `/cart/${productId}`;
    const count = Number(data.count);
    const payload = Number.isFinite(count) && count > 0 ? { count } : undefined;
    return cartClient.post(url, payload);
  },

  Sync_Cart: async (data: { items: CartItemPayload[] }) => {
    const items = data.items || [];
    const results = [] as unknown[];
    for (const item of items) {
      if (item.id_product) {
        const result = await CartAPI.Add_To_Cart(item);
        results.push(result);
      }
    }
    return results;
  },

  Update_Cart_Item: (productId: string, count: number) => {
    const url = `/cart/${productId}`;
    return cartClient.put(url, { count });
  },

  Remove_From_Cart: (productId: string) => {
    const url = `/cart/${productId}`;
    return cartClient.delete(url);
  },

  Clear_Cart: () => {
    const url = "/cart/checkout";
    return cartClient.delete(url);
  },
};

export default CartAPI;
