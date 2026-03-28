import React, { useState } from 'react';

export default React.memo(function ImageLoader({ src, alt, className = "", width, height, priority = false }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden bg-slate-50 ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse z-10"></div>
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : undefined}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        className={`w-full h-full object-cover transition-opacity duration-300 ease-in-out relative z-20 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
});