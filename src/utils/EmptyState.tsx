import React from 'react';
import emptyImg from '@/assets/empty.png';

const DEFAULT_IMAGE = emptyImg as string;

type EmptyStateProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  imageSize?: 'sm' | 'md' | 'lg' | 'xl';
  imageClassName?: string;       
  titlePlacement?: 'below' | 'over';
  titleClassName?: string;         
  overlayStyle?: React.CSSProperties; 
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
};

const sizeClass: Record<NonNullable<EmptyStateProps['imageSize']>, string> = {
  sm: 'w-[clamp(200px,28vw,360px)]',
  md: 'w-[clamp(260px,34vw,480px)]',
  lg: 'w-[clamp(320px,40vw,640px)]',
  xl: 'w-[clamp(360px,45vw,760px)]',
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  imageSrc,
  imageAlt = 'Empty illustration',
  imageSize = 'xl',
  imageClassName,
  titlePlacement = 'below',
  titleClassName,
  overlayStyle,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  const src = imageSrc ?? DEFAULT_IMAGE;
  const wrapperW = sizeClass[imageSize];
  const imgCls = imageClassName ?? 'w-full h-auto select-none';
  const defaultTitleCls =
    'mt-6 text-[clamp(14px,1.2vw,16px)] font-semibold uppercase ' +
    'tracking-[0.18em] text-[#2F5AF8]';
  const titleCls = titleClassName ?? defaultTitleCls;

  return (
    <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
      <div className={`relative ${wrapperW}`}>
        <img src={src} alt={imageAlt} className={imgCls} loading="lazy" />
        {titlePlacement === 'over' && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: '7%', ...overlayStyle }}
          >
            <p className={defaultTitleCls}>{title}</p>
          </div>
        )}
      </div>

      {titlePlacement === 'below' && <h3 className={titleCls}>{title}</h3>}
      {description && <p className="text-gray-500 mt-1">{description}</p>}

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
