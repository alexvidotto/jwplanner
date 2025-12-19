import { Calendar, Users, List, Grid, ChevronRight, Briefcase, Printer, MessageCircle } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-200">
            <Calendar className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">JW Planner</h1>
          <p className="text-gray-500 text-sm">Planejamento de Designações</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <button onClick={() => onNavigate('/planner')} className="w-full bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Briefcase size={20} /></div>
                <div className="text-left"><p className="font-semibold text-gray-800">Planejar</p><p className="text-xs text-gray-500">Planejar semana e designar</p></div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-blue-500" size={20} />
            </button>
            <button onClick={() => onNavigate('/month')} className="w-full bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Printer size={20} /></div>
                <div className="text-left"><p className="font-semibold text-gray-800">Visão do Mês</p><p className="text-xs text-gray-500">Visualizar e imprimir mês</p></div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-indigo-500" size={20} />
            </button>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <button onClick={() => onNavigate('/participants')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-gray-50 transition-all text-center gap-2">
                <div className="bg-green-100 p-2 rounded-full text-green-700"><Users size={18} /></div>
                <span className="text-[10px] font-bold text-gray-600 uppercase">Usuários</span>
              </button>
              <button onClick={() => onNavigate('/parts')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-gray-50 transition-all text-center gap-2">
                <div className="bg-orange-100 p-2 rounded-full text-orange-700"><List size={18} /></div>
                <span className="text-[10px] font-bold text-gray-600 uppercase">Partes</span>
              </button>
              <button onClick={() => onNavigate('/skills')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-gray-50 transition-all text-center gap-2">
                <div className="bg-purple-100 p-2 rounded-full text-purple-700"><Grid size={18} /></div>
                <span className="text-[10px] font-bold text-gray-600 uppercase">Matriz</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={() => onNavigate('/tracking')} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-all group">
              <div className="flex items-center gap-3">
                <div className="bg-green-50 p-2.5 rounded-lg text-green-600"><MessageCircle size={20} /></div>
                <div className="text-left"><p className="font-semibold text-gray-800">Acompanhamento</p><p className="text-xs text-gray-500">Acompanhe status das designações</p></div>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </button>
          </div>
        </div>
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t">JW Planner v0.1.0</div>
      </div>
    </div>
  );
};
