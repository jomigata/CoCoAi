import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  lazy?: boolean;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  lazy = true,
  quality = 80,
  format = 'auto',
  sizes,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 이미지 최적화 URL 생성
  const getOptimizedSrc = useCallback((originalSrc: string): string => {
    // Firebase Storage 이미지인 경우 최적화 파라미터 추가
    if (originalSrc.includes('firebasestorage.googleapis.com')) {
      const url = new URL(originalSrc);
      
      // 이미 최적화 파라미터가 있는지 확인
      if (url.searchParams.has('_glb')) {
        return originalSrc;
      }

      // 최적화 파라미터 추가
      url.searchParams.set('_glb', '1'); // Firebase Storage 최적화 활성화
      
      if (width) {
        url.searchParams.set('w', width.toString());
      }
      
      if (height) {
        url.searchParams.set('h', height.toString());
      }
      
      url.searchParams.set('q', quality.toString());
      
      if (format !== 'auto') {
        url.searchParams.set('f', format);
      }

      return url.toString();
    }

    // 외부 이미지 서비스인 경우 (예: Cloudinary, ImageKit 등)
    if (originalSrc.includes('cloudinary.com')) {
      const transformations = [];
      
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      transformations.push(`q_${quality}`);
      
      if (format !== 'auto') {
        transformations.push(`f_${format}`);
      }

      const transformString = transformations.join(',');
      return originalSrc.replace('/upload/', `/upload/${transformString}/`);
    }

    // 기본 이미지인 경우 원본 반환
    return originalSrc;
  }, [width, height, quality, format]);

  // Intersection Observer 설정
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // 50px 전에 미리 로드
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy]);

  // 이미지 로드 처리
  useEffect(() => {
    if (!isInView) return;

    const optimizedSrc = getOptimizedSrc(src);
    setCurrentSrc(optimizedSrc);
  }, [isInView, src, getOptimizedSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsError(true);
    setIsLoaded(false);
    onError?.();
  }, [onError]);

  // 로딩 상태
  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        style={{ width, height }}
        aria-label={alt}
      >
        {placeholder && (
          <img
            src={placeholder}
            alt=""
            className="w-full h-full object-cover opacity-50"
            style={{ width, height }}
          />
        )}
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={`이미지 로드 실패: ${alt}`}
      >
        <div className="text-gray-400 text-sm text-center">
          <div className="mb-2">📷</div>
          <div>이미지를 불러올 수 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* 로딩 인디케이터 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* 플레이스홀더 */}
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}

      {/* 실제 이미지 */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
      />
    </div>
  );
};

// 이미지 갤러리 컴포넌트
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    thumbnail?: string;
  }>;
  className?: string;
  columns?: number;
  gap?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = '',
  columns = 3,
  gap = 4
}) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const gridStyle = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap * 0.25}rem`
  };

  return (
    <>
      <div
        className={`grid ${className}`}
        style={gridStyle}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setSelectedImage(index)}
          >
            <OptimizedImage
              src={image.thumbnail || image.src}
              alt={image.alt}
              className="w-full h-32 object-cover rounded-lg"
              lazy={true}
              quality={70}
            />
          </div>
        ))}
      </div>

      {/* 이미지 모달 */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-4xl p-4">
            <button
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
            <OptimizedImage
              src={images[selectedImage].src}
              alt={images[selectedImage].alt}
              className="max-w-full max-h-full object-contain"
              quality={90}
            />
          </div>
        </div>
      )}
    </>
  );
};

// 아바타 이미지 컴포넌트
interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  fallback
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  if (!src) {
    return (
      <div
        className={`${sizeClasses[size]} ${textSizeClasses[size]} bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold ${className}`}
        role="img"
        aria-label={alt}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full ${className}`}
      placeholder={fallback}
      quality={75}
      format="webp"
    />
  );
};

export default OptimizedImage;
