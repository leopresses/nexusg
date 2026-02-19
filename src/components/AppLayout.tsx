import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  Settings,
  LogOut,
  CreditCard,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

const baseNavItems = [
  { icon: LayoutDashboard, label: "Painel Geral", href: "/dashboard" },
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: CheckSquare, label: "Tarefas", href: "/tasks" },
  { icon: FileText, label: "Gerador de Relatórios", href: "/reports" },
  { icon: Settings, label: "Configurações", href: "/settings" },
  { icon: CreditCard, label: "Planos", href: "/pricing" },
];

const adminNavItems = [
  { icon: Shield, label: "Usuários & Planos", href: "/admin/users-plans" },
  { icon: FileText, label: "Templates de Tarefas", href: "/admin/templates" },
];

export function AppLayout({ children, title, subtitle, headerActions }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const navItems = [...baseNavItems, ...(isAdmin ? adminNavItems : [])];

  const isActive = (href: string) => location.pathname === href;

  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Set sidebar open by default on desktop
  useEffect(() => {
    if (!isMobile) setSidebarOpen(true);
  }, [isMobile]);

  const handleSignOut = async () => {
    try {
      await signOut();

      // limpa qualquer cache de sessão
      localStorage.clear();
      sessionStorage.clear();

      // força refresh e volta para landing
      window.location.href = "/";
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    // ✅ trava o layout na altura da tela e impede scroll do body
    <div className="h-screen bg-slate-50 text-slate-900 flex overflow-hidden">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${
            isMobile
              ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
                  sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`
              : "relative w-64 flex-shrink-0"
          }
          flex flex-col h-full
          bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#2563EB]
          text-white
        `}
      >
        <div className="p-4 border-b border-white/15 flex items-center justify-between">
          <div className="text-white">
            <Logo size="sm" showText={true} />
          </div>

          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white/90 hover:bg-white/10 hover:text-white rounded-xl"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* ✅ pode rolar só dentro do menu se passar do tamanho */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-white/15 ring-1 ring-white/20 text-white"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/15">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-white/90 hover:bg-white/10 hover:text-white rounded-xl"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      {/* ✅ só o lado direito rola */}
      <main className="flex-1 h-full overflow-y-auto min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-slate-100"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5 text-slate-700" />
                </Button>
              )}

              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-slate-900">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4">{headerActions}</div>
          </div>
        </header>

        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
