import CartAPI, { CartItemPayload } from "../api/CartAPI";

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
  const userId = sessionStorage.getItem("id_user");
  return userId ? `carts_${userId}` : "carts_guest";
};

const normalizeServerItems = (response: any) => {
  if (Array.isArray(response?.items)) {
    return response.items;
  }
  if (Array.isArray(response?.Products)) {
    return response.Products;
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
  return raw ? (JSON.parse(raw) as LocalCartItem[]) : [];
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
      return [] as LocalCartItem[];
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
    const dataAdd = data;
    const token = localStorage.getItem("token");

    if (token) {
      try {
        await CartAPI.Add_To_Cart({
          id_product: dataAdd.id_product,
          name_product: dataAdd.name_product,
          price_product: dataAdd.price_product,
          count: dataAdd.count,
          image: dataAdd.image,
          size: dataAdd.size,
        });
        const serverCart = await CartsLocal.fetchFromServer();
        return serverCart;
      } catch (error) {
        console.error("Error adding to cart:", error);
      }
    }

    const cartKey = getCartKey();
    const current = readCartFromStorage();

    if (current.length < 1) {
      current.push({ ...dataAdd, id_cart: Date.now().toString() });
      localStorage.setItem(cartKey, JSON.stringify(current));
    } else {
      let flag = false;

      for (let i = 0; i < current.length; i += 1) {
        if (current[i].id_product === dataAdd.id_product && current[i].size === dataAdd.size) {
          current[i].count = Number(current[i].count) + Number(dataAdd.count);
          flag = true;
          break;
        }
      }

      if (!flag) {
        current.push({ ...dataAdd, id_cart: Date.now().toString() });
      }

      localStorage.setItem(cartKey, JSON.stringify(current));
    }
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
    const cartKey = getCartKey();
    const current = readCartFromStorage();
    const index = current.findIndex((value) => value.id_cart === data.id_cart);

    if (index > -1) {
      current[index].count = data.count;
      localStorage.setItem(cartKey, JSON.stringify(current));
    }

    try {
      await CartAPI.Update_Cart_Item();
    } catch (error) {
      console.error("Error updating cart:", error);
    }
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
