import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  type?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton = ({
  type = 'text',
  width,
  height,
  className = '',
  style,
}: SkeletonProps) => {
  const classes = `skeleton skeleton-${type} ${className}`;

  return (
    <div
      className={classes}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
};

export default Skeleton;
