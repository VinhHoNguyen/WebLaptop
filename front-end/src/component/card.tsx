import "../Style/home.css";
import { formatVnd } from "../utils/currency";

interface Props {
  name: string;
  price: number | string;
  imgsrc: string;
  category: string;
  stock?: number | null;
  onAddToCart?: () => void;
}

const Card = ({ name, price, imgsrc, category, stock, onAddToCart }: Props) => {
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Fallback image for invalid/broken URLs from API data.
    event.currentTarget.src = "/vite.svg";
    event.currentTarget.style.objectFit = "contain";
    event.currentTarget.style.backgroundColor = "#eef1f4";
  };

  const stockValue = Number.isFinite(Number(stock)) ? Number(stock) : null;
  const isOutOfStock = stockValue !== null && stockValue <= 0;
  const stockLabel = stockValue === null
    ? "Tồn kho: Đang cập nhật"
    : stockValue > 0
      ? `Tồn kho: ${stockValue}`
      : "Hết hàng";

  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onAddToCart?.();
  };

  return (
    <div className="item game-card">
      <img src={imgsrc} alt={name} onError={handleImageError} />
      <h4 className="game-card-title">{name}</h4>
      <p className="game-card-category">{category}</p>
      <p className={`game-card-stock${isOutOfStock ? " is-out" : ""}`}>{stockLabel}</p>
      <div className="game-card-price">{formatVnd(price)}</div>
      <button
        type="button"
        className={`card-add${isOutOfStock ? " is-disabled" : ""}`}
        onClick={handleAddClick}
        disabled={isOutOfStock}
      >
        {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
      </button>
    </div>
  );
};

export default Card;
