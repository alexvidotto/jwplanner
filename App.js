import './index.css'
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  User, 
  Users, 
  MessageCircle, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search, 
  ArrowLeft,
  AlertTriangle,
  Briefcase,
  Trash2,
  Plus,
  Edit2,
  Save,
  FileText,
  MoreVertical,
  Info,
  CalendarX,
  Check,
  Printer,
  History,
  Send,
  Smartphone,
  List,
  Grid,
  Book,
  Minus,
  Ban
} from 'lucide-react';

// --- HELPER FUNCTIONS ---

const parseTime = (timeStr) => {
  const match = timeStr.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : 0;
};

const formatTotalTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const mStr = m < 10 ? `0${m}` : m;
  return `${h}h ${mStr}min`;
};

// --- INITIAL MOCK DATA ---

const INITIAL_PART_TEMPLATES = [
  { id: 'tpl_discurso', title: 'Discurso Público', defaultTime: '30 min', section: 'tesouros', requiresAssistant: false, requiresReader: false, allowedPrivileges: ['ANCIAO', 'SERVO'] },
  { id: 'tpl_joias', title: 'Jóias Espirituais', defaultTime: '10 min', section: 'tesouros', requiresAssistant: false, requiresReader: false, allowedPrivileges: ['ANCIAO', 'SERVO'] },
  { id: 'tpl_leitura', title: 'Leitura da Bíblia', defaultTime: '4 min', section: 'tesouros', requiresAssistant: false, requiresReader: false, allowedPrivileges: ['PH'] },
  
  { id: 'tpl_iniciando', title: 'Iniciando Conversas', defaultTime: '3 min', section: 'fsm', requiresAssistant: true, requiresReader: false, allowedPrivileges: ['ANY'] },
  { id: 'tpl_cultivando', title: 'Cultivando o Interesse', defaultTime: '4 min', section: 'fsm', requiresAssistant: true, requiresReader: false, allowedPrivileges: ['ANY'] },
  { id: 'tpl_fazendo', title: 'Fazendo Discípulos', defaultTime: '5 min', section: 'fsm', requiresAssistant: true, requiresReader: false, allowedPrivileges: ['ANY'] },
  { id: 'tpl_crencas', title: 'Explique suas Crenças', defaultTime: '5 min', section: 'fsm', requiresAssistant: true, requiresReader: false, allowedPrivileges: ['ANY'] },
  
  { id: 'tpl_necessidades', title: 'Necessidades Locais', defaultTime: '15 min', section: 'nvc', requiresAssistant: false, requiresReader: false, allowedPrivileges: ['ANCIAO'] },
  { id: 'tpl_estudo', title: 'Estudo Bíblico', defaultTime: '30 min', section: 'nvc', requiresAssistant: false, requiresReader: true, allowedPrivileges: ['ANCIAO'] },
  { id: 'tpl_oracao', title: 'Oração Final', defaultTime: '5 min', section: 'nvc', requiresAssistant: false, requiresReader: false, allowedPrivileges: ['PH', 'ANCIAO', 'SERVO'] },
];

