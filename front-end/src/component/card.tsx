import "../Style/home.css";

interface Props {
  name: string;
  price: number | string;
  imgsrc: string;
  category: string;
}

const Card = ({ name, price, imgsrc, category }: Props) => {
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Fallback image for invalid/broken URLs from API data.
    event.currentTarget.src = "/vite.svg";
    event.currentTarget.style.objectFit = "contain";
    event.currentTarget.style.backgroundColor = "#1f2122";
  };

  return (
    <div className="item game-card">
      <img src={imgsrc} alt={name} onError={handleImageError} />
      <h4 className="game-card-title">{name}</h4>
      <p className="game-card-category">{category}</p>
      <div className="game-card-price">${price}</div>
    </div>
  );
};

export default Card;
