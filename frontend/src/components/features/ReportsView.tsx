import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Printer, BarChart3, Filter, Eye, EyeOff, X, Calendar, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { MonthRangePicker } from '../ui/MonthRangePicker';
import { MultiSelect } from '../ui/MultiSelect';

type FilterType = 'this_cycle' | 'past_cycle' | 'next_cycle' | 'last_6_months' | 'this_year' | 'all_time' | 'custom';
type RoleType = 'ALL' | 'TITULAR' | 'AJUDANTE';

export const ReportsView = () => {
  // Initialize with "This Cycle"
  const getCycleRange = (date: Date) => {
    const month = date.getMonth(); // 0-11
    const cycleStartMonth = Math.floor(month / 2) * 2;
    const start = new Date(date.getFullYear(), cycleStartMonth, 1);
    const end = endOfMonth(addMonths(start, 1));
    return { start, end };
  };

  const initialRange = getCycleRange(new Date());

  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [activeFilter, setActiveFilter] = useState<FilterType>('this_cycle');

  // State
  const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>([]);
  const [assignmentType, setAssignmentType] = useState<RoleType>('ALL');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'total', direction: 'desc' });

  // Format for API
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  // Queries
  const { data: weeks, isLoading, refetch } = useQuery({
    queryKey: ['reports', startStr, endStr],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/planning/weeks/reports', {
        params: { start: startStr, end: endStr }
      });
      return response.data;
    }
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['parts-templates'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/parts');
      return response.data;
    }
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/users');
      return response.data;
    }
  });

  // Handlers
  const setRange = (type: FilterType) => {
    setActiveFilter(type);
    const now = new Date();

    if (type === 'this_cycle') {
      const { start, end } = getCycleRange(now);
      setStartDate(start);
      setEndDate(end);
    } else if (type === 'past_cycle') {
      const currentCycleStart = getCycleRange(now).start;
      const pastCycleStart = subMonths(currentCycleStart, 2);
      const pastCycleEnd = endOfMonth(addMonths(pastCycleStart, 1));
      setStartDate(pastCycleStart);
      setEndDate(pastCycleEnd);
    } else if (type === 'next_cycle') {
      const currentCycleStart = getCycleRange(now).start;
      const nextCycleStart = addMonths(currentCycleStart, 2);
      const nextCycleEnd = endOfMonth(addMonths(nextCycleStart, 1));
      setStartDate(nextCycleStart);
      setEndDate(nextCycleEnd);
    } else if (type === 'last_6_months') {
      setStartDate(startOfMonth(subMonths(now, 5)));
      setEndDate(endOfMonth(now));
    } else if (type === 'this_year') {
      setStartDate(startOfYear(now));
      setEndDate(endOfYear(now));
    } else if (type === 'all_time') {
      setStartDate(new Date(2020, 0, 1));
      setEndDate(new Date(2030, 11, 31));
    }
  };

  const togglePrivilege = (priv: string) => {
    if (priv === 'ALL') {
      setSelectedPrivileges([]);
      return;
    }

    setSelectedPrivileges(prev => {
      if (prev.includes(priv)) {
        return prev.filter(p => p !== priv);
      } else {
        return [...prev, priv];
      }
    });
  };

  // Process Data
  const processData = () => {
    if (!weeks) return { byRole: [], byTemplate: [], totalParts: 0, byParticipant: [] };

    const stats: any = {};

    // 1. Initialize with ALL users
    if (allUsers.length > 0) {
      allUsers.forEach((u: any) => {
        stats[u.id] = {
          name: u.nome,
          total: 0,
          privilegio: u.privilegio,
          roles: {
            PRESIDENTE: 0,
            LEITOR: 0,
            TITULAR: 0,
            AJUDANTE: 0,
            ORACAO: 0
          },
          templates: {}
        };
      });
    }

    weeks.forEach((week: any) => {
      week.designacoes.forEach((d: any) => {
        // --- PROCESS TITULAR ---
        if (assignmentType === 'ALL' || assignmentType === 'TITULAR') {
          if (d.titularId) {
            // Template Filter for Titular
            if (selectedTemplateIds.length > 0 && !selectedTemplateIds.includes(d.parteTemplateId)) {
              // If strict check fails, skip.
              // Note: Reader parts check "ID-READER" in Assistant block. Here we check "ID".
              // So if "Estudo (Leitor)" is selected, this Titular block correctly skips.
            } else {
              const pId = d.titularId;
              const pName = d.titular?.nome || 'Desconhecido';
              const templateName = d.parteTemplate?.titulo || 'Outros';

              if (!stats[pId]) {
                stats[pId] = {
                  name: pName,
                  total: 0,
                  privilegio: 'UNKNOWN',
                  roles: { PRESIDENTE: 0, LEITOR: 0, TITULAR: 0, AJUDANTE: 0, ORACAO: 0 },
                  templates: {}
                };
              } else if (stats[pId].name === 'Desconhecido' && pName !== 'Desconhecido') {
                stats[pId].name = pName;
              }

              stats[pId].total++;

              let role = 'TITULAR';
              if (d.parteTemplate?.titulo === 'Presidente') role = 'PRESIDENTE';
              if (d.parteTemplate?.titulo.includes('Leitura')) role = 'LEITOR';
              if (d.parteTemplate?.titulo.includes('Oração')) role = 'ORACAO';

              stats[pId].roles[role] = (stats[pId].roles[role] || 0) + 1;
              stats[pId].templates[templateName] = (stats[pId].templates[templateName] || 0) + 1;
            }
          }
        }
      });

      // --- PROCESS PRESIDENT ---
      if (assignmentType === 'ALL' || assignmentType === 'TITULAR') {
        if (week.presidenteId) {
          const presidentTemplateId = 'tpl_presidente';
          if (selectedTemplateIds.length === 0 || selectedTemplateIds.includes(presidentTemplateId)) {
            const pId = week.presidenteId;
            const pName = week.presidente ? week.presidente.nome : 'Desconhecido';

            if (!stats[pId]) {
              stats[pId] = {
                name: pName,
                total: 0,
                privilegio: 'UNKNOWN',
                roles: { PRESIDENTE: 0, LEITOR: 0, TITULAR: 0, AJUDANTE: 0, ORACAO: 0 },
                templates: {}
              };
            } else if (stats[pId].name === 'Desconhecido' && pName !== 'Desconhecido') {
              stats[pId].name = pName;
            }

            stats[pId].total++;
            stats[pId].roles['PRESIDENTE']++;
            stats[pId].templates['Presidente'] = (stats[pId].templates['Presidente'] || 0) + 1;
          }
        }
      }

      week.designacoes.forEach((d: any) => {
        // --- PROCESS ASSISTANT/READER ---
        if (assignmentType === 'ALL' || assignmentType === 'AJUDANTE') {
          if (d.ajudanteId) {
            const isReader = d.parteTemplate?.requerLeitor || d.parteTemplate?.titulo.includes('Leitura');

            // Template Filter Logic
            if (selectedTemplateIds.length > 0) {
              if (isReader) {
                // Only include if "ID-READER" is selected
                if (!selectedTemplateIds.includes(`${d.parteTemplateId}-READER`)) return;
              } else {
                // Normal assistant - strictly check ID
                if (!selectedTemplateIds.includes(d.parteTemplateId)) return;
              }
            }

            const pId = d.ajudanteId;
            const pName = d.ajudante?.nome || 'Desconhecido';
            const templateName = d.parteTemplate?.titulo || 'Outros';

            if (!stats[pId]) {
              stats[pId] = {
                name: pName,
                total: 0,
                privilegio: 'UNKNOWN',
                roles: { PRESIDENTE: 0, LEITOR: 0, TITULAR: 0, AJUDANTE: 0, ORACAO: 0 },
                templates: {}
              };
            } else if (stats[pId].name === 'Desconhecido' && pName !== 'Desconhecido') {
              stats[pId].name = pName;
            }

            stats[pId].total++;

            const roleKey = isReader ? 'LEITOR' : 'AJUDANTE';
            stats[pId].roles[roleKey]++;

            const suffix = isReader ? '(Leitor)' : '(Ajudante)';
            const helperKey = `${templateName} ${suffix}`;
            stats[pId].templates[helperKey] = (stats[pId].templates[helperKey] || 0) + 1;
          }
        }
      });
    });

    let byParticipant = Object.values(stats);

    // Apply Privilege Filter
    if (selectedPrivileges.length > 0) {
      byParticipant = byParticipant.filter((p: any) => selectedPrivileges.includes(p.privilegio));
    }

    byParticipant.sort((a: any, b: any) => b.total - a.total);

    return {
      byParticipant,
      totalDesignations: byParticipant.reduce((acc: number, p: any) => acc + p.total, 0),
      count: byParticipant.length
    };
  };

  const data = processData();

  // Sorting Handler
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and Sort Data
  const filteredAndSortedData = () => {
    let result = [...data.byParticipant];

    // Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter((p: any) =>
        p.name.toLowerCase().includes(lowerTerm)
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested role properties
        if (['TITULAR', 'AJUDANTE', 'LEITOR', 'ORACAO'].includes(sortConfig.key)) {
          aValue = a.roles[sortConfig.key] || 0;
          bValue = b.roles[sortConfig.key] || 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  };

  const processedList = filteredAndSortedData();


  // Helper Components for Styles
  const FilterButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all border ${active
        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        }`}
    >
      {label}
    </button>
  );

  const PrivilegeButton = ({ type, label }: { type: string, label: string }) => {
    const isActive = type === 'ALL' ? selectedPrivileges.length === 0 : selectedPrivileges.includes(type);
    return (
      <button
        onClick={() => togglePrivilege(type)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all border ${isActive
          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          }`}
      >
        {label}
      </button>
    );
  };

  const RoleTypeButton = ({ type, label }: { type: RoleType, label: string }) => (
    <button
      onClick={() => setAssignmentType(type)}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all border ${assignmentType === type
        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        }`}
    >
      {label}
    </button>
  );

  // Generate options for MultiSelect
  const filterOptions = templates.flatMap((t: any) => {
    if (t.requerLeitor) {
      return [
        { value: t.id, label: `${t.titulo} (Titular/Condutor)` },
        { value: `${t.id}-READER`, label: `${t.titulo} (Leitor)` }
      ];
    }
    return [{ value: t.id, label: t.titulo }];
  });

  const SortableHeader = ({ label, sortKey, center = false }: { label: string, sortKey: string, center?: boolean }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th
        className={`px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors ${center ? 'text-center' : 'text-left'}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className={`flex items-center gap-2 ${center ? 'justify-center' : 'justify-start'}`}>
          {label}
          {isActive ? (
            sortConfig?.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
          ) : (
            <ArrowUpDown size={14} className="text-gray-400 opacity-0 group-hover:opacity-50" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 print:p-0 print:max-w-none">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <BarChart3 className="text-blue-600" />
            Relatórios Estatísticos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Análise detalhada de designações e participação</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          <Printer size={18} />
          Imprimir
        </button>
      </div>

      {/* Filters Container */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-6 print:hidden">

        {/* Row 1: Period & Type */}
        <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Calendar size={14} /> Período
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton active={activeFilter === 'this_cycle'} onClick={() => setRange('this_cycle')} label="Ciclo Atual" />
              <FilterButton active={activeFilter === 'next_cycle'} onClick={() => setRange('next_cycle')} label="Próximo Ciclo" />
              <FilterButton active={activeFilter === 'past_cycle'} onClick={() => setRange('past_cycle')} label="Ciclo Anterior" />
              <FilterButton active={activeFilter === 'last_6_months'} onClick={() => setRange('last_6_months')} label="Últimos 6 Meses" />
              <FilterButton active={activeFilter === 'this_year'} onClick={() => setRange('this_year')} label="Este Ano" />
              <FilterButton active={activeFilter === 'all_time'} onClick={() => setRange('all_time')} label="Todo o Período" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Filter size={14} /> Tipo
            </div>
            <div className="flex flex-wrap gap-2">
              <RoleTypeButton type="ALL" label="Ambos" />
              <RoleTypeButton type="TITULAR" label="Titular" />
              <RoleTypeButton type="AJUDANTE" label="Ajudante" />
            </div>
          </div>
        </div>

        {/* Row 2: Privilege & Custom Date */}
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Filter size={14} /> Privilégio
            </div>
            <div className="flex flex-wrap gap-2">
              <PrivilegeButton type="ALL" label="Todos" />
              <PrivilegeButton type="ANCIAO" label="Ancião" />
              <PrivilegeButton type="SERVO" label="Servo" />
              <PrivilegeButton type="PUB_HOMEM" label="Publicador" />
              <PrivilegeButton type="PUB_MULHER" label="Publicadora" />
            </div>
          </div>

          <div className="space-y-1">
            {/* Custom Date Picker */}
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Intervalo Personalizado</div>
            <div className="flex gap-4 items-center">
              <MonthRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                  setActiveFilter('custom');
                }}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Part Select & Refresh */}
        <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-end">
          <div className="w-full md:w-1/2">
            <MultiSelect
              label="Filtrar por Partes Específicas"
              options={filterOptions}
              selectedValues={selectedTemplateIds}
              onChange={setSelectedTemplateIds}
              placeholder="Todas as partes selecionadas"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-sm transition-colors"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Atualizar Relatório'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BarChart3 size={48} className="text-blue-600" />
          </div>
          <h3 className="text-blue-600 font-medium mb-1 text-sm uppercase tracking-wider">Total de Designações</h3>
          <p className="text-3xl font-bold text-gray-900">{data.totalDesignations}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Filter size={48} className="text-emerald-600" />
          </div>
          <h3 className="text-emerald-600 font-medium mb-1 text-sm uppercase tracking-wider">Participantes Ativos</h3>
          <p className="text-3xl font-bold text-gray-900">{data.count}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calendar size={48} className="text-purple-600" />
          </div>
          <h3 className="text-purple-600 font-medium mb-1 text-sm uppercase tracking-wider">Período Selecionado</h3>
          <p className="text-base font-medium text-gray-900 mt-2">
            {format(startDate, 'dd/MM/yyyy')}
            <span className="mx-2 text-gray-400">até</span>
            {format(endDate, 'dd/MM/yyyy')}
          </p>
        </div>
      </div>

      {/* Charts with Toggle */}
      <div className="grid grid-cols-1 gap-8 print:break-inside-avoid">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-gray-500" /> Participantes por Volume
            </h3>
            <button
              onClick={() => setShowChart(!showChart)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2"
            >
              {showChart ? <><EyeOff size={16} /> Ocultar Gráfico</> : <><Eye size={16} /> Ver Gráfico</>}
            </button>
          </div>

          {showChart && (
            <ResponsiveContainer width="100%" height={Math.max(400, data.byParticipant.length * 40)}>
              <BarChart
                data={data.byParticipant}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Designações" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 print:bg-transparent print:border-b-2 print:border-black flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Detalhamento por Participante</h3>
          <div className="relative print:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar participante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold print:bg-transparent">
              <tr>
                <SortableHeader label="Nome" sortKey="name" />
                <SortableHeader label="Total" sortKey="total" center />
                <SortableHeader label="Titular" sortKey="TITULAR" center />
                <SortableHeader label="Ajudante" sortKey="AJUDANTE" center />
                <SortableHeader label="Leitor" sortKey="LEITOR" center />
                <SortableHeader label="Oração" sortKey="ORACAO" center />
                <th className="px-6 py-3">Partes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedList.map((p: any) => (
                <tr key={p.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-3 text-center font-bold text-blue-600 bg-blue-50/30">{p.total}</td>
                  <td className="px-6 py-3 text-center text-gray-600">{p.roles['TITULAR'] || '-'}</td>
                  <td className="px-6 py-3 text-center text-gray-600">{p.roles['AJUDANTE'] || '-'}</td>
                  <td className="px-6 py-3 text-center text-gray-600">{p.roles['LEITOR'] || '-'}</td>
                  <td className="px-6 py-3 text-center text-gray-600">{p.roles['ORACAO'] || '-'}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {Object.entries(p.templates)
                      .sort(([, a]: any, [, b]: any) => b - a)
                      .map(([k, v]) => `${k} (${v})`)
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
