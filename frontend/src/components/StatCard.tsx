import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  className?: string;
}

const StatCard = ({ label, value, icon, trend, className }: StatCardProps) => (
  <div className={cn("glass-elevated rounded-xl p-6 animate-fade-in", className)}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        {trend && <p className="mt-1 text-xs font-medium text-success">{trend}</p>}
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
    </div>
  </div>
);

export default StatCard;
