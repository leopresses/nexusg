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

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Set sidebar open by default on desktop
  useEffect(() => {
    if (!isMobile) setSidebarOpen(true);
  }, [isMobile]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${
            isMobile
              ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
              : "relative w-64 flex-shrink-0"
          }
          bg-sidebar border-r border-sidebar-border flex flex-col h-full
        `}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Logo size="sm" showText={true} />
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
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
