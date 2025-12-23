import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, Clock } from 'lucide-react';

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
      const response = await axios.get('http://localhost:3000/planning/weeks/smart-suggestions');
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
      const readyParts = user.skills.map((skillId: string) => {
        const isReader = skillId.endsWith('_reader');
        const realId = isReader ? skillId.replace('_reader', '') : skillId;
        const template = templates.find(t => t.id === realId);

        if (!template) return null;

        // Name Disambiguation
        const isDuplicate = nameCounts[template.titulo] > 1;
        const displayName = isDuplicate
          ? `${template.titulo} (${formatSection(template.secao)})`
          : template.titulo;

        const lastDate = user.history[skillId];
        let status = 'NEVER'; // NEVER, READY, RECENT
        let label = 'Nunca Fez';
        let monthsDiff = 999;

        // Label Logic
        // isReader -> (Leitor)
        // isAssistant -> (Ajudante) (handled in the assistant filter block mainly, but good to be generic if logic changes)
        // Main -> (Titular) ONLY if section is 'fsm'

        const getRoleSuffix = () => {
          if (isReader) return ' (Leitor)';
          // For main parts, only show (Titular) if it is FSM
          if (template.secao === 'fsm') return ' (Titular)';
          return '';
        };

        if (lastDate) {
          const date = parseISO(lastDate);
          const now = new Date();
          // Diff in months rough calc
          monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());

          if (monthsDiff < minMonths) {
            status = 'RECENT';
          } else {
            status = 'READY';
          }
          label = formatDistanceToNow(date, { locale: ptBR, addSuffix: true }) + getRoleSuffix();
        } else {
          label = 'Nunca Fez' + getRoleSuffix();
        }

        return {
          id: skillId,
          realId,
          name: displayName,
          isReader,
          section: template.secao,
          status,
          label,
          lastDate,
          monthsDiff
        };
      }).filter((p: any) => p !== null)
        .sort((a: any, b: any) => b.monthsDiff - a.monthsDiff); // Most "ready" (oldest/never) first

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
        if (selectedPartId.endsWith('_assistant')) {
          const realId = selectedPartId.replace('_assistant', '');
          // Check if they have the base skill (meaning they can do the part)
          const hasSkill = user.readyParts.some((p: any) => p.realId === realId);
          if (!hasSkill) return false;
        } else {
          // Strict match for normal parts/readers
          const hasSkill = user.readyParts.some((p: any) => p.id === selectedPartId);
          if (!hasSkill) return false;
        }
      }
      return true;
    }).map((user: any) => {
      // If Part Filter is active, filter readyParts
      if (selectedPartId) {
        if (selectedPartId.endsWith('_assistant')) {
          const realId = selectedPartId.replace('_assistant', '');
          const basePart = user.readyParts.find((p: any) => p.realId === realId);

          if (basePart) {
            const assistantKey = `${realId}_assistant`;
            const lastDate = user.history[assistantKey];

            let status = 'NEVER';
            let label = 'Nunca Fez (Ajudante)';
            let monthsDiff = 999;

            if (lastDate) {
              const date = parseISO(lastDate);
              const now = new Date();
              monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());

              if (monthsDiff < minMonths) {
                status = 'RECENT';
              } else {
                status = 'READY';
              }
              label = formatDistanceToNow(date, { locale: ptBR, addSuffix: true }) + ' (Ajudante)';
            } else {
              label = 'Nunca Fez (Ajudante)';
            }

            return {
              ...user,
              readyParts: [{
                id: assistantKey,
                realId: realId,
                name: basePart.name, // Will include section if duplicate
                isReader: false,
                isAssistant: true,
                status,
                label,
                lastDate,
                monthsDiff
              }]
            };
          }
          return { ...user, readyParts: [] };
        }

        return {
          ...user,
          readyParts: user.readyParts.filter((p: any) => p.id === selectedPartId)
        };
      }
      return user;
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
                  Nenhuma habilidade cadastrada
                </div>
              ) : (
                user.readyParts.map((part: any) => (
                  <div key={part.id} className="flex justify-between items-center group">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${part.status === 'NEVER' ? 'text-green-700' :
                          part.status === 'READY' ? 'text-blue-700' :
                            'text-gray-400'
                          }`}>
                          {part.name}
                        </span>
                        {part.isReader && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded uppercase tracking-wider">
                            Leitor
                          </span>
                        )}
                        {part.isAssistant && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded uppercase tracking-wider">
                            Ajudante
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {part.label}
                      </div>
                    </div>

                    <div>
                      {part.status === 'NEVER' && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          Nunca
                        </span>
                      )}
                      {part.status === 'READY' && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          Disponível
                        </span>
                      )}
                      {part.status === 'RECENT' && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-400">
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
