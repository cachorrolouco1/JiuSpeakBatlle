import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Check, 
  AlertCircle, 
  LockOpen, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from './AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, initialTab = 'login', onSuccess }: AuthModalProps) {
  const { login, registerUser, requestPasswordReset, submitPasswordReset, triggerSocialSignIn } = useAuth();
  
  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'reset' | 'admin-login' | 'admin-2fa'>(initialTab);
  
  // Registration Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Admin 2FA State
  const [adminUser2FA, setAdminUser2FA] = useState<{ id: string; email: string } | null>(null);
  const [code2FA, setCode2FA] = useState('');
  
  // Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [simulatedLink, setSimulatedLink] = useState('');
  
  // Password Strength rating helper: 0 to 4
  const [pwdStrength, setPwdStrength] = useState(0);
  const [pwdFeedback, setPwdFeedback] = useState<string[]>([]);
  
  // Phone mask formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // keep only numbers
    
    if (value.length > 11) {
      value = value.slice(0, 11);
    }
    
    // Brazilian format: (99) 99999-9999
    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setPhone(value);
  };

  // Evaluate password strength in real time
  useEffect(() => {
    if (!password) {
      setPwdStrength(0);
      setPwdFeedback([]);
      return;
    }
    
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) score++;
    else feedback.push('No mínimo 8 caracteres');
    
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Uma letra maiúscula');
    
    if (/[0-9]/.test(password)) score++;
    else feedback.push('Um número');
    
    if (/[@$!%*?&]/.test(password)) score++;
    else feedback.push('Um caractere especial (@$!%*?&)');
    
    setPwdStrength(score);
    setPwdFeedback(feedback);
  }, [password]);

  // Clean error alerts upon switching views
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setSimulatedLink('');
  }, [tab]);

  if (!isOpen) return null;

  // Handles Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setSimulatedLink('');

    // Real-time validations enforcement
    if (!firstName || !lastName || !email || !phone || !address || !password || !confirmPassword) {
      setErrorMsg('Preencha todos os campos obrigatórios do formulário.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('A confirmação de senha não coincide.');
      setIsLoading(false);
      return;
    }

    if (pwdStrength < 4) {
      setErrorMsg('Sua senha não cumpre as regras mínimas de segurança.');
      setIsLoading(false);
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setErrorMsg('Você precisa aceitar os Termos e as Políticas de Privacidade.');
      setIsLoading(false);
      return;
    }

    const result = await registerUser({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address,
      password,
      confirm_password: confirmPassword,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted
    });

    setIsLoading(false);
    if (result.success) {
      setSuccessMsg(result.message);
      if (result.simulatedLink) {
        setSimulatedLink(result.simulatedLink);
      }
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 5000); // give them time to see the simulation!
    } else {
      setErrorMsg(result.message);
    }
  };

  // Handles Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Por favor, informe suas credenciais de acesso.');
      setIsLoading(false);
      return;
    }

    const result = await login(loginEmail, loginPassword);
    setIsLoading(false);
    if (result.success) {
      setSuccessMsg(result.message);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } else {
      setErrorMsg(result.message);
    }
  };

  // Handles separate Administrative Login submission (Step 1)
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao realizar login administrativo.');
      }

      if (data.require2FA) {
        setAdminUser2FA({ id: data.id, email: data.email });
        setSuccessMsg(data.message || 'Credenciais ok. Insira o código 2FA de administrador.');
        setTab('admin-2fa');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handles dynamic Admin 2FA confirmation (Step 2)
  const handleAdmin2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/admin/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adminUser2FA?.id, code2FA }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Código 2FA incorreto ou expirado.');
      }

      // Record administrative token and payload
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      
      setSuccessMsg('Autenticação aprovada! Acesso administrativo liberado.');
      
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        window.location.reload(); // Refresh components cleanly to load admin state
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handles Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!forgotEmail) {
      setErrorMsg('Digite seu e-mail cadastrado primeiro.');
      setIsLoading(false);
      return;
    }

    const result = await requestPasswordReset(forgotEmail);
    setIsLoading(false);
    if (result.success) {
      setSuccessMsg(result.message);
      if (result.simulatedLink) {
        setSimulatedLink(result.simulatedLink);
      }
    } else {
      setErrorMsg(result.message);
    }
  };

  // Handles Reset Password Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!resetToken || !newPassword || !confirmNewPassword) {
      setErrorMsg('Preencha os campos de código e novas senhas.');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('A confirmação da nova senha não bate.');
      setIsLoading(false);
      return;
    }

    const result = await submitPasswordReset(resetToken, newPassword, confirmNewPassword);
    setIsLoading(false);
    if (result.success) {
      setSuccessMsg(result.message);
      setTimeout(() => {
        setTab('login');
      }, 3000);
    } else {
      setErrorMsg(result.message);
    }
  };

  // Social Login Triggers (Simulated with live feedback matching users database)
  const handleSocialSignInClick = async (provider: 'Google' | 'Apple') => {
    setIsLoading(true);
    const mockEmail = provider === 'Google' ? 'lucas.spider@jiuspeak.com' : 'apple-athlete@jiuspeak.id';
    const mockName = provider === 'Google' ? "Lucas Spider Silva" : "Apple Fighter";
    
    const result = await triggerSocialSignIn(provider, mockEmail, mockName);
    setIsLoading(false);
    if (result.success) {
      setSuccessMsg(`Autenticado com sucesso através da conta ${provider}!`);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } else {
      setErrorMsg('Social Authentication temporary exception. Tente novamente.');
    }
  };

  const getStrengthBarColor = () => {
    switch (pwdStrength) {
      case 1: return 'bg-red-500 w-1/4';
      case 2: return 'bg-orange-500 w-2/4';
      case 3: return 'bg-yellow-500 w-3/4';
      case 4: return 'bg-green-500 w-full';
      default: return 'bg-neutral-800 w-0';
    }
  };

  const getStrengthLabel = () => {
    switch (pwdStrength) {
      case 1: return 'Fraca 🥋';
      case 2: return 'Média 🥋🥋';
      case 3: return 'Boa ⭐🥋🥋';
      case 4: return 'Forte & Blindada! 🥇⚡';
      default: return 'Inexistente';
    }
  };

  return (
    <div id="auth_portal_overlay" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="relative bg-[#050505] border border-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header line accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-650 via-amber-500 to-yellow-500" />
        
        {/* Close Button */}
        <button 
          id="btn_close_auth_modal"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white bg-neutral-900/40 p-1.5 rounded-lg border border-neutral-850 hover:border-neutral-800 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Box */}
        <div className="p-6 md:p-8">
          
          {/* Logo Brand Header */}
          <div className="text-center mb-6">
            <span className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white italic tracking-tighter text-xs mx-auto mb-2 shadow shadow-red-950">
              JS
            </span>
            <h3 className="text-xl font-extrabold tracking-tight text-white italic uppercase">
              {tab === 'login' && 'Iniciar Sessão De Luta'}
              {tab === 'register' && 'Criar Conta JiuSpeak'}
              {tab === 'forgot' && 'Recuperar Senha'}
              {tab === 'reset' && 'Redefinir Nova Senha'}
              {tab === 'admin-login' && 'Painel Militar 🛡️ Admin'}
              {tab === 'admin-2fa' && 'Verificação 2FA Requerida'}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
              {tab === 'login' && 'Faça o login para acumular pontos no placar gringo.'}
              {tab === 'register' && 'Participe do ranking global, PvP multiplayer e fature certificados de luta.'}
              {tab === 'forgot' && 'Insira seu e-mail cadastrado e enviaremos um token automático.'}
              {tab === 'reset' && 'Insira o token recebido e configure sua nova chave de segurança.'}
              {tab === 'admin-login' && 'Acesso restrito para administradores credenciados do JiuSpeak.'}
              {tab === 'admin-2fa' && 'Digite o código de duas etapas (123456 ou 080808) para autorização.'}
            </p>
          </div>

          {/* Feedback alerts */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-950/40 border border-red-900/50 rounded-xl p-3 mb-4 text-xs text-red-400 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-green-950/40 border border-green-900/50 rounded-xl p-3.5 mb-4 text-xs text-green-400 flex flex-col gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-500" />
                  <span className="font-bold">{successMsg}</span>
                </div>
                
                {/* Embedded simulator block for simulated email verification inside the iframe preview */}
                {simulatedLink && (
                  <div className="mt-2 bg-[#020202] border border-neutral-850 p-2.5 rounded-lg space-y-2">
                    <p className="text-[10px] text-yellow-500 font-mono font-bold flex items-center gap-1.5 uppercase">
                      <Sparkles className="w-3 h-3 animate-spin text-yellow-500" />
                      SIMULADOR DE SERVIDOR JIUSPEAK:
                    </p>
                    <p className="text-[9px] text-neutral-400">Como estamos rodando na sandbox do AI Studio, você pode ativar e verificar a conta instantaneamente clicando abaixo:</p>
                    <a 
                      href={simulatedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono uppercase bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[9px] px-2.5 py-1.5 rounded border border-yellow-600 transition-all hover:scale-[1.01]"
                    >
                      <span>Simular Clique de Verificação 🥋</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render Tab Views */}
          
          {/* --- VIEW: LOGIN --- */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Endereço de E-mail</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email"
                    required
                    placeholder="exemplo@atleta.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Sua Senha</label>
                  <button 
                    type="button" 
                    onClick={() => setTab('forgot')}
                    className="text-[10px] font-mono text-amber-500 hover:text-amber-400 font-bold transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password"
                    required
                    placeholder="Sua senha secreta"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-red-650 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-800 disabled:to-red-950 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-950/20 hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? 'Checando Chave De Luta...' : 'Entrar no Combate! 🥋'}
              </button>

              {/* Login Social Structures */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-900" />
                </div>
                <div className="relative flex justify-center text-[10px] font-mono uppercase font-bold text-neutral-500">
                  <span className="bg-[#050505] px-3">Ou conecte-se com</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => handleSocialSignInClick('Google')}
                  className="py-3 px-4 bg-neutral-950 border border-neutral-900 hover:border-neutral-800 rounded-xl font-mono text-xs font-bold text-neutral-300 hover:text-white transition duration-200 flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <span className="text-base">🌐</span>
                  <span>Google Sign-In</span>
                </button>
                <button 
                  type="button"
                  onClick={() => handleSocialSignInClick('Apple')}
                  className="py-3 px-4 bg-neutral-950 border border-neutral-900 hover:border-neutral-800 rounded-xl font-mono text-xs font-bold text-neutral-300 hover:text-white transition duration-200 flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <span className="text-base">🍎</span>
                  <span>Apple ID</span>
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-4 pt-2 border-t border-neutral-900">
                <p className="text-center text-xs text-neutral-500">
                  Novo por aqui?{' '}
                  <button 
                    type="button" 
                    onClick={() => setTab('register')}
                    className="text-amber-500 hover:text-amber-400 font-bold underline transition-colors"
                  >
                    Cadastre sua conta grátis
                  </button>
                </p>
                <p className="text-center text-[10px] text-neutral-600 font-mono mt-0.5">
                  É administrador?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setTab('admin-login'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-red-500 hover:text-red-400 font-bold hover:underline transition-colors focus:outline-none"
                  >
                    Acesso Administrativo (2FA) 🛡️
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* --- VIEW: ADMINISTRATIVE LOGIN (Step 1) --- */}
          {tab === 'admin-login' && (
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">E-mail Corporativo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email"
                    required
                    placeholder="exemplo@jiuspeak.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Chave Militar Secreta</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password"
                    required
                    placeholder="Sua senha secreta de administrador"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-800 disabled:to-red-950 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-950/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? 'Autenticando...' : 'Verificar Cadastro Admin 🔏'}
              </button>

              <div className="flex flex-col gap-2 mt-4 pt-2 border-t border-neutral-900">
                <p className="text-center text-xs text-neutral-500">
                  Voltar para login de aluno?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-amber-500 hover:text-amber-400 font-bold underline transition-colors focus:outline-none"
                  >
                    Voltar ao Portal Geral
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* --- VIEW: ADMINISTRATIVE 2FA (Step 2) --- */}
          {tab === 'admin-2fa' && (
            <form onSubmit={handleAdmin2FASubmit} className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center">
                <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">MFA Canal Ativo</p>
                <p className="text-xs font-bold text-neutral-200 mt-1">
                  Enviamos o código 2FA para o e-mail: <span className="text-red-400">{adminUser2FA?.email}</span>
                </p>
                <div className="mt-2 text-[10px] text-neutral-500 bg-neutral-900/50 p-2 rounded border border-neutral-950 font-mono text-center">
                  Dica de simulação para desenvolvimento/testes:<br />
                  Código válido padrão: <span className="text-amber-500 font-bold">123456</span> ou <span className="text-amber-500 font-bold">080808</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block text-center">Código de Verificação de 6 Dígitos</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-base font-bold font-mono tracking-[0.5em] text-center text-white rounded-xl py-3 placeholder-neutral-700 focus:outline-none focus:border-red-650 transition-all placeholder:tracking-normal"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-850 disabled:from-neutral-800 disabled:to-neutral-900 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
              >
                {isLoading ? 'Checando Código...' : 'Confirmar e Liberar Sessão ✔️'}
              </button>

              <div className="flex flex-col gap-2 mt-4 pt-2 border-t border-neutral-900">
                <p className="text-center text-xs text-neutral-500">
                  Deseja cancelar?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setTab('admin-login'); setErrorMsg(''); setSuccessMsg(''); setCode2FA(''); }}
                    className="text-amber-500 hover:text-amber-400 font-bold underline transition-colors focus:outline-none"
                  >
                    Voltar para Login Admin
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* --- VIEW: REGISTER (Sign Up) --- */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1.5 scrollbar-thin">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Nome *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Marcus"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Sobrenome *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: da Silva"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl px-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">E-mail de Trabalho ou Atleta *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email"
                    required
                    placeholder="atleta@jiuspeak.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Telefone (DDD + Celular) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input 
                    type="text"
                    required
                    maxLength={15}
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Endereço Completo (Rua, Cidade, Estado) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input 
                    type="text"
                    required
                    placeholder="Rua das Acacias, 123, São Paulo, SP"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Senha Segura *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password"
                    required
                    placeholder="No mínimo 8 caracteres com símbolos"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all"
                  />
                </div>
              </div>

              {/* Dynamic strength meter rendering */}
              {password.length > 0 && (
                <div className="bg-[#080808] border border-neutral-900 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                    <span>Força da Senha:</span>
                    <span className="font-bold">{getStrengthLabel()}</span>
                  </div>
                  
                  {/* Visual slider block */}
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${getStrengthBarColor()}`} />
                  </div>

                  {/* Missing requirements feedback */}
                  {pwdFeedback.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[9px] text-neutral-500 font-mono">Falta para ficar 100% segura:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pwdFeedback.map((feed, i) => (
                          <span key={i} className="bg-red-950/20 text-red-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-red-900/10">
                            ✕ {feed}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {pwdStrength === 4 && (
                    <p className="text-[9px] text-green-400 font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Senha blindada! Pronto para travar o combate.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Confirmar Senha *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <LockOpen className="w-4 h-4" />
                  </span>
                  <input 
                    type="password"
                    required
                    placeholder="Repita sua senha idêntica"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all"
                  />
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-[10px] text-red-400 font-mono">⚠️ As senhas digitadas não batem.</p>
                )}
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <p className="text-[10px] text-green-400 font-mono flex items-center gap-1">✓ Confirmação coincide.</p>
                )}
              </div>

              {/* Accolades of Agreements */}
              <div className="space-y-2 pt-2 border-t border-neutral-900">
                <label className="relative flex items-start gap-2.5 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={() => setTermsAccepted(!termsAccepted)}
                    className="w-4 h-4 rounded border-neutral-800 text-red-650 bg-neutral-950 mt-0.5 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-neutral-400 leading-normal select-none group-hover:text-neutral-300">
                    Li e concordo expressamente com os <a href="#" className="underline text-amber-500 hover:text-amber-400">Termos de Uso</a> da arena JiuSpeak.
                  </span>
                </label>

                <label className="relative flex items-start gap-2.5 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={() => setPrivacyAccepted(!privacyAccepted)}
                    className="w-4 h-4 rounded border-neutral-800 text-red-650 bg-neutral-950 mt-0.5 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-neutral-400 leading-normal select-none group-hover:text-neutral-300">
                    Autorizo o uso dos meus dados cadastrais conforme a <a href="#" className="underline text-amber-500 hover:text-amber-400">Política de Privacidade</a> para fins de ranking.
                  </span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={isLoading || pwdStrength < 4 || !termsAccepted || !privacyAccepted}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-red-650 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-neutral-900 disabled:to-neutral-950 disabled:text-neutral-600 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-950/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? 'Cadastrando Usuário...' : 'Cadastrar Minha Faixa! 🥋'}
              </button>

              <p className="text-center text-xs text-neutral-500 mt-4 pt-1">
                Já possui conta?{' '}
                <button 
                  type="button" 
                  onClick={() => setTab('login')}
                  className="text-amber-500 hover:text-amber-400 font-bold underline transition-colors"
                >
                  Entrar na plataforma
                </button>
              </p>
            </form>
          )}

          {/* --- VIEW: FORGOT PASSWORD --- */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Endereço de E-mail cadastrado</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email"
                    required
                    placeholder="atleta@jiuspeak.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-red-650 to-red-700 hover:from-red-700 hover:to-red-800 disabled:bg-neutral-900 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-950/20 hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? 'Checando Servidor...' : 'Disparar Token Automático ⚡'}
              </button>

              {/* Simulation recovery details link displayed for immediate access inside sandbox */}
              {simulatedLink && (
                <div className="bg-[#020202] border border-neutral-850 p-2.5 rounded-lg space-y-2 mt-4">
                  <p className="text-[10px] text-yellow-500 font-mono font-bold flex items-center gap-1.5 uppercase">
                    <Sparkles className="w-3" />
                    SIMULADOR DE EMAIL DE RECOVERY:
                  </p>
                  <p className="text-[9px] text-neutral-400">Clique no link correspondente simulado para digitar e registrar a nova senha de login:</p>
                  <button
                    type="button"
                    onClick={() => {
                      setResetToken(simulatedLink.split('token=')[1]);
                      setTab('reset');
                    }}
                    className="w-full inline-flex items-center justify-center gap-1 font-mono uppercase bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[9px] px-2.5 py-1.5 rounded border border-yellow-600 transition-all hover:scale-[1.01]"
                  >
                    <span>Ir Para Redefinição De Senha 🥋</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              <p className="text-center text-xs text-neutral-500 mt-4 pt-2">
                Esqueceu o token?{' '}
                <button 
                  type="button" 
                  onClick={() => setTab('login')}
                  className="text-neutral-400 hover:text-white font-bold underline transition-colors"
                >
                  Voltar para login
                </button>
              </p>
            </form>
          )}

          {/* --- VIEW: RESET PASSWORD --- */}
          {tab === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Código Token De Segurança</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <Clock className="w-4 h-4 text-neutral-400" />
                  </span>
                  <input 
                    type="text"
                    required
                    placeholder="Código do token (rec_xxxxxx)"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Nova Senha Segura</label>
                <input 
                  type="password"
                  required
                  placeholder="Nova senha secreta"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl px-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Confirmar Nova Senha</label>
                <input 
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-neutral-800 text-xs text-white rounded-xl px-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-red-650 transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading || newPassword !== confirmNewPassword}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-red-650 to-red-700 hover:from-red-700 hover:to-red-800 disabled:bg-neutral-900 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-950/20 hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? 'Redefinindo Senha...' : 'Salvar Nova Senha! 🥋'}
              </button>

              <button 
                type="button" 
                onClick={() => setTab('login')}
                className="w-full py-2 text-xs text-neutral-500 hover:text-white transition-colors"
              >
                Cancelar e voltar ao login
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
