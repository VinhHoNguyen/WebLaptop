import { parseProductsFromResponse, formatProductSpecs } from "../utils/chatHelpers";
import { describe, test, expect } from "vitest";

describe("chatHelpers", () => {
  test("parseProductsFromResponse returns products when response.products present", () => {
    const data = { products: [{ name: "A", price: 1000 }] };
    const products = parseProductsFromResponse(data as any);
    expect(products.length).toBe(1);
    expect(products[0].name).toBe("A");
  });

  test("parseProductsFromResponse parses JSON string in text", () => {
    const payload = JSON.stringify([{ name: "B", price: 2000 }]);
    const data = { text: payload };
    const products = parseProductsFromResponse(data as any);
    expect(products.length).toBe(1);
    expect(products[0].price).toBe(2000);
  });

  test("formatProductSpecs returns formatted specs array", () => {
    const product = {
      name: "C",
      price: 1,
      specs: { brand: "X", cpu: "i7", ramGb: 16, storageGb: 512 },
    } as any;
    const specs = formatProductSpecs(product);
    expect(specs).toContain("Hãng: X");
    expect(specs).toContain("CPU: i7");
    expect(specs).toContain("RAM: 16GB");
    expect(specs).toContain("SSD: 512GB");
  });
});
