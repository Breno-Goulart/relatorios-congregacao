import React, { useState, useRef } from 'react';
import { ShieldCheck, User, Clock, BookOpen, Send, Calendar, CheckCircle, Lock, ChevronDown } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { validateName, validarApenasLetras, searchPartialName } from '../utils/formatters';

export default function FormularioPublicador(props) {
  const {
    view,
    setView,
    publicadoresList = [],
    monthlyImage,
    handleAdminLogin,
    adminEmail,
    setAdminEmail,
    adminPassword,
    setAdminPassword,
    adminError,
    isSubmitted,
    handleSubmit,
    isSelectedMonthClosed,
    formData,
    setFormData,
    handleInputChange,
    meses,
    anosDisponiveis,
    opcoesEstudos,
    ImageLoader
  } = props;

  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const debounceTimeoutRef = useRef(null);

  const today = new Date();
  const currentMonthIndex = today.getMonth();
  const currentYear = today.getFullYear();

  const calculateInitialDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const mes = meses[date.getMonth()];
    const ano = date.getFullYear().toString();
    return { mes, ano };
  };

  const initialFormData = {
    mes: '',
    ano: '',
    nome: '',
    participou: 'SIM',
    tipo: 'Publicador(a)',
    horas: '',
    estudos: '0',
    ...formData
  };

  if (!initialFormData.mes || !initialFormData.ano) {
      const { mes, ano } = calculateInitialDate();
      initialFormData.mes = mes;
      initialFormData.ano = ano;
  }

  const fetchBrotherNameSuggestions = (query) => {
  // 1. Sai se não houver texto
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    setSuggestions([]);
    return;
  }

  // 2. LÓGICA OBRIGATÓRIA: Normaliza a entrada (tira acento e põe minúsculo)
  const normalizedQuery = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  // 3. REGRA DE IMPLEMENTAÇÃO: Busca na lista vinda do App.js
  const filteredNames = publicadoresList.filter(p => {
    // Comparar sempre com o campo nome_busca (que já preparamos no App.js)
    const termoBanco = (p.nome_busca || "").toLowerCase();
    return termoBanco.includes(normalizedQuery);
  });

  // 4. REGRA DE EXIBIÇÃO: Mostrar sempre o campo "nome" (com acentos) em MAIÚSCULAS
  const finalSuggestions = filteredNames.map(p => p.nome.toUpperCase());
  
  setSuggestions(finalSuggestions);
};

  const handleNameChange = (e) => {
    const { name, value } = e.target;

    // Valida ANTES de atualizar. Permite apagar o campo (value === '').
    if (validateName(value) || value === '') {
      // 1. A entrada é válida, então atualiza o estado do formulário.
      handleInputChange({ target: { name, value } });

      // 2. Limpa qualquer erro que estivesse sendo exibido.
      setErrors(prev => ({ ...prev, nome: null }));

      // 3. Busca sugestões com base na entrada válida.
      fetchBrotherNameSuggestions(value);
    } else {
      // A entrada é inválida. NÃO atualiza o estado, impedindo
      // que o caractere inválido apareça. Apenas exibe o erro.
      setErrors(prev => ({ ...prev, nome: "Nome inválido. Apenas letras com acentos e espaços são permitidos." }));
    }
  };
  
  const handleSuggestionClick = (name) => {
    if (validateName(name)) {
      setFormData(prev => ({ ...prev, nome: name }));
      setErrors(prev => ({ ...prev, nome: null }));
    } else {
      setErrors(prev => ({ ...prev, nome: 'Nome inválido. Apenas letras com acentos e espaços são permitidos.' }));
    }
    setSuggestions([]);
    setIsNameFocused(false);
  };

  const handleNameBlur = (e) => {
    const { name, value } = e.target;
    // Verifica se o valor digitado corresponde exatamente a uma sugestão (ignorando maiúsculas/minúsculas)
    const selectedSuggestion = suggestions.find(s => s.toLowerCase() === value.toLowerCase());
  
    if (selectedSuggestion) {
      // Se houver correspondência, trata como uma seleção de sugestão
      handleSuggestionClick(selectedSuggestion);
    } else {
      // Se não, aplica a formatação padrão e esconde a lista
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
      // Adiciona um pequeno delay para permitir que o evento de clique na sugestão seja registrado
      setTimeout(() => {
        setIsNameFocused(false);
      }, 150);
    }
  };

  const handleAdminEmailChange = (e) => {
    const { value } = e.target;
    // Regex para validar caracteres permitidos em e-mails, prevenindo a entrada de caracteres especiais indesejados.
    const validEmailCharsRegex = /^[a-zA-Z0-9@._+-]*$/;
    if (validEmailCharsRegex.test(value) || value === '') {
      setAdminEmail(value);
    }
    // Caso contrário, não atualiza o estado, bloqueando o caractere inválido.
  };

  const isDateSelectionDisabled = (selectedYear, selectedMonthIndex) => {
      const firstDayOfSelectedMonth = new Date(selectedYear, selectedMonthIndex, 1);
      const firstDayOfCurrentMonth = new Date(currentYear, currentMonthIndex, 1);
      return firstDayOfSelectedMonth >= firstDayOfCurrentMonth;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center pb-12 font-sans text-gray-800 selection:bg-[#4A90E2]/20">
      <div className="w-full h-56 sm:h-64 relative overflow-hidden bg-transparent">
        <ImageLoader
          src={monthlyImage}
          alt="Tema do Mês"
          className="w-full h-full"
          priority={true}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center pb-8 z-20 pointer-events-none">
          <h1 className="text-white text-[1.8rem] font-extrabold tracking-tight text-center drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
          {/* Aqui ele lê o nome que você definir no .env ou no Netlify */}
            {import.meta.env.VITE_CONGRE_NAME}
          </h1>
        </div>
      </div>

      <div className="w-full max-w-[420px] px-4 -mt-8 relative z-30">
        {view === 'login' ? (
          <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center mb-8">
              
              <img 
                src="/logo.png" 
                alt="Logo Congregação Norte" 
                fetchPriority="high" 
                className="h-16 w-auto object-contain mb-3 drop-shadow-md" 
              />
              
              <h2 className="text-[1.4rem] font-semibold text-gray-800 text-center leading-tight">Painel Administrativo</h2>
              <p className="text-sm text-gray-500 font-normal mt-1">Exclusivo para Anciãos</p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <Input 
                label="E-mail Administrativo" 
                type="email" 
                autoComplete="username"
                value={adminEmail} 
                onChange={handleAdminEmailChange} 
                placeholder="secretario@congregacao.com" 
                required 
              />
              
              <Input 
                label="Senha Segura" 
                type="password" 
                autoComplete="current-password"
                value={adminPassword} 
                onChange={(e) => setAdminPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
                errorMessage={adminError} 
              />
              
              <div className="flex flex-col space-y-3 pt-2">
                <Button type="submit" className="!bg-[#2B6CB0] hover:!bg-[#1E4A78] transform active:scale-95 active:brightness-90 active:shadow-inner transition-all duration-100">
                  Acessar Painel
                </Button>
                
                <Button type="button" variant="text" onClick={() => setView('form')} className="border-2 border-[#2B6CB0] !text-[#2B6CB0] transform active:scale-95 transition-all duration-100 hover:bg-[#F0F5FA]">
                  Voltar ao Formulário
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 relative overflow-hidden">
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-400">
                <div className="bg-[#E8F5E9] p-5 rounded-full mb-6 shadow-sm border border-[#C8E6C9]">
                  <CheckCircle size={56} className="text-[#2E7D32]" />
                </div>
                <h2 className="text-[1.5rem] font-semibold text-gray-800 mb-2">Enviado!</h2>
                <p className="text-gray-500 text-[0.95rem] leading-relaxed max-w-[250px]">Seu relatório foi registrado com sucesso. Muito obrigado!</p>
              </div>
              ) : (
              <form onSubmit={(e) => { if(isSelectedMonthClosed) { e.preventDefault(); return; } handleSubmit(e); }} className="space-y-5">
                
                {/* --- NOVO TÍTULO CENTRALIZADO --- */}
                <div className="w-full text-center pb-2">
                  <h2 className="text-[1.4rem] font-bold text-gray-800">Relatório de Serviço</h2>
                  <p className="text-[0.85rem] text-gray-500 mt-0.5">Preencha os dados do seu ministério</p>
                </div>
                {/* ------------------------------- */}

                {isSelectedMonthClosed && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-[12px] font-medium text-[0.85rem] flex items-center justify-center text-center border border-red-100 animate-in fade-in">
                     <Lock size={16} className="mr-2 shrink-0" /> O período de envio para este mês já foi encerrado.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-[0.85rem] font-medium text-[#555] mb-1.5 ml-1">
                      <Calendar size={14} className="mr-1.5 text-[#4A90E2]" /> Mês
                    </label>
                    <div className="relative">
                      <select name="mes" value={formData.mes || initialFormData.mes} onChange={(e) => { handleInputChange(e); const selectedYear = parseInt(formData.ano || initialFormData.ano, 10); const selectedMonthIndex = meses.indexOf(e.target.value); const isFuture = isDateSelectionDisabled(selectedYear, selectedMonthIndex); setFormData(prev => ({ ...prev, mes: e.target.value, isFutureMonth: isFuture })); }} className="w-full pl-4 pr-10 py-3.5 rounded-[12px] border border-[#ddd] bg-[#fafafa] focus:bg-white focus:ring-4 focus:ring-[#4A90E2]/15 focus:border-[#4A90E2] outline-none transition-all text-[0.95rem] text-gray-800 appearance-none font-medium cursor-pointer">
                        {meses.map((m, idx) => {
                          const yearToConsider = parseInt(formData.ano || initialFormData.ano, 10);
                          const isFuturo = isDateSelectionDisabled(yearToConsider, idx);
                          return (
                            <option key={m} value={m} disabled={isFuturo}>
                              {m} {isFuturo ? '(Indisponível)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-400">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center text-[0.85rem] font-medium text-[#555] mb-1.5 ml-1">
                       Ano
                    </label>
                    <div className="relative">
                      <select name="ano" value={initialFormData.ano} onChange={(e) => { handleInputChange(e); const selectedYear = parseInt(e.target.value, 10); const selectedMonthIndex = meses.indexOf(initialFormData.mes) ; const isFuture = isDateSelectionDisabled(selectedYear, selectedMonthIndex); setFormData(prev => ({ ...prev, ano: e.target.value, mes: `${e.target.value}-${(selectedMonthIndex + 1).toString().padStart(2, '0')}`, isFutureMonth: isFuture })); }} className="w-full pl-4 pr-10 py-3.5 rounded-[12px] border border-[#ddd] bg-[#fafafa] focus:bg-white focus:ring-4 focus:ring-[#4A90E2]/15 focus:border-[#4A90E2] outline-none transition-all text-[0.95rem] text-gray-800 appearance-none font-medium cursor-pointer">
                        {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-400">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative w-full">
                  <Input
                    label="Nome Completo"
                    icon={User}
                    type="text"
                    name="nome"
                    required
                    value={formData.nome || initialFormData.nome}
                    onChange={handleNameChange}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={handleNameBlur}
                    placeholder="Ex: João da Silva"
                    autoComplete="off"
                    autoCapitalize="words"
                    errorMessage={errors.nome}
                  />
                  
                  {isNameFocused && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-[12px] shadow-lg z-10 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                      <ul className="py-1">
                        {suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className="px-4 py-2.5 text-sm text-gray-800 font-medium cursor-pointer hover:bg-[#4A90E2]/10 hover:text-[#4A90E2]"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Impede que o input perca o foco e feche a lista antes da hora
                              handleSuggestionClick(suggestion);
                            }}
                          >
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-[#f8fafd] p-5 rounded-[16px] border border-[#e1ebf5]">
                  <label className="block text-[0.9rem] font-medium text-gray-700 mb-3 text-center">Participou no ministério este mês?</label>
                  <div className="flex space-x-3">
                    {['SIM', 'NÃO'].map(op => (
                      <label key={op} className={`flex-1 flex items-center justify-center p-3.5 rounded-[12px] cursor-pointer border transition-all duration-200 ${ formData.participou === op  ? (op === 'SIM'  ? 'border-[#4A90E2] bg-[#4A90E2] text-white font-semibold shadow-[0_4px_10px_rgba(74,144,226,0.25)]'  : 'border-red-500 bg-red-500 text-white font-semibold shadow-[0_4px_10px_rgba(239,68,68,0.25)]') : 'border-[#ddd] bg-white text-gray-500 hover:bg-gray-50' }`}>
                        <input type="radio" name="participou" value={op} checked={formData.participou === op} onChange={handleInputChange} className="sr-only" /> {op}
                      </label>
                    ))}
                  </div>
                </div>

                {formData.participou === 'SIM' && (
                  <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                    
                    <div className="space-y-2">
                      <label className="block text-[0.85rem] font-medium text-[#555] ml-1 mb-2">
                        Sua designação atual:
                      </label>
                      <div className="flex flex-col gap-2.5">
                        {[
                          { id: 'Publicador(a)', label: 'Publicador(a)' },
                          { id: 'Pioneiro(a) Auxiliar', label: 'Pioneiro(a) Auxiliar' },
                          { id: 'Pioneiro(a) Regular', label: 'Pioneiro(a) Regular' }
                        ].map(op => (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                tipo: op.id,
                                horas: op.id.includes('Pioneiro') ? prev.horas : ''
                              }));
                            }}
                            className={`w-full py-3.5 px-4 text-left rounded-[12px] border transition-all duration-200 font-medium text-[0.95rem] flex items-center justify-between ${
                              formData.tipo === op.id 
                              ? 'border-[#4A90E2] bg-[#f0f6ff] text-[#4A90E2] shadow-[0_2px_12px_rgba(74,144,226,0.12)]' 
                              : 'border-[#ddd] bg-white text-gray-600 hover:bg-white hover:border-[#ccc]'
                            }`}
                          >
                            {op.label}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.tipo === op.id ? 'border-[#4A90E2]' : 'border-[#ccc]'}`}>
                              {formData.tipo === op.id && <div className="w-2.5 h-2.5 bg-[#4A90E2] rounded-full" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {formData.tipo?.includes('Pioneiro') && (
                      <div className="animate-in zoom-in-95 duration-200 bg-[#f8fafd] p-4 rounded-[16px] border border-[#e1ebf5]">
                        <label className="flex items-center text-[0.85rem] font-medium text-[#555] mb-3 ml-1">
                          <Clock size={14} className="mr-1.5 text-[#4A90E2]" /> Horas Trabalhadas
                        </label>
                        <div className="flex gap-3">
                          <div className="flex-1 relative">
                            <select
                              value={formData.horas ? formData.horas.split(':')[0] : ''}
                              onChange={(e) => {
                                const h = e.target.value;
                                const m = formData.horas ? (formData.horas.split(':')[1] || '00') : '00';
                                handleInputChange({ target: { name: 'horas', value: `${h}:${m}` }});
                              }}
                              required
                              className="w-full pl-3 pr-8 py-3.5 rounded-[12px] border border-[#ddd] bg-[#fafafa] focus:bg-white focus:ring-4 focus:ring-[#4A90E2]/15 focus:border-[#4A90E2] outline-none transition-all text-[0.95rem] text-gray-800 appearance-none font-medium cursor-pointer"
                            >
                              <option value="" disabled>Horas</option>
                              {Array.from({ length: 151 }, (_, i) => (
                                <option key={i} value={i}>{i} h</option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#4A90E2]/60">
                              <ChevronDown size={16} />
                            </div>
                          </div>
                          
                          <div className="flex-1 relative">
                            <select
                              value={formData.horas ? (formData.horas.split(':')[1] || '00') : '00'}
                              onChange={(e) => {
                                const h = formData.horas ? (formData.horas.split(':')[0] || '0') : '0';
                                const m = e.target.value;
                                handleInputChange({ target: { name: 'horas', value: `${h}:${m}` }});
                              }}
                              className="w-full pl-3 pr-8 py-3.5 rounded-[12px] border border-[#ddd] bg-[#fafafa] focus:bg-white focus:ring-4 focus:ring-[#4A90E2]/15 focus:border-[#4A90E2] outline-none transition-all text-[0.95rem] text-gray-800 appearance-none font-medium cursor-pointer"
                            >
                              <option value="00">00 min</option>
                              <option value="15">15 min</option>
                              <option value="30">30 min</option>
                              <option value="45">45 min</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#4A90E2]/60">
                              <ChevronDown size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="flex items-center text-[0.85rem] font-medium text-[#555] mb-1.5 ml-1">
                        <BookOpen size={14} className="mr-1.5 text-[#4A90E2]" /> Estudos Bíblicos Dirigidos
                      </label>
                      <div className="relative">
                        <select name="estudos" value={formData.estudos} onChange={handleInputChange} className="w-full pl-4 pr-10 py-3.5 rounded-[12px] border border-[#ddd] bg-[#fafafa] focus:bg-white focus:ring-4 focus:ring-[#4A90E2]/15 focus:border-[#4A90E2] outline-none transition-all text-[0.95rem] text-gray-800 appearance-none font-medium cursor-pointer">
                          {opcoesEstudos.map(num => <option key={num} value={num}>{num} {num === 1 ? 'Estudo' : 'Estudos'}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-400">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                <div className="pt-2">
                  <Button type="submit" icon={Send} disabled={isSelectedMonthClosed || formData.isFutureMonth} className="!bg-emerald-600 hover:!bg-emerald-700 !shadow-[0_4px_14px_0_rgba(16,185,129,0.39)]">
                    Enviar Relatório
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="mt-8 text-center pb-8">
          <button onClick={() => setView('login')} className="px-6 py-2.5 rounded-full border-2 border-[#2B6CB0] bg-[#4A90E2]/5 text-[0.85rem] text-[#2B6CB0] hover:bg-[#2B6CB0] hover:text-white font-semibold inline-flex items-center justify-center transition-all shadow-sm">
            <ShieldCheck size={16} className="mr-2" /> Área Restrita
          </button>
        </div>
      </div>
    </div>
  );
}