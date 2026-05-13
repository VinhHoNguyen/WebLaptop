const resolveBaseUrl = (value: string | undefined, fallback: string) => {
  return (value?.trim() || fallback).replace(/\/+$/, "");
};

export const API_BASE_URLS = {
  user: resolveBaseUrl(import.meta.env.VITE_USER_API_URL, "http://localhost:3001"),
  product: resolveBaseUrl(import.meta.env.VITE_PRODUCT_API_URL, "http://localhost:3002"),
  checkout: resolveBaseUrl(import.meta.env.VITE_CHECKOUT_API_URL, "http://localhost:3004"),
};

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}