

interface BadgeProps {
  status: string;
}

export const Badge = ({ status }: BadgeProps) => {
  const styles: Record<string, string> = {
    CONFIRMADO: "bg-green-100 text-green-800",
    PENDENTE: "bg-yellow-100 text-yellow-800",
    RECUSADO: "bg-red-100 text-red-800",
    SUBSTITUIDO: "bg-gray-100 text-gray-600"
  };

  const labels: Record<string, string> = {
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
