import './ProductCard.css';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  colors?: string[];
}

const ProductCard = ({ name, price, originalPrice, image, badge, colors }: ProductCardProps) => {
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;
  
  return (
    <div className="product-card">
      <div className="product-image-container">
        {badge && <div className="product-badge">{badge}</div>}
        {discount > 0 && <div className="product-discount">-{discount}%</div>}
        <img src={image} alt={name} className="product-image" />
        <div className="product-overlay">
          <button className="add-to-cart-btn">THÊM VÀO GIỎ</button>
        </div>
      </div>
      
      <div className="product-info">
        {colors && (
          <div className="product-colors">
            {colors.map((color, idx) => (
              <span key={idx} className="color-swatch" style={{ backgroundColor: color }}></span>
            ))}
          </div>
        )}
        <h3 className="product-name">{name}</h3>
        <div className="product-prices">
          <span className="current-price">{price.toLocaleString('vi-VN')}đ</span>
          {originalPrice && <span className="original-price">{originalPrice.toLocaleString('vi-VN')}đ</span>}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
