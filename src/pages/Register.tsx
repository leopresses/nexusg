import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";

const benefits = ["1 cliente grátis para sempre", "Tarefas semanais automatizadas", "Relatórios em PDF"];

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/onboarding");
    }
  }, [user, navigate]);

  const validatePassword = (pwd: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(pwd)) errors.push("1 letra maiúscula");
    if (!/[0-9]/.test(pwd)) errors.push("1 número");
    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validatePassword(password);
    if (!validation.valid) {
      toast({
        title: "Senha inválida",
        description: `Requisitos: ${validation.errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, name);

    if (error) {
      let errorMessage = "Ocorreu um erro ao criar sua conta.";

      if (error.message.includes("already registered")) {
        errorMessage = "Este email já está cadastrado. Tente fazer login.";
      } else if (error.message.includes("invalid email")) {
        errorMessage = "Por favor, insira um email válido.";
      } else if (error.message.includes("weak password")) {
        errorMessage = "Senha muito fraca. Use letras, números e símbolos.";
      }

      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Conta criada!",
        description: "Bem-vindo ao Gestão Nexus! Vamos configurar seu primeiro cliente.",
      });
      navigate("/onboarding");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB]" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

        <motion.div
          className="relative max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-6 text-white">
            Comece grátis, <span className="text-white/90">sem compromisso</span>
          </h2>
          <p className="text-white/70 mb-8">
            Crie sua conta em segundos e comece a gerenciar seu primeiro cliente imediatamente.
          </p>

          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              >
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-white">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="inline-block mb-8">
            <Logo size="md" />
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-[#0F172A]">Criar sua conta</h1>
            <p className="text-[#64748B]">Preencha os dados abaixo para começar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#0F172A]">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#64748B]" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 bg-white border-[#E6EAF2] focus-visible:ring-[#2563EB]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#0F172A]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#64748B]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white border-[#E6EAF2] focus-visible:ring-[#2563EB]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#0F172A]">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#64748B]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-white border-[#E6EAF2] focus-visible:ring-[#2563EB]"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>

            <Button type="submit" className="w-full h-12 bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-xl font-semibold" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Criar conta grátis"}
              <ArrowRight className="h-5 w-5" />
            </Button>

            <p className="text-xs text-[#64748B] text-center">
              Ao criar uma conta, você concorda com nossos{" "}
              <a href="#" className="text-[#2563EB] hover:underline">
                Termos de Uso
              </a>{" "}
              e{" "}
              <a href="#" className="text-[#2563EB] hover:underline">
                Política de Privacidade
              </a>
            </p>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <p className="text-[#64748B]">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-[#2563EB] hover:underline font-medium">
                Fazer login
              </Link>
            </p>
            <Link 
              to="/" 
              className="inline-block text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              ← Voltar para tela inicial
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
