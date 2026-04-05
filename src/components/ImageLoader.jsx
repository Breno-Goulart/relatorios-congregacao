import React, { useState, useRef, useEffect } from 'react';

export default React.memo(function ImageLoader({ src, alt, className = "", width, height, priority = false }) {
  const imgRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // Se a imagem já estiver no cache do navegador quando o componente montar, remove o "loading"
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoading(false);
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-slate-50 ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse z-10"></div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        // Usa as novas APIs de prioridade de navegadores
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        // Só aplica a transição de opacidade SE não for a imagem de prioridade E ainda estiver carregando
        className={`w-full h-full object-cover relative z-20 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${!priority && isLoading ? 'transition-opacity duration-300 ease-in-out' : ''}`}
      />
    </div>
  );
});