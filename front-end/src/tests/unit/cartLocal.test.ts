import { beforeEach, describe, expect, it, vi } from "vitest";
import CartsLocal from "../../utils/cartLocal";
import CartAPI from "../../api/CartAPI";

vi.mock("../../api/CartAPI", () => ({
  default: {
    Get_Cart: vi.fn(),
    Add_To_Cart: vi.fn(),
    Sync_Cart: vi.fn(),
    Remove_From_Cart: vi.fn(),
    Clear_Cart: vi.fn(),
    Update_Cart_Item: vi.fn(),
  },
}));

describe("CartsLocal", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("adds item to guest cart", async () => {
    await CartsLocal.addProduct({
      id_cart: "",
      id_product: "p1",
      name_product: "Laptop A",
      price_product: 1000,
      count: 1,
      size: "default",
    });

    const raw = localStorage.getItem("carts_guest");
    expect(raw).toBeTruthy();
    const items = JSON.parse(raw || "[]");
    expect(items).toHaveLength(1);
    expect(items[0].id_product).toBe("p1");
  });

  it("merges same product and size", async () => {
    await CartsLocal.addProduct({
      id_cart: "",
      id_product: "p1",
      name_product: "Laptop A",
      price_product: 1000,
      count: 1,
      size: "default",
    });
    await CartsLocal.addProduct({
      id_cart: "",
      id_product: "p1",
      name_product: "Laptop A",
      price_product: 1000,
      count: 2,
      size: "default",
    });

    const items = JSON.parse(localStorage.getItem("carts_guest") || "[]");
    expect(items).toHaveLength(1);
    expect(items[0].count).toBe(3);
  });

  it("syncs guest cart to server and stores server data", async () => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem(
      "carts_guest",
      JSON.stringify([
        {
          id_cart: "g1",
          id_product: "p-sync",
          name_product: "Sync Item",
          price_product: 99,
          count: 1,
          size: "default",
        },
      ])
    );

    vi.mocked(CartAPI.Get_Cart).mockResolvedValue({
      data: {
        items: [
          {
            id_cart: "s1",
            id_product: "server-p1",
            name_product: "Server Laptop",
            price_product: 999,
            count: 1,
            size: "default",
          },
        ],
      },
    } as never);

    const result = await CartsLocal.syncWithServer();

    expect(CartAPI.Sync_Cart).toHaveBeenCalledTimes(1);
    expect(CartAPI.Get_Cart).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].id_product).toBe("server-p1");
    const storedGuest = JSON.parse(localStorage.getItem("carts_guest") || "[]");
    expect(storedGuest).toHaveLength(1);
    expect(storedGuest[0].id_product).toBe("server-p1");
  });
});
