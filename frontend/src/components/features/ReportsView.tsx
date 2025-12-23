import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format, addDays, subDays, isMonday, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Printer, BarChart3, Filter, Eye, EyeOff, Calendar, Search, ArrowUpDown, ArrowUp, ArrowDown, Sparkles, LayoutGrid } from 'lucide-react';
import { MonthRangePicker } from '../ui/MonthRangePicker';
import { formatDateRange } from '../../lib/transformers';
import { SmartSuggestions } from './SmartSuggestions';

type FilterType = 'this_cycle' | 'past_cycle' | 'next_cycle' | 'last_6_months' | 'this_year' | 'all_time' | 'custom';
type RoleType = 'ALL' | 'TITULAR' | 'AJUDANTE';
type ViewMode = 'REPORTS' | 'SUGGESTIONS';

export const ReportsView = () => {
  // Helper: Find the first Monday of a given month
  const getFirstMonday = (year: number, month: number) => {
    let date = new Date(year, month, 1);
    while (!isMonday(date)) {
      date = addDays(date, 1);
    }
    return date;
  };

  // Helper: Get cycle limits for a specific cycle index (0=Jan-Feb, 1=Mar-Apr, etc.)
  const getCycleLimits = (year: number, cycleIndex: number) => {
    let targetYear = year;
    let targetIndex = cycleIndex;

    while (targetIndex < 0) {
      targetIndex += 6;
      targetYear -= 1;
    }
    while (targetIndex > 5) {
      targetIndex -= 6;
      targetYear += 1;
    }

    const startMonth = targetIndex * 2;
    const start = getFirstMonday(targetYear, startMonth);

    // End is Sunday before the NEXT cycle starts
    // Next cycle start month is startMonth + 2
    const nextCycleStart = getFirstMonday(targetYear, startMonth + 2);
    const end = subDays(nextCycleStart, 1);

    return { start, end };
  };

  // Helper: Determine which cycle a date belongs to
  const getCycleForDate = (date: Date) => {
    const year = date.getFullYear();
    // Check all 6 cycles of this year
    for (let i = 0; i < 6; i++) {
      const { start, end } = getCycleLimits(year, i);
      if (date >= start && date <= end) {
        return { index: i, year, start, end };
      }
    }

    // Check Previous Year Last Cycle
    const prevLast = getCycleLimits(year - 1, 5);
    if (date >= prevLast.start && date <= prevLast.end) {
      return { index: 5, year: year - 1, start: prevLast.start, end: prevLast.end };
    }

    // Check Next Year First Cycle
    const nextFirst = getCycleLimits(year + 1, 0);
    if (date >= nextFirst.start && date <= nextFirst.end) {
      return { index: 0, year: year + 1, start: nextFirst.start, end: nextFirst.end };
    }

    // Fallback default
    return { index: 0, year, ...getCycleLimits(year, 0) };
  };

  const initialCycle = getCycleForDate(new Date());

  const [startDate, setStartDate] = useState(initialCycle.start);
  const [endDate, setEndDate] = useState(initialCycle.end);
  const [activeFilter, setActiveFilter] = useState<FilterType>('this_cycle');
  const [viewMode, setViewMode] = useState<ViewMode>('REPORTS');

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
  const { data: weeks, isLoading: isLoadingReports, refetch } = useQuery({
    queryKey: ['reports', startStr, endStr],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/planning/weeks/reports', {
        params: { start: startStr, end: endStr }
      });
      return response.data;
    },
    enabled: viewMode === 'REPORTS' // Only fetch reports if in reports mode
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
    const currentCycle = getCycleForDate(now);

    if (type === 'this_cycle') {
      setStartDate(currentCycle.start);
      setEndDate(currentCycle.end);
    } else if (type === 'past_cycle') {
      const { start, end } = getCycleLimits(currentCycle.year, currentCycle.index - 1);
      setStartDate(start);
      setEndDate(end);
    } else if (type === 'next_cycle') {
      const { start, end } = getCycleLimits(currentCycle.year, currentCycle.index + 1);
      setStartDate(start);
      setEndDate(end);
    } else if (type === 'last_6_months') {
      const startLimit = getCycleLimits(currentCycle.year, currentCycle.index - 2);
      setStartDate(startLimit.start);
      setEndDate(currentCycle.end);
    } else if (type === 'this_year') {
      const first = getCycleLimits(now.getFullYear(), 0);
      const last = getCycleLimits(now.getFullYear(), 5);
      setStartDate(first.start);
      setEndDate(last.end);
    } else if (type === 'all_time') {
      setStartDate(new Date(2000, 0, 1));
      setEndDate(new Date(2100, 11, 31));
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
      className={`px-2 py-1 text-xs font-medium rounded-md transition-all border ${active
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
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all border ${isActive
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
      className={`px-2 py-1 text-xs font-medium rounded-md transition-all border ${assignmentType === type
        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        }`}
    >
      {label}
    </button>
  );

  const PartFilterButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs font-medium rounded-md transition-all border ${active
        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        }`}
    >
      {label}
    </button>
  );

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

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
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 print:p-0 print:max-w-none">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <BarChart3 className="text-blue-600" />
            Relatórios
          </h1>
          <p className="text-gray-500 text-sm mt-1">Análise detalhada de designações e participação</p>
        </div>

        <div className="flex gap-2">
          <div className="bg-gray-100 p-1 rounded-lg flex items-center mr-4">
            <button
              onClick={() => setViewMode('REPORTS')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'REPORTS'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <BarChart3 size={16} />
              Relatórios
            </button>
            <button
              onClick={() => setViewMode('SUGGESTIONS')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'SUGGESTIONS'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Sparkles size={16} />
              Sugestões
            </button>
          </div>

          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <Printer size={18} />
            Imprimir
          </button>
        </div>
      </div>

      {viewMode === 'SUGGESTIONS' ? (
        <SmartSuggestions templates={templates} />
      ) : (
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-[320px] shrink-0 space-y-4 sticky top-6 md:h-[calc(100vh-120px)] md:overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 space-y-4 print:hidden">

            {/* Period Section */}
            <div className="space-y-2">
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

            {/* Custom Date Picker */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Intervalo Personalizado</div>
              <div className="w-full">
                <MonthRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(start, end) => {
                    const adjustedStart = getFirstMonday(start.getFullYear(), start.getMonth());
                    const adjustedEnd = endOfMonth(end);
                    setStartDate(adjustedStart);
                    setEndDate(adjustedEnd);
                    setActiveFilter('custom');
                  }}
                />
              </div>
            </div>

            {/* Privilege Section */}
            <div className="space-y-2">
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

            <div className="border-t border-gray-100 my-4"></div>

            {/* Part Filters Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <Filter size={14} /> Filtar Partes
                </div>
                <button
                  onClick={() => setSelectedTemplateIds([])}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  Limpar
                </button>
              </div>

              {/* Tesouros */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">Tesouros</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.filter((o: any) => {
                    const t = templates.find((t: any) => t.id === (o.value as string).replace('-READER', ''));
                    return t?.secao === 'tesouros';
                  }).map((option: any) => (
                    <PartFilterButton
                      key={option.value}
                      active={selectedTemplateIds.includes(option.value)}
                      onClick={() => toggleTemplate(option.value)}
                      label={option.label.replace(' (Titular/Condutor)', '').replace(' (Leitor)', ' (L)')}
                    />
                  ))}
                </div>
              </div>

              {/* FSM with Role Type */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">Faça Seu Melhor</h4>

                {/* Role Type Filter Nested in FSM */}
                <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Tipo de Designação</div>
                  <div className="flex flex-wrap gap-2">
                    <RoleTypeButton type="ALL" label="Ambos" />
                    <RoleTypeButton type="TITULAR" label="Titular" />
                    <RoleTypeButton type="AJUDANTE" label="Ajudante" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filterOptions.filter((o: any) => {
                    const t = templates.find((t: any) => t.id === (o.value as string).replace('-READER', ''));
                    return t?.secao === 'fsm';
                  }).map((option: any) => (
                    <PartFilterButton
                      key={option.value}
                      active={selectedTemplateIds.includes(option.value)}
                      onClick={() => toggleTemplate(option.value)}
                      label={option.label.replace(' (Titular/Condutor)', '').replace(' (Leitor)', ' (L)')}
                    />
                  ))}
                </div>
              </div>

              {/* NVC */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">Nossa Vida Cristã</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.filter((o: any) => {
                    const t = templates.find((t: any) => t.id === (o.value as string).replace('-READER', ''));
                    return t?.secao === 'nvc';
                  }).map((option: any) => (
                    <PartFilterButton
                      key={option.value}
                      active={selectedTemplateIds.includes(option.value)}
                      onClick={() => toggleTemplate(option.value)}
                      label={option.label.replace(' (Titular/Condutor)', '').replace(' (Leitor)', ' (L)')}
                    />
                  ))}
                </div>
              </div>

              {/* Outros */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">Outros</h4>
                <div className="flex flex-wrap gap-2">
                  <PartFilterButton
                    active={selectedTemplateIds.includes('tpl_presidente')}
                    onClick={() => toggleTemplate('tpl_presidente')}
                    label="Presidente"
                  />
                  {filterOptions.filter((o: any) => {
                    const t = templates.find((t: any) => t.id === (o.value as string).replace('-READER', ''));
                    return !['tesouros', 'fsm', 'nvc'].includes(t?.secao || '') && o.value !== 'tpl_presidente';
                  }).map((option: any) => (
                    <PartFilterButton
                      key={option.value}
                      active={selectedTemplateIds.includes(option.value)}
                      onClick={() => toggleTemplate(option.value)}
                      label={option.label.replace(' (Titular/Condutor)', '').replace(' (Leitor)', ' (L)')}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => refetch()}
                    disabled={isLoadingReports}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold shadow-sm transition-all active:scale-95 text-sm"
              >
                    {isLoadingReports ? <Loader2 className="animate-spin" size={16} /> : 'Atualizar Relatório'}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-8">
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
                {formatDateRange(startDate)}
                <span className="mx-2 text-gray-400">até</span>
                {formatDateRange(endDate)}
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
      </div>
      )}
    </div>
  );
};
