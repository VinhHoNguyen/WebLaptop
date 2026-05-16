export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  category?: string;
  stock?: number | null;
  specs?: {
    brand?: string;
    cpu?: string;
    ramGb?: number;
    storageGb?: number;
  };
}

export interface ChatResponse {
  answer?: string;
  text?: string;
  message?: string;
  products?: Product[];
  data?: unknown;
}

export const createMessage = (role: ChatRole, content: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
});

export const parseProductsFromResponse = (data: ChatResponse): Product[] => {
  if (Array.isArray(data.products)) {
    return data.products;
  }

  const candidateText = [data.answer, data.text, data.message].filter(Boolean).join("\n");
  if (!candidateText) {
    return [];
  }

  try {
    const parsed = JSON.parse(candidateText);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is Product => Boolean(item?.name && item?.price));
    }

    if (parsed && typeof parsed === "object" && Array.isArray((parsed as ChatResponse).products)) {
      return (parsed as ChatResponse).products || [];
    }
  } catch (_error) {
    return [];
  }

  return [];
};

export const formatProductSpecs = (product: Product) => {
  const specs = product.specs;
  if (!specs) {
    return [];
  }

  return [
    specs.brand ? `Hãng: ${specs.brand}` : null,
    specs.cpu ? `CPU: ${specs.cpu}` : null,
    typeof specs.ramGb === "number" ? `RAM: ${specs.ramGb}GB` : null,
    typeof specs.storageGb === "number" ? `SSD: ${specs.storageGb}GB` : null,
  ].filter(Boolean) as string[];
};
