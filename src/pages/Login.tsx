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

  useEffect(() => {
    if (user) {
      toast({
        title: "Você já está logado",
        description: "Redirecionando para o painel...",
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

      toast({
        title: "Erro no login",
        description: errorMessage,
      });
    } else {
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao Gestão Nexus.",
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
                  className="pl-10 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-blue-600 !text-slate-900"
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
                  className="pl-10 pr-10 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-blue-600 !text-slate-900"
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

            {/* BOTÃO AJUSTADO: Agora usa a variante 'default' (azul Nexus) configurada globalmente */}
            <Button type="submit" variant="default" className="w-full h-12" disabled={isLoading}>
              <span className="flex items-center justify-center gap-2 font-bold">
                {isLoading ? "Entrando..." : "Entrar"}
                <ArrowRight className="h-5 w-5" />
              </span>
            </Button>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <p className="text-slate-600">
              Não tem uma conta?{" "}
              <Link to="/register" className="text-blue-600 hover:underline font-bold">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden border-l border-slate-100 bg-[#f6f8fc]">
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-[120px]" />
        <motion.div
          className="relative text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="h-20 w-20 mx-auto mb-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-slate-900">Gerencie tudo em um só lugar</h2>
          <p className="text-slate-600">A produtividade que seu negócio merece com a precisão do Gestão Nexus.</p>
        </motion.div>
      </div>
    </div>
  );
}
