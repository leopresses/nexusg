import { motion } from "framer-motion";
import { Users, CheckSquare, Star, MessageSquare } from "lucide-react";

interface DashboardStatsCardsProps {
  clientsCount: number;
  pendingTasks: number;
  totalReviews?: number;
  averageRating?: number;
}

const cards = [
  {
    key: "clients",
    label: "Clientes Ativos",
    icon: Users,
    bgClass: "bg-primary/10",
    iconClass: "text-primary",
  },
  {
    key: "tasks",
    label: "Tarefas Pendentes",
    icon: CheckSquare,
    bgClass: "bg-warning/10",
    iconClass: "text-warning",
  },
  {
    key: "reviews",
    label: "Avaliações Totais",
    icon: MessageSquare,
    bgClass: "bg-accent/10",
    iconClass: "text-accent",
  },
  {
    key: "rating",
    label: "Avaliação Média",
    icon: Star,
    bgClass: "bg-success/10",
    iconClass: "text-success",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 mt-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(rating) ? "text-warning fill-warning" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export function DashboardStatsCards({
  clientsCount,
  pendingTasks,
  totalReviews = 0,
  averageRating = 0,
}: DashboardStatsCardsProps) {
  const values: Record<string, string> = {
    clients: clientsCount.toString(),
    tasks: pendingTasks.toString(),
    reviews: totalReviews.toString(),
    rating: averageRating > 0 ? averageRating.toFixed(1) : "—",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.key}
          className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.07 }}
        >
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${card.bgClass} flex items-center justify-center flex-shrink-0`}>
              <card.icon className={`h-6 w-6 ${card.iconClass}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold leading-tight mt-0.5">{values[card.key]}</p>
              {card.key === "rating" && averageRating > 0 && <StarRating rating={averageRating} />}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
