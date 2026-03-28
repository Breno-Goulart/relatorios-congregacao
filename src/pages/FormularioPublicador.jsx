import React from 'react';
import { ShieldCheck, User, Clock, BookOpen, Send, Calendar, CheckCircle, Lock, ChevronDown } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';

export default function FormularioPublicador(props) {
  const {
    view,
    setView,
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

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center pb-12 font-sans text-gray-800 selection:bg-[#4A90E2]/20">
      <div className="w-full h-56 sm:h-64 relative overflow-hidden bg-transparent">
        <ImageLoader
          src={monthlyImage}
          alt="Tema do Mês"
          className="w-full h-full"
          priority={true}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end justify-center pb-14 z-20 pointer-events-none">
          <h1 className="text-white text-[1.5rem] font-semibold tracking-wide drop-shadow-md">Congre.Norte - Relatório de Serviço</h1>
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
                onChange={(e) => setAdminEmail(e.target.value)} 
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
                <Button type="submit" className="transform active:scale-95 active:brightness-90 active:shadow-inner transition-all duration-100">Acessar Painel</Button>
                <Button type="button" variant="text" onClick={() => setView('form')} className="transform active:scale-95 active:bg-gray-200 active:text-gray-800 transition-all duration-100 hover:bg-gray-50">Voltar ao Formulário</Button>
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
              <form onSubmit={handleSubmit} className="space-y-5">
                
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
<select name="mes" value={formData.mes} onChange={handleInputChange} className="w-full pl-4 pr-10 py-3.5 rounded-[12px] border border-[#ddd] bg-[#fafafa] focus:bg-white focus:ring-4 focus:ring-[#4A90E2]/15 focus:border-[#4A90E2] outline-none transition-all text-[0.95rem] text-gray-800 appearance-none font-medium cursor-pointer">
{meses.map((m, idx) => {
const anoAtualNum = new Date().getFullYear();
const mesAtualIdx = new Date().getMonth();
const anoSelecionado = parseInt(formData.ano, 10);
const isFuturo = (anoSelecionado > anoAtualNum) || (anoSelecionado === anoAtualNum && idx > mesAtualIdx);

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
                      <select name="ano" value={formData.ano} onChange={handleInputChange} className="w-full pl-4 pr-10 py-3.5 rounded-[12px] border border-[#ddd] bg-[#fafafa] focus:bg-white focus:ring-4 focus:ring-[#4A90E2]/15 focus:border-[#4A90E2] outline-none transition-all text-[0.95rem] text-gray-800 appearance-none font-medium cursor-pointer">
                        {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-400">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                </div>

                <Input 
                  label="Nome Completo" 
                  icon={User}
                  type="text" 
                  name="nome" 
                  required 
                  value={formData.nome} 
                  onChange={handleInputChange} 
                  placeholder="Ex: João da Silva"
                  autoComplete="name"
                  autoCapitalize="words"
                />

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
                  <Button type="submit" icon={Send} disabled={isSelectedMonthClosed} className="!bg-emerald-600 hover:!bg-emerald-700 !shadow-[0_4px_14px_0_rgba(16,185,129,0.39)]">
                    Enviar Relatório
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="mt-8 text-center pb-8">
          <button onClick={() => setView('login')} className="px-6 py-2.5 rounded-full border-2 border-[#4A90E2]/20 bg-[#4A90E2]/5 text-[0.85rem] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white font-semibold inline-flex items-center justify-center transition-all shadow-sm">
            <ShieldCheck size={16} className="mr-2" /> Área Restrita
          </button>
        </div>
      </div>
    </div>
  );
}