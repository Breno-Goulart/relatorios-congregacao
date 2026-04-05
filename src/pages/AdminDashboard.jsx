import React, { useState, useMemo, useEffect } from 'react';
import { validarApenasLetras } from '../utils/formatters';
import { 
  Users, 
  Clock, 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  Edit2, 
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Image as ImageIcon,
  Save,
  Plus
} from 'lucide-react';
import { ordenarRelatoriosAlfabeticamente, searchPartialName, validateName } from '../utils/formatters';
import Input from '../components/Input.jsx';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "px-4 py-2 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700"
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const StatCard = ({ title, value, icon: Icon, color, trend, delay }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards will-change-transform" style={{ animationDelay: delay || '0ms' }}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} />
      </div>
      {trend}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

const ActionCard = ({ title, description, icon: Icon, onClick, color }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all text-left group"
  >
    <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
      <Icon size={20} />
    </div>
    <div>
      <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  </button>
);

export default function AdminDashboard({ 
  reports,
  fechamentos = {},
  onLogout, 
  monthlyImage, 
  setMonthlyImage, 
  meses = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", 
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
  ], 
  anosDisponiveis = [new Date().getFullYear().toString()],
  opcoesEstudos = [0, 1, 2, 3, 4, 5],
  onUpdateReport,
  onDeleteReport,
  onAddReport,
  onSaveConfig,
  onToggleFechamento,
  ImageLoader = ({ src, className }) => <img src={src || 'https://via.placeholder.com/400x300?text=Sem+Imagem'} className={className} alt="Capa" />
}) {
  const relatorios = reports || [];

  const [searchTerm, setSearchTerm] = useState('');
  const mesAtualDin = new Date().toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
  const [filterMonth, setFilterMonth] = useState([mesAtualDin]);
  const [filterYear, setFilterYear] = useState([new Date().getFullYear().toString()]);
  const [filterType, setFilterType] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMonth, filterYear, filterType]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmCloseMonthOpen, setIsConfirmCloseMonthOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);

  const filteredData = useMemo(() => {
    const normalizedSearchTerm = searchTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    return relatorios.filter(item => {
      const nameToSearch = (item.nome_busca || item.nome || '');
      const normalizedNameToSearch = nameToSearch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const matchSearch = normalizedNameToSearch.includes(normalizedSearchTerm);
      
      const matchMonth = filterMonth.includes('Todos') || filterMonth.some(m => m?.toLowerCase() === item.mes?.toLowerCase());
      const matchYear = filterYear.includes('Todos') || filterYear.some(y => String(y) === String(item.ano));
      const matchType = filterType === 'Todos' || item.tipo === filterType;
      
      return matchSearch && matchMonth && matchYear && matchType;
    });
  }, [relatorios, searchTerm, filterMonth, filterYear, filterType]);
  
  const sortedData = useMemo(() => ordenarRelatoriosAlfabeticamente(filteredData), [filteredData]);

  const stats = useMemo(() => {
    const totalReports = filteredData.length;
    
    const publicadoresUnicosGeral = new Set(relatorios.map(r => r.nome_busca || (r.nome ? r.nome.toUpperCase() : '')));
    publicadoresUnicosGeral.delete('');
    const totalPublicadoresGeral = publicadoresUnicosGeral.size;

    const publicadoresEnviaramFiltro = new Set(filteredData.map(r => r.nome_busca || (r.nome ? r.nome.toUpperCase() : '')));
    publicadoresEnviaramFiltro.delete('');
    const totalEnviaram = publicadoresEnviaramFiltro.size;

    const totalFaltantes = totalPublicadoresGeral > totalEnviaram ? totalPublicadoresGeral - totalEnviaram : 0;
    
    // NOVO: Descobre exatamente quem são os nomes que faltam e ordena alfabeticamente
    const nomesQueFaltam = [...publicadoresUnicosGeral]
      .filter(nome => !publicadoresEnviaramFiltro.has(nome))
      .sort();
    
    const totalHoras = filteredData.reduce((acc, curr) => {
      if (!curr.horas) return acc;
      const parts = String(curr.horas).split(':');
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      return acc + h + (m / 60);
    }, 0);

    const totalEstudos = filteredData.reduce((acc, curr) => acc + (parseInt(curr.estudos) || 0), 0);
    const totalParticipations = filteredData.reduce((acc, curr) => curr.participou === 'SIM' ? acc + 1 : acc, 0);

    return { 
      totalReports, 
      totalHoras: Number(totalHoras.toFixed(1)), 
      totalEstudos, 
      totalParticipations,
      totalPublicadoresGeral,
      totalEnviaram,
      totalFaltantes,
      nomesQueFaltam
    };
  }, [filteredData, relatorios]);

  const { totalReports, totalHoras, totalEstudos, totalParticipations, totalPublicadoresGeral, totalEnviaram, totalFaltantes, nomesQueFaltam } = stats;

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEditClick = (report) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (reportToDelete) {
      if (onDeleteReport) await onDeleteReport(reportToDelete.id);
      setIsConfirmDeleteOpen(false);
      setReportToDelete(null);
    }
  };

  const handleExportData = () => {
    const csvContent = "Nome;Mês;Ano;Participou;Tipo;Estudos;Horas;Data de Envio\n"
      + filteredData.map(r => {
          const dt = r.dataEnvio?.seconds ? new Date(r.dataEnvio.seconds * 1000).toLocaleString('pt-BR') : (typeof r.dataEnvio?.toDate === 'function' ? r.dataEnvio.toDate().toLocaleString('pt-BR') : (r.dataEnvio instanceof Date ? r.dataEnvio.toLocaleString('pt-BR') : ''));
          return `"${r.nome}";"${r.mes}";"${r.ano}";"${r.participou}";"${r.tipo}";"${r.estudos || 0}";"${r.horas || ''}";"${dt}"`;
      }).join("\n");
      
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `relatorios_${filterMonth.includes('Todos') ? 'Todos' : (filterMonth.length > 2 ? filterMonth.length + '_meses' : filterMonth.join('-'))}_${filterYear.includes('Todos') ? 'Todos' : filterYear.join('-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 flex flex-col pb-20 overflow-x-hidden scroll-smooth animate-in slide-in-from-right-4 fade-in duration-300 ease-out will-change-transform">
        <header className="bg-white/70 backdrop-blur-lg border-b border-white/20 sticky top-0 z-30 transition-all duration-300 ease-out">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 1. Mudamos h-16 para py-4 (isso deixa a altura flexível e adiciona um espaçamento em cima e embaixo) */}
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4"> {/* Aumentei um pouquinho o gap para não grudar no texto */}
                
                {/* 2. Agora sim, podemos colocar w-20 h-20 (ou w-24 h-24 se quiser ainda maior) */}
                <div className="w-24 h-24 flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
                </div>
                
                <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-none">Painel Administrativo</h1>
                  {/* Trocamos o texto fixo pela variável */}
                  <p className="text-xs text-slate-500 mt-1">
                    {import.meta.env.VITE_CONGRE_NAME_ADMIN || ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => setIsConfigModalOpen(true)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 ease-out active:scale-90 will-change-transform"
                  title="Configurações"
                >
                  <Settings size={20} />
                </button>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl transition-all duration-200 ease-out active:scale-95 will-change-transform text-sm font-bold shadow-sm shadow-red-200"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-full px-4 mx-auto py-8 sm:px-6 lg:px-8 lg:max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Painel Administrativo</h1>
              <p className="text-slate-500 mt-1">Gerencie os relatórios da congregação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Total de Relatórios" 
              value={totalReports} 
              icon={Users} 
              color="bg-blue-100 text-blue-600"
              delay="0ms"
              trend={
                <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-[10px] font-bold">
                  {relatorios.length > 0 ? Math.round((filteredData.length / relatorios.length) * 100) : 0}% do Geral
                </span>
              }
            />
            <StatCard 
              title="Total de Horas" 
              value={`${totalHoras}h`} 
              icon={Clock} 
              color="bg-amber-100 text-amber-600"
              delay="100ms"
              trend={
                <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-[10px] font-bold">
                  {relatorios.reduce((acc, curr) => acc + (parseInt(curr.horas) || 0), 0) > 0 ? Math.round((totalHoras / relatorios.reduce((acc, curr) => acc + (parseInt(curr.horas) || 0), 0)) * 100) : 0}% do Geral
                </span>
              }
            />
            <StatCard 
              title="Estudos Bíblicos" 
              value={totalEstudos} 
              icon={BookOpen} 
              color="bg-purple-100 text-purple-600"
              delay="200ms"
              trend={
                <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-[10px] font-bold">
                  {relatorios.reduce((acc, curr) => acc + (parseInt(curr.estudos) || 0), 0) > 0 ? Math.round((totalEstudos / relatorios.reduce((acc, curr) => acc + (parseInt(curr.estudos) || 0), 0)) * 100) : 0}% do Geral
                </span>
              }
            />
            <StatCard 
              title="Participações" 
              value={totalParticipations} 
              icon={CheckCircle2} 
              color="bg-green-100 text-green-600"
              delay="300ms"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 col-span-1 flex flex-col items-center justify-center">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 w-full text-left">Entrega de Relatórios</h3>
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full" style={{ background: `conic-gradient(#10b981 ${totalPublicadoresGeral > 0 ? (totalEnviaram / totalPublicadoresGeral) * 100 : 0}%, #f1f5f9 0)`}}>
                <div className="absolute w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-800">{totalPublicadoresGeral > 0 ? Math.round((totalEnviaram / totalPublicadoresGeral) * 100) : 0}%</span>
                  <span className="text-[10px] text-slate-400">Entregue</span>
                </div>
              </div>
              <div className="flex w-full justify-between mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Enviaram ({totalEnviaram})
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200"></span> Faltam ({totalFaltantes})
                  </div>
                  {totalFaltantes > 0 && (
                    <button 
                      onClick={() => setIsMissingModalOpen(true)}
                      className="text-[10px] font-bold bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1 mt-1"
                    >
                      VER LISTA
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 col-span-1 lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Histórico de Envios</h3>
              <div className="h-40 flex items-end gap-2 w-full pt-4">
                {meses.map(mes => {
                  const anoGrafico = filterYear.includes('Todos') ? new Date().getFullYear().toString() : filterYear[0];
                  
                  const count = relatorios.filter(r => r.mes?.toUpperCase() === mes.toUpperCase() && String(r.ano) === String(anoGrafico)).length;
                  const maxCount = Math.max(...meses.map(m => relatorios.filter(r => r.mes?.toUpperCase() === m.toUpperCase() && String(r.ano) === String(anoGrafico)).length), 1);
                  
                  const height = count > 0 ? `${(count / maxCount) * 100}%` : '0%';
                  
                  // Lógica Termômetro: Compara envios do mês com total atual da congregação
                  const percentualEnvio = totalPublicadoresGeral > 0 ? (count / totalPublicadoresGeral) * 100 : 0;
                  
                  let corBarra = 'bg-slate-200';
                  let corFundo = 'bg-slate-50 hover:bg-slate-100';
                  
                  if (count > 0) {
                      if (percentualEnvio >= 90) {
                          corBarra = 'bg-emerald-500';
                          corFundo = 'bg-emerald-50 hover:bg-emerald-100';
                      } else if (percentualEnvio >= 50) {
                          corBarra = 'bg-amber-400';
                          corFundo = 'bg-amber-50 hover:bg-amber-100';
                      } else {
                          corBarra = 'bg-red-500';
                          corFundo = 'bg-red-50 hover:bg-red-100';
                      }
                  }
                  
                  return (
                    <div key={mes} className="flex-1 flex flex-col items-center gap-2 group relative cursor-pointer h-full" onClick={() => { setFilterMonth([mes]); setFilterYear([anoGrafico]); }}>
                      
                      {/* O Fundo do gráfico (semáforo suave) */}
                      <div className={`w-full flex-1 rounded-t-md relative flex items-end justify-center transition-colors ${corFundo}`}>
                        
                        {/* Tooltip Dinâmico */}
                        <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          {count} {count === 1 ? 'relatório' : 'relatórios'}
                        </div>
                        
                        {/* A Barra Preenchida que sobe (Semáforo Forte) */}
                        <div className={`w-full rounded-t-md transition-all duration-500 ${corBarra}`} style={{ height: count > 0 ? height : '4px' }}></div>
                      </div>
                      
                      <span className="text-[10px] font-bold text-slate-400 uppercase truncate w-full text-center" title={mes}>{mes.substring(0,3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full mb-8">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  placeholder="Pesquisar por nome..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl min-h-[48px] focus:ring-2 focus:ring-[#4A90E2] outline-none transition-all text-sm shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-3 w-full mt-3 pb-2">
              <div className="flex items-center gap-2 text-slate-400 pr-2 border-r border-slate-200 shrink-0">
                <Filter size={18} />
              </div>

              <div className="relative group shrink-0 outline-none" tabIndex={0}>
                <button className={`border rounded-full px-4 py-2 min-h-[44px] text-sm outline-none cursor-pointer flex items-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-out active:scale-[0.97] will-change-transform ${!filterMonth.includes('Todos') ? 'bg-[#4A90E2] text-white border-[#4A90E2] shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                  Meses ({filterMonth.includes('Todos') ? 'Todos' : filterMonth.length})
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 flex flex-col gap-2 max-h-64 overflow-y-auto opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all">
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg font-bold text-slate-800">
                    <input type="checkbox" checked={filterMonth.includes('Todos')} onChange={(e) => {
                      if (e.target.checked) setFilterMonth(['Todos']);
                      else setFilterMonth([]);
                    }} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
                    Todos os meses
                  </label>
                  <div className="h-px bg-slate-100 my-1"></div>
                  {meses.map(m => (
                    <label key={m} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg text-slate-600">
                      <input type="checkbox" checked={!filterMonth.includes('Todos') && filterMonth.some(x => x?.toLowerCase() === m?.toLowerCase())} onChange={(e) => {
                        let novos = filterMonth.filter(x => x !== 'Todos');
                        if (e.target.checked) novos.push(m);
                        else novos = novos.filter(x => x?.toLowerCase() !== m?.toLowerCase());
                        setFilterMonth(novos.length === 0 ? ['Todos'] : novos);
                      }} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
                      {m}
                    </label>
                  ))}
                </div>
              </div>

              <div className="relative group shrink-0 outline-none" tabIndex={0}>
                <button className={`border rounded-full px-4 py-2 min-h-[44px] text-sm outline-none cursor-pointer flex items-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-out active:scale-[0.97] will-change-transform ${!filterYear.includes('Todos') ? 'bg-[#4A90E2] text-white border-[#4A90E2] shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                  Anos ({filterYear.includes('Todos') ? 'Todos' : filterYear.length})
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 flex flex-col gap-2 max-h-64 overflow-y-auto opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all">
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg font-bold text-slate-800">
                    <input type="checkbox" checked={filterYear.includes('Todos')} onChange={(e) => {
                      if (e.target.checked) setFilterYear(['Todos']);
                      else setFilterYear([]);
                    }} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
                    Todos os anos
                  </label>
                  <div className="h-px bg-slate-100 my-1"></div>
                  {anosDisponiveis.map(a => (
                    <label key={a} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg text-slate-600">
                      <input type="checkbox" checked={!filterYear.includes('Todos') && filterYear.some(y => String(y) === String(a))} onChange={(e) => {
                        let novos = filterYear.filter(x => x !== 'Todos');
                        if (e.target.checked) novos.push(a);
                        else novos = novos.filter(x => String(x) !== String(a));
                        setFilterYear(novos.length === 0 ? ['Todos'] : novos);
                      }} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
                      {a}
                    </label>
                  ))}
                </div>
              </div>

              {[
                { id: 'Todos', label: 'Todos' },
                { id: 'Publicador(a)', label: 'Publicadores' },
                { id: 'Pioneiro(a) Auxiliar', label: 'Pio. Auxiliar' },
                { id: 'Pioneiro(a) Regular', label: 'Pio. Regular' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  className={`border rounded-full px-4 py-2 min-h-[44px] text-sm outline-none cursor-pointer flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 ease-out active:scale-[0.97] will-change-transform shrink-0 ${filterType === type.id ? 'bg-[#4A90E2] text-white border-[#4A90E2] shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex flex-row gap-3 mt-4 w-full items-center justify-end">
              <Button variant="secondary" onClick={handleExportData} className="w-full md:w-auto">
                <Download size={16} className="text-emerald-600" /> Exportar Excel
              </Button>
              <Button variant="secondary" onClick={() => window.print()} className="w-full md:w-auto">
                <Download size={16} className="text-red-600" /> Exportar PDF
              </Button>
              <Button 
                variant="primary" 
                className="flex items-center justify-center gap-2 min-h-[48px] rounded-xl shadow-lg shadow-blue-100"
                onClick={() => {
                  setSelectedReport(null);
                  setIsReportModalOpen(true);
                }}
              >
                <Plus size={18} />
                Novo Registro
              </Button>
            </div>

            <div className="sm:hidden flex flex-col gap-3 mt-4">
              <Button 
                variant="primary" 
                className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl shadow-lg shadow-blue-100"
                onClick={() => {
                  setSelectedReport(null);
                  setIsReportModalOpen(true);
                }}
              >
                <Plus size={18} />
                Novo Registro
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={handleExportData} className="w-full">
                  <Download size={16} className="text-emerald-600" /> Exportar Excel
                </Button>
                <Button variant="secondary" onClick={() => window.print()} className="w-full">
                  <Download size={16} className="text-red-600" /> Exportar PDF
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${(!filterMonth.includes('Todos') && filterMonth.length === 1 && !filterYear.includes('Todos') && filterYear.length === 1 && fechamentos[`${filterMonth[0]}-${filterYear[0]}`]) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Status do Período: {(filterMonth.includes('Todos') || filterMonth.length !== 1 || filterYear.includes('Todos') || filterYear.length !== 1) ? 'Selecione apenas 1 mês e 1 ano' : `${filterMonth[0]} / ${filterYear[0]}`}</h3>
                <p className="text-xs text-slate-500">Controle de abertura e fechamento para envios</p>
              </div>
            </div>
            {!filterMonth.includes('Todos') && filterMonth.length === 1 && !filterYear.includes('Todos') && filterYear.length === 1 && (
              <button 
                onClick={() => {
                  if (!fechamentos[`${filterMonth[0]}-${filterYear[0]}`]) {
                    setIsConfirmCloseMonthOpen(true);
                  } else {
                    onToggleFechamento && onToggleFechamento(filterMonth[0], filterYear[0], true);
                  }
                }}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${ fechamentos[`${filterMonth[0]}-${filterYear[0]}`] ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100' }`}
              >
                {fechamentos[`${filterMonth[0]}-${filterYear[0]}`] ? '🔒 MÊS FECHADO (Clique p/ Abrir)' : '🔓 MÊS ABERTO (Clique p/ Fechar)'}
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="w-full bg-slate-50 sm:bg-white rounded-2xl p-2 sm:p-0">
              <table className="w-full text-left border-collapse block sm:table min-w-full sm:min-w-[800px]">
                <thead className="hidden sm:table-header-group">
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Publicador</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Horas</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estudos</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Envio</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 block sm:table-row-group">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((report, index) => (
<tr key={report.id} className="hover:bg-slate-50 sm:hover:bg-slate-50/50 transition-all duration-200 ease-out group animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards will-change-transform flex flex-col sm:table-row bg-white sm:bg-transparent p-4 sm:p-0 mb-3 sm:mb-0 rounded-[12px] sm:rounded-none shadow-md sm:shadow-none border border-slate-100 sm:border-0 sm:border-b last:border-0" style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                              {report.nome?.charAt(0)}
                            </div>
                            <div>
<div className="text-[1.1rem] font-bold text-slate-800 leading-tight">{report.nome}</div>
                              {report.enviadoPorAdmin && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Lançamento Manual</span>
                              )}
                            </div>
                          </div>
                          <span className="sm:hidden text-xs text-slate-400">Publicador</span>
                        </td>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center">
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-700 font-medium">{report.mes}</span>
                            <span className="text-xs text-slate-400">{report.ano}</span>
                          </div>
                          <span className="sm:hidden text-xs text-slate-400">Período</span>
                        </td>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center">
<span className={`text-xs font-medium px-2 py-1 rounded-lg ${ report.tipo === 'Pioneiro(a) Regular' ? 'bg-purple-50 text-purple-600' :  report.tipo === 'Pioneiro(a) Auxiliar' ? 'bg-sky-50 text-sky-600' :  'bg-slate-100 text-slate-600' }`}>
{report.tipo}
</span>
                          <span className="sm:hidden text-xs text-slate-400">Tipo</span>
                        </td>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center sm:text-center">
                          <span className="text-sm font-bold text-slate-700">{report.horas || '--'}</span>
                          <span className="sm:hidden text-xs text-slate-400">Horas</span>
                        </td>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center sm:text-center">
                          <span className="text-sm font-bold text-slate-700">{report.estudos || '0'}</span>
                          <span className="sm:hidden text-xs text-slate-400">Estudos</span>
                        </td>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center sm:text-center">
                          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                            {report.dataEnvio?.seconds ? new Date(report.dataEnvio.seconds * 1000).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '--'}
                          </span>
                          <span className="sm:hidden text-xs text-slate-400">Envio</span>
                        </td>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center sm:text-right">
                          <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditClick(report)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(report)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <span className="sm:hidden text-xs text-slate-400">Ações</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="block sm:table-row">
                      <td colSpan="7" className="px-6 py-12 text-center block sm:table-cell">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Search size={40} strokeWidth={1.5} />
                          <p className="text-sm font-medium">Nenhum relatório encontrado para os filtros aplicados.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  Mostrando <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> de <span className="text-slate-900">{sortedData.length}</span> registros
                </p>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentPage(prev => prev - 1); }}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentPage(prev => prev + 1); }}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {isReportModalOpen && (
        <ReportModal 
          report={selectedReport}
          reports={reports}
          onClose={() => setIsReportModalOpen(false)}
          onSave={selectedReport ? onUpdateReport : onAddReport}
          meses={meses}
          anos={anosDisponiveis}
          opcoesEstudos={opcoesEstudos}
        />
      )}

      {isConfigModalOpen && (
        <ConfigModal 
          onClose={() => setIsConfigModalOpen(false)}
          monthlyImage={monthlyImage}
          onSaveImage={onSaveConfig}
          fechamentos={fechamentos}
          onToggleFechamento={onToggleFechamento}
          meses={meses}
          anoAtual={filterYear[0]}
          ImageLoader={ImageLoader}
        />
      )}

      {isMissingModalOpen && (
        <MissingReportsModal 
          isOpen={isMissingModalOpen} 
          onClose={() => setIsMissingModalOpen(false)} 
          missingNames={nomesQueFaltam} 
          periodo={`${filterMonth.includes('Todos') ? 'Todos os Meses' : filterMonth[0]} / ${filterYear.includes('Todos') ? 'Todos os Anos' : filterYear[0]}`}
        />
      )}

      {isConfirmDeleteOpen && (
        <ConfirmModal 
          title="Excluir Relatório"
          message={`Tem certeza que deseja remover o relatório de ${reportToDelete?.nome}? Esta ação não pode ser desfeita.`}
          onConfirm={confirmDelete}
          onCancel={() => setIsConfirmDeleteOpen(false)}
        />
      )}

      {isConfirmCloseMonthOpen && (
        <ConfirmModal 
          title="Confirmar Fechamento"
          message="Tem certeza que deseja fechar este mês? Novos relatórios não poderão ser enviados até que seja reaberto."
          onConfirm={() => {
            onToggleFechamento && onToggleFechamento(filterMonth[0], filterYear[0], false);
            setIsConfirmCloseMonthOpen(false);
          }}
          onCancel={() => setIsConfirmCloseMonthOpen(false)}
        />
      )}
    </>
  );
}

function ReportModal({ report, reports, onClose, onSave, meses, anos, opcoesEstudos }) {
  const [formData, setFormData] = useState(report || {
    nome: '',
    mes: meses[new Date().getMonth()] || meses[0],
    ano: new Date().getFullYear().toString(),
    tipo: 'Publicador(a)',
    participou: 'SIM',
    estudos: '0',
    horas: ''
  });
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [reportError, setReportError] = useState('');

  const nomesUnicos = useMemo(() => {
    if (!reports) return [];
    return [...new Set(reports.map(r => r.nome).filter(Boolean))].sort();
  }, [reports]);

  const fetchBrotherNameSuggestions = (query) => {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    if (!Array.isArray(nomesUnicos)) {
      setSuggestions([]);
      return;
    }

    const filteredNames = nomesUnicos.filter(name => {
      if (!name || typeof name !== 'string') return false; 
      const normalizedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return normalizedName.includes(normalizedQuery);
    });

    setSuggestions(filteredNames.map(name => name.toUpperCase()));
  };
  const handleBrotherNameChange = (e) => {
  const originalValue = e.target.value;

  // 🔥 regex para detectar caracteres inválidos
  const hasInvalidChar = /[^a-zA-ZÀ-ÿ\s]/.test(originalValue);

  const cleanedValue = validarApenasLetras(originalValue).toUpperCase();

  if (hasInvalidChar) {
    setReportError('Nome inválido. Apenas letras com acentos e espaços são permitidos.');
  } else {
    setReportError('');
  }

  setFormData({ ...formData, nome: cleanedValue });

  fetchBrotherNameSuggestions(cleanedValue);
};

  const handleSuggestionClick = (name) => {
    setFormData({ ...formData, nome: name });
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setReportError('');
    
    if (!validateName(formData.nome)) {
      setReportError('Nome do publicador inválido. Permita apenas letras com acentos e espaços.');
      return;
    }

    setLoading(true);

    const nomeCorrigido = formData.nome
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
      
    const nomeBusca = nomeCorrigido
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const dadosFinal = {
      ...formData,
      nome: nomeCorrigido,
      nome_busca: nomeBusca
    };

    if (onSave) {
      const success = await onSave(dadosFinal);
      if (success !== false) onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      {/* Modal Container: Bottom Sheet no Mobile, Modal centralizado no Desktop */}
      <div className="bg-white w-full max-w-lg rounded-t-[24px] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        
        {/* Tracinho de puxar (Exclusivo Mobile) */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden bg-white shrink-0">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        {/* Cabeçalho */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
          <h2 className="text-xl font-bold text-slate-800">{report ? 'Editar Relatório' : 'Novo Lançamento'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><XCircle size={22} /></button>
        </div>
        
        {/* Formulário com scroll interno */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 sm:space-y-4 overflow-y-auto flex-1 bg-slate-50/30">
          
          <div className="relative w-full">
            <Input
              label="Nome do Irmão(ã)"
              value={formData.nome}
              onChange={handleBrotherNameChange}
              placeholder="Ex: JOÃO SILVA"
              autoComplete="off"
              required
            />
            {reportError && <p className="text-red-500 text-xs mt-1.5 ml-1">{reportError}</p>}
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-lg">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 text-sm font-medium text-slate-700 border-b border-slate-50 last:border-0"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Participou no Ministério?</label>
            <div className="flex gap-3 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200">
              <label className={`flex flex-1 items-center justify-center gap-2 text-sm font-bold cursor-pointer rounded-lg py-2.5 transition-all ${formData.participou === 'SIM' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:bg-slate-200/50'}`}>
                <input type="radio" name="participou" value="SIM" checked={formData.participou === 'SIM'} onChange={(e) => setFormData({...formData, participou: e.target.value})} className="hidden" /> SIM
              </label>
              <label className={`flex flex-1 items-center justify-center gap-2 text-sm font-bold cursor-pointer rounded-lg py-2.5 transition-all ${formData.participou === 'NÃO' ? 'bg-white text-red-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:bg-slate-200/50'}`}>
                <input type="radio" name="participou" value="NÃO" checked={formData.participou === 'NÃO'} onChange={(e) => setFormData({...formData, participou: e.target.value})} className="hidden" /> NÃO
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mês</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                value={formData.mes}
                onChange={(e) => setFormData({...formData, mes: e.target.value})}
              >
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
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ano</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                value={formData.ano}
                onChange={(e) => setFormData({...formData, ano: e.target.value})}
              >
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {formData.participou === 'SIM' && (
            <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo de Serviço</label>
                <div className="flex flex-col gap-2">
                  {['Publicador(a)', 'Pioneiro(a) Auxiliar', 'Pioneiro(a) Regular'].map(t => (
                    <button 
                      key={t} type="button" 
                      onClick={() => setFormData({...formData, tipo: t, horas: t.includes('Pioneiro') ? formData.horas : ''})} 
                      className={`p-3.5 rounded-xl border text-sm font-semibold transition-all text-left flex justify-between items-center ${formData.tipo === t ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`}
                    >
                      {t}
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${formData.tipo === t ? 'border-blue-600' : 'border-slate-300'}`}>
                        {formData.tipo === t && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.tipo?.includes('Pioneiro') && (
                <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1.5"><Clock size={14} className="text-blue-500"/> Horas Trabalhadas</label>
                  <div className="flex gap-3">
                    <select
                      value={formData.horas ? formData.horas.split(':')[0] : ''}
                      onChange={(e) => {
                        const h = e.target.value;
                        const m = formData.horas ? (formData.horas.split(':')[1] || '00') : '00';
                        setFormData({...formData, horas: `${h}:${m}`});
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                    >
                      <option value="" disabled>Horas</option>
                      {Array.from({ length: 151 }, (_, i) => <option key={i} value={i}>{i} h</option>)}
                    </select>
                    <select
                      value={formData.horas ? (formData.horas.split(':')[1] || '00') : '00'}
                      onChange={(e) => {
                        const h = formData.horas ? (formData.horas.split(':')[0] || '0') : '0';
                        const m = e.target.value;
                        setFormData({...formData, horas: `${h}:${m}`});
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                    >
                      <option value="00">00 min</option>
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1.5"><BookOpen size={14} className="text-blue-500"/> Estudos Bíblicos</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm font-medium"
                  value={formData.estudos}
                  onChange={(e) => setFormData({...formData, estudos: e.target.value})}
                >
                  {opcoesEstudos.map(n => <option key={n} value={n}>{n} {n === 1 ? 'Estudo' : 'Estudos'}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Área Fixa inferior para botões de ação */}
          <div className="pt-4 pb-6 sm:pb-2 flex gap-3 sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent sm:static sm:bg-none mt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm">Cancelar</button>
            <Button type="submit" variant="primary" className="flex-1 shadow-md py-3.5" disabled={loading}>
              {loading ? 'Salvando...' : 'Confirmar Lançamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfigModal({ onClose, monthlyImage, onSaveImage, ImageLoader }) {
  const [imgUrl, setImgUrl] = useState(monthlyImage);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileToUpload(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImgUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImg = async () => {
    setSaving(true);
    if (onSaveImage) await onSaveImage(fileToUpload || imgUrl);
    setFileToUpload(null);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Configurações Gerais</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImageIcon size={16} /> Imagem de Capa do Mês
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-4">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <Button onClick={handleSaveImg} disabled={saving} className="w-full flex items-center justify-center gap-2">
                  <Save size={18} />
                  {saving ? 'Gravando...' : 'Atualizar Capa'}
                </Button>
              </div>
              <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                <ImageLoader src={imgUrl} className="w-full h-full object-cover" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function MissingReportsModal({ isOpen, onClose, missingNames, periodo }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Ainda Faltam</h2>
            <p className="text-xs text-slate-500 font-medium">{periodo}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-full hover:bg-slate-100 transition-colors shadow-sm border border-slate-100"><XCircle size={24} /></button>
        </div>
        
        <div className="p-4 overflow-y-auto bg-slate-50/30 flex-1">
          {missingNames.length > 0 ? (
            <ul className="space-y-2">
              {missingNames.map((nome, idx) => (
                <li key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 text-sm font-bold text-slate-700 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${(idx % 15) * 30}ms` }}>
                  <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs font-bold shrink-0">
                    {nome.charAt(0)}
                  </div>
                  {nome}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-2" />
              <p className="font-medium text-sm">Todos entregaram neste período!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}