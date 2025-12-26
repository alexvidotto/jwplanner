
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter } from 'lucide-react';

interface SmartSuggestionsProps {
  templates: any[];
}

export const SmartSuggestions = ({ templates }: SmartSuggestionsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [minMonths] = useState(3); // Filter: Show parts not done in X months

  // Helper for section formatting
  const formatSection = (sec: string) => {
    const map: Record<string, string> = {
      'tesouros': 'Tesouros',
      'fsm': 'Faça Seu Melhor',
      'nvc': 'Vida Cristã',
    };
    return map[sec] || sec;
  };

  // Analyze templates for duplicates
  const { partOptions, nameCounts } = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const counts: Record<string, number> = {};

    // Count occurrences of each title to detect duplicates
    templates.forEach(t => {
      counts[t.titulo] = (counts[t.titulo] || 0) + 1;
    });

    templates.forEach(t => {
      const isDuplicate = counts[t.titulo] > 1;
      const sectionLabel = isDuplicate ? ` (${formatSection(t.secao)})` : '';

      // Add Main Role (Titular/Condutor)
      const mainLabel = t.titulo + sectionLabel + (t.requerLeitor ? ' (Titular)' : '');
      options.push({ value: t.id, label: mainLabel });

      // Add Reader Role if applicable
      if (t.requerLeitor) {
        options.push({
          value: `${t.id}_reader`,
          label: `${t.titulo}${sectionLabel} (Leitor)`
        });
      }

      // Add Assistant Role if applicable
      if (t.requerAjudante) {
        options.push({
          value: `${t.id}_assistant`,
          label: `${t.titulo}${sectionLabel} (Ajudante)`
        });
      }
    });

    return {
      partOptions: options.sort((a, b) => a.label.localeCompare(b.label)),
      nameCounts: counts
    };
  }, [templates]);

  // Fetch Suggestions Data
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['smart-suggestions'],
    queryFn: async () => {
      const response = await api.get('/planning/weeks/smart-suggestions');
      return response.data;
    }
  });

  const togglePrivilege = (priv: string) => {
    setSelectedPrivileges(prev =>
      prev.includes(priv) ? prev.filter(p => p !== priv) : [...prev, priv]
    );
  };

  const filteredData = useMemo(() => {
    if (!suggestions) return [];

    let result = suggestions.map((user: any) => {
      // Enhance user with "Ready Parts"
      const readyParts = user.skills.flatMap((skillId: string) => {
        const isReader = skillId.endsWith('_reader');
        const realId = isReader ? skillId.replace('_reader', '') : skillId;
        const template = templates.find(t => t.id === realId);

        if (!template) return [];

        const parts = [];

        // Name Disambiguation
        const isDuplicate = nameCounts[template.titulo] > 1;
        const displayName = isDuplicate
          ? `${template.titulo} (${formatSection(template.secao)})`
          : template.titulo;

        // 1. Main Role (Titular / Leitor)
        // Verify if history exists
        const lastDate = user.history[skillId];


        const getRoleSuffix = (isAsst = false) => {
          if (isAsst) return ' (Ajudante)';
          if (isReader) return ' (Leitor)';
          if (template.secao === 'fsm') return ' (Titular)';
          return '';
        };

        const calculateStatus = (dateStr?: string) => {
          if (!dateStr) return { status: 'NEVER', label: 'Nunca Fez', monthsDiff: 999 };
          const date = parseISO(dateStr);
          const now = new Date();
          const diff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
          const st = diff < minMonths ? 'RECENT' : 'READY';
          const lbl = formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
          return { status: st, label: lbl, monthsDiff: diff };
        };

        const mainStats = calculateStatus(lastDate);

        parts.push({
          id: skillId,
          realId,
          name: displayName,
          isReader,
          isAssistant: false,
          section: template.secao,
          status: mainStats.status,
          label: mainStats.label + getRoleSuffix(false),
          lastDate,
          monthsDiff: mainStats.monthsDiff
        });

        // 2. Assistant Role (if applicable and NOT reader)
        if (!isReader && template.requerAjudante) {
          const assistantKey = `${realId}_assistant`;
          const asstDate = user.history[assistantKey];
          const asstStats = calculateStatus(asstDate);

          parts.push({
            id: assistantKey,
            realId,
            name: displayName, // Same name
            isReader: false,
            isAssistant: true,
            section: template.secao,
            status: asstStats.status,
            label: asstStats.label + getRoleSuffix(true),
            lastDate: asstDate,
            monthsDiff: asstStats.monthsDiff
          });
        }

        return parts;
      }).sort((a: any, b: any) => {
        // Sort by status priority: NEVER > READY > RECENT
        const getWeight = (s: string) => {
          if (s === 'NEVER') return 3;
          if (s === 'READY') return 2;
          return 1;
        };
        const wA = getWeight(a.status);
        const wB = getWeight(b.status);
        if (wA !== wB) return wB - wA;
        return b.monthsDiff - a.monthsDiff;
      });

      return { ...user, readyParts };
    });

    // Apply Filters
    return result.filter((user: any) => {
      // 1. Search Term
      if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // 2. Privilege
      if (selectedPrivileges.length > 0 && !selectedPrivileges.includes(user.privilege)) {
        return false;
      }
      // 3. Part Filter
      if (selectedPartId) {
        const hasSkill = user.readyParts.some((p: any) => p.id === selectedPartId);
        if (!hasSkill) return false;
      }
      return true;
    }).map((user: any) => {
      // If Part Filter is active, filter readyParts locally
      if (selectedPartId) {
        return {
          ...user,
          readyParts: user.readyParts.filter((p: any) => p.id === selectedPartId)
        };
      }
      return user;
    }).sort((a: any, b: any) => {
      // Sort Logic:
      // 1. If Part Filter is active, sort by THAT part's status
      // 2. 'NEVER' comes first (monthsDiff = 999 or similar high logic, but we use status)
      // 3. Then 'READY' (sorted by monthsDiff DESC -> longest time ago first)
      // 4. Then 'RECENT' (sorted by monthsDiff DESC)

      if (selectedPartId) {
        const partA = a.readyParts[0]; // Should have only 1 if filtered
        const partB = b.readyParts[0];

        if (!partA && !partB) return 0;
        if (!partA) return 1;
        if (!partB) return -1;

        // Custom weight for status
        const getWeight = (p: any) => {
          if (p.status === 'NEVER') return 3;
          if (p.status === 'READY') return 2;
          return 1;
        };

        const weightA = getWeight(partA);
        const weightB = getWeight(partB);

        if (weightA !== weightB) {
          return weightB - weightA; // Higher weight first
        }

        // If same weight, sort by time (Longest ago first)
        // For NEVER, monthsDiff is 999, so it doesn't matter much (stable)
        // For READY/RECENT, we want larger monthsDiff first
        return partB.monthsDiff - partA.monthsDiff;
      }

      // Default Sort (No part selected): Sort by "Best" available suggestion
      // We can sort by the count of 'NEVER' parts, then 'READY' parts?
      // Or just alphabetical for now if no filter?
      // User specific request was likely about the specific filtered view.
      // Let's keep alphabetical for 'All' or maybe sort by "Most Available"?
      // Let's default to Name for non-filtered to keep it stable, 
      // UNLESS user wants generally "underused" people top. 
      // Let's sticking to Name for general view for now to avoid chaos.
      return a.name.localeCompare(b.name);
    });
  }, [suggestions, searchTerm, selectedPrivileges, templates, minMonths, selectedPartId, nameCounts]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar publicador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="relative w-full md:w-64">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-sm text-gray-600"
              >
                <option value="">Todas as Partes</option>
                {partOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {['ANCIAO', 'SERVO', 'PUB_HOMEM', 'PUB_MULHER'].map(priv => (
              <button
                key={priv}
                onClick={() => togglePrivilege(priv)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedPrivileges.includes(priv)
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {priv === 'ANCIAO' ? 'Ancião' :
                  priv === 'SERVO' ? 'Servo' :
                    priv === 'PUB_HOMEM' ? 'Publicador' : 'Publicadora'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((user: any) => (
          <div key={user.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800">{user.name}</h3>
                <p className="text-xs text-gray-500 capitalize">
                  {user.privilege === 'PUB_MULHER' ? 'Publicadora' :
                    user.privilege === 'PUB_HOMEM' ? 'Publicador' :
                      user.privilege === 'ANCIAO' ? 'Ancião' :
                        user.privilege === 'SERVO' ? 'Servo Ministerial' : user.privilege}
                </p>
              </div>
              <div className="px-2 py-1 bg-white rounded text-xs font-mono text-gray-400 border border-gray-100">
                {user.readyParts.filter((p: any) => p.status !== 'RECENT').length} sugestões
              </div>
            </div>

            <div className="p-4 space-y-3">
              {user.readyParts.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Nenhuma habilidade correspondente
                </div>
              ) : (
                user.readyParts.map((part: any) => (
                  <div key={part.id} className="flex justify-between items-center group py-1 border-b border-gray-50/50 last:border-0 hover:bg-gray-50/80 px-2 -mx-2 rounded transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-semibold truncate ${part.status === 'NEVER' ? 'text-green-700' :
                            part.status === 'READY' ? 'text-blue-700' :
                            'text-gray-400'
                          }`}>
                          {part.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5">
                        <span className="opacity-75">{part.label}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {part.status === 'NEVER' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide border border-green-200">
                          Nunca
                        </span>
                      )}
                      {part.status === 'READY' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-wide border border-blue-100">
                          Disponível
                        </span>
                      )}
                      {part.status === 'RECENT' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-400 uppercase tracking-wide">
                          Recente
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            Nenhum publicador encontrado com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
};
