import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MessageSquare,
  Trash2,
  Check,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

interface Notification {
  id: string;
  type: "warning" | "success" | "info" | "task";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const typeConfig = {
  warning: { 
    icon: AlertTriangle, 
    color: "text-warning",
    bg: "bg-warning/10" 
  },
  success: { 
    icon: CheckCircle2, 
    color: "text-success",
    bg: "bg-success/10" 
  },
  info: { 
    icon: MessageSquare, 
    color: "text-primary",
    bg: "bg-primary/10" 
  },
  task: { 
    icon: Clock, 
    color: "text-muted-foreground",
    bg: "bg-secondary" 
  },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Agora";
  if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)} hora(s)`;
  if (diffInSeconds < 604800) return `Há ${Math.floor(diffInSeconds / 86400)} dia(s)`;
  return date.toLocaleDateString("pt-BR");
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    emailTarefasAtrasadas: true,
    emailRelatorios: true,
    emailAvaliacoes: false,
    pushTarefas: true,
    pushLimites: true,
  });

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications();
    }
  }, [user, isOpen]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data && !error) {
      const mapped: Notification[] = data.map((n: NotificationRow) => ({
        id: n.id,
        type: (n.type as Notification["type"]) || "info",
        title: n.title,
        message: n.message || "",
        time: formatTimeAgo(n.created_at),
        read: n.is_read,
      }));
      setNotifications(mapped);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Notificações</h2>
                {unreadCount > 0 && (
                  <Badge variant="default" className="gradient-gold text-primary-foreground">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-border overflow-hidden"
                >
                  <div className="p-4 space-y-4 bg-secondary/30">
                    <h3 className="font-medium text-sm">Configurações de Notificação</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-tarefas" className="text-sm">Email: Tarefas atrasadas</Label>
                        <Switch 
                          id="email-tarefas"
                          checked={settings.emailTarefasAtrasadas}
                          onCheckedChange={(checked) => setSettings({...settings, emailTarefasAtrasadas: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-relatorios" className="text-sm">Email: Relatórios prontos</Label>
                        <Switch 
                          id="email-relatorios"
                          checked={settings.emailRelatorios}
                          onCheckedChange={(checked) => setSettings({...settings, emailRelatorios: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-avaliacoes" className="text-sm">Email: Novas avaliações</Label>
                        <Switch 
                          id="email-avaliacoes"
                          checked={settings.emailAvaliacoes}
                          onCheckedChange={(checked) => setSettings({...settings, emailAvaliacoes: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push-tarefas" className="text-sm">Push: Lembretes de tarefas</Label>
                        <Switch 
                          id="push-tarefas"
                          checked={settings.pushTarefas}
                          onCheckedChange={(checked) => setSettings({...settings, pushTarefas: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push-limites" className="text-sm">Push: Limites do plano</Label>
                        <Switch 
                          id="push-limites"
                          checked={settings.pushLimites}
                          onCheckedChange={(checked) => setSettings({...settings, pushLimites: checked})}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="p-3 border-b border-border flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
                  <Check className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Nenhuma notificação</h3>
                  <p className="text-sm text-muted-foreground">
                    Você está em dia! Novas notificações aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => {
                    const config = typeConfig[notification.type];
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`p-4 hover:bg-secondary/30 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex gap-3">
                          <div className={`h-10 w-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                              </div>
                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">{notification.time}</span>
                              {!notification.read && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-xs"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Marcar como lida
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Notification Bell Button Component
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error && count !== null) {
      setUnreadCount(count);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full gradient-gold text-[10px] font-bold flex items-center justify-center text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </Button>
      <NotificationCenter isOpen={isOpen} onClose={() => { setIsOpen(false); fetchUnreadCount(); }} />
    </>
  );
}
