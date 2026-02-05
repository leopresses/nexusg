import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckSquare,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
  /** Mantido para compatibilidade com páginas antigas */
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

const baseNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: CheckSquare, label: "Tarefas", href: "/tasks" },
  { icon: FileText, label: "Relatórios", href: "/reports" },
  { icon: Settings, label: "Configurações", href: "/settings" },
  { icon: CreditCard, label: "Planos", href: "/pricing" },
];

const adminNavItems = [
  { icon: Shield, label: "Usuários & Planos", href: "/admin/users-plans" },
  { icon: FileText, label: "Templates", href: "/admin/templates" },
];

function initials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean);
  return (chars.join("") || "U").slice(0, 2);
}

export function AppLayout({ children, headerActions }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { signOut, isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  useEffect(() => {
    if (!isMobile) setSidebarOpen(true);
  }, [isMobile]);

  const navItems = useMemo(() => (isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems), [isAdmin]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex">
      {/* overlay mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "relative w-[260px]"
        }
      >
        <div className="h-full flex flex-col text-white bg-gradient-to-b from-[#1F3B8C] via-[#2447A3] to-[#1B2F6E]">
          <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
            <Logo size="sm" showText={true} />
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <nav className="flex-1 px-4 py-5">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isActive(item.href)
                        ? "bg-white/15 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="px-4 pb-5">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-black/5">
          <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {isMobile && (
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              )}

              <div className="relative w-[220px] sm:w-[280px] md:w-[360px] max-w-full">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Pesquisar"
                  className="pl-9 rounded-xl bg-[#F4F6FB] border-black/5 focus-visible:ring-[#2D62F1]/30"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {headerActions}

              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setNotifOpen(true)}
                title="Notificações"
              >
                <Bell className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => navigate("/settings")}
                title="Configurações"
              >
                <Settings className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-xl px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#2D62F1] text-white">
                        {initials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{profile?.full_name || "Usuário"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>Configurações</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/pricing")}>Planos</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 md:px-6 py-6">{children}</div>
      </main>

      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
