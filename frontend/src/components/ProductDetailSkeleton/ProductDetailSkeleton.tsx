import Skeleton from '../Skeleton/Skeleton';
import './ProductDetailSkeleton.css';

const ProductDetailSkeleton = () => {
  return (
    <div className="pdp-skeleton-container">
      {/* Breadcrumb Skeleton */}
      <div className="pdp-breadcrumb-skeleton">
        <Skeleton type="text" width={120} />
      </div>

      <div className="pdp-top-section-skeleton">
        {/* Left Column: Gallery Skeleton */}
        <div className="pdp-gallery-col-skeleton">
          {/* Main Image */}
          <div className="pdp-main-image-skeleton">
            <Skeleton type="rectangular" className="full-height-skeleton" />
          </div>
          {/* Thumbnails */}
          <div className="pdp-thumbnails-skeleton">
            <Skeleton type="rectangular" className="thumb-skeleton" />
            <Skeleton type="rectangular" className="thumb-skeleton" />
            <Skeleton type="rectangular" className="thumb-skeleton" />
            <Skeleton type="rectangular" className="thumb-skeleton" />
          </div>
        </div>
        
        {/* Right Column: Info & Actions Skeleton */}
        <div className="pdp-info-col-skeleton">
          {/* Title */}
          <Skeleton type="text" height={36} width="90%" className="mb-4" />
          
          {/* Price */}
          <div className="pdp-price-skeleton mb-6">
            <Skeleton type="text" height={32} width={150} />
            <Skeleton type="text" height={24} width={100} />
          </div>

          {/* Divider */}
          <div className="pdp-divider-skeleton" />

          {/* Colors */}
          <div className="mb-6">
            <Skeleton type="text" height={20} width={80} className="mb-2" />
            <div className="pdp-colors-skeleton">
              <Skeleton type="circular" width={40} height={40} />
              <Skeleton type="circular" width={40} height={40} />
              <Skeleton type="circular" width={40} height={40} />
              <Skeleton type="circular" width={40} height={40} />
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-6">
            <Skeleton type="text" height={20} width={80} className="mb-2" />
            <div className="pdp-sizes-skeleton">
              <Skeleton type="rectangular" width={60} height={40} />
              <Skeleton type="rectangular" width={60} height={40} />
              <Skeleton type="rectangular" width={60} height={40} />
              <Skeleton type="rectangular" width={60} height={40} />
              <Skeleton type="rectangular" width={60} height={40} />
            </div>
          </div>

          {/* Actions */}
          <div className="pdp-actions-skeleton">
            <Skeleton type="rectangular" height={50} width="100%" />
            <Skeleton type="rectangular" height={50} width="100%" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
