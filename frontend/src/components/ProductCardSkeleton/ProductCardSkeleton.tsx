import Skeleton from '../Skeleton/Skeleton';
import './ProductCardSkeleton.css';

const ProductCardSkeleton = () => {
  return (
    <div className="product-card-skeleton">
      {/* Image Area Skeleton */}
      <div className="product-image-container-skeleton">
        <Skeleton type="rectangular" className="image-skeleton" />
      </div>

      {/* Info Area Skeleton */}
      <div className="product-info-skeleton">
        {/* Colors Skeleton */}
        <div className="product-colors-skeleton">
          <Skeleton type="circular" width={20} height={20} />
          <Skeleton type="circular" width={20} height={20} />
          <Skeleton type="circular" width={20} height={20} />
        </div>
        
        {/* Title Skeleton */}
        <Skeleton type="text" width="80%" height={20} className="title-skeleton" />
        
        {/* Prices Skeleton */}
        <div className="product-prices-skeleton">
          <Skeleton type="text" width={80} height={20} className="price-skeleton" />
          <Skeleton type="text" width={60} height={16} className="orig-price-skeleton" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
