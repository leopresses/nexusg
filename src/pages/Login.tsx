import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Estilo padrão para os balões azuis (Adicionado para consistência)
  const toastStyle = {
    className: "!bg-blue-600 !text-white border-none shadow-2xl rounded-2xl p-4 font-bold",
  };

  useEffect(() => {
    if (user) {
      toast({
        title: "Você já está logado",
        description: "Redirecionando para o painel...",
        ...toastStyle, // Aplica o estilo azul
      });
      navigate("/dashboard");
    }
  }, [user, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      let errorMessage = "Ocorreu um erro ao fazer login.";

      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Confirme seu email antes de fazer login.";
      }

      // LINHA 53 CORRIGIDA: Removido 'variant: destructive' e adicionado estilo azul
      toast({
        title: "Erro no login",
        description: errorMessage,
        ...toastStyle, // Garante que o balão seja azul
      });
    } else {
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao Gestão Nexus.",
        ...toastStyle, // Garante que o balão seja azul
      });
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="inline-block mb-8">
            {/* garante logo sempre legível no tema claro */}
            <div className="text-slate-900 [&_*]:!text-slate-900">
              <Logo size="md" />
            </div>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-slate-900">Bem-vindo de volta</h1>
            <p className="text-slate-600">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">
                  Senha
                </Label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-blue-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl relative overflow-hidden group
              !bg-gradient-to-r !from-blue-600 !to-indigo-600 !text-white hover:opacity-95
              shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? "Entrando..." : "Entrar"}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
            </Button>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <p className="text-slate-600">
              Não tem uma conta?{" "}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">
                Criar conta grátis
              </Link>
            </p>
            <Link to="/" className="inline-block text-sm text-slate-500 hover:text-slate-800 transition-colors">
              ← Voltar para tela inicial
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
        {/* fundo CLARO premium (sem gradient-dark) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f6f8fc] to-[#f6f8fc]" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />

        <motion.div
          className="relative text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className="h-24 w-24 mx-auto mb-8 rounded-3xl bg-white border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.06)] flex items-center justify-center"
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
              <svg
                className="h-9 w-9 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </motion.div>

          <h2 className="text-2xl font-bold mb-4 text-slate-900">Gerencie tudo em um só lugar</h2>
          <p className="text-slate-600">
            Tarefas, métricas e relatórios para todos os seus clientes com a precisão que seu negócio merece.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
