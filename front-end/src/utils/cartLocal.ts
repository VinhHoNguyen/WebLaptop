import CartAPI, { CartItemPayload } from "../api/CartAPI";
import { ensureUserSession } from "./auth";

export type LocalCartItem = {
  id_cart: string;
  id_product: string;
  name_product: string;
  price_product: number;
  count: number;
  image?: string;
  size?: string;
};

export const getCartKey = () => {
  ensureUserSession();
  const userId = sessionStorage.getItem("id_user");
  return userId ? `carts_${userId}` : "carts_guest";
};

const normalizeServerItems = (response: any) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.products)) {
    return payload.products;
  }
  if (Array.isArray(payload?.Products)) {
    return payload.Products;
  }
  return [] as any[];
};

const convertServerToLocal = (serverItems: any[]): LocalCartItem[] => {
  return serverItems.map((item) => {
    const productId = item?.id_product?._id || item?.id_product || item?._id || item?.ProductId || "";
    return {
      id_cart: item?.id_cart || item?._id || productId || `${Date.now()}`,
      id_product: productId,
      name_product: item?.name_product || item?.name || item?.title || "",
      price_product: Number(item?.price_product ?? item?.price ?? 0),
      count: Number(item?.count ?? item?.quantity ?? 1),
      image: item?.image || item?.img1 || item?.thumbnail,
      size: item?.size || "default",
    };
  });
};

const convertLocalToServer = (localItems: LocalCartItem[]): CartItemPayload[] => {
  return localItems.map((item) => ({
    id_product: item.id_product,
    name_product: item.name_product,
    price_product: item.price_product,
    count: item.count,
    image: item.image,
    size: item.size,
  }));
};

const saveCartToStorage = (items: LocalCartItem[]) => {
  const cartKey = getCartKey();
  localStorage.setItem(cartKey, JSON.stringify(items));
};

const readCartFromStorage = (): LocalCartItem[] => {
  const cartKey = getCartKey();
  const raw = localStorage.getItem(cartKey);
  if (raw) {
    return JSON.parse(raw) as LocalCartItem[];
  }

  if (cartKey !== "carts_guest") {
    const guestRaw = localStorage.getItem("carts_guest");
    return guestRaw ? (JSON.parse(guestRaw) as LocalCartItem[]) : [];
  }

  return [];
};

const CartsLocal = {
  syncWithServer: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return readCartFromStorage();
      }

      const guestCartKey = "carts_guest";
      const guestRaw = localStorage.getItem(guestCartKey);
      const guestCart = guestRaw ? (JSON.parse(guestRaw) as LocalCartItem[]) : [];

      if (guestCart.length > 0) {
        const serverItems = convertLocalToServer(guestCart);
        await CartAPI.Sync_Cart({ items: serverItems });
        localStorage.removeItem(guestCartKey);
      }

      const response = await CartAPI.Get_Cart();
      const serverItems = normalizeServerItems(response);
      const localCart = convertServerToLocal(serverItems);
      saveCartToStorage(localCart);

      return localCart;
    } catch (error) {
      console.error("Error syncing cart:", error);
      return readCartFromStorage();
    }
  },

  fetchFromServer: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return readCartFromStorage();
      }

      const response = await CartAPI.Get_Cart();
      const serverItems = normalizeServerItems(response);
      const localCart = convertServerToLocal(serverItems);
      saveCartToStorage(localCart);
      return localCart;
    } catch (error) {
      console.error("Error fetching cart:", error);
      return [] as LocalCartItem[];
    }
  },

  addProduct: async (data: LocalCartItem) => {
    const token = localStorage.getItem("token");
    if (!token) {
      const err = new Error("AUTH_REQUIRED") as Error & { code?: string };
      err.code = "AUTH_REQUIRED";
      throw err;
    }

    try {
      await CartAPI.Add_To_Cart({
        id_product: data.id_product,
        name_product: data.name_product,
        price_product: data.price_product,
        count: data.count,
        image: data.image,
        size: data.size,
      });
      return await CartsLocal.fetchFromServer();
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        const err = new Error("AUTH_REQUIRED") as Error & { code?: string };
        err.code = "AUTH_REQUIRED";
        throw err;
      }
      throw error;
    }
  },

  incrementProduct: async (productId: string) => {
    if (!localStorage.getItem("token")) {
      const err = new Error("AUTH_REQUIRED") as Error & { code?: string };
      err.code = "AUTH_REQUIRED";
      throw err;
    }
    await CartAPI.Add_To_Cart({ id_product: productId, count: 1 });
    return CartsLocal.fetchFromServer();
  },

  decrementProduct: async (productId: string) => {
    if (!localStorage.getItem("token")) {
      const err = new Error("AUTH_REQUIRED") as Error & { code?: string };
      err.code = "AUTH_REQUIRED";
      throw err;
    }
    await CartAPI.Decrement_Cart_Item(productId);
    return CartsLocal.fetchFromServer();
  },

  removeProduct: async (productId: string) => {
    if (!localStorage.getItem("token")) {
      const err = new Error("AUTH_REQUIRED") as Error & { code?: string };
      err.code = "AUTH_REQUIRED";
      throw err;
    }
    await CartAPI.Remove_From_Cart(productId);
    return CartsLocal.fetchFromServer();
  },

  deleteProduct: async (id_cart: string) => {
    const cartKey = getCartKey();
    const current = readCartFromStorage();
    const indexDelete = current.findIndex((value) => value.id_cart === id_cart);
    const removedItem = indexDelete > -1 ? current[indexDelete] : null;

    if (indexDelete > -1) {
      current.splice(indexDelete, 1);
      localStorage.setItem(cartKey, JSON.stringify(current));
    }

    try {
      const token = localStorage.getItem("token");
      if (token && removedItem?.id_product) {
        await CartAPI.Remove_From_Cart(removedItem.id_product);
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  },

  updateProduct: async (data: LocalCartItem) => {
    if (!localStorage.getItem("token")) {
      const err = new Error("AUTH_REQUIRED") as Error & { code?: string };
      err.code = "AUTH_REQUIRED";
      throw err;
    }
    await CartAPI.Update_Cart_Item(data.id_product, data.count);
    return CartsLocal.fetchFromServer();
  },

  clearCart: async () => {
    const cartKey = getCartKey();
    localStorage.setItem(cartKey, JSON.stringify([]));

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await CartAPI.Clear_Cart();
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  },
};

export default CartsLocal;
