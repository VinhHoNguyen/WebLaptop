import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChatBubble from "../../component/ChatBubble";

describe("ChatBubble integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends message and renders assistant response with products", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "Goi y cho ban",
        products: [
          {
            id: 10,
            name: "Titan Pro",
            price: 1500000,
            category: "Gaming",
            stock: 5,
            specs: { brand: "Titan", cpu: "i5", ramGb: 16, storageGb: 512 },
          },
        ],
      }),
    } as Response);

    render(<ChatBubble />);

    // Open chat first
    fireEvent.click(screen.getByRole("button", { name: /💬|Chat/i }));

    fireEvent.change(screen.getByPlaceholderText("Nhập câu hỏi..."), {
      target: { value: "Laptop duoi 2 trieu" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const requestInit = fetchMock.mock.calls[0]?.[1];
    const requestBody = requestInit && typeof requestInit.body === "string" ? new URLSearchParams(requestInit.body) : null;
    expect(requestBody?.get("sessionId")).toEqual(expect.any(String));
    expect(requestBody?.get("message")).toBe("Laptop duoi 2 trieu");
    await screen.findByText("Goi y cho ban");
  });

  it("shows connection error when webhook fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

    render(<ChatBubble />);

    // Open chat first
    fireEvent.click(screen.getByRole("button", { name: /💬|Chat/i }));

    fireEvent.change(screen.getByPlaceholderText("Nhập câu hỏi..."), {
      target: { value: "Test loi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi" }));

    await screen.findByText(/Lỗi kết nối/i);
    const networkErrors = await screen.findAllByText(/Network down/i);
    expect(networkErrors.length).toBeGreaterThan(0);
  });
});
