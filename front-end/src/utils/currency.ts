const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const toNumber = (value: number | string | undefined | null): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

export const formatVnd = (value: number | string | undefined | null) => {
  const numeric = toNumber(value);
  if (numeric === null) {
    return "0 đ";
  }

  return currencyFormatter.format(numeric);
};
