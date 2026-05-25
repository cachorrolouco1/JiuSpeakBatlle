import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Share2, Award, Trophy, Heart, MessageSquare, 
  Send, Shield, Sparkles, RefreshCw, Eye, Search, 
  Check, Copy, Bell, BellOff, Volume2, Flame, Play,
  Instagram, Facebook, Twitter, Disc, Linkedin, ArrowRight, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';

// Standard Badges list
interface BadgeInfo {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
}

const ALL_AVAILABLE_BADGES: BadgeInfo[] = [
  { id: 'b1', name: 'White Belt English', desc: 'Sua jornada começou! Aprendeu os primeiros 10 termos fundamentais de tatame.', icon: '🥋', color: 'border-white text-white bg-neutral-900' },
  { id: 'b2', name: 'Submission Expert', desc: 'Venceu 3 rodadas consecutivas na Arena PvP finalizando com precisão.', icon: '🦅', color: 'border-red-500 text-red-500 bg-red-950/20' },
  { id: 'b3', name: 'Tatame Translator', desc: 'Dominou 100% das gírias clássicas brasileiras e suas correspondências internacionais.', icon: '🗣️', color: 'border-amber-500 text-amber-500 bg-amber-950/20' },
  { id: 'b4', name: 'Arena Champion', desc: 'Conquistou mais de 1200 pontos de ELO Gladiador na Arena online.', icon: '🏆', color: 'border-yellow-400 text-yellow-400 bg-yellow-950/20 animate-pulse' },
  { id: 'b5', name: 'Pronunciation Master', desc: 'Alcançou score superior a 90% na IA de reconhecimento de voz por 5 vezes.', icon: '🎙️', color: 'border-green-500 text-green-500 bg-green-950/20' },
  { id: 'b6', name: '100 Day Streak', desc: 'Treinou inglês de combate por 100 dias consecutivos sem bater.', icon: '🔥', color: 'border-orange-500 text-orange-400 bg-orange-950/20' }
];

