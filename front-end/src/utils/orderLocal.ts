// Stores only lightweight simulation state in localStorage.
// Full order data lives in the database.

type SimMap    = Record<string, number>;   // orderId → created_at timestamp
type CancelMap = Record<string, boolean>;  // orderId → cancelled

function getUserSuffix(): string {
  return sessionStorage.getItem("id_user") || "guest";
}

function getSimKey(): string {
  return `order_sim_${getUserSuffix()}`;
}

function getCancelKey(): string {
  return `order_cancel_${getUserSuffix()}`;
}

function readMap<T>(key: string): Record<string, T> {
  const raw = localStorage.getItem(key);
  try {
    return raw ? (JSON.parse(raw) as Record<string, T>) : {};
  } catch {
    return {};
  }
}

/** Call when an order is successfully placed — records the start timestamp. */
export function recordOrderSim(orderId: string): void {
  const map = readMap<number>(getSimKey());
  map[orderId] = Date.now();
  localStorage.setItem(getSimKey(), JSON.stringify(map));
}

/** Mark an order as cancelled locally (for instant UI feedback). */
export function markOrderCancelled(orderId: string): void {
  const map = readMap<boolean>(getCancelKey());
  map[orderId] = true;
  localStorage.setItem(getCancelKey(), JSON.stringify(map));
}

/** Calculate the simulated status for an order, 6 s per step from placed time. */
export function getSimStatus(orderId: string): { status: 1 | 2 | 3 | 4; cancelled: boolean } {
  const cancelMap = readMap<boolean>(getCancelKey());
  if (cancelMap[orderId]) return { status: 1, cancelled: true };

  const simMap = readMap<number>(getSimKey());
  const createdAt = simMap[orderId];
  if (!createdAt) return { status: 1, cancelled: false };

  const elapsed = (Date.now() - createdAt) / 1000;
  const status: 1 | 2 | 3 | 4 =
    elapsed < 6 ? 1 : elapsed < 12 ? 2 : elapsed < 18 ? 3 : 4;
  return { status, cancelled: false };
}

export const STATUS_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "Chờ người bán xác nhận",
  2: "Chờ đơn vị vận chuyển",
  3: "Đang giao",
  4: "Đã giao xong",
};
