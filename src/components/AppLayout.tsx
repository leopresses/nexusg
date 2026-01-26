import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";

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
];

export function AppLayout({ children, title, subtitle, headerActions }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col fixed md:relative h-screen z-50`}>
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Logo size="sm" showText={sidebarOpen} />
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden text-sidebar-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-sidebar-accent text-sidebar-primary' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
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
            {sidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-40 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${sidebarOpen ? 'md:ml-0' : ''}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              {headerActions}
            </div>
          </div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
