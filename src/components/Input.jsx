import React, { useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = React.forwardRef(({ label, icon: Icon, errorMessage, className = '', type, id, validate, onChange, debounceTime = 300, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const handleChange = (e) => {
    const { value } = e.target;
    // Permite a alteração se:
    // 1. Não houver função de validação.
    // 2. A validação passar.
    // 3. O campo estiver sendo limpo (essencial para usabilidade).
    if (!validate || validate(value) || value === '') {
      if (onChange) {
        onChange(e); // Chama o onChange original passado pelo componente pai
      }
    }
    // Se a validação falhar, o onChange do pai não é chamado, bloqueando a entrada.
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="flex items-center text-[0.85rem] font-medium text-[#555] mb-1.5 ml-1">
          {Icon && <Icon size={14} className="mr-1.5 text-[#4A90E2]" />}
          {label}
        </label>
      )}
      <div className="relative">
        <input 
          id={inputId}
          ref={ref}
          type={inputType}
          onChange={handleChange}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? `${inputId}-error` : undefined}
          className={`w-full px-4 py-3.5 rounded-[12px] border border-[#ddd] bg-[#fafafa] focus:bg-white focus:ring-4 focus:ring-[#4A90E2]/15 focus:border-[#4A90E2] outline-none transition-all text-[0.95rem] text-gray-800 ${isPassword ? 'pr-12' : ''}`}
          {...props} 
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 flex items-center justify-center text-gray-400 hover:text-[#4A90E2] transition-colors rounded-full"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {errorMessage && (
        <p id={`${inputId}-error`} aria-live="polite" className="text-red-500 text-xs mt-2 font-medium flex items-center bg-red-50 p-2.5 rounded-lg border border-red-100">
          {errorMessage}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;