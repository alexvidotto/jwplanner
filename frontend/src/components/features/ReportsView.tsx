import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { format, addDays, subDays, isMonday, endOfMonth } from 'date-fns';

import { BarChart3, Filter, Eye, EyeOff, Calendar, Search, ArrowUp, ArrowDown, Sparkles, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
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
  // Expanded rows as a Set for multiple toggles
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Format for API
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  // Queries
  const { data: weeks, isLoading: isLoadingReports, refetch } = useQuery({
    queryKey: ['reports', startStr, endStr],
    queryFn: async () => {
      const response = await api.get('/planning/weeks/reports', {
        params: { start: startStr, end: endStr }
      });
      return response.data;
    },
    enabled: viewMode === 'REPORTS' // Only fetch reports if in reports mode
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['parts-templates'],
    queryFn: async () => {
      const response = await api.get('/parts');
      return response.data;
    }
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const response = await api.get('/users');
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
      setStartDate(new Date(2023, 0, 1));
      setEndDate(new Date());
    }
  };

  const togglePrivilege = (type: string) => {
    if (type === 'ALL') {
      setSelectedPrivileges([]);
    } else {
      setSelectedPrivileges(prev =>
        prev.includes(type) ? prev.filter(p => p !== type) : [...prev, type]
      );
    }
  };

  const toggleRow = (name: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  // Process Data
  const processData = () => {
    if (!weeks) return { byRole: [], byTemplate: [], totalParts: 0, byParticipant: [] as any[] };

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
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all border ${active
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
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all border ${isActive
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
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all border ${assignmentType === type
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
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all border ${active
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


  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <BarChart3 className="text-blue-600" />
            Relatórios
          </h1>
          <p className="text-gray-500 text-sm mt-1">Análise detalhada de designações e participação</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto items-center">
          <button
            onClick={() => refetch()}
            disabled={isLoadingReports}
            className="p-2 text-gray-500 hover:text-blue-600 rounded-md transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw size={16} className={isLoadingReports ? "animate-spin" : ""} />
          </button>
          <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
          <button
            onClick={() => setViewMode('REPORTS')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'REPORTS'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <BarChart3 size={16} />
            Relatórios
          </button>
          <button
            onClick={() => setViewMode('SUGGESTIONS')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'SUGGESTIONS'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Sparkles size={16} />
            Sugestões
          </button>
        </div>
      </div>

      {viewMode === 'SUGGESTIONS' ? (
        <SmartSuggestions templates={templates} />
      ) : (
          <div className="flex flex-col gap-6">

            {/* Stats Cards - Grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* Periodo - FIRST NOW */}
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
                trigger={
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-purple-200 transition-colors group relative">
                    <h3 className="text-purple-600 font-bold mb-2 text-xs uppercase tracking-wider group-hover:text-purple-700">Período<br />Selecionado</h3>
                    <div className="flex flex-col gap-1 mt-3">
                      <span className="text-lg font-medium text-gray-900">{formatDateRange(startDate)}</span>
                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">ATÉ</span>
                      <span className="text-lg font-medium text-gray-900">{formatDateRange(endDate)}</span>
                    </div>
                    {/* Hover hint */}
                    <div className="absolute top-4 right-4 text-purple-200 group-hover:text-purple-500 transition-colors">
                      <Calendar size={20} />
                    </div>
                  </div>
                }
              />


            </div>

            {/* Filters Stack */}
            <div className="space-y-6">

              {/* Period Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
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

              {/* Privilege Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
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

              {/* Parts Filter Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <Filter size={14} /> Filtrar Partes
                  </div>
                  {selectedTemplateIds.length > 0 && (
                    <button
                      onClick={() => setSelectedTemplateIds([])}
                      className="text-xs text-blue-600 font-medium hover:underline"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Tesouros */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Tesouros</h4>
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

                {/* FSM */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Faça Seu Melhor</h4>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Tipo de Designação</div>
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

                {/* NVC & Outros */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Nossa Vida Cristã</h4>
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

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Outros</h4>
                    <div className="flex flex-wrap gap-2">
                      <PartFilterButton active={selectedTemplateIds.includes('tpl_presidente')} onClick={() => toggleTemplate('tpl_presidente')} label="Presidente" />
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
              </div>
            </div>

            {/* Stats Cards - Summary */}
            <div className="grid grid-cols-1 gap-4">
              {/* Total */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-blue-600 font-bold mb-2 text-xs uppercase tracking-wider">Total de<br />Designações</h3>
                <p className="text-5xl font-bold text-gray-900 tracking-tight">{data.totalDesignations}</p>
              </div>

              {/* Participantes */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-emerald-600 font-bold mb-2 text-xs uppercase tracking-wider">Participantes<br />Ativos</h3>
                <p className="text-5xl font-bold text-gray-900 tracking-tight">{data.count}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <BarChart3 size={20} className="text-gray-400" /> Participantes por Volume
                </h3>
                <button
                  onClick={() => setShowChart(!showChart)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {showChart ? <><EyeOff size={16} /> Ocultar Gráfico</> : <><Eye size={16} /> Ver Gráfico</>}
                </button>
              </div>

              {showChart && (
                <div className="space-y-4">
                  {data.byParticipant.slice(0, 15).map((p: any, index: number) => {
                    const max = data.byParticipant[0]?.total || 1;
                    const percent = (p.total / max) * 100;
                    return (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-500 w-4 text-right">{index + 1}</span>
                        <div className="w-24 sm:w-32 text-sm font-medium text-gray-700 truncate text-right shrink-0" title={p.name}>{p.name}</div>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="w-8 text-sm font-bold text-gray-900 text-left shrink-0">{p.total}</div>
                      </div>
                    );
                  })}
                  {data.byParticipant.length > 15 && (
                    <div className="text-center pt-2">
                      <span className="text-xs text-gray-400 italic">Exibindo top 15 de {data.byParticipant.length} participantes</span>
                    </div>
                  )}
                </div>
              )}
            </div>


            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="font-bold text-gray-800">Detalhamento por Participante</h3>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar participante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="w-full">
                <table className="w-full text-sm text-left table-fixed">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="w-[40px] px-2 py-3 text-center">
                        <button
                          onClick={() => {
                            if (expandedRows.size === processedList.length) {
                              setExpandedRows(new Set());
                            } else {
                              setExpandedRows(new Set(processedList.map((p: any) => p.name)));
                            }
                          }}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-100"
                          title={expandedRows.size === processedList.length ? "Recolher Todos" : "Expandir Todos"}
                        >
                          {expandedRows.size === processedList.length ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </th>
                      <th className="px-2 py-3 cursor-pointer hover:bg-gray-100 transition-colors text-left" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome</span>
                          {sortConfig?.key === 'name' && (
                            sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                          )}
                        </div>
                      </th>
                      <th className="w-[80px] px-2 py-3 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('total')}>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left w-[60%]">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Partes (Resumo)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {processedList.map((p: any) => (
                      <>
                        <tr
                          key={p.name}
                          className="hover:bg-gray-50 transition-colors cursor-pointer sm:cursor-default group"
                          onClick={() => toggleRow(p.name)}
                        >
                          <td className="pl-3 text-center align-middle">
                            {/* Indicator dot or empty */}
                            <div className={`w-1.5 h-1.5 rounded-full mx-auto transition-colors ${expandedRows.has(p.name) ? 'bg-blue-400' : 'bg-gray-200'}`} />
                          </td>
                          <td className="px-2 py-4 font-medium text-gray-900 bg-white truncate max-w-[150px] sm:max-w-none">
                            {p.name}
                          </td>
                          <td className="px-2 py-4 text-center font-bold text-blue-600 bg-blue-50/10 text-base">{p.total}</td>
                          <td className="hidden sm:table-cell px-6 py-4 text-gray-500 text-xs text-wrap leading-relaxed">
                          {Object.entries(p.templates)
                            .sort(([, a]: any, [, b]: any) => b - a)
                            .map(([k, v]) => `${k} (${v})`)
                            .join(', ')}
                        </td>
                      </tr>
                        {expandedRows.has(p.name) && (
                          <tr className="sm:hidden bg-gray-50 animate-in slide-in-from-top-1">
                            <td colSpan={3} className="px-4 py-3 text-xs text-gray-600 border-b border-gray-100">
                              <div className="font-semibold mb-1 text-gray-800">Partes Designadas:</div>
                              {Object.keys(p.templates).length > 0 ? (
                                Object.entries(p.templates)
                                  .sort(([, a]: any, [, b]: any) => b - a)
                                  .map(([k, v]) => (
                                    <div key={k} className="flex justify-between py-1 border-b border-gray-200/50 last:border-0">
                                      <span>{k}</span>
                                      <span className="font-medium bg-white px-1.5 rounded text-gray-700">{v as number}</span>
                                    </div>
                                  ))
                              ) : (
                                <span className="italic text-gray-400">Nenhuma parte neste período.</span>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {processedList.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic">
                          Nenhum registro encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

        </div>
      )}
    </div>
  );
};