export default function SocialHub() {
  const { user, token } = useAuth();
  const [activeHubTab, setActiveHubTab] = useState<'feed' | 'generator' | 'profile' | 'badges'>('feed');
  
  // Feed states
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [feedLoading, setFeedLoading] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  // Achievements States
  const [myBadges, setMyBadges] = useState<string[]>([]);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebratedBadge, setCelebratedBadge] = useState<BadgeInfo | null>(null);

  // Social Login state mockup triggers
  const [linkedSocials, setLinkedSocials] = useState({
    google: true,
    apple: false,
    facebook: false,
    discord: false
  });

  // Share Card settings for Geração de Imagem
  const [cardLayout, setCardLayout] = useState<'story' | 'feed' | 'twitter' | 'whatsapp'>('feed');
  const [selectedShareTemplate, setSelectedShareTemplate] = useState<string>('streak');
  const [isCopying, setIsCopying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareLoadingText, setShareLoadingText] = useState('');

  // Public Profile lookup state
  const [searchQuery, setSearchQuery] = useState('lucas-spider');
  const [viewedProfile, setViewedProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Follow states
  const [isFollowingMap, setIsFollowingMap] = useState<{ [userId: string]: boolean }>({});

  // Active Notifications list
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifExpanded, setNotifExpanded] = useState(false);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  // Load Feed, Badges & Notifications on Init
  useEffect(() => {
    fetchFeed();
    if (user) {
      fetchMyAchievements();
      fetchNotifications();
    }
  }, [user]);

  const fetchFeed = async () => {
    setFeedLoading(true);
    try {
      const res = await fetch('/api/social/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFeedLoading(false);
    }
  };

  const fetchMyAchievements = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/social/user/${user.id}/achievements`);
      if (res.ok) {
        const data = await res.json();
        setMyBadges(data.achievements.map((a: any) => a.badge));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    if (!user || !token) return;
    try {
      const res = await fetch('/api/social/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create a custom community post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token || !newPostText.trim()) return;

    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'community',
          image_url: '🥋',
          content: newPostText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPosts(prev => [data.post, ...prev]);
        setNewPostText('');
        triggerToast('Post publicado com sucesso no feed!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auto post generator helper
  const triggerAutomatedPost = async (templateId: string) => {
    if (!user || !token) return;
    
    let content = '';
    let type = 'community';
    let icon = '🥋';

    if (templateId === 'belt') {
      content = `🥋 Acabei de ser graduado ${user.belt_rank} Belt em inglês aplicado ao Jiu-Jítsu no JiuSpeak! Superando desafios pragmáticos no dojo conceitual. OSS!`;
      type = 'belt';
      icon = '🥋';
    } else if (templateId === 'streak') {
      content = `🔥 Treino com constância na veia! Completei uma sequência de ${user.streak || 5} dias consecutivos no app JiuSpeak dominando gírias e pronúncia de combate.`;
      type = 'streak';
      icon = '🔥';
    } else if (templateId === 'ranking') {
      content = `🌎 Subindo a escada dos campeões no JiuSpeak! Estou no Top Geral do dojo de inglês de combate. Conquiste seu espaço na tatame! #BJJ`;
      type = 'rank';
      icon = '🏆';
    } else if (templateId === 'pvp') {
      content = `⚡ MMA Verbal! Acabei de vencer uma luta intensa na Arena PvP do JiuSpeak traduzindo termos técnicos em tempo recorde! OSS!`;
      type = 'match';
      icon = '⚡';
    }

    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, image_url: icon, content })
      });

      if (res.ok) {
        const data = await res.json();
        setPosts(prev => [data.post, ...prev]);
        setActiveHubTab('feed');
        triggerToast('Nova conquista publicada automaticamente no feed!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Post liking
  const handleLikePost = async (postId: string) => {
    if (!user || !token) {
      triggerToast('Faça login para curtir posts da comunidade');
      return;
    }

    try {
      const res = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes: data.liked 
                ? [...(p.likes || []), user.id]
                : (p.likes || []).filter((id: string) => id !== user.id)
            };
          }
          return p;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Comment
  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId] || '';
    if (!text.trim() || !user || !token) return;

    try {
      const res = await fetch(`/api/social/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: text })
      });

      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comments: [...(p.comments || []), data.comment]
            };
          }
          return p;
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        triggerToast('Comentário enviado!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Follow User action
  const handleFollowUser = async (targetUserId: string) => {
    if (!user || !token) {
      triggerToast('Sessão fechada. Crie uma conta ou entre no dojo.');
      return;
    }

    try {
      const res = await fetch(`/api/social/user/${targetUserId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowingMap(prev => ({ ...prev, [targetUserId]: data.followed }));
        triggerToast(data.followed ? 'Seguindo novo guerreiro!' : 'Deixou de seguir.');
        // If viewing searched profile, reload stats
        if (viewedProfile && viewedProfile.user.id === targetUserId) {
          lookupPublicProfile(viewedProfile.user.username);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Simulate instant social logins
  const toggleSocialLink = (provider: 'google' | 'apple' | 'facebook' | 'discord') => {
    setLinkedSocials(prev => {
      const update = { ...prev, [provider]: !prev[provider] };
      triggerToast(update[provider] ? `Conectado via ${provider.toUpperCase()} com sucesso!` : `Vínculo ${provider.toUpperCase()} removido.`);
      return update;
    });
  };

  // Simulate Instant Badge Unlock & Celebrate
  const forceUnlockBadge = async (badge: BadgeInfo) => {
    if (!user || !token) {
      triggerToast('Somente membros credenciados podem acumular insígnias.');
      return;
    }

    try {
      const res = await fetch(`/api/social/user/${user.id}/unlock-badge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ badge: badge.name })
      });

      if (res.ok) {
        setCelebratedBadge(badge);
        setShowCelebrationModal(true);
        fetchMyAchievements();
        
        // Auto publish post about unlocking badge
        const postContent = `🏆 Insígnia Desbloqueada: Acabei de conquistar a badge "${badge.name}" no JiuSpeak! "${badge.desc}". OSS!`;
        fetch('/api/social/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ type: 'badge', image_url: badge.icon, content: postContent })
        }).then(() => fetchFeed());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Simulate different activities triggers
  const handleSimulateNotif = async (type: 'follow' | 'like' | 'comment' | 'challenge') => {
    if (!user || !token) return;

    let sender = 'Antônio Gracie';
    let msg = 'desafiou você para um combate verbal na Arena PvP!';
    if (type === 'follow') {
      sender = 'Flávio BJJ';
      msg = 'começou a seguir sua evolução diária no inglês!';
    } else if (type === 'like') {
      sender = 'Yuki Sato 🇯🇵';
      msg = 'curtiu seu Story de subida de faixa.';
    } else if (type === 'comment') {
      sender = 'Marcus Miller 🇺🇸';
      msg = 'comentou: "Very nice roll and clean pronunciation!"';
    }

    try {
      const res = await fetch('/api/social/notifications/sim-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, sender_name: sender, message: msg })
      });

      if (res.ok) {
        fetchNotifications();
        triggerToast(`Notificação social simulada! Nova atividade gerada.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Lookup public profiles
  const lookupPublicProfile = async (targetUsername: string) => {
    setProfileLoading(true);
    setViewedProfile(null);
    try {
      const res = await fetch(`/api/social/user/${targetUsername}`);
      if (res.ok) {
        const data = await res.json();
        setViewedProfile(data);
        setIsFollowingMap(prev => ({ ...prev, [data.user.id]: data.is_following || false }));
      } else {
        triggerToast('Nenhum competidor encontrado com esse usuário ou ID.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  };

  // Clipboard copy emulation
  const copyShareLink = () => {
    setIsCopying(true);
    setTimeout(() => {
      navigator.clipboard.writeText(`https://jiuspeak.com/user/${user ? user.first_name.toLowerCase() : 'atleta'}`);
      setCopiedLink(true);
      setIsCopying(false);
      triggerToast('Link de compartilhamento copiado para o clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    }, 450);
  };

  // Social trigger animation mock
  const simulateSocialShare = (networkName: string) => {
    setShareLoadingText(`Gerando pacote esportivo premium para o ${networkName}...`);
    setTimeout(() => {
      setShareLoadingText(`Redirecionando de forma responsiva para o portal ${networkName}...`);
      setTimeout(() => {
        setShareLoadingText('');
        triggerToast(`Sucesso! Conquista publicada via web api no ${networkName}.`);
      }, 1000);
    }, 1200);
  };

  // Utility Toast Controller
  const triggerToast = (text: string) => {
    setActiveAlert(text);
    setTimeout(() => {
      setActiveAlert(null);
    }, 4500);
  };

  return (
    <div id="jiuspeak_social_hub_scope" className="space-y-6 relative">
      
      {/* Toast popup */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-amber-500 text-black border-2 border-amber-400 font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 fill-current shrink-0 animate-spin" />
            <span>{activeAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UFC styled upper notifications drawer */}
      <div className="bg-neutral-950/80 border border-neutral-900 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-900 flex items-center justify-center text-red-500">
            <Bell className="w-5 h-5" />
          </div>
          <div className="leading-tight text-left">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Notificações Sociais ({notifications.length})</h4>
            <p className="text-[10px] text-neutral-500">Acompanhe quem curtiu, desafiou ou seguiu seu dojo.</p>
          </div>
        </div>

        {/* Dynamic inline notification toggler */}
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={() => setNotifExpanded(!notifExpanded)}
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-stone-200 text-[10px] font-mono uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              {notifExpanded ? 'Recolher Atividades ▲' : 'Expandir Atividades ▼'}
            </button>
          )}

          {/* Simulate Action quick console */}
          <div className="flex gap-1.5 overflow-x-auto p-1 bg-neutral-900/50 border border-neutral-850/60 rounded-xl">
            <span className="text-[8px] font-mono text-neutral-600 uppercase self-center px-1.5 font-bold">Simular:</span>
            <button 
              onClick={() => handleSimulateNotif('follow')}
              className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 text-[8.5px] border border-neutral-800 text-neutral-400 rounded transition cursor-pointer"
            >
              + Seguidor
            </button>
            <button 
              onClick={() => handleSimulateNotif('like')}
              className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 text-[8.5px] border border-neutral-800 text-neutral-400 rounded transition cursor-pointer"
            >
              + Curtida
            </button>
            <button 
              onClick={() => handleSimulateNotif('challenge')}
              className="px-2 py-1 bg-[#1a0f0f] hover:bg-red-950/40 text-[8.5px] text-red-400 border border-red-950/60 rounded transition cursor-pointer"
            >
              ⚔️ PvP
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Notifications Drawer */}
      <AnimatePresence>
        {notifExpanded && notifications.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-neutral-950 border border-neutral-900 rounded-2xl p-4 space-y-2 text-left"
          >
            {notifications.map((notif: any) => (
              <div 
                key={notif.id} 
                className="p-3 bg-neutral-900/50 border border-neutral-850 rounded-xl flex items-center justify-between gap-3 font-sans"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl shrink-0">{notif.sender_image || '👤'}</span>
                  <div>
                    <span className="text-xs font-bold text-white block md:inline">{notif.sender_name} </span>
                    <span className="text-xs text-stone-300">{notif.message}</span>
                    <span className="block text-[9px] text-neutral-500 font-mono mt-0.5">{new Date(notif.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Event badgings */}
                <div className="shrink-0">
                  {notif.type === 'challenge' && (
                    <span className="text-[8.5px] font-mono font-black italic tracking-widest bg-red-950 border border-red-900 text-red-400 px-2 py-0.5 rounded uppercase">
                      Desafio Pendente
                    </span>
                  )}
                  {notif.type === 'follow' && (
                    <span className="text-[8.5px] font-mono font-bold bg-blue-950 border border-blue-900 text-blue-400 px-2 py-0.5 rounded uppercase">
                      Novo Amigo
                    </span>
                  )}
                  {notif.type === 'like' && (
                    <span className="text-[8.5px] font-mono font-bold bg-amber-950 border border-amber-900 text-amber-500 px-2 py-0.5 rounded uppercase">
                      Conteúdo Curtido
                    </span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUB SUB-TABS SELECTORS */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-900 pb-1">
        {[
          { id: 'feed', name: 'Feed Interno', icon: Users },
          { id: 'generator', name: 'Gerador de Post / Imagens', icon: Share2 },
          { id: 'badges', name: 'Conquistas & Badges', icon: Award },
          { id: 'profile', name: 'Perfil Público / Atletas', icon: Trophy }
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isSel = activeHubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveHubTab(tab.id as any)}
              className={`py-2 px-4 rounded-xl text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-2 transition cursor-pointer ${
                isSel 
                  ? 'bg-neutral-900 border border-red-650/50 text-white' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isSel ? 'text-red-500' : 'text-neutral-400'}`} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* SHARE SCREEN PROCESSING SCREEN OVERLAY */}
      {shareLoadingText && (
        <div className="z-50 bg-neutral-950/90 border border-neutral-900 rounded-3xl p-8 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full border border-amber-500 border-t-transparent animate-spin mx-auto flex items-center justify-center">
            <Share2 className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Processamento Social Ativo</h5>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">{shareLoadingText}</p>
          </div>
        </div>
      )}

      {/* TAB CONTAINER BODY */}
      <div className="animate-fade-in">

        {/* HUB VIEW 1: COMMUNITY FEED */}
        {activeHubTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            
            {/* Feed contents scroll */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Write a community post block */}
              {user ? (
                <form onSubmit={handleCreatePost} className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center font-bold text-xs text-white uppercase">
                      {user.profile_image.length < 4 ? user.profile_image : '🥋'}
                    </div>
                    <textarea
                      placeholder="OSS guerreiro! Compartilhe conquistas, dicas de pronúncia de Wrestling/BJJ ou desafie alguém..."
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      rows={3}
                      className="w-full bg-neutral-950 border border-neutral-900 text-xs text-white placeholder:text-neutral-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 font-sans resize-none"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-neutral-600 uppercase font-bold">Publicação no Dojo Geral</span>
                    <button
                      type="submit"
                      disabled={!newPostText.trim()}
                      className="py-2 px-4 bg-red-650 hover:bg-red-700 disabled:opacity-40 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      <span>Postar OSS</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-neutral-900/20 border border-neutral-900/40 rounded-2xl p-5 text-center leading-relaxed">
                  <p className="text-xs text-neutral-400">Faça login para postar e trocar interações de treino com outros atletas!</p>
                </div>
              )}

              {/* Feed posts loop */}
              {feedLoading ? (
                <div className="text-center py-10 font-mono text-xs text-neutral-500">
                  Sincronizando feed da comunidade de atletas...
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-10 font-mono text-xs text-neutral-600">
                  Nenhum post no feed geral no momento. Seja o primeiro!
                </div>
              ) : (
                posts.map((post: any) => {
                  const hasLiked = user && post.likes && post.likes.includes(user.id);
                  return (
                    <motion.div 
                      key={post.id} 
                      layout
                      className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-4 shadow-lg hover:border-neutral-800 transition"
                    >
                      
                      {/* Post Header details */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-neutral-850 flex items-center justify-center text-xl shrink-0">
                            {post.user_image && post.user_image.length < 4 ? post.user_image : '👤'}
                          </div>
                          <div className="leading-tight">
                            <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                              <span>{post.user_name}</span>
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-400">
                                {post.user_belt} Belt
                              </span>
                            </h5>
                            <span className="text-[9px] font-mono text-neutral-500">{new Date(post.created_at).toLocaleDateString()} às {new Date(post.created_at).toLocaleTimeString().slice(0, 5)}</span>
                          </div>
                        </div>

                        {/* Quick user lookup or Follow */}
                        {user && post.user_id !== user.id && (
                          <button
                            onClick={() => handleFollowUser(post.user_id)}
                            className={`py-1 px-2.5 rounded-lg text-[9.5px] font-mono uppercase font-bold transition border ${
                              isFollowingMap[post.user_id]
                                ? 'bg-neutral-900 border-neutral-800 text-neutral-500'
                                : 'bg-red-950/20 border-red-900 text-red-400 hover:bg-neutral-900'
                            }`}
                          >
                            {isFollowingMap[post.user_id] ? 'Seguindo ✓' : '+ Seguir'}
                          </button>
                        )}
                      </div>

                      {/* Content Card layout */}
                      <div className="space-y-3 pl-1 bg-neutral-900/20 p-3 rounded-xl border border-neutral-900">
                        <p className="text-xs text-stone-200 leading-relaxed font-sans font-medium">
                          {post.content}
                        </p>
                        
                        {/* Custom post sports banner preview */}
                        {post.type !== 'community' && (
                          <div className="bg-gradient-to-r from-neutral-950 to-[#0e0c0c] border border-neutral-850 p-4 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl shrink-0 animate-bounce">{post.image_url || '🥋'}</span>
                              <div className="text-left font-sans">
                                <span className="text-[9px] font-mono uppercase tracking-wider font-extrabold text-amber-500 bg-amber-950/20 px-1.5 py-0.5 rounded">CONQUISTA OFICIAL</span>
                                <h6 className="text-[11px] font-extrabold text-white mt-1">Status premium validado pelo motor dojo</h6>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedShareTemplate(post.type);
                                setActiveHubTab('generator');
                              }}
                              className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 text-[9px] font-mono uppercase tracking-widest border border-neutral-800 rounded-lg shrink-0 transition"
                            >
                              COMPARTILHAR FORA ↗
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Interactive block (Likes & comment toggles) */}
                      <div className="flex items-center gap-5 border-t border-neutral-900/60 pt-3">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-1.5 text-xs font-mono transition cursor-pointer ${
                            hasLiked ? 'text-rose-500 font-bold' : 'text-neutral-500 hover:text-rose-400'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes ? post.likes.length : 0} Curtidas</span>
                        </button>

                        <span className="flex items-center gap-1.5 text-neutral-500 text-xs font-mono">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.comments ? post.comments.length : 0} Comentários</span>
                        </span>
                      </div>

                      {/* Comments stream */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="space-y-2 border-t border-neutral-900/40 pt-3 text-left bg-neutral-900/10 p-2.5 rounded-xl">
                          {post.comments.map((comment: any) => (
                            <div key={comment.id} className="text-xs leading-normal bg-neutral-950 border border-neutral-900 p-2.5 rounded-xl">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-extrabold text-stone-200">{comment.name}</span>
                                <span className="text-[8px] font-mono text-neutral-600">{new Date(comment.created_at).toLocaleTimeString().slice(0, 5)}</span>
                              </div>
                              <p className="text-stone-300 font-sans">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comments box */}
                      {user && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Adicione um comentário mestre..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="flex-1 bg-neutral-950 border border-neutral-900 text-xs text-stone-200 placeholder:text-neutral-600 rounded-xl px-3 py-2 focus:outline-none focus:border-neutral-850"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-stone-200 px-3.5 rounded-xl transition cursor-pointer flex items-center justify-center"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    </motion.div>
                  );
                })
              )}

            </div>

            {/* Side column: social linking settings */}
            <div className="space-y-4">
              
              {/* Linked Accounts widget */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-4">
                <div className="border-b border-neutral-900 pb-3 leading-tight">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-amber-500 font-black block">Conexão Unificada</span>
                  <h4 className="text-sm font-black text-white uppercase font-mono mt-0.5">Vínculos de Provedor</h4>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans font-medium">
                  Associe suas credenciais aos maiores serviços digitais para sincronização de dados automatizados e login instantâneo.
                </p>

                <div className="space-y-2">
                  {[
                    { id: 'google', name: 'Google Login', icon: Instagram, color: 'text-amber-500' },
                    { id: 'apple', name: 'Apple ID', icon: Twitter, color: 'text-stone-300' },
                    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-500' },
                    { id: 'discord', name: 'Discord', icon: Disc, color: 'text-purple-500' }
                  ].map((srv) => {
                    const isLinked = (linkedSocials as any)[srv.id];
                    return (
                      <div key={srv.id} className="flex justify-between items-center p-3 bg-neutral-900/50 border border-neutral-850/60 rounded-xl">
                        <span className="text-xs font-bold text-stone-300 flex items-center gap-2">
                          <srv.icon className={`w-4 h-4 ${srv.color}`} />
                          {srv.name}
                        </span>
                        <button
                          onClick={() => toggleSocialLink(srv.id as any)}
                          className={`text-[9px] font-mono tracking-wider uppercase font-black px-2.5 py-1 rounded-md border ${
                            isLinked 
                              ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' 
                              : 'bg-neutral-950 border-neutral-800 text-neutral-550'
                          }`}
                        >
                          {isLinked ? 'Vinculado ✓' : 'Ligar +'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick statistics widgets */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-4">
                <div className="border-b border-neutral-900 pb-3 leading-tight">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 block">Dojo Global</span>
                  <h4 className="text-xs font-bold text-white uppercase font-mono mt-0.5">Academia de Combate</h4>
                </div>

                <div className="p-3 bg-neutral-900/40 rounded-xl border border-neutral-850/60">
                  <span className="text-[9px] font-mono text-neutral-500 block">Link de Divulgação:</span>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      readOnly
                      value={`jiuspeak.com/user/${user ? `${user.first_name.toLowerCase()}` : 'atleta'}`}
                      className="flex-1 bg-neutral-950 border border-neutral-900 text-[10px] text-neutral-400 px-2.5 py-1.5 rounded-lg font-mono focus:outline-none focus:border-neutral-800"
                    />
                    <button
                      onClick={copyShareLink}
                      className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 transition shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-sans font-medium">
                  <div className="p-3 bg-[#0d0d0d] rounded-xl border border-neutral-900">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase">Seguidores</span>
                    <span className="text-base font-black text-white mt-1 block">
                      {user ? 4 : 0}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0d0d0d] rounded-xl border border-neutral-900">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase">Seguindo</span>
                    <span className="text-base font-black text-white mt-1 block">
                      {user ? 2 : 0}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* HUB VIEW 2: SPORT FRAME OVERLAY CARD IMAGE GENERATOR */}
        {activeHubTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-left">
            
            {/* Template options column */}
            <div className="lg:col-span-2 space-y-5">
              
              {/* Select content category */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-3">
                <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Passo 1: Tipo da Conquista</h5>
                <p className="text-[10px] text-neutral-400 leading-relaxed font-sans font-medium">
                  Selecione qual conquista ou indicador do site você gostaria de renderizar em alta fidelidade esportiva.
                </p>

                <div className="space-y-1.5 pt-1">
                  {[
                    { id: 'belt', label: '🥋 Subida de Faixa (Belt Badge)', desc: `Graduação ativa (${user ? user.belt_rank : 'White'} Belt)` },
                    { id: 'streak', label: '🔥 Sequência Diária (30-Day Streak)', desc: `${user ? user.streak : 12} dias de foco consecutivo` },
                    { id: 'ranking', label: '🏆 Ranking Global (Top Fighter)', desc: 'Demonstração de ELO e chaves do ranking' },
                    { id: 'pvp', label: '⚡ Vitórias PvP Arena (OSS Submit)', desc: 'Performance extrema dentro de dojos online' },
                    { id: 'certificates', label: '🎓 Certificado de Fluência', desc: 'Validadores internacionais certificados' }
                  ].map((temp) => (
                    <button
                      key={temp.id}
                      onClick={() => setSelectedShareTemplate(temp.id)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all leading-snug flex flex-col justify-start group cursor-pointer ${
                        selectedShareTemplate === temp.id
                          ? 'border-amber-500 bg-amber-950/20 text-white font-bold'
                          : 'border-neutral-900 bg-[#060606]/60 text-stone-300 hover:border-neutral-800'
                      }`}
                    >
                      <span className="text-xs font-black block">{temp.label}</span>
                      <span className="text-[9px] text-neutral-500 font-mono mt-0.5">{temp.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select card layout format */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-3">
                <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Passo 2: Formato do Post</h5>
                <p className="text-[10px] text-neutral-400 leading-relaxed font-sans font-medium">
                  Tamanhos específicos otimizados para maximizar a visualização.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { id: 'story', name: 'Instagram Story', aspect: 'Vertical 9:16' },
                    { id: 'feed', name: 'Feed Quadrado', aspect: 'Grid 1:1' },
                    { id: 'twitter', name: 'X / Twitter Card', aspect: 'Banner 16:9' },
                    { id: 'whatsapp', name: 'WhatsApp', aspect: 'Story / Status' }
                  ].map((lay) => (
                    <button
                      key={lay.id}
                      onClick={() => setCardLayout(lay.id as any)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        cardLayout === lay.id
                          ? 'border-red-600 bg-red-950/20 text-white font-bold'
                          : 'border-neutral-900 bg-[#060606] text-stone-300'
                      }`}
                    >
                      <span className="text-xs block font-bold">{lay.name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">{lay.aspect}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* LIVE CARD CANVAS RENDER PREVIEW (UFC / DUOLINGO / STRAVA PREMIUM DARK STYLES) */}
            <div className="lg:col-span-3 space-y-5">
              
              <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center px-1.5">
                  <span className="text-[10px] font-mono uppercase bg-neutral-950 px-2 py-0.5 border border-neutral-800 rounded font-bold text-neutral-400">Visualização de Canvas</span>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Esporte Premium Dark Mode</span>
                </div>

                {/* DYNAMIC DESIGN CARD FRAME RENDERING */}
                <div className="bg-neutral-950 border-2 border-neutral-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center items-center shadow-2xl transition-all duration-300">
                  
                  {/* Neon radial backlights based on layout */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-red-650/10 blur-[80px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 blur-[80px] pointer-events-none" />

                  {/* Layout adaptive frame canvas */}
                  <div 
                    id="jiuspeak_sport_banner_target"
                    className={`bg-[#050505] border border-neutral-800/80 rounded-2xl p-6 flex flex-col justify-between relative shadow-lg ${
                      cardLayout === 'story' ? 'w-full max-w-[280px] aspect-[9/16] py-14' :
                      cardLayout === 'twitter' ? 'w-full aspect-[16/9]' :
                      cardLayout === 'whatsapp' ? 'w-full aspect-[4/3]' :
                      'w-full max-w-[340px] aspect-square' // quadrat 1:1 format
                    }`}
                  >
                    
                    {/* Top UI Brand Watermarks */}
                    <div className="flex justify-between items-center text-sans font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-red-650 flex items-center justify-center font-black text-[9px] text-stone-100">J</span>
                        <span className="text-[11px] font-black tracking-widest text-white uppercase italic">JIU<span className="text-red-500">SPEAK</span></span>
                      </div>
                      <span className="text-[8px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/60 font-black">VALIDADO ✓</span>
                    </div>

                    {/* Adaptive content based on option */}
                    <div className="space-y-4 my-auto py-4 text-center">
                      
                      {selectedShareTemplate === 'belt' && (
                        <div className="space-y-3">
                          <div className="w-16 h-16 rounded-full bg-neutral-900 border-2 border-red-600 flex items-center justify-center text-4xl mx-auto shadow-inner animate-pulse">
                            🥋
                          </div>
                          <div>
                            <span className="text-[9px] font-mono uppercase bg-red-950/60 text-red-500 border border-red-900 px-2.5 py-1 rounded font-black tracking-wider block w-max mx-auto">GRADUADO PELO TATAME</span>
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tight mt-2">{user ? `${user.first_name} ${user.last_name}` : 'Lucas Spider'}</h3>
                            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mt-0.5">{user ? user.belt_rank : 'Blue'} BELT GRADUATE</p>
                          </div>
                          <div className="bg-neutral-900/60 border border-neutral-850 p-3 rounded-xl max-w-xs mx-auto">
                            <p className="text-[10px] text-neutral-300 italic">"I can confidently translate tactics, explain sweeps and handle instructions in pure English, OSS!"</p>
                          </div>
                        </div>
                      )}

                      {selectedShareTemplate === 'streak' && (
                        <div className="space-y-3">
                          <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-4xl mx-auto shadow-inner">
                            🔥
                          </div>
                          <div>
                            <span className="text-[9px] font-mono uppercase bg-amber-950/60 text-amber-500 border border-amber-900 px-2.5 py-1 rounded font-black tracking-wider block w-max mx-auto">CONSELHO DE CONSTÂNCIA</span>
                            <h3 className="text-lg font-black text-white italic uppercase mt-2">{user ? user.streak : 30} DIAS INVICTOS</h3>
                            <p className="text-xs font-bold text-neutral-400 mt-0.5">Estudando inglês técnico sem desistência!</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center text-[9px] font-mono max-w-xs mx-auto">
                            <span className="bg-neutral-900 p-1.5 rounded border border-neutral-850 text-neutral-300">XP: {user ? user.xp : 8920}</span>
                            <span className="bg-neutral-900 p-1.5 rounded border border-neutral-850 text-neutral-300">LIGA: Gladiadores</span>
                          </div>
                        </div>
                      )}

                      {selectedShareTemplate === 'ranking' && (
                        <div className="space-y-3">
                          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center text-4xl mx-auto shadow-inner">
                            🌎
                          </div>
                          <div>
                            <span className="text-[9px] font-mono uppercase bg-indigo-950/60 text-indigo-400 border border-indigo-900 px-2.5 py-1 rounded font-black tracking-wider block w-max mx-auto">TATAME INTERNACIONAL</span>
                            <h3 className="text-lg font-black text-white italic uppercase mt-2">RANKING GERAL: #150</h3>
                            <p className="text-[10px] text-neutral-400 mt-0.5">No topo do dojo global frente a competidores do mundo.</p>
                          </div>
                          <div className="p-2.5 bg-neutral-900 rounded-xl max-w-xs mx-auto flex justify-around items-center text-[10px] font-bold text-white leading-none">
                            <span>⚡ {user ? user.xp : '4220'} XP</span>
                            <span className="text-neutral-500">|</span>
                            <span>🥋 {user ? user.belt_rank : 'Blue'} Belt</span>
                          </div>
                        </div>
                      )}

                      {selectedShareTemplate === 'pvp' && (
                        <div className="space-y-3">
                          <div className="w-16 h-16 rounded-full bg-red-650/10 border-2 border-red-650 flex items-center justify-center text-4xl mx-auto shadow-inner">
                            ⚔️
                          </div>
                          <div>
                            <span className="text-[9px] font-mono uppercase bg-red-950 border border-red-900 px-2.5 py-1 text-red-400 rounded font-black tracking-wider block w-max mx-auto">OCTÓGONO DOJO ON-LINE</span>
                            <h3 className="text-lg font-black text-white italic uppercase mt-2">SUPREMACIA DA ARENA</h3>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Venceu por submissão de tradução imediata!</p>
                          </div>
                          <div className="flex justify-center items-center gap-1.5 text-[9px] font-mono text-neutral-400 uppercase font-bold">
                            <span>ELO: 1240</span>
                            <span>•</span>
                            <span>92% ACCURACY</span>
                          </div>
                        </div>
                      )}

                      {selectedShareTemplate === 'certificates' && (
                        <div className="space-y-3">
                          <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-4xl mx-auto shadow-inner animate-pulse">
                            🎓
                          </div>
                          <div>
                            <span className="text-[9.5px] font-mono uppercase bg-amber-950 text-amber-500 border border-amber-900 px-2.5 py-1 rounded font-black tracking-wider block w-max mx-auto">CERTIFICAÇÃO CERTIFICADA</span>
                            <h3 className="text-base font-black text-white italic uppercase mt-2">COMMUNICATION CERTIFICATE</h3>
                            <p className="text-[9px] text-neutral-400 mt-0.5">Comprovadamente fluente para seminários e treinos.</p>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Bottom visual sport layout info */}
                    <div className="border-t border-neutral-900/60 pt-2 flex justify-between items-center text-[8px] font-mono text-neutral-500 uppercase">
                      <span>ORGANISMO JIUSPEAK</span>
                      <span>BJJ FLUENCE ENGINE v2.6</span>
                    </div>

                  </div>
                </div>

                {/* Simulated Social Portals Trigger Link */}
                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">Passo 3: Publicação Externa</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'insta', name: 'Instagram', icon: Instagram, color: 'hover:bg-pink-950 hover:text-pink-400 hover:border-pink-900' },
                      { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'hover:bg-blue-950 hover:text-blue-400 hover:border-blue-900' },
                      { id: 'x', name: 'X / Twitter', icon: Twitter, color: 'hover:bg-stone-900 hover:text-white hover:border-neutral-800' },
                      { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'hover:bg-indigo-950 hover:text-indigo-400 hover:border-indigo-900' }
                    ].map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => simulateSocialShare(provider.name)}
                        className={`py-3.5 border border-neutral-900 bg-neutral-950 rounded-xl text-[10px] font-mono uppercase tracking-wider font-extrabold transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${provider.color}`}
                      >
                        <provider.icon className="w-4 h-4" />
                        <span>{provider.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Immediate automatic post block button */}
                  <div className="pt-2">
                    <button
                      onClick={() => triggerAutomatedPost(selectedShareTemplate)}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Sparkles className="w-4 h-4 fill-current animate-pulse shrink-0" />
                      <span>Compartilhar Agora no Feed Interno ⚡</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* HUB VIEW 3: BADGES SYSTEM & INSTANT SIMULATOR ACCESS */}
        {activeHubTab === 'badges' && (
          <div className="space-y-6 text-left">
            
            <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4">
              <div className="leading-tight">
                <span className="text-[9px] font-mono text-red-500 uppercase tracking-widest font-black block">Portfólio de Insígnias</span>
                <h3 className="text-xl font-black text-white italic uppercase font-mono mt-0.5">Sistema de Badges Compartilháveis</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                  Cada conquista desbloqueada no tatame virtual concede uma badge oficial contendo design esportivo premium. Clique para emular o desbloqueio e testar as popups e postagem automática.
                </p>
              </div>

              {/* Grid map badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {ALL_AVAILABLE_BADGES.map((badge) => {
                  const isUnlocked = myBadges.includes(badge.name);
                  return (
                    <div 
                      key={badge.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 relative overflow-hidden transition ${
                        isUnlocked 
                          ? 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-800' 
                          : 'bg-neutral-950 border-neutral-900/60 opacity-60'
                      }`}
                    >
                      {/* Ribbon banner on top if unlocked */}
                      {isUnlocked && (
                        <div className="absolute top-3 right-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-mono tracking-widest font-black px-1.5 py-0.5 rounded uppercase">
                          Desbloqueado ✓
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* Circular graphic */}
                        <div className={`w-12 h-12 rounded-full border flex items-center justify-center text-2xl relative ${badge.color}`}>
                          {badge.icon}
                        </div>
                        <div className="leading-tight">
                          <h4 className="text-sm font-extrabold text-white">{badge.name}</h4>
                          <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">{badge.desc}</p>
                        </div>
                      </div>

                      {/* Triggers simulate lock/unlock */}
                      <div className="pt-2">
                        {isUnlocked ? (
                          <button
                            onClick={() => {
                              setCelebratedBadge(badge);
                              setShowCelebrationModal(true);
                            }}
                            className="w-full py-2 bg-neutral-950 hover:bg-neutral-900 text-stone-300 text-[10px] border border-neutral-800 font-mono uppercase tracking-wider rounded-xl transition cursor-pointer"
                          >
                            Ver Cartão de Compartilhamento 👁️
                          </button>
                        ) : (
                          <button
                            onClick={() => forceUnlockBadge(badge)}
                            className="w-full py-2 bg-gradient-to-r from-red-650 to-red-750 hover:from-red-700 text-white text-[10px] font-mono uppercase tracking-widest font-black rounded-xl transition cursor-pointer hover:scale-[1.01]"
                          >
                            🔓 Simular Conquista !
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* HUB VIEW 4: PUBLIC PROFILE VISUAL EMULATOR / SEARCH */}
        {activeHubTab === 'profile' && (
          <div className="space-y-6 text-left">
            
            {/* Search filter panel */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 shrink-0">Buscar Atleta:</span>
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Ex: lucas-spider, Gabriel Souza, Elena Petrova..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#050505] border border-neutral-900 text-xs text-stone-200 placeholder:text-neutral-600 rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:border-red-600 font-mono"
                />
                <button
                  onClick={() => lookupPublicProfile(searchQuery)}
                  className="absolute right-2 top-2 p-1 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-lg border border-neutral-800 transition"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={() => lookupPublicProfile('lucas-spider')}
                  className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 text-[10px] font-mono uppercase rounded-lg transition"
                >
                  Lucas Spider 🥋
                </button>
                <button
                  onClick={() => lookupPublicProfile('gabrielsouza')}
                  className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 text-[10px] font-mono uppercase rounded-lg transition"
                >
                  Gabriel Souza 🇧🇷
                </button>
              </div>
            </div>

            {/* Profile loaded container */}
            {profileLoading ? (
              <div className="text-center py-16 bg-neutral-950 border border-neutral-900 rounded-3xl font-mono text-xs text-neutral-500">
                Acessando arquivos do tatame internacional...
              </div>
            ) : viewedProfile ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-neutral-950 border-2 border-neutral-900 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden"
              >
                
                {/* Header design bar */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-indigo-600" />

                {/* Main profile banner block */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-neutral-900 border-2 border-red-600 flex items-center justify-center text-4xl shrink-0">
                      {viewedProfile.user.profile_image && viewedProfile.user.profile_image.length < 4 ? viewedProfile.user.profile_image : '🥋'}
                    </div>
                    <div className="leading-tight text-sans font-medium">
                      
                      {/* URL route indicator badge */}
                      <span className="text-[8px] font-mono tracking-widest text-[#999] uppercase bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded">
                        /user/{viewedProfile.user.username}
                      </span>

                      <h3 className="text-xl font-black text-white italic uppercase tracking-tight mt-1.5">{viewedProfile.user.first_name} {viewedProfile.user.last_name}</h3>
                      <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                        <span className="text-amber-500 font-extrabold uppercase font-mono tracking-wide">🥋 {viewedProfile.user.belt_rank} Belt</span>
                        <span>•</span>
                        <span>Cadastro: {new Date(viewedProfile.user.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions column */}
                  {user && viewedProfile.user.id !== user.id && (
                    <button
                      onClick={() => handleFollowUser(viewedProfile.user.id)}
                      className={`py-2.5 px-6 font-mono uppercase text-xs tracking-wider rounded-xl transition-all border font-extrabold cursor-pointer ${
                        isFollowingMap[viewedProfile.user.id]
                          ? 'bg-neutral-900 border-neutral-800 text-neutral-500'
                          : 'bg-red-650 hover:bg-red-700 text-white border-red-900'
                      }`}
                    >
                      {isFollowingMap[viewedProfile.user.id] ? 'Seguindo Atleta ✓' : '+ Seguir Atleta'}
                    </button>
                  )}
                </div>

                {/* ELO Metrics row cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#0d0d0d] rounded-xl border border-neutral-900">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase">ELO Combate</span>
                    <span className="text-sm font-black text-amber-500 block mt-1">🏆 {viewedProfile.stats.elo} PTS</span>
                  </div>
                  <div className="p-3 bg-[#0d0d0d] rounded-xl border border-neutral-900">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase">Nível XP</span>
                    <span className="text-sm font-black text-white block mt-1">⚡ {viewedProfile.user.xp} XP</span>
                  </div>
                  <div className="p-3 bg-[#0d0d0d] rounded-xl border border-neutral-900">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase">Win-streak</span>
                    <span className="text-sm font-black text-emerald-400 block mt-1">🔥 {viewedProfile.stats.streak} Lutas</span>
                  </div>
                  <div className="p-3 bg-[#0d0d0d] rounded-xl border border-neutral-900">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase">Rank Dojo</span>
                    <span className="text-sm font-black text-white block mt-1">🌎 Top {viewedProfile.stats.rank}</span>
                  </div>
                </div>

                {/* Achievements List */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold border-b border-neutral-900 pb-1.5">Insígnias Colecionadas ({viewedProfile.achievements.length})</h5>
                  {viewedProfile.achievements.length === 0 ? (
                    <p className="text-xs text-neutral-600 font-mono italic">Nenhum troféu ganho por esse atleta ainda.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {viewedProfile.achievements.map((ach: string) => {
                        const original = ALL_AVAILABLE_BADGES.find(b => b.name === ach);
                        return (
                          <span 
                            key={ach}
                            className="inline-flex items-center gap-1 bg-neutral-900 text-stone-300 border border-neutral-850 px-3 py-1.5 rounded-xl text-[10.5px] font-mono font-bold"
                          >
                            <span>{original?.icon || '🏆'}</span>
                            <span>{ach}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Direct Simulator links */}
                <div className="p-4 bg-[#0a0a0a] border border-neutral-900 rounded-xl leading-relaxed">
                  <span className="text-[9px] font-mono text-amber-500 uppercase block font-black">Link de Acesso Externo Simulador:</span>
                  <div className="flex justify-between items-center mt-1.5 gap-2">
                    <p className="text-[10px] text-neutral-400 font-mono truncate">
                      https://jiuspeak.com/user/{viewedProfile.user.username}
                    </p>
                    <button 
                      onClick={() => triggerToast('Link copiado para o portal!')}
                      className="text-[9px] font-mono text-red-400 uppercase hover:underline shrink-0"
                    >
                      Copiar Link ❐
                    </button>
                  </div>
                </div>

              </motion.div>
            ) : (
              /* Fallback default lookup guide */
              <div className="text-center py-12 bg-neutral-950 border border-neutral-900 rounded-3xl space-y-3">
                <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mx-auto text-xl">
                  🔍
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Pesquisa de Jogadores</h5>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">Utilize a barra acima para carregar as estatísticas e badges públicos de qualquer guerreiro cadastrado no JiuSpeak.</p>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* POPUP CELEBRATION MODAL FOR NEW UNLOCKED BADGES */}
      <AnimatePresence>
        {showCelebrationModal && celebratedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-left">
            
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-950 border-2 border-amber-500 max-w-md w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-6"
            >
              {/* Glowing ring lights background */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-48 h-48 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />

              <div className="text-center space-y-4 pt-4">
                <div className="w-20 h-20 rounded-full border-2 border-amber-500 bg-amber-950/20 text-4xl flex items-center justify-center mx-auto animate-bounce">
                  {celebratedBadge.icon}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase bg-amber-950 text-amber-500 border border-amber-900 px-3 py-1 rounded font-black tracking-widest inline-block">CONQUISTA REVELADA!</span>
                  <h3 className="text-2xl font-black text-white italic uppercase">{celebratedBadge.name}</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">{celebratedBadge.desc}</p>
                </div>
              </div>

              {/* UFC Premium Sports Card Frame Render copy preview inside popup */}
              <div className="bg-[#050505] border border-neutral-920 p-4 rounded-2xl space-y-2.5">
                <span className="text-[9px] font-mono text-neutral-500 uppercase block font-bold">Preview do Story de Compartilhamento:</span>
                <div className="p-3 bg-neutral-900 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 bg-neutral-950 border border-neutral-800 flex items-center justify-center rounded-full text-lg shrink-0">
                    {celebratedBadge.icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{user ? `${user.first_name} ${user.last_name}` : 'Membro JiuSpeak'}</h5>
                    <p className="text-[9px] text-amber-500 font-mono uppercase mt-0.5">Faixa: {user ? user.belt_rank : 'Branca'} Belt</p>
                  </div>
                </div>
              </div>

              {/* Supported triggers */}
              <div className="space-y-2 pt-2">
                <span className="text-[9px] font-mono text-neutral-500 uppercase block font-black text-center">COMPARTILHAR NAS REDES</span>
                <div className="grid grid-cols-4 gap-2">
                  <button 
                    onClick={() => simulateSocialShare('Instagram Stories')}
                    className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-850 rounded-xl text-xs text-sans flex flex-col items-center justify-center cursor-pointer transition"
                  >
                    <Instagram className="w-4 h-4 text-pink-500 mb-1" />
                    <span className="text-[8.5px] font-mono uppercase">Story</span>
                  </button>
                  <button 
                    onClick={() => simulateSocialShare('X (Twitter)')}
                    className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-850 rounded-xl text-xs flex flex-col items-center justify-center cursor-pointer transition"
                  >
                    <Twitter className="w-4 h-4 text-white mb-1" />
                    <span className="text-[8.5px] font-mono uppercase">X - Post</span>
                  </button>
                  <button 
                    onClick={() => simulateSocialShare('WhatsApp Status')}
                    className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-850 rounded-xl text-xs flex flex-col items-center justify-center cursor-pointer transition"
                  >
                    <Users className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-[8.5px] font-mono uppercase">WhatsApp</span>
                  </button>
                  <button 
                    onClick={() => {
                      copyShareLink();
                    }}
                    className="p-3 bg-neutral-950 hover:bg-neutral-900 border border-amber-500/20 text-amber-500 rounded-xl text-xs flex flex-col items-center justify-center cursor-pointer transition"
                  >
                    <Copy className="w-4 h-4 mb-1" />
                    <span className="text-[8.5px] font-mono uppercase">Copiar</span>
                  </button>
                </div>
              </div>

              {/* Dismiss button */}
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => setShowCelebrationModal(false)}
                  className="py-3 px-8 bg-neutral-900 hover:bg-neutral-800 text-stone-300 font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
                >
                  Voltar ao Dojô
                </button>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
