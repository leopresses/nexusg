interface TaskStatsProps {
  pending: number;
  inProgress: number;
  completed: number;
}

export function TaskStats({ pending, inProgress, completed }: TaskStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
        <div className="text-2xl font-bold text-warning">{pending}</div>
        <div className="text-sm text-muted-foreground">Pendentes</div>
      </div>
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
        <div className="text-2xl font-bold text-primary">{inProgress}</div>
        <div className="text-sm text-muted-foreground">Em progresso</div>
      </div>
      <div className="p-4 rounded-xl bg-success/10 border border-success/20">
        <div className="text-2xl font-bold text-success">{completed}</div>
        <div className="text-sm text-muted-foreground">Concluídas</div>
      </div>
    </div>
  );
}
