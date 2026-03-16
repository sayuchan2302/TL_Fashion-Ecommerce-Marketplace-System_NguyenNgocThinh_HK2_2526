import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ChevronRight } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import './Wishlist.css';

const Wishlist = () => {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const formatPrice = (price: number) =>
    price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      color: 'Mặc định',
      size: 'M',
    });
    removeFromWishlist(item.id);
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        {/* Breadcrumb */}
        <div className="wishlist-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <span>Yêu thích</span>
        </div>

        <h1 className="wishlist-title">
          <Heart size={24} fill="var(--co-blue)" color="var(--co-blue)" />
          Sản phẩm yêu thích ({items.length})
        </h1>

        {items.length === 0 ? (
          <div className="wishlist-empty">
            <Heart size={80} strokeWidth={1} />
            <h2>Danh sách yêu thích trống</h2>
            <p>Hãy thêm những sản phẩm bạn yêu thích bằng cách nhấn vào biểu tượng ❤️ trên sản phẩm.</p>
            <Link to="/" className="wishlist-shop-btn">Khám phá sản phẩm</Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {items.map(item => (
              <div key={item.id} className="wishlist-card">
                <div className="wishlist-card-img-wrap">
                  <Link to={`/product/${item.id}`}>
                    <img src={item.image} alt={item.name} className="wishlist-card-img" />
                  </Link>
                  <button className="wishlist-remove-btn" onClick={() => removeFromWishlist(item.id)} title="Xoá khỏi yêu thích">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="wishlist-card-info">
                  <Link to={`/product/${item.id}`} className="wishlist-card-name">{item.name}</Link>
                  <div className="wishlist-card-prices">
                    <span className="wishlist-price">{formatPrice(item.price)}</span>
                    {item.originalPrice && (
                      <span className="wishlist-orig-price">{formatPrice(item.originalPrice)}</span>
                    )}
                  </div>
                  <button className="wishlist-add-cart-btn" onClick={() => handleAddToCart(item)}>
                    <ShoppingCart size={16} />
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