const INITIAL_PARTICIPANTS = [
  // --- ANCIÃOS (8) ---
  { id: 'p1', name: 'Alex Vidotto', type: 'ANCIAO', gender: 'PH', abilities: ['tpl_discurso', 'tpl_leitura', 'tpl_estudo', 'tpl_oracao', 'tpl_necessidades'], phone: '(11) 99876-5432', active: true },
  { id: 'p6', name: 'Carlos Oliveira', type: 'ANCIAO', gender: 'PH', abilities: ['tpl_discurso', 'tpl_joias', 'tpl_necessidades', 'tpl_estudo'], phone: '(11) 95555-4444', active: true },
  { id: 'a1', name: 'Ricardo Mendes', type: 'ANCIAO', gender: 'PH', abilities: ['tpl_discurso', 'tpl_estudo', 'tpl_oracao', 'tpl_necessidades'], phone: '(11) 97777-1111', active: true },
  { id: 'a2', name: 'Roberto Almeida', type: 'ANCIAO', gender: 'PH', abilities: ['tpl_discurso', 'tpl_joias', 'tpl_estudo'], phone: '(11) 97777-2222', active: true },
  { id: 'a3', name: 'Paulo Ferreira', type: 'ANCIAO', gender: 'PH', abilities: ['tpl_discurso', 'tpl_leitura', 'tpl_oracao'], phone: '(11) 97777-3333', active: true },
  { id: 'a4', name: 'Marcos Costa', type: 'ANCIAO', gender: 'PH', abilities: ['tpl_discurso', 'tpl_estudo', 'tpl_necessidades'], phone: '(11) 97777-4444', active: true },
  { id: 'a5', name: 'Jorge Amado', type: 'ANCIAO', gender: 'PH', abilities: ['tpl_discurso', 'tpl_joias', 'tpl_oracao'], phone: '(11) 97777-5555', active: true },
  { id: 'a6', name: 'Fernando Rocha', type: 'ANCIAO', gender: 'PH', abilities: ['tpl_discurso', 'tpl_estudo', 'tpl_necessidades'], phone: '(11) 97777-6666', active: true },

  // --- SERVOS MINISTERIAIS (7) ---
  { id: 'p2', name: 'João Silva', type: 'SERVO', gender: 'PH', abilities: ['tpl_leitura', 'tpl_oracao', 'tpl_discurso'], phone: '(11) 91234-5678', active: true },
  { id: 's1', name: 'André Souza', type: 'SERVO', gender: 'PH', abilities: ['tpl_leitura', 'tpl_oracao', 'tpl_joias'], phone: '(11) 96666-1111', active: true },
  { id: 's2', name: 'Bruno Lima', type: 'SERVO', gender: 'PH', abilities: ['tpl_leitura', 'tpl_oracao', 'tpl_discurso'], phone: '(11) 96666-2222', active: true },
  { id: 's3', name: 'Daniel Carvalho', type: 'SERVO', gender: 'PH', abilities: ['tpl_leitura', 'tpl_joias'], phone: '(11) 96666-3333', active: true },
  { id: 's4', name: 'Eduardo Santos', type: 'SERVO', gender: 'PH', abilities: ['tpl_oracao', 'tpl_discurso'], phone: '(11) 96666-4444', active: true },
  { id: 's5', name: 'Felipe Martins', type: 'SERVO', gender: 'PH', abilities: ['tpl_leitura', 'tpl_oracao'], phone: '(11) 96666-5555', active: true },
  { id: 's6', name: 'Gabriel Pereira', type: 'SERVO', gender: 'PH', abilities: ['tpl_leitura', 'tpl_joias', 'tpl_discurso'], phone: '(11) 96666-6666', active: true },

  // --- PUBLICADORES (20) ---
  { id: 'p5', name: 'Pedro Santos', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_leitura', 'tpl_oracao', 'tpl_estudo_reader'], phone: '(11) 96666-5555', active: false },
  { id: 'ph1', name: 'Lucas Barbosa', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_leitura', 'tpl_oracao', 'tpl_iniciando'], phone: '(11) 95555-1111', active: true },
  { id: 'ph2', name: 'Mateus Oliveira', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_leitura', 'tpl_iniciando', 'tpl_cultivando'], phone: '(11) 95555-2222', active: true },
  { id: 'ph3', name: 'Thiago Rodrigues', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_oracao', 'tpl_fazendo'], phone: '(11) 95555-3333', active: true },
  { id: 'ph4', name: 'Rafael Costa', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_leitura', 'tpl_crencas'], phone: '(11) 95555-4444', active: true },
  { id: 'ph5', name: 'Gustavo Alves', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 95555-5555', active: true },
  { id: 'ph6', name: 'Henrique Dias', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_leitura', 'tpl_oracao'], phone: '(11) 95555-6666', active: true },
  { id: 'ph7', name: 'Igor Nunes', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_iniciando', 'tpl_fazendo'], phone: '(11) 95555-7777', active: true },
  { id: 'ph8', name: 'Julio Cesar', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_cultivando', 'tpl_crencas'], phone: '(11) 95555-8888', active: true },
  { id: 'ph9', name: 'Kevin Rocha', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_leitura', 'tpl_oracao'], phone: '(11) 95555-9999', active: true },
  { id: 'ph10', name: 'Leandro Gomes', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 95555-0000', active: true },
  { id: 'ph11', name: 'Marcelo Vieira', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_fazendo', 'tpl_crencas'], phone: '(11) 94444-1111', active: true },
  { id: 'ph12', name: 'Nicolas Fernandes', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_leitura', 'tpl_oracao'], phone: '(11) 94444-2222', active: true },
  { id: 'ph13', name: 'Otávio Martins', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 94444-3333', active: true },
  { id: 'ph14', name: 'Pablo Soares', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_fazendo'], phone: '(11) 94444-4444', active: true },
  { id: 'ph15', name: 'Renan Ribeiro', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_leitura'], phone: '(11) 94444-5555', active: true },
  { id: 'ph16', name: 'Samuel Lopes', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_oracao', 'tpl_iniciando'], phone: '(11) 94444-6666', active: true },
  { id: 'ph17', name: 'Vitor Hugo', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_cultivando', 'tpl_fazendo'], phone: '(11) 94444-7777', active: true },
  { id: 'ph18', name: 'William Cardoso', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_crencas', 'tpl_leitura'], phone: '(11) 94444-8888', active: true },
  { id: 'ph19', name: 'Yuri Mendes', type: 'PUB_HOMEM', gender: 'PH', abilities: ['tpl_oracao', 'tpl_iniciando'], phone: '(11) 94444-9999', active: true },

  // --- PUBLICADORAS (20) ---
  { id: 'p3', name: 'Natália Braz', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 98888-7777', active: true },
  { id: 'p4', name: 'Maria Souza', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_iniciando', 'tpl_cultivando', 'tpl_fazendo'], phone: '(11) 97777-6666', active: true },
  { id: 'pm1', name: 'Ana Clara', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 93333-1111', active: true },
  { id: 'pm2', name: 'Beatriz Lima', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_fazendo', 'tpl_crencas'], phone: '(11) 93333-2222', active: true },
  { id: 'pm3', name: 'Camila Rocha', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 93333-3333', active: true },
  { id: 'pm4', name: 'Daniela Alves', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_fazendo', 'tpl_crencas'], phone: '(11) 93333-4444', active: true },
  { id: 'pm5', name: 'Eliana Costa', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 93333-5555', active: true },
  { id: 'pm6', name: 'Fernanda Dias', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_fazendo', 'tpl_crencas'], phone: '(11) 93333-6666', active: true },
  { id: 'pm7', name: 'Gabriela Nunes', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 93333-7777', active: true },
  { id: 'pm8', name: 'Helena Gomes', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_fazendo', 'tpl_crencas'], phone: '(11) 93333-8888', active: true },
  { id: 'pm9', name: 'Isabela Vieira', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 93333-9999', active: true },
  { id: 'pm10', name: 'Juliana Fernandes', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_fazendo', 'tpl_crencas'], phone: '(11) 93333-0000', active: true },
  { id: 'pm11', name: 'Larissa Martins', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 92222-1111', active: true },
  { id: 'pm12', name: 'Mariana Soares', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_fazendo', 'tpl_crencas'], phone: '(11) 92222-2222', active: true },
  { id: 'pm13', name: 'Nicole Ribeiro', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 92222-3333', active: true },
  { id: 'pm14', name: 'Olivia Lopes', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_fazendo', 'tpl_crencas'], phone: '(11) 92222-4444', active: true },
  { id: 'pm15', name: 'Patrícia Cardoso', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 92222-5555', active: true },
  { id: 'pm16', name: 'Rafaela Mendes', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_fazendo', 'tpl_crencas'], phone: '(11) 92222-6666', active: true },
  { id: 'pm17', name: 'Sabrina Castro', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_iniciando', 'tpl_cultivando'], phone: '(11) 92222-7777', active: true },
  { id: 'pm18', name: 'Tatiane Melo', type: 'PUB_MULHER', gender: 'PM', abilities: ['tpl_fazendo', 'tpl_crencas'], phone: '(11) 92222-8888', active: true },
];

const MOCK_HISTORY_DATA = {
  'p1': [
    { id: 'h1', date: '15/12/2023', title: 'Presidente da Reunião', role: 'Titular', status: 'CONFIRMADO' },
    { id: 'h2', date: '01/12/2023', title: 'Discurso: Necessidades Locais', role: 'Titular', status: 'CONFIRMADO' },
    { id: 'h3', date: '15/11/2023', title: 'Leitura da Bíblia', role: 'Titular', status: 'RECUSADO' },
  ],
  'p3': [
    { id: 'h4', date: '22/12/2023', title: 'Iniciando Conversas', role: 'Titular', partner: 'Maria Souza', status: 'PENDENTE' },
    { id: 'h5', date: '10/11/2023', title: 'Cultivando o Interesse', role: 'Ajudante', partner: 'Maria Souza', status: 'CONFIRMADO' },
  ],
  'p4': [
    { id: 'h6', date: '22/12/2023', title: 'Iniciando Conversas', role: 'Ajudante', partner: 'Natália Braz', status: 'PENDENTE' },
  ]
};

const generateWeek = (id, dateLabel, offset = 0) => ({
  id,
  dateLabel,
  isCanceled: false,
  presidentId: offset === 0 ? null : 'p1', 
  presidentStatus: 'CONFIRMADO',
  presidentDescription: '',
  openingPrayerId: offset === 0 ? null : 'p1',
  openingPrayerStatus: 'PENDENTE',
  openingPrayerDescription: '',
  sections: [
    {
      id: 'tesouros',
      title: 'Tesouros da Palavra de Deus',
      color: 'bg-gray-600',
      allowAdd: false,
      parts: [
        { id: `t1-${id}`, templateId: 'tpl_discurso', title: 'Discurso', time: '10 min', description: '', assignedTo: offset === 0 ? 'p1' : 'p6', status: 'CONFIRMADO' },
        { id: `t2-${id}`, templateId: 'tpl_joias', title: 'Jóias Espirituais', time: '10 min', description: '', assignedTo: null, status: 'PENDENTE' },
        { id: `t3-${id}`, templateId: 'tpl_leitura', title: 'Leitura da Bíblia', time: '4 min', description: '', assignedTo: 'p2', status: 'PENDENTE' },
      ]
    },
    {
      id: 'fsm',
      title: 'Faça Seu Melhor no Ministério',
      color: 'bg-yellow-600',
      allowAdd: true,
      parts: [
        { 
          id: `f1-${id}`, 
          templateId: 'tpl_iniciando',
          title: 'Iniciando Conversas', 
          time: '3 min', 
          description: 'Lição 1, ponto 4', 
          assignedTo: 'p3', 
          status: 'PENDENTE',
          assistantId: 'p4', 
          assistantStatus: 'PENDENTE' 
        },
        { 
          id: `f2-${id}`, 
          templateId: 'tpl_cultivando',
          title: 'Cultivando o Interesse', 
          time: '4 min', 
          description: '', 
          assignedTo: null, 
          status: 'PENDENTE',
          assistantId: null, 
          assistantStatus: 'PENDENTE'
        },
      ]
    },
    {
      id: 'nvc',
      title: 'Nossa Vida Cristã',
      color: 'bg-red-700',
      allowAdd: true,
      parts: [
        { id: `n1-${id}`, templateId: 'tpl_necessidades', title: 'Necessidades Locais', time: '15 min', description: '', assignedTo: null, status: 'PENDENTE' },
        { 
          id: `n2-${id}`, 
          templateId: 'tpl_estudo',
          title: 'Estudo Bíblico de Congregação', 
          time: '30 min', 
          description: '', 
          assignedTo: 'p6', 
          status: 'CONFIRMADO',
          readerId: 'p5', 
          readerStatus: 'PENDENTE'
        },
        { id: `n_prayer-${id}`, templateId: 'tpl_oracao', title: 'Oração Final', time: '5 min', description: '', assignedTo: null, status: 'PENDENTE' },
      ]
    }
  ]
});

const MOCK_WEEKS = [
  generateWeek('week-0', '08-14 de Dezembro', -1),
  generateWeek('week-1', '15-21 de Dezembro', 0),
  generateWeek('week-2', '22-28 de Dezembro', 1),
];

const STATUS_OPTIONS = [
  { value: 'CONFIRMADO', label: 'Confirmado', color: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-800' },
  { value: 'PENDENTE', label: 'Pendente', color: 'bg-yellow-400', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { value: 'RECUSADO', label: 'Recusado', color: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-800' },
];

const PRIVILEGE_OPTIONS = [
  { value: 'ANCIAO', label: 'Ancião' },
  { value: 'SERVO', label: 'Servo Ministerial' },
  { value: 'PUB_HOMEM', label: 'Publicador (H)' },
  { value: 'PUB_MULHER', label: 'Publicador (M)' },
];

// --- COMPONENTES UI REUTILIZÁVEIS ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = "", disabled = false, ...props }) => {
  const baseStyle = "font-medium rounded-lg transition-colors flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 print:hidden",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 print:hidden",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 print:border-gray-400",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 print:hidden",
    success: "bg-green-100 text-green-700 hover:bg-green-200 print:hidden",
    ghost: "text-gray-500 hover:bg-gray-100 print:hidden"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    icon: "p-2"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} {...props}>
      {children}
    </button>
  );
};

const Badge = ({ status }) => {
  const styles = {
    CONFIRMADO: "bg-green-100 text-green-800",
    PENDENTE: "bg-yellow-100 text-yellow-800",
    RECUSADO: "bg-red-100 text-red-800",
    SUBSTITUIDO: "bg-gray-100 text-gray-600"
  };
  
  const labels = {
    CONFIRMADO: "Confirmado",
    PENDENTE: "Pendente",
    RECUSADO: "Recusou",
    SUBSTITUIDO: "Substituído"
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium print:border print:border-gray-300 print:text-black print:bg-white ${styles[status] || styles.PENDENTE}`}>
      {labels[status] || status}
    </span>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>Confirmar</Button>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type = 'success', isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white animate-in slide-in-from-bottom-5 fade-in duration-300 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

const StatusEditMenu = ({ status, onChange, variant = 'badge', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const currentStatus = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[1];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (e, value) => {
    e.stopPropagation();
    onChange(value);
    setIsOpen(false);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!disabled) setIsOpen(!isOpen);
  };

  const renderTrigger = () => {
    if (variant === 'circle') {
      return (
        <button 
          onClick={handleToggle}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={currentStatus.label}
        >
          <div className={`w-4 h-4 rounded-full ${currentStatus.color}`} />
        </button>
      );
    }
    return (
      <button 
        onClick={handleToggle}
        className={`px-2 py-0.5 rounded-full text-xs font-medium border border-transparent transition-all hover:brightness-95 hover:border-black/10 flex items-center gap-1 ${currentStatus.bg} ${currentStatus.text} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${currentStatus.color}`} />
        {currentStatus.label}
      </button>
    );
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {renderTrigger()}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          <div className="py-1">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={(e) => handleSelect(e, opt.value)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 group transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${opt.color} ring-2 ring-transparent group-hover:ring-gray-200`} />
                <span className={status === opt.value ? 'font-semibold text-gray-900' : 'text-gray-600'}>
                  {opt.label}
                </span>
                {status === opt.value && <Check size={14} className="ml-auto text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const EditableField = ({ value, onChange, className = "", placeholder = "" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) onChange(localValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleBlur();
  };

  if (isEditing) {
    return (
      <input autoFocus value={localValue} onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} placeholder={placeholder} className={`bg-white border border-blue-400 rounded px-1 outline-none shadow-sm min-w-[60px] ${className}`} />
    );
  }

  return (
    <div onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className={`cursor-pointer hover:bg-gray-100 rounded px-1 border border-transparent hover:border-gray-200 transition-colors ${className}`} title="Clique para editar">
      {value}
    </div>
  );
};

const EditableDescription = ({ value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => { setLocalValue(value || ''); }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) onChange(localValue);
  };

  if (isEditing) {
    return (
      <textarea autoFocus value={localValue} onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur} className="w-full mt-1 p-2 text-sm border border-blue-400 rounded-lg focus:outline-none bg-white shadow-sm" rows={2} placeholder="Ex: Lição 3, ponto 4" />
    );
  }

  if (!value) {
    return (
      <div onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="mt-1 text-xs text-gray-400 hover:text-blue-500 cursor-pointer flex items-center gap-1 w-fit px-1 rounded hover:bg-gray-50">
        <Plus size={12} /> descrição
      </div>
    );
  }

  return (
    <div onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="mt-1 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer p-1 rounded border border-transparent hover:border-gray-200 flex items-start gap-1">
      <FileText size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
      <span>{value}</span>
    </div>
  );
};

// --- NOVAS VIEWS ADMINISTRATIVAS ---

const AdminParticipantsView = ({ participants, setParticipants, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'PUB_HOMEM', gender: 'PH', phone: '', active: true });
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Helper para determinar o Privilégio na UI (agrupando PUB_HOMEM e PUB_MULHER)
  const getUiPrivilege = (type) => {
    if (type === 'ANCIAO') return 'ANCIAO';
    if (type === 'SERVO') return 'SERVO';
    return 'PUBLICADOR'; // Agrupa PUB_HOMEM e PUB_MULHER
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    if (editingId) {
      setParticipants(participants.map(p => p.id === editingId ? { ...p, ...formData } : p));
    } else {
      setParticipants([...participants, { id: Date.now().toString(), ...formData, abilities: [] }]);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', type: 'PUB_HOMEM', gender: 'PH', phone: '', active: true });
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setFormData({ name: p.name, type: p.type, gender: p.gender, phone: p.phone, active: p.active !== false });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
    setConfirmDelete(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20}/></Button>
            <h1 className="font-bold text-gray-800 text-lg">Cadastro de Usuários</h1>
          </div>
          <Button onClick={() => { setEditingId(null); setFormData({name:'', type:'PUB_HOMEM', gender:'PH', phone:'', active: true}); setIsModalOpen(true); }}>
            <Plus size={16}/> Novo
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-gray-500 font-medium">Nome</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Privilégio</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Gênero</th>
                <th className="px-6 py-3 text-gray-500 font-medium text-center">Designar</th>
                <th className="px-6 py-3 text-gray-500 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {participants.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="px-2 py-1 rounded bg-gray-100 border text-xs">{PRIVILEGE_OPTIONS.find(o => o.value === p.type)?.label || p.type}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.gender === 'PH' ? 'H' : 'M'}</td>
                  <td className="px-6 py-4 text-center">
                    {p.active !== false ? 
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold"><Check size={12}/> Sim</span> : 
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold"><Ban size={12}/> Não</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                    <button onClick={() => setConfirmDelete(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg">{editingId ? 'Editar Participante' : 'Novo Participante'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nome Completo</label>
                <input className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Privilégio</label>
                  <select 
                    className="w-full border rounded p-2 bg-white" 
                    value={getUiPrivilege(formData.type)} 
                    onChange={(e) => {
                      const newPriv = e.target.value;
                      if (newPriv === 'ANCIAO') setFormData({...formData, type: 'ANCIAO', gender: 'PH'});
                      else if (newPriv === 'SERVO') setFormData({...formData, type: 'SERVO', gender: 'PH'});
                      else if (newPriv === 'PUBLICADOR') setFormData({...formData, type: 'PUB_HOMEM', gender: 'PH'});
                    }}
                  >
                    <option value="ANCIAO">Ancião</option>
                    <option value="SERVO">Servo Ministerial</option>
                    <option value="PUBLICADOR">Publicador</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Gênero</label>
                  <select 
                    className={`w-full border rounded p-2 ${getUiPrivilege(formData.type) !== 'PUBLICADOR' ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                    value={formData.gender} 
                    disabled={getUiPrivilege(formData.type) !== 'PUBLICADOR'}
                    onChange={(e) => {
                      const newGender = e.target.value;
                      const newType = newGender === 'PH' ? 'PUB_HOMEM' : 'PUB_MULHER';
                      setFormData({...formData, gender: newGender, type: newType});
                    }}
                  >
                    <option value="PH">Homem (H)</option>
                    <option value="PM">Mulher (M)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Telefone (WhatsApp)</label>
                <input className="w-full border rounded p-2" placeholder="(11) 99999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              
              <div className="pt-2 border-t mt-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.active ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                    {formData.active && <Check size={14} className="text-white"/>}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={formData.active} 
                    onChange={(e) => setFormData({...formData, active: e.target.checked})} 
                  />
                  <div>
                    <span className="font-medium text-gray-900 block text-sm">Pode receber designações?</span>
                    <span className="text-xs text-gray-500 block">Desmarque para afastar temporariamente</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete)} title="Excluir Participante" message="Tem certeza? Isso pode afetar designações existentes." />
    </div>
  );
};

const AdminPartsView = ({ parts, setParts, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', defaultTime: '5 min', section: 'fsm', requiresAssistant: false, requiresReader: false });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleSave = () => {
    if (!formData.title) return;
    if (editingId) {
      setParts(parts.map(p => p.id === editingId ? { ...p, ...formData } : p));
    } else {
      setParts([...parts, { id: 'tpl_' + Date.now(), ...formData, allowedPrivileges: ['ANY'] }]);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', defaultTime: '5 min', section: 'fsm', requiresAssistant: false, requiresReader: false });
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setFormData({ title: p.title, defaultTime: p.defaultTime, section: p.section, requiresAssistant: p.requiresAssistant, requiresReader: p.requiresReader || false });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setParts(parts.filter(p => p.id !== id));
    setConfirmDelete(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20}/></Button>
            <h1 className="font-bold text-gray-800 text-lg">Cadastro de Partes</h1>
          </div>
          <Button onClick={() => { setEditingId(null); setFormData({title: '', defaultTime: '5 min', section: 'fsm', requiresAssistant: false, requiresReader: false}); setIsModalOpen(true); }}>
            <Plus size={16}/> Nova Parte
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-gray-500 font-medium">Título</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Seção</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Tempo Padrão</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Ajudante?</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Leitor?</th>
                <th className="px-6 py-3 text-gray-500 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {parts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.title}</td>
                  <td className="px-6 py-4 text-gray-600 uppercase text-xs">{p.section}</td>
                  <td className="px-6 py-4 text-gray-600">{p.defaultTime}</td>
                  <td className="px-6 py-4 text-gray-600">{p.requiresAssistant ? 'Sim' : '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{p.requiresReader ? <span className="text-blue-600 font-bold flex items-center gap-1"><Book size={14}/> Sim</span> : '-'}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                    <button onClick={() => setConfirmDelete(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg">{editingId ? 'Editar Parte' : 'Nova Parte'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Título da Parte</label>
                <input className="w-full border rounded p-2" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Estudo Bíblico" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Seção</label>
                <select className="w-full border rounded p-2 bg-white" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}>
                  <option value="tesouros">Tesouros da Palavra</option>
                  <option value="fsm">Faça Seu Melhor</option>
                  <option value="nvc">Nossa Vida Cristã</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-sm text-gray-600 block mb-1">Tempo Padrão</label>
                   <input className="w-full border rounded p-2" value={formData.defaultTime} onChange={e => setFormData({...formData, defaultTime: e.target.value})} placeholder="Ex: 5 min" />
                 </div>
                 <div className="flex flex-col pt-6 gap-2">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={formData.requiresAssistant} onChange={e => setFormData({...formData, requiresAssistant: e.target.checked})} />
                     <span className="text-sm text-gray-800">Requer Ajudante</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={formData.requiresReader} onChange={e => setFormData({...formData, requiresReader: e.target.checked})} />
                     <span className="text-sm text-gray-800">Requer Leitor</span>
                   </label>
                 </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete)} title="Excluir Parte Template" message="Isso não removerá designações já criadas na grade, apenas a opção de criar novas." />
    </div>
  );
};

// --- NOVA VERSÃO: AdminSkillsView REDESENHADA (Suporte a Leitor e Seleção Múltipla) ---

const AdminSkillsView = ({ participants, setParticipants, parts, onBack }) => {
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set()); // Novo estado para seleção

  // Alternar habilidade para UM usuário
  const toggleAbility = (participantId, abilityKey) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    const hasAbility = participant.abilities?.includes(abilityKey);
    let newAbilities;
    
    if (hasAbility) {
      newAbilities = participant.abilities.filter(a => a !== abilityKey);
    } else {
      newAbilities = [...(participant.abilities || []), abilityKey];
    }

    setParticipants(participants.map(p => p.id === participantId ? { ...p, abilities: newAbilities } : p));
  };

  // Alternar habilidade para TODOS os selecionados
  const toggleBulkAbility = (abilityKey) => {
    const selectedArray = Array.from(selectedIds);
    if (selectedArray.length === 0) return;

    // Verificar se TODOS os selecionados já têm a habilidade
    const allSelectedHave = selectedArray.every(id => {
      const p = participants.find(user => user.id === id);
      return p?.abilities?.includes(abilityKey);
    });

    const newParticipants = participants.map(p => {
      if (!selectedIds.has(p.id)) return p;
      
      let newAbilities = p.abilities || [];
      if (allSelectedHave) {
        // Remover de todos
        newAbilities = newAbilities.filter(a => a !== abilityKey);
      } else {
        // Adicionar a todos (se não tiver)
        if (!newAbilities.includes(abilityKey)) {
          newAbilities = [...newAbilities, abilityKey];
        }
      }
      return { ...p, abilities: newAbilities };
    });
    
    setParticipants(newParticipants);
  };

  // Selecionar/Deselecionar usuário individual
  const toggleSelectUser = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Selecionar/Deselecionar TODOS do grupo
  const toggleSelectAllGroup = (groupParticipants) => {
    const ids = groupParticipants.map(p => p.id);
    const allSelected = ids.every(id => selectedIds.has(id));
    const newSelected = new Set(selectedIds);

    if (allSelected) {
      ids.forEach(id => newSelected.delete(id));
    } else {
      ids.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const groups = [
    { id: 'ANCIAO', label: 'Anciãos', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    { id: 'SERVO', label: 'Servos Ministeriais', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
    { id: 'PUB_HOMEM', label: 'Publicadores (Homens)', bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' },
    { id: 'PUB_MULHER', label: 'Publicadoras', bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200' },
  ];

  const sections = [
    { id: 'tesouros', label: 'Tesouros da Palavra', icon: Briefcase, color: 'text-gray-600' },
    { id: 'fsm', label: 'Faça Seu Melhor', icon: Users, color: 'text-yellow-600' },
    { id: 'nvc', label: 'Nossa Vida Cristã', icon: User, color: 'text-red-700' },
  ];

  return (
    <div className={`bg-gray-50 min-h-screen ${selectedIds.size > 0 ? 'pb-[420px]' : 'pb-20'}`}>
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20}/></Button>
            <h1 className="font-bold text-gray-800 text-lg">Matriz de Habilidades</h1>
          </div>
          {selectedIds.size > 0 && (
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setSelectedIds(new Set())}>
              Limpar Seleção
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {groups.map(group => {
           const groupParticipants = participants.filter(p => p.type === group.id);
           if (groupParticipants.length === 0) return null;

           const allGroupSelected = groupParticipants.every(p => selectedIds.has(p.id));
           const someGroupSelected = groupParticipants.some(p => selectedIds.has(p.id));

           return (
             <div key={group.id}>
               <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg w-full md:w-fit md:min-w-[300px] ${group.bg} ${group.text} border ${group.border}`}>
                 <div className="flex items-center gap-3">
                   <span className="font-bold text-sm uppercase tracking-wider">{group.label}</span>
                   <span className="bg-white/50 px-2 rounded-full text-xs font-bold">{groupParticipants.length}</span>
                 </div>
                 
                 {/* Checkbox de Selecionar Todos do Grupo */}
                 <div 
                    onClick={() => toggleSelectAllGroup(groupParticipants)}
                    className="flex items-center gap-2 cursor-pointer hover:bg-white/20 px-2 py-1 rounded"
                 >
                    <div className={`w-5 h-5 bg-white border border-current rounded flex items-center justify-center ${allGroupSelected ? 'bg-current' : ''}`}>
                       {allGroupSelected ? <Check size={14} className="text-white"/> : someGroupSelected ? <div className="w-3 h-3 bg-current rounded-sm"/> : null}
                    </div>
                    <span className="text-xs font-bold">Todos</span>
                 </div>
               </div>
               
               <div className="space-y-3">
                 {groupParticipants.map(p => {
                    const isExpanded = expandedUserId === p.id;
                    const isSelected = selectedIds.has(p.id);
                    const totalSkills = p.abilities?.length || 0;

                    return (
                      <div key={p.id} className={`bg-white rounded-xl border transition-all duration-200 ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'}`}>
                        {/* Header do Usuário */}
                        <div className="p-4 flex items-center gap-4">
                           {/* Checkbox de Seleção Individual */}
                           <div 
                             onClick={(e) => { e.stopPropagation(); toggleSelectUser(p.id); }}
                             className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 hover:border-blue-400'}`}
                           >
                             {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                           </div>

                           <div 
                             onClick={() => setExpandedUserId(isExpanded ? null : p.id)}
                             className="flex-1 flex items-center justify-between cursor-pointer"
                           >
                             <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isExpanded ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                 {p.name.charAt(0)}
                               </div>
                               <div>
                                 <h3 className={`font-bold ${isExpanded ? 'text-blue-700' : 'text-gray-800'}`}>{p.name}</h3>
                                 <p className="text-xs text-gray-500">{p.gender === 'PH' ? 'H' : 'M'} • {totalSkills} habilidades ativas</p>
                               </div>
                             </div>
                             <div className="text-gray-400">
                               {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                             </div>
                           </div>
                        </div>

                        {/* Área Expandida de Habilidades (Individual) */}
                        {isExpanded && !selectedIds.size && (
                          <div className="border-t border-gray-100 bg-gray-50/50 p-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid md:grid-cols-3 gap-6">
                              {sections.map(section => {
                                const sectionParts = parts.filter(pt => pt.section === section.id);
                                if (sectionParts.length === 0) return null;

                                return (
                                  <div key={section.id} className="space-y-3">
                                     <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${section.color}`}>
                                       <section.icon size={14} />
                                       {section.label}
                                     </div>
                                     <div className="space-y-2">
                                       {sectionParts.map(part => {
                                         const hasMainAbility = p.abilities?.includes(part.id);
                                         const hasReaderAbility = p.abilities?.includes(`${part.id}_reader`);

                                         return (
                                           <div key={part.id} className="flex flex-col gap-1">
                                             <label className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${hasMainAbility ? 'bg-white border-blue-300 shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                                               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${hasMainAbility ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                                 {hasMainAbility && <Check size={12} className="text-white" strokeWidth={3} />}
                                               </div>
                                               <input type="checkbox" className="hidden" checked={hasMainAbility || false} onChange={() => toggleAbility(p.id, part.id)} />
                                               <span className={`text-sm ${hasMainAbility ? 'font-medium text-gray-900' : 'text-gray-500'}`}>{part.title}</span>
                                             </label>

                                             {part.requiresReader && (
                                               <label className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ml-4 ${hasReaderAbility ? 'bg-white border-purple-300 shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                                                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${hasReaderAbility ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}>
                                                   {hasReaderAbility && <Book size={10} className="text-white" strokeWidth={3} />}
                                                 </div>
                                                 <input type="checkbox" className="hidden" checked={hasReaderAbility || false} onChange={() => toggleAbility(p.id, `${part.id}_reader`)} />
                                                 <span className={`text-xs ${hasReaderAbility ? 'font-medium text-purple-900' : 'text-gray-500'}`}>Leitor: {part.title}</span>
                                               </label>
                                             )}
                                           </div>
                                         );
                                       })}
                                     </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                 })}
               </div>
             </div>
           );
        })}

        {participants.length === 0 && (
          <div className="text-center py-12 text-gray-400">
             <Users size={48} className="mx-auto mb-3 opacity-20" />
             <p>Nenhum participante cadastrado.</p>
          </div>
        )}
      </div>

      {/* PAINEL DE EDIÇÃO EM MASSA (FIXO NA PARTE INFERIOR) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-30 animate-in slide-in-from-bottom-10 duration-300 max-h-[400px] overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between sticky top-0 z-10">
               <div className="flex items-center gap-3">
                 <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold">{selectedIds.size}</div>
                 <div>
                   <p className="font-bold text-sm">Editando Selecionados</p>
                   <p className="text-xs text-gray-400">Alterações aplicadas a todos</p>
                 </div>
               </div>
               <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => setSelectedIds(new Set())}>
                 <XCircle size={20} />
               </Button>
            </div>
            
            <div className="p-6 grid md:grid-cols-3 gap-6 pb-10">
               {sections.map(section => {
                  const sectionParts = parts.filter(pt => pt.section === section.id);
                  if (sectionParts.length === 0) return null;

                  return (
                    <div key={section.id} className="space-y-3">
                       <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${section.color}`}>
                         <section.icon size={14} />
                         {section.label}
                       </div>
                       <div className="space-y-2">
                         {sectionParts.map(part => {
                           const selectedArr = Array.from(selectedIds);
                           // Verifica quantos selecionados têm a habilidade
                           const countMain = selectedArr.filter(id => participants.find(p => p.id === id)?.abilities?.includes(part.id)).length;
                           const allMain = countMain === selectedIds.size;
                           const someMain = countMain > 0 && !allMain;

                           const countReader = selectedArr.filter(id => participants.find(p => p.id === id)?.abilities?.includes(`${part.id}_reader`)).length;
                           const allReader = countReader === selectedIds.size;
                           const someReader = countReader > 0 && !allReader;

                           return (
                             <div key={part.id} className="flex flex-col gap-1">
                               <label className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${allMain ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`}>
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${allMain ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                   {allMain && <Check size={12} className="text-white" strokeWidth={3} />}
                                   {someMain && <Minus size={12} className="text-blue-600" strokeWidth={3} />}
                                 </div>
                                 <input type="checkbox" className="hidden" checked={allMain} onChange={() => toggleBulkAbility(part.id)} />
                                 <span className="text-sm font-medium text-gray-700">{part.title}</span>
                               </label>

                               {part.requiresReader && (
                                 <label className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ml-4 hover:bg-purple-50 ${allReader ? 'bg-purple-50 border-purple-200' : 'border-gray-200'}`}>
                                   <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${allReader ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}>
                                     {allReader && <Book size={10} className="text-white" strokeWidth={3} />}
                                     {someReader && <Minus size={10} className="text-purple-600" strokeWidth={3} />}
                                   </div>
                                   <input type="checkbox" className="hidden" checked={allReader} onChange={() => toggleBulkAbility(`${part.id}_reader`)} />
                                   <span className="text-xs font-medium text-gray-600">Leitor: {part.title}</span>
                                 </label>
                               )}
                             </div>
                           );
                         })}
                       </div>
                    </div>
                  );
               })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- VIEW PRINCIPAL ATUALIZADA (ADMIN PLANNER) ---
// Recebe participantes e parts dinâmicos agora

const AdminPlanner = ({ weekData, setWeekData, onBack, onNavigateWeek, participants, partTemplates }) => {
  const [selectedPart, setSelectedPart] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAddMenu, setActiveAddMenu] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [draggedPart, setDraggedPart] = useState(null);
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, data: null });
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const totalMinutes = weekData.sections.reduce((acc, section) => {
    return acc + section.parts.reduce((pAcc, part) => pAcc + parseTime(part.time), 0);
  }, 0);
  
  const MAX_MINUTES = 105;
  const isOverTime = totalMinutes > MAX_MINUTES;

  const handleDragStart = (e, partId, sectionId) => {
    if (sectionId !== 'fsm' && sectionId !== 'nvc') {
      e.preventDefault();
      return;
    }
    if (partId.includes('n_prayer') || partId.includes('n2-')) {
      e.preventDefault();
      return;
    }
    setDraggedPart({ partId, sectionId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggedPart(null);
  };

  const handleDrop = (e, targetPartId, sectionId) => {
    e.preventDefault();
    if (!draggedPart || draggedPart.sectionId !== sectionId) return;
    if (draggedPart.partId === targetPartId) return;

    const updatedSections = weekData.sections.map(section => {
      if (section.id !== sectionId) return section;

      const parts = [...section.parts];
      const fromIndex = parts.findIndex(p => p.id === draggedPart.partId);
      const toIndex = parts.findIndex(p => p.id === targetPartId);

      if (fromIndex === -1 || toIndex === -1) return section;

      const [movedPart] = parts.splice(fromIndex, 1);
      parts.splice(toIndex, 0, movedPart);

      if (section.id === 'nvc') {
        const study = parts.find(p => p.id.includes('n2-'));
        const prayer = parts.find(p => p.id.includes('n_prayer'));
        
        const dynamicParts = parts.filter(p => !p.id.includes('n2-') && !p.id.includes('n_prayer'));
        
        const reconstructedParts = [...dynamicParts];
        if (study) reconstructedParts.push(study);
        if (prayer) reconstructedParts.push(prayer);
        
        return { ...section, parts: reconstructedParts };
      }

      return { ...section, parts };
    });

    setWeekData({ ...weekData, sections: updatedSections });
    setDraggedPart(null);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Alterações salvas com sucesso!");
    }, 800);
  };

  const handleToggleWeekCanceled = () => {
    setWeekData({ ...weekData, isCanceled: !weekData.isCanceled });
    setIsMenuOpen(false);
  };

  const handleUpdatePart = (sectionId, partId, field, value) => {
    const updatedSections = weekData.sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        parts: section.parts.map(p => p.id === partId ? { ...p, [field]: value } : p)
      };
    });
    setWeekData({ ...weekData, sections: updatedSections });
  };

  const handleAssignClick = (part, role) => {
    setSelectedPart({ ...part, roleTarget: role });
    setIsModalOpen(true);
  };

  const handleSelectParticipant = (participantId) => {
    if (selectedPart.id === 'president') {
      const isPrayerEmpty = !weekData.openingPrayerId;
      const isPrayerSameAsPresident = weekData.openingPrayerId === weekData.presidentId;

      setWeekData({ 
        ...weekData, 
        presidentId: participantId,
        presidentStatus: 'PENDENTE',
        openingPrayerId: (isPrayerEmpty || isPrayerSameAsPresident) ? participantId : weekData.openingPrayerId,
        openingPrayerStatus: (isPrayerEmpty || isPrayerSameAsPresident) ? 'PENDENTE' : weekData.openingPrayerStatus
      });
      setIsModalOpen(false);
      return;
    }

    if (selectedPart.id === 'openingPrayer') {
      setWeekData({ 
        ...weekData, 
        openingPrayerId: participantId,
        openingPrayerStatus: 'PENDENTE'
      });
      setIsModalOpen(false);
      return;
    }

    const updatedSections = weekData.sections.map(section => ({
      ...section,
      parts: section.parts.map(p => {
        if (p.id === selectedPart.id) {
          if (selectedPart.roleTarget === 'assistant') return { ...p, assistantId: participantId };
          if (selectedPart.roleTarget === 'reader') return { ...p, readerId: participantId };
          return { ...p, assignedTo: participantId, status: 'PENDENTE' };
        }
        return p;
      })
    }));
    setWeekData({ ...weekData, sections: updatedSections });
    setIsModalOpen(false);
  };

  const handleAddPart = (sectionId, template) => {
    const newPart = {
      id: `new-${Date.now()}`,
      templateId: template.id,
      title: template.title,
      time: template.defaultTime,
      assignedTo: null,
      status: 'PENDENTE',
      description: '',
      ...(template.requiresAssistant ? { assistantId: null, assistantStatus: 'PENDENTE' } : {}),
      ...(template.requiresReader ? { readerId: null, readerStatus: 'PENDENTE' } : {})
    };

    const updatedSections = weekData.sections.map(section => {
      if (section.id !== sectionId) return section;
      let newParts = [...section.parts];
      if (section.id === 'nvc') {
        const fixedPartIndex = newParts.findIndex(p => p.id.includes('n2-') || p.id.includes('n_prayer'));
        if (fixedPartIndex !== -1) {
          newParts.splice(fixedPartIndex, 0, newPart);
        } else {
          newParts.push(newPart);
        }
      } else {
        newParts.push(newPart);
      }
      return { ...section, parts: newParts };
    });

    setWeekData({ ...weekData, sections: updatedSections });
    setActiveAddMenu(null);
  };

  const handleRequestRemove = (sectionId, partId) => {
    setConfirmDialog({
      isOpen: true,
      data: { sectionId, partId }
    });
  };

  const executeRemovePart = () => {
    const { sectionId, partId } = confirmDialog.data;
    const updatedSections = weekData.sections.map(section => {
      if (section.id !== sectionId) return section;
      return { ...section, parts: section.parts.filter(p => p.id !== partId) };
    });
    setWeekData({ ...weekData, sections: updatedSections });
    setConfirmDialog({ isOpen: false, data: null });
    showToast("Parte removida.");
  };

  const getSuggestions = () => {
    if (!selectedPart) return [];

    return participants.filter(p => {
      // 0. Filtro de Ativo (Designar: Sim/Não)
      if (p.active === false) return false;

      // 1. Filtro de Ajudante (Gênero)
      if (selectedPart.roleTarget === 'assistant') {
        const mainPart = weekData.sections.flatMap(s => s.parts).find(pt => pt.id === selectedPart.id);
        const mainPerson = participants.find(user => user.id === mainPart?.assignedTo);
        if (mainPerson?.gender === 'PM' && p.gender !== 'PM') return false;
        if (mainPerson?.gender === 'PH' && p.gender !== 'PH') return false; 
        return true;
      }

      // 2. Filtro de Habilidade (Vinculado ao Template ID)
      if (selectedPart.templateId) {
         // Se estamos buscando um LEITOR, procuramos a habilidade _reader
         if (selectedPart.roleTarget === 'reader') {
            if (!p.abilities?.includes(`${selectedPart.templateId}_reader`)) return false;
         } else {
            // Se estamos buscando Titular, procuramos a habilidade padrão
            if (!p.abilities?.includes(selectedPart.templateId)) return false;
         }
      }
      
      // Se for Presidente ou Oração e não tiver templateId explícito, assumimos logica simples (Anciao/Servo/PH)
      if (selectedPart.id === 'president') {
        if (p.type !== 'ANCIAO' && p.type !== 'SERVO') return false;
      }
      if (selectedPart.id === 'openingPrayer') {
        if (p.gender !== 'PH') return false;
      }

      return true;
    });
  };

  const getAvailablePartsForSection = (sectionId) => {
    return partTemplates.filter(pt => pt.section === sectionId);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between relative">
          <div className="flex items-center gap-3 z-10">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20}/></Button>
          </div>

          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 w-max">
            <button onClick={() => onNavigateWeek(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
              <ChevronLeft size={20}/>
            </button>
            <div className="text-center">
              <h1 className="font-bold text-gray-800 text-lg leading-tight">Planejamento</h1>
              <p className="text-xs text-gray-500 whitespace-nowrap">{weekData.dateLabel}</p>
            </div>
            <button onClick={() => onNavigateWeek(1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-white transition-colors">
              <ChevronRight size={20}/>
            </button>
          </div>

          <div className="flex items-center gap-2 z-10">
            <Button size="sm" variant="primary" onClick={handleSave} disabled={isSaving} className="hidden sm:flex">
              {isSaving ? 'Salvando...' : <><Save size={16}/> Salvar</>}
            </Button>
            
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 hover:bg-gray-100">
                <MoreVertical size={20}/>
              </Button>

              {isMenuOpen && (
                <div className="absolute right-0 top-10 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-30">
                   <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3" onClick={handleToggleWeekCanceled}>
                     <div className={`mt-0.5 w-5 h-5 border-2 rounded flex items-center justify-center ${weekData.isCanceled ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                       {weekData.isCanceled && <CheckCircle size={14} className="fill-white text-blue-600"/>}
                     </div>
                     <div className="flex-1">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-sm font-medium text-gray-800">Não haverá reunião</span>
                         <div className="group relative">
                           <Info size={14} className="text-gray-400 hover:text-blue-500"/>
                           <div className="absolute right-0 top-6 w-56 p-2 bg-gray-800 text-white text-xs rounded hidden group-hover:block z-40 shadow-lg">
                             Utilize esta opção quando eventos especiais cancelam a reunião do meio de semana.
                           </div>
                         </div>
                       </div>
                       <p className="text-xs text-gray-500 leading-tight">Desativa a grade e notifica participantes.</p>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {weekData.isCanceled ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-100 transition-opacity">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <CalendarX size={40} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700">Semana sem Reunião</h2>
            <p className="text-gray-500 max-w-md">Programação suspensa. Não haverá reunião nesta semana devido a eventos especiais.</p>
            <Button variant="outline" onClick={handleToggleWeekCanceled} className="mt-4">Reativar Semana</Button>
          </div>
        ) : (
          <>
            {/* CARD PRESIDENTE */}
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800">Presidente da Reunião</h3>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px] flex-shrink-0">
                  {/* Card Presidente */}
                  {weekData.presidentId ? (
                      <div 
                        onClick={() => handleAssignClick({id: 'president'}, 'main')}
                        className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded hover:border-blue-400 cursor-pointer"
                      >
                         <div className="flex items-center gap-2 mr-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                              {participants.find(p => p.id === weekData.presidentId)?.name.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-700 truncate max-w-[120px]">
                              {participants.find(p => p.id === weekData.presidentId)?.name}
                            </span>
                         </div>
                         <div onClick={(e) => e.stopPropagation()}>
                           <StatusEditMenu 
                              variant="circle"
                              status={weekData.presidentStatus} 
                              onChange={(s) => {
                                setWeekData({ ...weekData, presidentStatus: s });
                              }} 
                           />
                         </div>
                      </div>
                  ) : (
                      <button 
                        onClick={() => handleAssignClick({id: 'president'}, 'main')}
                        className="flex items-center gap-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded p-2 hover:bg-blue-50 justify-center"
                      >
                        + Designar Presidente
                      </button>
                  )}

                  {/* Oração Inicial */}
                  {(weekData.presidentId || weekData.openingPrayerId) && (
                     <div className="relative">
                         <div 
                            onClick={() => handleAssignClick({id: 'openingPrayer'}, 'main')}
                            className="flex items-center justify-between gap-2 p-1.5 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                          >
                           <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 font-medium">Oração Inicial:</span>
                              <span className="text-sm text-gray-600 truncate max-w-[100px]">
                                {weekData.openingPrayerId 
                                  ? participants.find(p => p.id === weekData.openingPrayerId)?.name 
                                  : <span className="text-blue-500 italic text-xs">Selecionar</span>
                                }
                              </span>
                           </div>
                           {weekData.openingPrayerId && weekData.openingPrayerId !== weekData.presidentId && (
                              <div>
                                <StatusEditMenu 
                                  variant="circle"
                                  status={weekData.openingPrayerStatus} 
                                  onChange={(s) => setWeekData({ ...weekData, openingPrayerStatus: s })} 
                                />
                              </div>
                           )}
                         </div>
                     </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Seções */}
            {weekData.sections.map(section => (
              <div key={section.id}>
                <div className={`px-4 py-2 rounded-t-lg ${section.color} text-white font-semibold flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    {section.id === 'tesouros' && <Briefcase size={18}/>}
                    {section.id === 'fsm' && <Users size={18}/>}
                    {section.title}
                  </div>
                  
                  {section.allowAdd && (
                    <div className="relative">
                      <button onClick={() => setActiveAddMenu(activeAddMenu === section.id ? null : section.id)} className="bg-white/20 hover:bg-white/30 p-1 rounded transition-colors">
                        <Plus size={20} />
                      </button>
                      {activeAddMenu === section.id && (
                        <div className="absolute right-0 top-8 bg-white text-gray-800 shadow-xl rounded-lg py-2 w-56 z-20 border border-gray-200">
                          <p className="px-3 py-1 text-xs font-bold text-gray-400 uppercase">Adicionar Parte</p>
                          {getAvailablePartsForSection(section.id).map((tpl, idx) => (
                            <button key={idx} onClick={() => handleAddPart(section.id, tpl)} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm">
                              {tpl.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-white border-x border-b rounded-b-lg divide-y">
                  {section.parts.map((part, index) => {
                    const isClosingPrayer = part.id.includes('n_prayer');
                    const isBibleStudy = part.id.includes('n2-');
                    const isDraggable = (section.id === 'fsm' || (section.id === 'nvc' && !isClosingPrayer && !isBibleStudy));
                    const isFixedPart = isClosingPrayer || isBibleStudy;

                    return (
                    <div 
                      key={part.id} 
                      className={`p-4 pt-7 hover:bg-gray-50 transition-colors group relative ${draggedPart?.partId === part.id ? 'opacity-50 bg-gray-100' : ''}`}
                      draggable={isDraggable}
                      onDragStart={(e) => handleDragStart(e, part.id, section.id)}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, part.id, section.id)}
                    >
                      {/* Botão de Excluir - Visível só no Hover, e apenas para partes não fixas */}
                      {section.allowAdd && !isFixedPart && (
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRequestRemove(section.id, part.id);
                                }}
                                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                                title="Remover parte"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                      )}

                      <div className={`flex flex-col sm:flex-row sm:items-start gap-4`}>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <EditableField value={part.title} onChange={(val) => handleUpdatePart(section.id, part.id, 'title', val)} className="font-bold text-gray-800 truncate" />
                            <EditableField value={part.time} onChange={(val) => handleUpdatePart(section.id, part.id, 'time', val)} className="text-xs bg-gray-100 text-gray-600 rounded flex-shrink-0" />
                          </div>
                          
                          {!isClosingPrayer && (
                            <div className="mb-2 max-w-md">
                              <EditableDescription value={part.description} onChange={(val) => handleUpdatePart(section.id, part.id, 'description', val)} />
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {!part.assignedTo && <span className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={12}/> Não designado</span>}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px] flex-shrink-0">
                          {part.assignedTo ? (
                            <div onClick={() => handleAssignClick(part, 'main')} className={`flex items-center justify-between p-2 bg-white border border-gray-200 rounded hover:border-blue-400 cursor-pointer`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 text-xs rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700`}>
                                  {participants.find(p => p.id === part.assignedTo)?.name.charAt(0)}
                                </div>
                                <span className="text-sm text-gray-700 truncate max-w-[120px]">
                                  {participants.find(p => p.id === part.assignedTo)?.name}
                                </span>
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                <StatusEditMenu 
                                  variant="circle"
                                  status={part.status} 
                                  onChange={(s) => handleUpdatePart(section.id, part.id, 'status', s)} 
                                />
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => handleAssignClick(part, 'main')} className={`flex items-center gap-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded p-2 hover:bg-blue-50 justify-center`}>
                              + Designar Titular
                            </button>
                          )}

                          {(part.hasOwnProperty('assistantId') || part.hasOwnProperty('readerId')) && (
                            <div className="relative">
                              {part.assistantId || part.readerId ? (
                                <div onClick={() => handleAssignClick(part, part.readerId !== undefined ? 'reader' : 'assistant')} className={`flex items-center justify-between bg-gray-50 rounded p-2 border border-transparent hover:bg-gray-100`}>
                                  <div onClick={() => handleAssignClick(part, part.readerId !== undefined ? 'reader' : 'assistant')} className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-xs text-gray-400">{part.readerId !== undefined ? 'Leitor:' : 'Ajudante:'}</span>
                                    <span className="text-sm text-gray-600 truncate max-w-[100px]">
                                      {participants.find(p => p.id === (part.assistantId || part.readerId))?.name}
                                    </span>
                                  </div>
                                  
                                  {/* Status do Ajudante ou Leitor - Círculo Editável */}
                                  {((section.id === 'fsm' && part.assistantId) || part.readerId) && (
                                    <StatusEditMenu 
                                      variant="circle"
                                      status={(part.readerId ? part.readerStatus : part.assistantStatus) || 'PENDENTE'} 
                                      onChange={(s) => handleUpdatePart(section.id, part.id, part.readerId ? 'readerStatus' : 'assistantStatus', s)} 
                                    />
                                  )}
                                </div>
                              ) : (
                                <button onClick={() => handleAssignClick(part, part.readerId !== undefined ? 'reader' : 'assistant')} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1">
                                  + {part.readerId !== undefined ? 'Leitor' : 'Ajudante'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* FOOTER FIXO COM TEMPO TOTAL */}
      {!weekData.isCanceled && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-center items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className={`text-sm font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-2 transition-colors ${
            isOverTime ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}>
            <Clock size={16} />
            <span>Tempo Total: {formatTotalTime(totalMinutes)}</span>
            <span className="font-normal text-gray-400 text-xs ml-1">/ 1h 45min</span>
          </div>
        </div>
      )}

      {/* Modais... */}
      <ConfirmModal 
        isOpen={confirmDialog.isOpen} 
        onClose={() => setConfirmDialog({ isOpen: false, data: null })}
        onConfirm={executeRemovePart}
        title="Remover Parte"
        message="Tem certeza que deseja remover esta parte da programação?"
      />

      <Toast 
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Selecionar Participante</h3>
              <button onClick={() => setIsModalOpen(false)}><XCircle size={20} className="text-gray-400"/></button>
            </div>
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input type="text" placeholder="Buscar nome..." className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {getSuggestions().length > 0 ? getSuggestions().map(p => {
                // Determine if user has the SPECIFIC ability required (Reader or Main)
                let isApt = false;
                if (selectedPart?.templateId) {
                  if (selectedPart.roleTarget === 'reader') {
                     isApt = p.abilities?.includes(`${selectedPart.templateId}_reader`);
                  } else {
                     isApt = p.abilities?.includes(selectedPart.templateId);
                  }
                }

                return (
                <button key={p.id} onClick={() => handleSelectParticipant(p.id)} className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors text-left group">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold group-hover:bg-blue-200 group-hover:text-blue-700">
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-1.5 rounded border">{p.type}</span>
                      {isApt && 
                        <span className="text-green-600 flex items-center gap-1"><Check size={10}/> Apto</span>
                      }
                    </div>
                  </div>
                </button>
              )}) : <div className="p-8 text-center text-gray-500">Nenhum participante elegível encontrado.<br/><span className="text-xs">Verifique as habilidades ou gênero.</span></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ... (AdminMonthView e ParticipantView permanecem iguais) ...
const AdminMonthView = ({ weeks, onBack, participants }) => {
  const handlePrint = () => { window.print(); };
  const getParticipantName = (id) => participants.find(p => p.id === id)?.name || '---';

  return (
    <div className="bg-gray-50 min-h-screen pb-20 print:bg-white print:pb-0">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20}/></Button>
            <h1 className="font-bold text-gray-800 text-lg">Visão do Mês</h1>
          </div>
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Printer size={16} /> Imprimir
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-8 print:p-0 print:space-y-6 print:w-full">
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Programação de Reuniões</h1>
          <p className="text-gray-500 text-sm">Congregação Exemplo • Dezembro 2023</p>
        </div>

        {weeks.map((week) => (
          <div key={week.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden break-inside-avoid print:shadow-none print:border-gray-300 print:rounded-none">
            <div className="bg-gray-100 p-3 border-b border-gray-200 flex justify-between items-center print:bg-gray-50 print:border-gray-300">
              <span className="font-bold text-lg text-gray-800">{week.dateLabel}</span>
              {week.isCanceled && <span className="text-red-600 font-bold text-sm uppercase px-2 border border-red-200 bg-red-50 rounded">Sem Reunião</span>}
            </div>

            {!week.isCanceled && (
              <div className="p-4 grid gap-6 print:p-2 print:gap-4">
                <div className="flex flex-wrap gap-4 text-sm border-b border-gray-100 pb-4 print:pb-2 print:border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-600">Presidente:</span>
                    <span className="text-gray-900">{getParticipantName(week.presidentId)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-600">Oração Inicial:</span>
                    <span className="text-gray-900">{getParticipantName(week.openingPrayerId)}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-700 text-xs uppercase border-b border-gray-200 pb-1 mb-2">Tesouros</h4>
                    {week.sections.find(s => s.id === 'tesouros').parts.map(part => (
                      <div key={part.id} className="text-sm">
                        <div className="font-medium text-gray-900">{part.title}</div>
                        <div className="text-gray-600 text-xs">{getParticipantName(part.assignedTo)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-yellow-700 text-xs uppercase border-b border-gray-200 pb-1 mb-2">Faça Seu Melhor</h4>
                    {week.sections.find(s => s.id === 'fsm').parts.map(part => (
                      <div key={part.id} className="text-sm mb-2">
                        <div className="font-medium text-gray-900">{part.title}</div>
                        <div className="text-gray-600 text-xs flex flex-col">
                          <span>{getParticipantName(part.assignedTo)}</span>
                          {part.assistantId && <span className="text-gray-400 italic">Aj: {getParticipantName(part.assistantId)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-red-700 text-xs uppercase border-b border-gray-200 pb-1 mb-2">Vida Cristã</h4>
                    {week.sections.find(s => s.id === 'nvc').parts.map(part => (
                      <div key={part.id} className="text-sm mb-2">
                        <div className="font-medium text-gray-900">{part.title}</div>
                        <div className="text-gray-600 text-xs flex flex-col">
                          <span>{getParticipantName(part.assignedTo)}</span>
                          {part.readerId && <span className="text-gray-400 italic">Leitor: {getParticipantName(part.readerId)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ParticipantView = ({ weekData, setWeekData, currentUser, onBack, participants }) => {
  const myParts = [];
  
  if (!weekData || !currentUser) return <div className="p-10 text-center">Carregando...</div>;

  if (weekData.presidentId === currentUser.id) {
    myParts.push({ 
      id: 'president', 
      title: 'Presidente da Reunião', 
      section: 'Reunião Inteira', 
      role: 'Titular',
      status: weekData.presidentStatus,
      description: weekData.presidentDescription || 'Presidir a reunião.' 
    });
  }

  if (weekData.openingPrayerId === currentUser.id) {
     myParts.push({ 
      id: 'openingPrayer', 
      title: 'Oração Inicial', 
      section: 'Abertura', 
      role: 'Titular',
      status: weekData.openingPrayerStatus,
      description: weekData.openingPrayerDescription 
    });
  }

  weekData.sections.forEach(s => {
    s.parts.forEach(p => {
      if (p.assignedTo === currentUser.id) {
         myParts.push({ ...p, role: 'Titular', section: s.title, partnerId: p.assistantId, partnerLabel: 'Ajudante' });
      }
      if (p.assistantId === currentUser.id) {
         myParts.push({ ...p, role: 'Ajudante', section: s.title, partnerId: p.assignedTo, partnerLabel: 'Titular' });
      }
      if (p.readerId === currentUser.id) {
         myParts.push({ ...p, role: 'Leitor', section: s.title, partnerId: p.assignedTo, partnerLabel: 'Dirigente' });
      }
    });
  });

  const handleStatusChange = (partId, newStatus) => {
    const updatedSections = weekData.sections.map(section => ({
      ...section,
      parts: section.parts.map(p => p.id === partId ? { ...p, status: newStatus } : p)
    }));
    setWeekData({ ...weekData, sections: updatedSections });
  };

  const getRoleStyles = (role) => {
    switch(role) {
      case 'Titular': return 'bg-blue-50 border-blue-100 text-blue-700';
      case 'Ajudante': return 'bg-amber-50 border-amber-100 text-amber-700';
      case 'Leitor': return 'bg-purple-50 border-purple-100 text-purple-700';
      default: return 'bg-gray-50 border-gray-100 text-gray-700';
    }
  };

  const getRoleIconStyle = (role) => {
     switch(role) {
      case 'Titular': return 'bg-blue-200 text-blue-700';
      case 'Ajudante': return 'bg-amber-200 text-amber-700';
      case 'Leitor': return 'bg-purple-200 text-purple-700';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800 min-h-[600px] relative flex flex-col">
        <div className="bg-blue-600 p-6 text-white pt-10">
          <div className="flex justify-between items-start mb-4">
             <div>
               <h2 className="text-2xl font-bold">Olá, {currentUser.name.split(' ')[0]}</h2>
               <p className="text-blue-100 text-sm">Designações Pendentes</p>
             </div>
             <button onClick={onBack} className="text-white/80 hover:text-white text-xs">Sair</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
           {weekData.isCanceled ? (
             <div className="text-center py-10 text-gray-500">
               <CalendarX className="mx-auto mb-2 text-red-400" size={48} />
               <p className="font-bold text-gray-700">Sem Reunião</p>
               <p className="text-sm">Esta semana não haverá reunião.</p>
             </div>
           ) : myParts.length === 0 ? (
             <div className="text-center py-10 text-gray-500">
               <CheckCircle className="mx-auto mb-2 text-green-500" size={48} />
               <p>Tudo limpo! Nenhuma designação pendente.</p>
             </div>
           ) : (
             myParts.map(part => (
               <Card key={part.id} className="p-0 border-0 shadow-md">
                 <div className={`h-2 ${
                   part.status === 'CONFIRMADO' ? 'bg-green-500' : 
                   part.status === 'RECUSADO' ? 'bg-red-500' : 
                   'bg-yellow-400'
                 }`}></div>
                 <div className="p-5">
                   <div className="flex justify-between items-start mb-3">
                     <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{weekData.dateLabel}</span>
                     <Badge status={part.status} />
                   </div>
                   
                   <h3 className="text-xl font-bold text-gray-800 mb-1 leading-tight">{part.title}</h3>
                   <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">{part.section}</p>
                   
                   {part.description && (
                     <div className="mb-4 bg-gray-50 p-2 rounded text-sm text-gray-600 border border-gray-100">
                       <p>{part.description}</p>
                     </div>
                   )}

                   {!part.title.toLowerCase().includes('discurso') && part.id !== 'president' && part.id !== 'openingPrayer' && (
                     <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg border ${getRoleStyles(part.role)}`}>
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRoleIconStyle(part.role)}`}>
                         {part.role === 'Titular' ? 'T' : part.role === 'Ajudante' ? 'A' : 'L'}
                       </div>
                       <div>
                         <p className="text-xs font-bold uppercase opacity-80">Sua função: {part.role}</p>
                         {part.partnerId ? (
                           <p className="text-sm">
                             {part.partnerLabel}: <strong>{participants.find(p => p.id === part.partnerId)?.name}</strong>
                           </p>
                         ) : (
                           <p className="text-sm opacity-60 italic">Sem parceiro designado</p>
                         )}
                       </div>
                     </div>
                   )}
                   
                   <div className="grid grid-cols-2 gap-3 mt-4">
                     <Button 
                      variant="secondary" 
                      className={`
                        ${part.status === 'RECUSADO' 
                          ? 'bg-red-600 hover:bg-red-700 text-white font-bold' 
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-transparent'}
                      `}
                      onClick={() => handleStatusChange(part.id, 'RECUSADO')}
                      disabled={part.status === 'RECUSADO'}
                     >
                       {part.status === 'RECUSADO' ? 'Recusado' : 'Recusar'}
                     </Button>
                     <Button 
                      variant="primary" 
                      className={`
                        ${part.status === 'CONFIRMADO' 
                          ? 'bg-green-600 hover:bg-green-700 text-white font-bold' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'}
                      `}
                      onClick={() => handleStatusChange(part.id, 'CONFIRMADO')}
                      disabled={part.status === 'CONFIRMADO'}
                     >
                       {part.status === 'CONFIRMADO' ? 'Confirmado' : 'Confirmar'}
                     </Button>
                   </div>

                 </div>
               </Card>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

// ... AdminHistoryView (Simplificado, mantendo funcionalidade)

const AdminHistoryView = ({ onBack, participants }) => {
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedParticipant = participants.find(p => p.id === selectedParticipantId);
  const history = selectedParticipantId ? (MOCK_HISTORY_DATA[selectedParticipantId] || []) : [];

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm flex-none">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
           <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20}/></Button>
           <h1 className="font-bold text-gray-800 text-lg">Histórico</h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`w-full md:w-80 bg-white border-r flex-col ${selectedParticipantId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredParticipants.map(p => (
              <button key={p.id} onClick={() => setSelectedParticipantId(p.id)} className={`w-full text-left p-4 border-b hover:bg-gray-50 flex items-center gap-3 ${selectedParticipantId === p.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedParticipantId === p.id ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>{p.name.charAt(0)}</div>
                <div><p className={`font-medium ${selectedParticipantId === p.id ? 'text-blue-800' : 'text-gray-800'}`}>{p.name}</p></div>
              </button>
            ))}
          </div>
        </div>
        <div className={`flex-1 flex-col bg-gray-50 overflow-y-auto ${!selectedParticipantId ? 'hidden md:flex' : 'flex'}`}>
          {selectedParticipantId ? (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6 md:hidden">
                 <button onClick={() => setSelectedParticipantId(null)} className="flex items-center text-gray-500 hover:text-gray-800 text-sm"><ChevronLeft size={16}/> Voltar</button>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{selectedParticipant.name}</h2>
              <div className="space-y-3">
                {history.length > 0 ? history.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-gray-500 uppercase">{item.date}</span></div>
                      <p className="font-bold text-gray-800">{item.title}</p>
                    </div>
                    <Badge status={item.status} />
                  </div>
                )) : <div className="text-center py-10 text-gray-400">Nenhum histórico recente.</div>}
              </div>
            </div>
          ) : <div className="flex-1 flex items-center justify-center text-gray-400">Selecione um participante</div>}
        </div>
      </div>
    </div>
  );
};

const PresidentView = ({ weekData, onBack, onNavigateWeek, setWeekData, participants }) => {
  const getWhatsappLink = (participantId, partTitle) => {
    const user = participants.find(p => p.id === participantId);
    if (!user) return '#';
    const text = `Olá ${user.name}, estou fechando a programação da semana. Poderia confirmar sua designação para "${partTitle}"? Acesse: app.jwplanner.com/c/hash123`;
    return `https://wa.me/${user.telefone || ''}?text=${encodeURIComponent(text)}`;
  };

  const getPendingCount = () => {
    let count = 0;
    if (weekData.isCanceled) return 0;
    weekData.sections.forEach(s => s.parts.forEach(p => {
      if (p.assignedTo && p.status === 'PENDENTE') count++;
      if (p.assistantId && p.assistantStatus === 'PENDENTE') count++;
      if (p.readerId && p.readerStatus === 'PENDENTE') count++;
    }));
    return count;
  };

  const handleUpdateStatus = (sectionId, partId, field, newStatus) => {
    if (!setWeekData) return;
    const updatedSections = weekData.sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        parts: section.parts.map(p => p.id === partId ? { ...p, [field]: newStatus } : p)
      };
    });
    setWeekData({ ...weekData, sections: updatedSections });
  };

  const renderParticipantRow = (part, sectionId, userId, role, statusField) => {
    if (!userId) return null;
    const user = participants.find(p => p.id === userId);
    const status = part[statusField] || 'PENDENTE';
    
    const bgClass = role === 'Titular' ? 'bg-white' : 
                   role === 'Ajudante' ? 'bg-amber-50/50' : 'bg-purple-50/50';

    const statusBarColor = status === 'CONFIRMADO' ? 'bg-green-500' : 
                           status === 'RECUSADO' ? 'bg-red-500' : 
                           'bg-yellow-400';

    return (
      <div key={`${part.id}-${role}`} className={`${bgClass} rounded-lg shadow-sm border border-gray-200 flex`}>
        <div className={`w-1.5 ${statusBarColor} flex-shrink-0 rounded-l-lg`} />

        {/* Layout espaçado com p-5 */}
        <div className="p-5 flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-6"> {/* Alinhamento vertical centralizado */}
            <div className="flex-1 min-w-0">
               <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-3 flex-wrap">
                   <p className="font-bold text-gray-800 text-base truncate">{user?.name}</p>
                   <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border flex-shrink-0 tracking-wide ${
                      role === 'Titular' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                      role === 'Ajudante' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                      'bg-purple-100 text-purple-700 border-purple-200'
                   }`}>
                     {role}
                   </span>
                 </div>
                 
                 <p className="text-sm text-gray-600 truncate leading-relaxed">{part.title}</p>
                 
                 <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <Smartphone size={14} />
                    <span>{user?.phone || 'Sem telefone'}</span>
                 </div>
               </div>
            </div>
            
            <div className="flex items-center gap-4 flex-shrink-0">
              <StatusEditMenu 
                 variant="circle"
                 status={status} 
                 onChange={(s) => handleUpdateStatus(sectionId, part.id, statusField, s)}
               />
  
              <a 
                href={status === 'PENDENTE' ? getWhatsappLink(user?.id, part.title) : undefined}
                target={status === 'PENDENTE' ? "_blank" : undefined}
                className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${
                  status === 'PENDENTE' 
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md cursor-pointer' 
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
                title={status === 'PENDENTE' ? "Solicitar confirmação" : "Não disponível"}
                onClick={(e) => { if (status !== 'PENDENTE') e.preventDefault(); }}
              >
                <Send size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      <header className="bg-gray-900 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" className="text-white hover:bg-white/10 p-1" onClick={onBack}><ArrowLeft size={20}/></Button>
          
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigateWeek(-1)} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
              <ChevronLeft size={20}/>
            </button>
            <div className="text-center">
              <h1 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Semana</h1>
              <p className="text-sm font-medium text-white whitespace-nowrap">{weekData.dateLabel}</p>
            </div>
            <button onClick={() => onNavigateWeek(1)} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
              <ChevronRight size={20}/>
            </button>
          </div>

          <div className="w-8"></div>
        </div>
        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
           <div className="flex items-center gap-3">
             <div className="bg-yellow-500 text-gray-900 font-bold w-10 h-10 rounded-full flex items-center justify-center text-lg">
               {getPendingCount()}
             </div>
             <div className="text-sm">
               <p className="font-semibold text-white">Pendentes</p>
               <p className="text-gray-400">Aguardando confirmação</p>
             </div>
           </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {weekData.isCanceled ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <CalendarX size={40} className="text-gray-400" />
            <h2 className="text-xl font-bold text-gray-500">Semana Suspensa</h2>
            <p className="text-gray-400">Não há designações para monitorar.</p>
          </div>
        ) : (
          weekData.sections.map(section => (
            <div key={section.id} className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-gray-500 ml-1">{section.title}</h3>
              {section.parts.map(part => (
                 <React.Fragment key={part.id}>
                   {renderParticipantRow(part, section.id, part.assignedTo, 'Titular', 'status')}
                   {renderParticipantRow(part, section.id, part.assistantId, 'Ajudante', 'assistantStatus')}
                   {renderParticipantRow(part, section.id, part.readerId, 'Leitor', 'readerStatus')}
                 </React.Fragment>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState('LANDING');
  const [currentWeekIndex, setCurrentWeekIndex] = useState(1);
  const [weeks, setWeeks] = useState(MOCK_WEEKS);
  const [currentUser, setCurrentUser] = useState(null);
  
  // GLOBAL STATE
  const [participants, setParticipants] = useState(INITIAL_PARTICIPANTS);
  const [partTemplates, setPartTemplates] = useState(INITIAL_PART_TEMPLATES);

  const updateCurrentWeek = (updatedWeekData) => {
    const newWeeks = [...weeks];
    newWeeks[currentWeekIndex] = updatedWeekData;
    setWeeks(newWeeks);
  };

  const handleNavigateWeek = (direction) => {
    const newIndex = currentWeekIndex + direction;
    if (newIndex >= 0 && newIndex < weeks.length) setCurrentWeekIndex(newIndex);
  };

  const currentWeekData = weeks[currentWeekIndex];

  const goToParticipant = (userId) => {
    setCurrentUser(participants.find(p => p.id === userId));
    setCurrentView('PARTICIPANT');
  };

  if (currentView === 'ADMIN') return <AdminPlanner weekData={currentWeekData} setWeekData={updateCurrentWeek} onBack={() => setCurrentView('LANDING')} onNavigateWeek={handleNavigateWeek} participants={participants} partTemplates={partTemplates} />;
  if (currentView === 'ADMIN_MONTH') return <AdminMonthView weeks={weeks} onBack={() => setCurrentView('LANDING')} participants={participants} />;
  if (currentView === 'ADMIN_HISTORY') return <AdminHistoryView onBack={() => setCurrentView('LANDING')} participants={participants} />;
  if (currentView === 'ADMIN_PARTICIPANTS') return <AdminParticipantsView participants={participants} setParticipants={setParticipants} onBack={() => setCurrentView('LANDING')} />;
  if (currentView === 'ADMIN_PARTS') return <AdminPartsView parts={partTemplates} setParts={setPartTemplates} onBack={() => setCurrentView('LANDING')} />;
  if (currentView === 'ADMIN_SKILLS') return <AdminSkillsView participants={participants} setParticipants={setPartTemplates} parts={partTemplates} onBack={() => setCurrentView('LANDING')} />;
  if (currentView === 'PARTICIPANT') return <ParticipantView weekData={currentWeekData} setWeekData={updateCurrentWeek} currentUser={currentUser} onBack={() => setCurrentView('LANDING')} participants={participants} />;
  if (currentView === 'PRESIDENT') return <PresidentView weekData={currentWeekData} setWeekData={updateCurrentWeek} onBack={() => setCurrentView('LANDING')} onNavigateWeek={handleNavigateWeek} participants={participants} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-200">
            <Calendar className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">JW Assignments Planner</h1>
          <p className="text-gray-500 text-sm">Protótipo de Validação de Fluxo</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Para o Planejador</h2>
            <button onClick={() => setCurrentView('ADMIN')} className="w-full bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Briefcase size={20} /></div>
                <div className="text-left"><p className="font-semibold text-gray-800">Painel Administrativo</p><p className="text-xs text-gray-500">Planejar semana e designar</p></div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-blue-500" size={20} />
            </button>
            <button onClick={() => setCurrentView('ADMIN_MONTH')} className="w-full bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Printer size={20} /></div>
                <div className="text-left"><p className="font-semibold text-gray-800">Relatório Mensal</p><p className="text-xs text-gray-500">Visualizar e imprimir mês</p></div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-indigo-500" size={20} />
            </button>
            
            <div className="grid grid-cols-3 gap-3 pt-2">
               <button onClick={() => setCurrentView('ADMIN_PARTICIPANTS')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-gray-50 transition-all text-center gap-2">
                 <div className="bg-green-100 p-2 rounded-full text-green-700"><Users size={18}/></div>
                 <span className="text-[10px] font-bold text-gray-600 uppercase">Usuários</span>
               </button>
               <button onClick={() => setCurrentView('ADMIN_PARTS')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-gray-50 transition-all text-center gap-2">
                 <div className="bg-orange-100 p-2 rounded-full text-orange-700"><List size={18}/></div>
                 <span className="text-[10px] font-bold text-gray-600 uppercase">Partes</span>
               </button>
               <button onClick={() => setCurrentView('ADMIN_SKILLS')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-gray-50 transition-all text-center gap-2">
                 <div className="bg-purple-100 p-2 rounded-full text-purple-700"><Grid size={18}/></div>
                 <span className="text-[10px] font-bold text-gray-600 uppercase">Matriz</span>
               </button>
            </div>
          </div>

          <div className="space-y-3">
             <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Outras Visões</h2>
             <button onClick={() => setCurrentView('PRESIDENT')} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-all group">
              <div className="flex items-center gap-3">
                <div className="bg-green-50 p-2.5 rounded-lg text-green-600"><MessageCircle size={20} /></div>
                <div className="text-left"><p className="font-semibold text-gray-800">Acompanhamento</p><p className="text-xs text-gray-500">Cobrar designações via Zap</p></div>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => goToParticipant('p3')} className="p-3 border rounded-xl hover:bg-gray-50 text-left text-sm flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">N</div><div><p className="font-medium">Natália</p><p className="text-xs text-gray-500">Titular</p></div>
              </button>
              <button onClick={() => goToParticipant('p4')} className="p-3 border rounded-xl hover:bg-gray-50 text-left text-sm flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold">M</div><div><p className="font-medium">Maria</p><p className="text-xs text-gray-500">Ajudante</p></div>
              </button>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t">Simulação Frontend Only • React + Tailwind</div>
      </div>
    </div>
  );
}