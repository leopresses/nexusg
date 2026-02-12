import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
  return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-[#DCFCE7] flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-[#16A34A]" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-[#0F172A]">Email enviado!</h1>
          <p className="text-[#64748B] mb-6">
            Enviamos um link de recuperação para <strong className="text-[#0F172A]">{email}</strong>. 
            Verifique sua caixa de entrada e spam.
          </p>
          <Link to="/login">
            <Button variant="outline" className="border-[#E6EAF2] text-[#0F172A] hover:bg-[#F5F7FB]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Login
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="inline-block mb-8">
            <Logo size="md" />
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-[#0F172A]">Esqueceu sua senha?</h1>
            <p className="text-[#64748B]">
              Informe seu email para receber um link de recuperação
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <Button type="submit" className="w-full h-12 bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-xl font-semibold" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar link de recuperação"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <p className="text-[#64748B]">
              Lembrou sua senha?{" "}
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

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB]" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

        <motion.div
          className="relative text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="h-24 w-24 mx-auto mb-8 bg-white/15 rounded-3xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20">
            <Mail className="h-14 w-14 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Recupere seu acesso</h2>
          <p className="text-white/70">
            Enviaremos um link seguro para o seu email para que você possa criar uma nova senha.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
