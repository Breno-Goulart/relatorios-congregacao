import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
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

import Button from '../components/Button';
import Input from '../components/Input';

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
  fechamentos,
  onLogout, 
  monthlyImage, 
  setMonthlyImage, 
  meses, 
  anosDisponiveis,
  opcoesEstudos,
  onUpdateReport,
  onDeleteReport,
  onAddReport,
  onSaveConfig,
  onToggleFechamento,
  ImageLoader
}) {
  const relatorios = reports || [];

  const [searchTerm, setSearchTerm] = useState('');
  const mesAtualDin = new Date().toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
  const [filterMonth, setFilterMonth] = useState([mesAtualDin]);
  const [filterYear, setFilterYear] = useState([new Date().getFullYear().toString()]);
  const [filterType, setFilterType] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);

  const filteredData = useMemo(() => {
    return relatorios.filter(item => {
      const matchSearch = item.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMonth = filterMonth.includes('Todos') || filterMonth.some(m => m?.toLowerCase() === item.mes?.toLowerCase());
      const matchYear = filterYear.includes('Todos') || filterYear.some(y => String(y) === String(item.ano));
      const matchType = filterType === 'Todos' || item.tipo === filterType;
      return matchSearch && matchMonth && matchYear && matchType;
    });
  }, [relatorios, searchTerm, filterMonth, filterYear, filterType]);

  const stats = useMemo(() => {
    const totalReports = filteredData.length;
    
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
      totalParticipations 
    };
  }, [filteredData]);

  const { totalReports, totalHoras, totalEstudos, totalParticipations } = stats;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
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
      await onDeleteReport(reportToDelete.id);
      setIsConfirmDeleteOpen(false);
      setReportToDelete(null);
    }
  };

  const handleExportData = () => {
    const csvContent = "Nome;Mês;Ano;Participou;Tipo;Estudos;Horas;Data de Envio\n"
      + filteredData.map(r => {
          const dt = r.dataEnvio?.seconds ? new Date(r.dataEnvio.seconds * 1000).toLocaleString('pt-BR') : '';
          return `"${r.nome}";"${r.mes}";"${r.ano}";"${r.participou}";"${r.tipo}";"${r.estudos || 0}";"${r.horas || ''}";"${dt}"`;
      }).join("\n");
      
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `relatorios_${filterMonth.includes('Todos') ? 'Todos' : filterMonth.join('-')}_${filterYear.includes('Todos') ? 'Todos' : filterYear.join('-')}.csv`);
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
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-none">Painel Administrativo</h1>
                  <p className="text-xs text-slate-500 mt-1">Gestão de Relatórios Congregação Norte</p>
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

            <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
              <Button 
                variant="primary" 
                className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl shadow-lg shadow-blue-100 active:scale-[0.98] transition-all duration-200 ease-out will-change-transform"
                onClick={() => {
                  setSelectedReport(null);
                  setIsReportModalOpen(true);
                }}
              >
                <Plus size={18} />
                Novo Registro
              </Button>
              <Button 
                variant="primary" 
                className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !shadow-emerald-200 border-none active:scale-[0.98] transition-all duration-200 ease-out will-change-transform"
                onClick={handleExportData}
              >
                <Download size={18} />
                Exportar Excel
              </Button>
              <Button 
                variant="primary" 
                className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl !bg-red-600 hover:!bg-red-700 !shadow-red-200 border-none active:scale-[0.98] transition-all duration-200 ease-out will-change-transform"
                onClick={() => window.print()}
              >
                <Download size={18} />
                Exportar PDF
              </Button>
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
                onClick={() => onToggleFechamento(filterMonth[0], filterYear[0], fechamentos[`${filterMonth[0]}-${filterYear[0]}`])}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  fechamentos[`${filterMonth[0]}-${filterYear[0]}`] ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
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
                      <tr key={report.id} className="hover:bg-slate-50 sm:hover:bg-slate-50/50 transition-all duration-200 ease-out group animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards will-change-transform flex flex-col sm:table-row bg-white sm:bg-transparent p-4 sm:p-0 mb-3 sm:mb-0 rounded-2xl sm:rounded-none shadow-sm sm:shadow-none border border-slate-100 sm:border-0 sm:border-b last:border-0" style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                              {report.nome?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{report.nome}</div>
                              {report.enviadoPorAdmin && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Lançamento Manual</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center">
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-700 font-medium">{report.mes}</span>
                            <span className="text-xs text-slate-400">{report.ano}</span>
                          </div>
                        </td>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center">
                          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                            report.tipo?.includes('Pioneiro') ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {report.tipo}
                          </span>
                        </td>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center sm:text-center">
                          <span className="text-sm font-bold text-slate-700">{report.horas || '--'}</span>
                        </td>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center sm:text-center">
                          <span className="text-sm font-bold text-slate-700">{report.estudos || '0'}</span>
                        </td>
                        <td className="px-0 sm:px-6 py-2 sm:py-4 flex justify-between sm:table-cell items-center sm:text-center">
                          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                            {report.dataEnvio?.seconds ? new Date(report.dataEnvio.seconds * 1000).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '--'}
                          </span>
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
                  Mostrando <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> de <span className="text-slate-900">{filteredData.length}</span> registros
                </p>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
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

      {isConfirmDeleteOpen && (
        <ConfirmModal 
          title="Excluir Relatório"
          message={`Tem certeza que deseja remover o relatório de ${reportToDelete?.nome}? Esta ação não pode ser desfeita.`}
          onConfirm={confirmDelete}
          onCancel={() => setIsConfirmDeleteOpen(false)}
        />
      )}
    </>
  );
}

