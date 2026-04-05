import React from 'react';

const Button = React.forwardRef(({ children, variant = 'primary', icon: Icon, className = '', 'aria-label': ariaLabel, ...props }, ref) => {
  // `w-full` é removido da classe base para suportar variantes que não ocupam a largura total, como `text` e `floating`.
  const baseClass = `p-4 rounded-[12px] font-semibold text-[1rem] transition-all duration-200 flex items-center justify-center cursor-pointer ${props.disabled ? '' : 'active:scale-[0.98]'}`;
  
  // NOVA COR: O padrão é o estilo primário (Azul Escuro)
  let variantClass = "w-full bg-[#2B6CB0] text-white hover:bg-[#1E4A78] shadow-[0_4px_14px_0_rgba(43,108,176,0.39)]";
  
  if (props.disabled) {
    // Estilo genérico para desabilitado.
    variantClass = "w-full bg-gray-300 text-gray-500 cursor-not-allowed shadow-none";
    if (variant === 'floating') {
      // Estilo específico para o botão flutuante desabilitado, mantendo sua forma e posição.
      variantClass = "fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gray-300 text-gray-500 cursor-not-allowed shadow-none z-50 p-0";
    }
  } else if (variant === 'secondary') {
    variantClass = "w-full bg-gray-100 text-gray-600 hover:bg-gray-200";
  } else if (variant === 'danger') {
    variantClass = "w-full bg-red-500 text-white hover:bg-red-600 shadow-sm";
  } else if (variant === 'text') {
    variantClass = "bg-transparent text-gray-500 hover:text-gray-800 shadow-none py-2 font-medium text-[0.9rem]";
  } else if (variant === 'floating') {
    // NOVA COR: Variante para o botão de ação flutuante (Azul Escuro)
    variantClass = "fixed bottom-8 right-8 w-16 h-16 rounded-full bg-[#2B6CB0] text-white hover:bg-[#1E4A78] shadow-lg z-50 p-0";
  }

  return (
    <button ref={ref} className={`${baseClass} ${variantClass} ${className}`} aria-label={ariaLabel} {...props}>
      {/* A margem do ícone é aplicada apenas se houver `children` (texto) ao lado. */}
      {Icon && <Icon size={20} className={children ? "mr-2.5" : ''} />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default React.memo(Button);