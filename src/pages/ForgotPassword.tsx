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
      console.error("[forgotPassword]", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f6f8fc] to-[#f6f8fc]" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />

        <motion.div
          className="relative w-full max-w-md text-center bg-white border border-slate-200 rounded-3xl p-8
          shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
        >
          <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-slate-900">Email enviado!</h1>
          <p className="text-slate-600 mb-6">
            Enviamos um link de recuperação para <strong className="text-slate-900">{email}</strong>. Verifique sua
            caixa de entrada e spam.
          </p>

          <Link to="/login">
            <Button variant="outline" className="rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Login
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f6f8fc] to-[#f6f8fc]" />
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent rounded-full blur-[120px]" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />

      <motion.div
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8
        shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
      >
        <Link to="/" className="inline-block mb-8">
          <div className="text-slate-900 [&_*]:!text-slate-900">
            <Logo size="md" />
          </div>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">Esqueceu sua senha?</h1>
          <p className="text-slate-600">Informe seu email para receber um link de recuperação</p>
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

          <Button
            type="submit"
            className="w-full h-12 rounded-xl relative overflow-hidden group
            !bg-gradient-to-r !from-blue-600 !to-indigo-600 !text-white hover:opacity-95
            shadow-lg hover:shadow-xl transition-all"
            disabled={isLoading}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? "Enviando..." : "Enviar link de recuperação"}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
          </Button>
        </form>

        <div className="mt-8 space-y-4 text-center">
          <p className="text-slate-600">
            Lembrou sua senha?{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Fazer login
            </Link>
          </p>
          <Link to="/" className="inline-block text-sm text-slate-500 hover:text-slate-800 transition-colors">
            ← Voltar para tela inicial
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
