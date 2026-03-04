import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function validatePassword(pwd: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (pwd.length < 8) errors.push("Mínimo 8 caracteres");
  if (!/[A-Z]/.test(pwd)) errors.push("1 letra maiúscula");
  if (!/[0-9]/.test(pwd)) errors.push("1 número");
  return { valid: errors.length === 0, errors };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const timeoutRef = useRef<number | null>(null);

  const passwordsMatch = useMemo(
    () => password.length > 0 && password === confirmPassword,
    [password, confirmPassword],
  );

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        toast({
          title: "Link inválido ou expirado",
          description: "Solicite um novo link de recuperação.",
          variant: "destructive",
        });
        navigate("/forgot-password", { replace: true });
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [navigate, toast]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoading) return;

      const validation = validatePassword(password);
      if (!validation.valid) {
        toast({
          title: "Senha inválida",
          description: `Requisitos: ${validation.errors.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      if (!passwordsMatch) {
        toast({
          title: "Senhas não coincidem",
          description: "Por favor, verifique se as senhas são iguais.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        setIsSuccess(true);

        toast({
          title: "Senha atualizada!",
          description: "Sua senha foi redefinida com sucesso.",
        });

        timeoutRef.current = window.setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível atualizar a senha.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, password, passwordsMatch, toast, navigate],
  );

  const togglePasswordVisibility = useCallback(() => setShowPassword((p) => !p), []);
  const toggleConfirmPasswordVisibility = useCallback(() => setShowConfirmPassword((p) => !p), []);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f6f8fc] to-[#f6f8fc]" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent rounded-full blur-[120px]" />

        <motion.div
          className="relative w-full max-w-md text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
        >
          <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-slate-900">Senha redefinida!</h1>
          <p className="text-slate-600 mb-6">Você será redirecionado para o login em instantes...</p>

          <Link to="/login">
            <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95">
              Ir para Login
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

      <motion.div
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
      >
        <Link to="/" className="inline-block mb-8">
          <Logo size="md" />
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">Redefinir senha</h1>
          <p className="text-slate-600">Crie uma nova senha segura para sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Nova senha */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">
              Nova senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="pl-10 pr-12 h-12 bg-white border-slate-200 rounded-xl focus-visible:ring-blue-600"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <PasswordStrengthIndicator password={password} />
          </div>

          {/* Confirmar senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700">
              Confirmar nova senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirme a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="pl-10 pr-12 h-12 bg-white border-slate-200 rounded-xl focus-visible:ring-blue-600"
                required
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors"
                aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-600">As senhas precisam ser iguais.</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar nova senha"}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-block text-sm text-slate-500 hover:text-slate-800 transition-colors">
            ← Voltar para tela inicial
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