function ReportModal({ report, onClose, onSave, meses, anos, opcoesEstudos }) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    const success = await onSave(dadosFinal);
    if (success !== false) onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{report ? 'Editar Relatório' : 'Novo Lançamento'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><XCircle size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input 
            label="Nome do Irmão(ã)" 
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value.toUpperCase()})}
            placeholder="Ex: JOÃO SILVA"
            required
          />
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Participou no Ministério?</label>
            <div className="flex gap-4 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex flex-1 items-center justify-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 rounded-lg py-1 transition-colors">
                <input type="radio" name="participou" value="SIM" checked={formData.participou === 'SIM'} onChange={(e) => setFormData({...formData, participou: e.target.value})} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" /> SIM
              </label>
              <label className="flex flex-1 items-center justify-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 rounded-lg py-1 transition-colors">
                <input type="radio" name="participou" value="NÃO" checked={formData.participou === 'NÃO'} onChange={(e) => setFormData({...formData, participou: e.target.value})} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" /> NÃO
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mês</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.mes}
                onChange={(e) => setFormData({...formData, mes: e.target.value})}
              >
                {meses.map((m, idx) => {
                  const anoAtual = new Date().getFullYear().toString();
                  const mesAtualIdx = new Date().getMonth();
                  const isFuturo = formData.ano === anoAtual && idx > mesAtualIdx;
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.ano}
                onChange={(e) => setFormData({...formData, ano: e.target.value})}
              >
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {formData.participou === 'SIM' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo de Serviço</label>
                <div className="flex flex-col gap-2">
                  {['Publicador(a)', 'Pioneiro(a) Auxiliar', 'Pioneiro(a) Regular'].map(t => (
                    <button 
                      key={t} type="button" 
                      onClick={() => setFormData({...formData, tipo: t, horas: t.includes('Pioneiro') ? formData.horas : ''})} 
                      className={`p-3 rounded-xl border text-sm font-semibold transition-all text-left ${formData.tipo === t ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {formData.tipo?.includes('Pioneiro') && (
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Horas Trabalhadas</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.horas ? formData.horas.split(':')[0] : ''}
                      onChange={(e) => {
                        const h = e.target.value;
                        const m = formData.horas ? (formData.horas.split(':')[1] || '00') : '00';
                        setFormData({...formData, horas: `${h}:${m}`});
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Estudos Bíblicos</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  value={formData.estudos}
                  onChange={(e) => setFormData({...formData, estudos: e.target.value})}
                >
                  {opcoesEstudos.map(n => <option key={n} value={n}>{n} {n === 1 ? 'Estudo' : 'Estudos'}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancelar</button>
            <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
              {loading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfigModal({ onClose, monthlyImage, onSaveImage, fechamentos, onToggleFechamento, meses, anoAtual, ImageLoader }) {
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
    await onSaveImage(fileToUpload || imgUrl);
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
                <ImageLoader src={imgUrl} className="w-full h-full" />
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
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">Excluir</button>
        </div>
      </div>
    </div>
  );
}