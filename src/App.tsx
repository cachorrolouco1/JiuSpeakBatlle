/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sword, 
  Crown, 
  Flame, 
  Sparkles, 
  BrainCircuit, 
  Compass, 
  UserCheck, 
  Award, 
  GraduationCap, 
  ArrowRight, 
  Star, 
  Menu, 
  X, 
  ChevronRight, 
  Play, 
  Heart,
  Globe,
  Lock,
  MessageSquare,
  LogOut,
  User as UserIcon
} from 'lucide-react';

// Import our modular components
import AIPronunciation from './components/AIPronunciation';
import MatSlang from './components/MatSlang';
import PvPArena from './components/PvPArena';
import GlobalRanking from './components/GlobalRanking';
import Certificates from './components/Certificates';
import GamificationCenter from './components/GamificationCenter';
import InternationalSection from './components/InternationalSection';
import StudentDashboard from './components/StudentDashboard';
import { useAuth } from './components/AuthContext';
import AuthModal from './components/AuthModal';

// Athlete image path generated earlier
const HERO_ATHLETE_URL = "/src/assets/images/bjj_hero_athlete_1779667861450.png";

export default function App() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const [activeTab, setActiveTab] = useState<'pronounce' | 'slang' | 'pvp' | 'ranking' | 'certificates' | 'international'>('pronounce');

  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent;
      const tab = customEvent.detail?.tab || 'login';
      setAuthModalTab(tab);
      setAuthModalOpen(true);
    };
    window.addEventListener('open_auth_modal', handleOpenAuth);
    return () => window.removeEventListener('open_auth_modal', handleOpenAuth);
  }, []);

  const openAuth = (tabName: 'login' | 'register') => {
    setAuthModalTab(tabName);
    setAuthModalOpen(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const testimonies = [
    {
      name: "Felipe 'Preguiça' Ramos",
      role: "Atleta Profissional & Campeão Pan-Americano",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      text: "Eu passei muito sufoco nas minhas primeiras lutas na Califórnia. Não entendia o que o árbitro pedia e perdia pontos por enrolar a luta. O JiuSpeak é a cura para todo competidor brasileiro que quer conquistar o mundo.",
      belt: "Black Belt",
      rating: 5
    },
    {
      name: "Mestre Renan Gracie",
      role: "Diretor Técnico de Academia nos EUA",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      text: "Quando gringos vêm treinar no Rio de Janeiro, há uma barreira tremenda. Com o JiuSpeak, conseguimos sincronizar e explicar a essência das gírias cariocas mais emblemáticas de forma fluida. Uma ponte essencial.",
      belt: "Coral Belt 7º Grau",
      rating: 5
    },
    {
      name: "Sarah Jenkins",
      role: "Faixa Azul Americana (Treinando no Brasil)",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      text: "I used to get lost when the Brazilian master shouted 'Cava esgrima!'. This app helped me translate slang in real time. It boosted my mat vocabulary in weeks. Highly recommended for travelers!",
      belt: "Blue Belt",
      rating: 5
    }
  ];

  if (view === 'dashboard') {
    return (
      <StudentDashboard 
        onBackToHome={() => setView('landing')}
        AIPronunciationComponent={AIPronunciation}
        MatSlangComponent={MatSlang}
        PvPArenaComponent={PvPArena}
        GlobalRankingComponent={GlobalRanking}
        CertificatesComponent={Certificates}
      />
    );
  }

  return (
    <div className="bg-[#030303] min-h-screen text-stone-100 flex flex-col font-sans selection:bg-red-650 selection:text-white relative">
      
      {/* Dynamic Background Noise Line or Accent */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-red-950/20 via-transparent to-transparent pointer-events-none" />

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-[#030303]/90 backdrop-blur-md border-b border-neutral-900 px-4 md:px-8 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white italic tracking-tighter text-sm border border-neutral-950">
              JS
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5 italic">
                JIUSPEAK
              </h1>
              <div className="flex gap-0.5 mt-0.5">
                <span className="w-4 h-1 bg-black rounded" />
                <span className="w-2 h-1 bg-red-600 rounded" />
                <span className="w-2 h-1 bg-amber-500 rounded" />
              </div>
            </div>
          </div>
                   {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-mono uppercase tracking-wider font-bold text-neutral-400">
            <button onClick={() => scrollToSection('hero')} className="hover:text-red-500 transition-colors">Início</button>
            <button onClick={() => scrollToSection('dashboard')} className="hover:text-amber-500 transition-colors">Funcionalidades</button>
            <button onClick={() => scrollToSection('gamification')} className="hover:text-amber-500 transition-colors">Gamificação</button>
            <button onClick={() => scrollToSection('international_section')} className="hover:text-amber-500 transition-colors">Internacional</button>
            <button onClick={() => scrollToSection('testimonials')} className="hover:text-amber-500 transition-colors">Depoimentos</button>
            
            {user ? (
              <button 
                onClick={() => setView('dashboard')} 
                className="text-amber-400 hover:text-amber-300 hover:scale-[1.02] duration-200 transition-all font-semibold py-1.5 px-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"
              >
                Painel ({user.first_name}) 🥋
              </button>
            ) : (
              <button 
                onClick={() => openAuth('login')} 
                className="text-neutral-300 hover:text-white hover:scale-[1.02] duration-200 transition-all font-semibold py-1.5 px-3 bg-neutral-900 border border-neutral-800 rounded-xl"
              >
                Acessar Portal 🔑
              </button>
            )}
          </nav>

          {/* Premium Call Action button / User identity badge */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <span className="text-xs font-black block text-stone-100">{user.first_name}</span>
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">{user.belt_rank === 'White' ? 'Branca' : user.belt_rank} Belt</span>
                </div>
                <button 
                  onClick={() => setView('dashboard')}
                  className="py-2 px-4 bg-gradient-to-r from-red-650 to-red-700 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all duration-300 shadow hover:scale-[1.02]"
                >
                  Ir Para o Dojo🥋
                </button>
                <button 
                  onClick={logout}
                  title="Sair da Conta"
                  className="p-2 bg-neutral-950 border border-neutral-850 rounded-xl text-neutral-500 hover:text-red-500 hover:border-red-900/30 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => openAuth('register')}
                  className="py-2.5 px-5 bg-gradient-to-r from-red-650 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all duration-300 shadow-md shadow-red-950/20 hover:scale-[1.03]"
                >
                  Matricular Grátis
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <button 
            type="button"
            className="lg:hidden text-neutral-400 hover:text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden bg-neutral-950/95 border-b border-neutral-900 absolute top-full left-0 right-0 py-6 px-6 space-y-4 shadow-xl z-50"
          >
            <div className="flex flex-col gap-4 text-sm font-mono uppercase tracking-wider font-medium text-neutral-400">
              <button onClick={() => { scrollToSection('hero'); setMobileMenuOpen(false); }} className="text-left hover:text-white">Início</button>
              <button onClick={() => { scrollToSection('dashboard'); setMobileMenuOpen(false); }} className="text-left hover:text-white">Funcionalidades</button>
              <button onClick={() => { scrollToSection('gamification'); setMobileMenuOpen(false); }} className="text-left hover:text-white">Gamificação</button>
              <button onClick={() => { scrollToSection('international_section'); setMobileMenuOpen(false); }} className="text-left hover:text-white">Internacional</button>
              <button onClick={() => { scrollToSection('testimonials'); setMobileMenuOpen(false); }} className="text-left hover:text-white">Depoimentos</button>
              
              {user ? (
                <button onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }} className="text-left text-amber-500 font-bold">
                  Dojo Aluno: {user.first_name} 🥋
                </button>
              ) : (
                <button onClick={() => { openAuth('login'); setMobileMenuOpen(false); }} className="text-left text-neutral-300 font-bold">
                  Acessar Conta 🔑
                </button>
              )}
            </div>

            {user ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-900">
                <button 
                  onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition"
                >
                  Ir Para o Dojo 🥋
                </button>
                <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 bg-neutral-900 text-red-500 text-xs font-bold uppercase tracking-wider rounded-xl transition border border-red-900/10 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair do Tatame</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { openAuth('register'); setMobileMenuOpen(false); }}
                className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition"
              >
                Começar Agora (Grátis)
              </button>
            )}
          </motion.div>
        )}
      </header>

      {/* --- HERO SECTION --- */}
      <section id="hero" className="relative pt-10 md:pt-16 pb-12 md:pb-24 px-4 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/40 border border-red-900/50 rounded-full text-xs font-mono font-bold text-red-500">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>SISTEMA DE PRECISÃO COMBAT-SPEECH</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight uppercase italic duration-300">
              DOMINE O INGLÊS.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-amber-500">
                AMASSE NO TATAME
              </span><br />
              INTERNACIONAL.
            </h2>

            <p className="text-sm md:text-base text-neutral-400 max-w-xl leading-relaxed">
              A única plataforma gamificada do mundo focada 100% no inglês de luta. Domine expressões técnicas, comandos do árbitro, gírias dos seminários e vença as batalhas verbais gringas.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                onClick={() => user ? setView('dashboard') : openAuth('register')}
                className="w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-red-650 via-red-700 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-red-950/40 hover:shadow-red-950/60 duration-350 flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                <span>{user ? 'Ir para o Painel 🥋' : 'Matricular-se Grátis 🥋'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('dashboard')}
                className="w-full sm:w-auto py-4 px-8 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>Dicionário Rápido</span>
              </button>
            </div>

            {/* Micro Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-neutral-900/80 pt-8 mt-6">
              <div>
                <span className="text-2xl font-black text-white font-mono block">5.000+</span>
                <span className="text-[10px] text-neutral-500 uppercase font-mono font-bold">Rolas de Termos</span>
              </div>
              <div>
                <span className="text-2xl font-black text-amber-500 font-mono block">98%</span>
                <span className="text-[10px] text-neutral-500 uppercase font-mono font-bold">Acurácia Requerida</span>
              </div>
              <div>
                <span className="text-2xl font-black text-white font-mono block">IBJJF</span>
                <span className="text-[10px] text-neutral-500 uppercase font-mono font-bold">Foco em Regras</span>
              </div>
              <div>
                <span className="text-2xl font-black text-rose-500 font-mono block">LIVE</span>
                <span className="text-[10px] text-neutral-500 uppercase font-mono font-bold">Arena PvP 24/7</span>
              </div>
            </div>
          </div>

          {/* Hero Right - Interactive athlete display with gold spotlight frame */}
          <div className="lg:col-span-12 xl:col-span-5 relative flex justify-center py-6">
            
            {/* Outer golden halo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-red-650/10 to-transparent blur-3xl rounded-full scale-105 pointer-events-none" />

            {/* Custom crafted layout box with athlete */}
            <div className="relative z-10 w-full max-w-sm border border-neutral-800 rounded-3xl p-4 bg-gradient-to-b from-neutral-900 via-[#0a0a0a] to-[#040404]">
              {/* Premium header tag */}
              <div className="flex justify-between items-center bg-[#020202] px-3.5 py-1.5 rounded-2xl border border-neutral-850 text-xs font-mono font-bold">
                <span className="text-amber-500 text-[10px]">● GRADUADO PRO</span>
                <span className="text-neutral-500">JIUSPEAK 2026</span>
              </div>

              {/* Generated BJJ Athlete Visual Container */}
              <div className="mt-3.5 relative rounded-2xl overflow-hidden aspect-video border border-neutral-850 bg-neutral-950 group">
                <img 
                  src={HERO_ATHLETE_URL} 
                  alt="Atleta de Jiu-Jítsu Brasileiro Faixa Preta" 
                  className="w-full h-full object-cover group-hover:scale-105 duration-700"
                  referrerPolicy="no-referrer"
                />
                
                {/* Neon shadow lines overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/90 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[9px] font-mono text-red-400 font-bold uppercase">UFC Style Framing</span>
                  <p className="text-xs font-bold text-white leading-tight">Mestre Lucas 'Spider' Silva no Tatame Internacional</p>
                </div>
              </div>

              {/* Static widgets inside hero framing to look like dynamic game layout */}
              <div className="mt-3 bg-[#0a0a0a] border border-neutral-850 rounded-2xl p-3.5 space-y-3 font-mono text-xs">
                
                {/* Speed gauge representation */}
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-[10px]">Speech Target Accuracy</span>
                  <span className="text-green-500 font-black">94%</span>
                </div>
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-900">
                  <div className="w-11/12 bg-green-500 h-full rounded-full" />
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-neutral-400">Tactical Grade Level</span>
                  <span className="text-amber-500 font-bold uppercase py-0.5 px-2 bg-neutral-950 rounded border border-neutral-800">
                    Purple Belt V
                  </span>
                </div>
              </div>

              {/* Decorative brand footer stamp */}
              <p className="text-[10px] text-neutral-500 text-center font-mono mt-3.5 italic">
                "Technical speech is as sharp as a precise armbar."
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* --- REVOLUTIONARY INTERACTIVE FEATURE PLATFORM --- */}
      <section id="dashboard" className="py-16 bg-[#060606] border-y border-neutral-900 px-4 md:px-8 relative">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-mono tracking-wider bg-neutral-900 text-red-500 px-3 py-1 rounded-full border border-neutral-850 font-bold uppercase">
              PLATA-FORMA INTERATIVA
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mt-3">
              ÁREA DE TREINAMENTO (DOJO)
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 mt-2 leading-relaxed">
              Troque de aba abaixo e experimente os módulos da plataforma na hora. Pratique a fala gringa, confira gírias ou duele na arena live!
            </p>
          </div>

          {/* Quick tab switchers (Duolingo / UFC buttons style) */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 border-b border-neutral-900 pb-8">
            <button
              onClick={() => setActiveTab('pronounce')}
              className={`py-3 px-5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'pronounce'
                  ? 'bg-amber-500 text-black border-amber-500 shadow-xl shadow-amber-500/10 scale-102'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-900 hover:border-neutral-800'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              IA de Pronúncia
            </button>

            <button
              onClick={() => setActiveTab('slang')}
              className={`py-3 px-5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'slang'
                  ? 'bg-amber-500 text-black border-amber-500 shadow-xl shadow-amber-500/10 scale-102'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-900 hover:border-neutral-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              Gírias do Tatame
            </button>

            <button
              onClick={() => setActiveTab('pvp')}
              className={`py-3 px-5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'pvp'
                  ? 'bg-amber-500 text-black border-amber-500 shadow-xl shadow-amber-500/10 scale-102'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-900 hover:border-neutral-800'
              }`}
            >
              <Sword className="w-4 h-4" />
              Arena PvP
            </button>

            <button
              onClick={() => setActiveTab('ranking')}
              className={`py-3 px-5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'ranking'
                  ? 'bg-amber-500 text-black border-amber-500 shadow-xl shadow-amber-500/10 scale-102'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-900 hover:border-neutral-800'
              }`}
            >
              <Crown className="w-4 h-4" />
              Ranking Global
            </button>

            <button
              onClick={() => setActiveTab('certificates')}
              className={`py-3 px-5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'certificates'
                  ? 'bg-amber-500 text-black border-amber-500 shadow-xl shadow-amber-500/10 scale-102'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-900 hover:border-neutral-800'
              }`}
            >
              <Award className="w-4 h-4" />
              Certificações
            </button>
          </div>

          {/* Master Dashboard Module Render Container */}
          <div className="relative z-10">
            {activeTab === 'pronounce' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <AIPronunciation />
              </motion.div>
            )}

            {activeTab === 'slang' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <MatSlang />
              </motion.div>
            )}

            {activeTab === 'pvp' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <PvPArena />
              </motion.div>
            )}

            {activeTab === 'ranking' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <GlobalRanking />
              </motion.div>
            )}

            {activeTab === 'certificates' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <Certificates />
              </motion.div>
            )}
          </div>

        </div>
      </section>

      {/* --- GAMIFICATION HUB SHOWCASE --- */}
      <section id="gamification" className="py-16 px-4 md:px-8 border-b border-neutral-900">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Title */}
          <div className="mb-12">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full" />
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold">REGRADADO E JOGÁVEL</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mt-1.5 uppercase italic">
              Metologia De Medalhas & Faixas
            </h2>
            <p className="text-xs text-neutral-500 max-w-xl mt-1 leading-relaxed">
              Conforme você responde questões, interage com áudio e estuda as gírias do tatame americano, sua conta sobe de graduação e ganha recompensas e conquistas.
            </p>
          </div>

          {/* Core Gamification Hud modular component integration */}
          <div className="mt-8">
            <GamificationCenter />
          </div>

        </div>
      </section>

      {/* --- INTERNATIONAL CORNER SECTION --- */}
      <section id="international_section" className="py-16 bg-[#060606] px-4 md:px-8 border-b border-neutral-900">
        <div className="max-w-7xl mx-auto">
          <InternationalSection />
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section id="testimonials" className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-mono tracking-wider bg-neutral-900 text-amber-500 px-3 py-1 rounded-full border border-neutral-850 font-bold uppercase text-center inline-block">
              DEPOIMENTOS DOS LUTADORES
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3 italic">
              QUEM SEGUE ESTE PLANO DE LUTA?
            </h2>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Lutadores e mestres contam como a ausência do inglês os travava lá fora e como o JiuSpeak transformou seus tatames.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonies.map((t, idx) => (
              <div 
                key={idx}
                className="bg-neutral-950 border border-neutral-850 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-700 transition duration-300"
              >
                <div>
                  {/* Rating Stars */}
                  <div className="flex text-amber-500 mb-3 gap-0.5">
                    {Array(t.rating).fill(null).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>

                  <p className="text-xs text-neutral-300 italic leading-relaxed">
                    "{t.text}"
                  </p>
                </div>

                <div className="flex items-center gap-3.5 border-t border-neutral-900/60 pt-4 mt-5">
                  <img 
                    src={t.avatar} 
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-800"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white block">{t.name}</h4>
                    <span className="text-[9px] text-amber-500 block font-mono uppercase mt-0.5">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* --- PREMIUMPANEL CALL TO ACTION OUTRO --- */}
      <section className="py-16 bg-gradient-to-t from-red-950/20 via-[#030303] to-[#030303] text-center px-4 md:px-8 border-t border-neutral-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient-t to-transparent opacity-20" />
        <div className="max-w-xl mx-auto relative z-10 space-y-5">
          <span className="text-[11px] font-mono tracking-widest text-amber-400 font-bold uppercase">
            ESTRADA PARA A PROFICIÊNCIA EXTRANJERA
          </span>
          
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase italic">
            NÃO DEIXE O SEU INGLÊS BATER DESISTÊNCIA.
          </h2>
          
          <p className="text-xs text-neutral-400 leading-relaxed">
            Seja para lutar na Califórnia, ministrar seminários no Japão ou fazer contatos em Londres. Comece seu cronograma hoje gratuitamente.
          </p>

          <div className="pt-2">
            <button
              onClick={() => user ? setView('dashboard') : openAuth('register')}
              className="py-4 px-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition hover:scale-[1.03]"
            >
              {user ? 'Acessar Meu Painel 🥋' : 'Matricular-se Grátis & Desafiar Oponentes'}
            </button>
          </div>
          
          <div className="text-[10px] text-neutral-500 font-mono">
            Disponível com suporte completo de microfone para desktops e celulares.
          </div>
        </div>
      </section>

      {/* --- FOOTER PREMIUM --- */}
      <footer className="bg-[#010101] border-t border-neutral-900 py-12 px-4 md:px-8 relative z-10 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo brand / license */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center font-bold text-white text-xs italic">
              JS
            </div>
            <div>
              <span className="font-extrabold text-white text-sm block tracking-wider uppercase italic">JIUSPEAK</span>
              <p className="text-[10px] text-neutral-600 mt-0.5">© 2026 JiuSpeak Corporation. Todos os direitos reservados. Oss!</p>
            </div>
          </div>

          {/* Links structure */}
          <div className="flex flex-wrap justify-center gap-6 text-[11px] font-mono tracking-wider font-semibold">
            <a href="#" className="hover:text-amber-500 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Regras IBJJF</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Contato</a>
          </div>

          {/* Decorative UFC / Arena Tag */}
          <div className="text-right text-[10px] font-mono uppercase bg-neutral-950 px-3 py-1.5 rounded border border-neutral-900 text-neutral-600">
            Powered by modern BJJ linguistics
          </div>

        </div>
      </footer>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialTab={authModalTab}
        onSuccess={() => {
          setAuthModalOpen(false);
          setView('dashboard');
        }}
      />
    </div>
  );
}
