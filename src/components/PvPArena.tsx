import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Sword, Trophy, ShieldAlert, Zap, Heart, Award, 
  Check, X, Shield, Users, Search, RefreshCw, 
  MessageSquare, History, Globe, Star, Mail, Play, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';

interface LeaderboardItem {
  userId: string;
  name: string;
  profile_image: string;
  belt: string;
  elo: number;
  wins: number;
  losses: number;
  streak: number;
  country: string;
  academy: string;
  xp: number;
  rank: number;
}

interface MatchHistoryItem {
  id: string;
  player_one: string;
  player_two: string;
  player_one_name: string;
  player_two_name: string;
  player_one_belt: string;
  player_two_belt: string;
  player_one_image: string;
  player_two_image: string;
  winner: string;
  xp_gained: number;
  created_at: string;
}

export default function PvPArena() {
  const { user, token, updateUserProfile } = useAuth();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'arena' | 'ranking' | 'history'>('arena');

  // Connection states
  const socketRef = useRef<Socket | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [queueStatus, setQueueStatus] = useState<'idle' | 'seeking' | 'matched'>('idle');
  const [queueMessage, setQueueMessage] = useState('');
  const [queueError, setQueueError] = useState('');

  // Combat States
  const [combatRoomId, setCombatRoomId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<any | null>(null);
  const [selfElo, setSelfElo] = useState<number>(1000);

  // Active Battle Metrics
  const [roundNum, setRoundNum] = useState(0);
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [timer, setTimer] = useState(15);
  
  // Interactive Scoreboards
  const [p1Stamina, setP1Stamina] = useState(100);
  const [p2Stamina, setP2Stamina] = useState(100);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  
  // Selections
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [opponentStatus, setOpponentStatus] = useState<'idle' | 'answered'>('idle');

  // Round results overlay
  const [roundEnded, setRoundEnded] = useState(false);
  const [roundResultData, setRoundResultData] = useState<any | null>(null);

  // Match final state
  const [matchFinished, setMatchFinished] = useState(false);
  const [matchResultData, setMatchResultData] = useState<any | null>(null);

  // Chat/Interactivity State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatFloatingBubbles, setChatFloatingBubbles] = useState<any[]>([]);

  // Rankings and history fetched elements
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [historyList, setHistoryList] = useState<MatchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Leaderboard filters
  const [filterCountry, setFilterCountry] = useState('');
  const [filterAcademy, setFilterAcademy] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'global' | 'weekly'>('global');

  // Cooldown & Fraud states
  const [cooldownCountdown, setCooldownCountdown] = useState(0);

  // Trigger Auth Modals
  const triggerAuth = (tabName: 'login' | 'register') => {
    window.dispatchEvent(new CustomEvent('open_auth_modal', { detail: { tab: tabName } }));
  };

  // Setup / Clean Sockets on demands
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch rankings and match history logs
  useEffect(() => {
    if (user) {
      fetchPvpHistory();
    }
    fetchLeaderboard();
  }, [user, filterCountry, filterAcademy, filterPeriod]);

  // Cooldown tick management
  useEffect(() => {
    if (cooldownCountdown > 0) {
      const interval = setInterval(() => {
        setCooldownCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownCountdown]);

  const fetchLeaderboard = async () => {
    setRankingLoading(true);
    try {
      const url = `/api/pvp/leaderboard?country=${filterCountry}&academy=${filterAcademy}&period=${filterPeriod}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.error("Error fetching leaderboard", e);
    } finally {
      setRankingLoading(false);
    }
  };

  const fetchPvpHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/pvp/history/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history);
      }
    } catch (e) {
      console.error("Error fetching pvp history", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Initialize socket.io connection for match queues technical routing
  const initSocketConnection = () => {
    if (socketRef.current?.connected) return true;

    setConnecting(true);
    setQueueError('');

    // Uses absolute host dynamically resolving sandbox parameters
    const socket = io({
      reconnectionAttempts: 4,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnecting(false);
    });

    socket.on('connect_error', () => {
      setConnecting(false);
      setQueueError('Conexão recusada pelo servidor de batalha. Verifique sua rede.');
      socket.disconnect();
    });

    // Matchmaking events
    socket.on('queue_joined', (data: { message: string }) => {
      setQueueStatus('seeking');
      setQueueMessage(data.message);
    });

    socket.on('queue_left', (data: { message: string }) => {
      setQueueStatus('idle');
      setQueueMessage('');
    });

    socket.on('queue_error', (data: { message: string }) => {
      setQueueStatus('idle');
      setQueueError(data.message);
      // set spamming search cooldown
      setCooldownCountdown(4);
    });

    socket.on('match_ready', (data: { roomId: string; opponent: any; selfElo: number }) => {
      setQueueStatus('matched');
      setCombatRoomId(data.roomId);
      setOpponent(data.opponent);
      setSelfElo(data.selfElo);
      
      // Reset combat state metrics
      setRoundNum(0);
      setP1Stamina(100);
      setP2Stamina(100);
      setP1Score(0);
      setP2Score(0);
      setChatMessages([]);
      setChatFloatingBubbles([]);
      setMatchFinished(false);
      setRoundEnded(false);
    });

    // Battle game rounds
    socket.on('round_start', (data: any) => {
      setRoundNum(data.roundNum);
      setTotalRounds(data.totalRounds);
      setCurrentQuestion(data.question);
      setTimer(data.timer);
      setP1Stamina(data.player1Stamina);
      setP2Stamina(data.player2Stamina);
      setP1Score(data.player1Score);
      setP2Score(data.player2Score);
      
      // Clear selections
      setSelectedOption(null);
      setIsAnswered(false);
      setOpponentStatus('idle');
      setRoundEnded(false);
    });

    socket.on('timer_tick', (data: { timer: number }) => {
      setTimer(data.timer);
    });

    socket.on('opponent_action', (data: { action: string }) => {
      if (data.action === 'answered') {
        setOpponentStatus('answered');
      }
    });

    // Round ended feedback representation
    socket.on('round_end', (data: any) => {
      setRoundResultData(data);
      setRoundEnded(true);
      
      // sync local stamina values
      setP1Stamina(data.player1.stamina);
      setP2Stamina(data.player2.stamina);
      setP1Score(data.player1.score);
      setP2Score(data.player2.score);
    });

    // Match finished summary
    socket.on('match_finished', (data: any) => {
      setMatchResultData(data);
      setMatchFinished(true);
      setRoundEnded(false);
      setQueueStatus('idle');
      
      // trigger async profile data reload after match in context
      if (user) {
        updateUserProfile({
          xp: user.id === data.player1.id ? user.xp + data.player1.xpGained : user.xp + data.player2.xpGained
        });
        fetchPvpHistory();
        fetchLeaderboard();
      }
    });

    // Chat Sync
    socket.on('chat_message', (data: { senderId: string; senderName: string; message: string }) => {
      setChatMessages(prev => [...prev.slice(-20), data]);
      
      // Append bubble animation floating item
      const newBubble = {
        id: 'bubble_' + Math.random().toString(36).substr(2, 9),
        senderId: data.senderId,
        message: data.message
      };
      setChatFloatingBubbles(prev => [...prev, newBubble]);
      setTimeout(() => {
        setChatFloatingBubbles(prev => prev.filter(b => b.id !== newBubble.id));
      }, 3000);
    });

    return true;
  };

  // Queue manipulation trigger searches
  const startMatchmaking = () => {
    if (!user || !token) return;
    if (cooldownCountdown > 0) return;

    initSocketConnection();

    // Trigger join_queue socket event
    setTimeout(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_queue', { token });
      } else {
        setQueueError('Reconectando ao servidor de dojo. Tente novamente.');
      }
    }, 400);
  };

  const cancelMatchmaking = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_queue');
    }
    setQueueStatus('idle');
  };

  const submitBattleAnswer = (val: string) => {
    if (isAnswered) return;
    setSelectedOption(val);
    setIsAnswered(true);

    if (socketRef.current?.connected) {
      socketRef.current.emit('submit_answer', { answer: val });
    }
  };

  const sendPvPChatMsg = (text: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_chat', { message: text });
    }
  };

  const quitActiveMatch = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setCombatRoomId(null);
    setQueueStatus('idle');
    setMatchFinished(false);
  };

  return (
    <div id="jiuspeak_pvp_arena_scope" className="space-y-6">
      
      {/* Dynamic Header Metrics Ribbon Dashboard */}
      {user && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-neutral-950/80 border border-neutral-900 rounded-2xl p-4">
          <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-850/60 leading-tight">
            <span className="text-[10px] font-mono text-neutral-500 block uppercase font-bold">Faixa Atual</span>
            <span className="text-sm font-black text-amber-500 uppercase flex items-center gap-1.5 mt-0.5">
              🥋 {user.belt_rank === 'White' ? 'BRANCA' : user.belt_rank.toUpperCase()}
            </span>
          </div>
          <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-850/60 leading-tight">
            <span className="text-[10px] font-mono text-neutral-500 block uppercase font-bold">ELO Gladiador</span>
            <span className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
              🏆 {leaderboard.find(x => x.userId === user.id)?.elo || 1000} PTS
            </span>
          </div>
          <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-850/60 leading-tight">
            <span className="text-[10px] font-mono text-neutral-500 block uppercase font-bold">Vitórias / Derrotas</span>
            <span className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
              ⚡ {leaderboard.find(x => x.userId === user.id)?.wins || 0}W - {leaderboard.find(x => x.userId === user.id)?.losses || 0}L
            </span>
          </div>
          <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-850/60 leading-tight">
            <span className="text-[10px] font-mono text-neutral-500 block uppercase font-bold">Win Streak</span>
            <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
              🔥 {leaderboard.find(x => x.userId === user.id)?.streak || 0} SEGUIDAS
            </span>
          </div>
        </div>
      )}

      {/* MATCH PLAYING STAGE SCREEN OVERLAY */}
      {combatRoomId && (
        <div className="bg-neutral-950 border-2 border-red-950/40 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          
          {/* Accent radial glow simulating Octagon ring light */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-80 h-40 bg-red-650/5 blur-[80px] rounded-full pointer-events-none" />

          {/* ACTIVE GAMEPLAY SCREEN */}
          {!matchFinished ? (
            <div className="space-y-6">
              
              {/* UFC Head-To-Head Scoreboard card */}
              <div className="relative grid grid-cols-7 gap-1 items-center bg-neutral-900 border border-neutral-850 p-4 rounded-2xl">
                
                {/* P1 (Self User) */}
                <div className="col-span-3 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-neutral-950 border-2 border-red-650 flex items-center justify-center text-3xl overflow-hidden relative shadow">
                    {user?.profile_image && (user.profile_image.length > 4 || user.profile_image.startsWith('data:image')) ? (
                      <img src={user.profile_image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span>🥋</span>
                    )}
                  </div>
                  <h5 className="text-xs font-bold text-white mt-2 truncate w-full">{user ? `${user.first_name} ${user.last_name}` : 'Você'}</h5>
                  <span className="text-[10px] font-mono text-neutral-400 mt-0.5 uppercase tracking-wider">{user?.belt_rank} Belt</span>
                  
                  {/* P1 Stamina block */}
                  <div className="w-full mt-3 space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                      <span>Stamina: {p1Stamina}%</span>
                      <span>Pts: {p1Score}</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-850">
                      <div 
                        className={`h-full transition-all duration-300 ${p1Stamina < 40 ? 'bg-red-500 animate-pulse' : 'bg-red-600'}`}
                        style={{ width: `${p1Stamina}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* VS Center Marker + Dynamic Response Circular Timer */}
                <div className="col-span-1 flex flex-col items-center justify-center leading-none">
                  <div className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center relative shadow">
                    
                    {/* Pulsating stopwatch or numbers */}
                    <span className="text-xs font-black text-amber-500 animate-pulse">{timer}</span>
                    <span className="text-[7px] font-mono text-neutral-500 uppercase mt-0.5">seg</span>
                  </div>
                  <span className="text-[9px] font-black text-red-500 italic mt-3 uppercase tracking-widest bg-red-950/20 border border-red-950 px-2 py-0.5 rounded">R{roundNum}</span>
                </div>

                {/* P2 (Opponent Card) */}
                <div className="col-span-3 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-neutral-950 border-2 border-neutral-800 flex items-center justify-center text-3xl overflow-hidden relative shadow">
                    {opponent?.image && (opponent.image.length > 4 || opponent.image.startsWith('data:image')) ? (
                      <img src={opponent.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span>{opponent?.image || '👤'}</span>
                    )}
                  </div>
                  <h5 className="text-xs font-bold text-white mt-2 truncate w-full">{opponent?.name || 'Desconhecido'}</h5>
                  <span className="text-[10px] font-mono text-amber-500 mt-0.5 uppercase tracking-wider">{opponent?.belt} Belt</span>
                  
                  {/* P2 Stamina block */}
                  <div className="w-full mt-3 space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                      <span>Pts: {p2Score}</span>
                      <span>Stamina: {p2Stamina}%</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-850">
                      <div 
                        className={`h-full transition-all duration-300 ${p2Stamina < 40 ? 'bg-red-500 animate-pulse' : 'bg-red-600'}`}
                        style={{ width: `${p2Stamina}%` }}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* FLOATING TEXT CHAT INTERACTOR COMPONENT */}
              <div className="relative h-12 bg-neutral-900/60 border border-neutral-900 rounded-xl overflow-hidden flex items-center px-4">
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Provocações:</span>
                <div className="flex gap-2 ml-3">
                  {["OSS! 🥋", "Good Fight! 🤝", "Nice Sweep! 🔥", "Tough! 💪"].map((text) => (
                    <button
                      key={text}
                      onClick={() => sendPvPChatMsg(text)}
                      className="text-[10px] bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 px-2 py-1 rounded transition whitespace-nowrap"
                    >
                      {text}
                    </button>
                  ))}
                </div>

                {/* Animated Floating Bubbles */}
                <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden h-12 flex justify-around">
                  <AnimatePresence>
                    {chatFloatingBubbles.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 15, scale: 0.8 }}
                        animate={{ opacity: 1, y: -20, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded border shadow-lg ${
                          msg.senderId === user?.id 
                            ? 'bg-red-950/90 text-red-400 border-red-900' 
                            : 'bg-amber-950/90 text-amber-400 border-amber-900'
                        }`}
                      >
                        {msg.message}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* BATTLE CHATTER SYSTEM PROGRESSION VIEW */}
              {!roundEnded ? (
                <div className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono text-neutral-500">
                    <span>SELECIONE A RESPOSTA CORRETA</span>
                    {opponentStatus === 'answered' && (
                      <span className="text-amber-500 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 animate-ping" />
                        Adversário já respondeu!
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white leading-relaxed">
                    {currentQuestion?.question || 'Carregando enunciado...'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentQuestion?.options.map((opt: string) => {
                      const isChosen = selectedOption === opt;
                      let btnStyle = "border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-700";
                      
                      if (isChosen) {
                        btnStyle = "border-amber-500 bg-amber-950/35 text-white font-semibold";
                      }
                      if (isAnswered && !isChosen) {
                        btnStyle = "border-neutral-950 bg-neutral-950/20 text-neutral-500 pointer-events-none";
                      }

                      return (
                        <button
                          key={opt}
                          disabled={isAnswered}
                          onClick={() => submitBattleAnswer(opt)}
                          className={`w-full text-left p-4 rounded-xl border text-xs leading-snug transition-all flex items-center justify-between group ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {!isAnswered && (
                            <span className="opacity-0 group-hover:opacity-100 text-[9px] font-mono text-amber-500 uppercase tracking-widest font-black transition">BATER</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* INTER-ROUND DRILL FEEDBACK OVERLAY */
                <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 space-y-4 animate-fade-in text-left">
                  <div className="flex items-center gap-2 border-b border-neutral-805 pb-3">
                    <span className="text-[10px] font-mono tracking-wider bg-purple-950/60 text-purple-400 border border-purple-900 px-2 py-0.5 rounded uppercase font-bold">Feedback Técnico</span>
                    <h4 className="text-xs font-mono text-neutral-400">Resposta Correta: <span className="text-emerald-400 font-extrabold">{roundResultData?.question.answer}</span></h4>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed font-sans font-medium bg-neutral-950 border border-neutral-850 p-3.5 rounded-xl">
                    💡 {roundResultData?.question.explanation}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {/* User accuracy indicator card */}
                    <div className={`p-3 rounded-xl border ${
                      roundResultData?.player1.isCorrect 
                        ? 'bg-green-950/10 border-green-950 text-green-400' 
                        : 'bg-red-950/10 border-red-950 text-red-400'
                    }`}>
                      <span className="text-[9px] font-mono uppercase text-neutral-500 block">Sua Ação:</span>
                      <p className="text-[11px] truncate mt-1">
                        {roundResultData?.player1.selectedAnswer}
                      </p>
                      <span className="text-[9.5px] font-bold block mt-1">
                        {roundResultData?.player1.isCorrect ? '✅ Positivado (Excelente!)' : '❌ Bloqueio Falhou (-20 HP)'}
                      </span>
                    </div>

                    {/* Opponent correctness */}
                    <div className={`p-3 rounded-xl border ${
                      roundResultData?.player2.isCorrect 
                        ? 'bg-green-950/10 border-green-950 text-green-400' 
                        : 'bg-red-950/10 border-red-950 text-red-400'
                    }`}>
                      <span className="text-[9px] font-mono uppercase text-neutral-500 block">Ação do Oponente:</span>
                      <p className="text-[11px] truncate mt-1">
                        {roundResultData?.player2.selectedAnswer}
                      </p>
                      <span className="text-[9.5px] font-bold block mt-1">
                        {roundResultData?.player2.isCorrect ? '✅ Positivado' : '❌ Bloqueio Falhou (-20 HP)'}
                      </span>
                    </div>
                  </div>

                  <div className="text-center text-[10px] font-mono text-neutral-500 animate-pulse pt-2">
                    Preparando ganchos para o próximo round...
                  </div>
                </div>
              )}

              {/* Leave and forfait trigger links */}
              <div className="text-center">
                <button
                  onClick={quitActiveMatch}
                  className="text-[10px] font-mono text-neutral-600 hover:text-red-400 hover:underline transition-colors"
                >
                  🏳️ Bater no Tatame (Abandonar luta / Desistir por W.O.)
                </button>
              </div>

            </div>
          ) : (
            /* PVP FIGHT CONCLUSION SUMMARY (Won / Lost screens matching UFC standards) */
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-6 text-left"
            >
              {matchResultData?.winnerId === 'draw' ? (
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg">
                    🤝
                  </div>
                  <h3 className="text-2xl font-black text-white italic uppercase">Empate Técnico!</h3>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">Equilíbrio total no dojo. Vocês compartilharam o domínio dos conceitos.</p>
                </div>
              ) : (matchResultData?.winnerId === user?.id ? (
                <div className="space-y-2">
                  <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500 rounded-full flex items-center justify-center text-5xl mx-auto shadow-lg animate-bounce">
                    👑
                  </div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">VITÓRIA POR DESCLASSIFICAÇÃO DO OPONENTE!</h3>
                  <p className="text-sm font-bold text-amber-400 uppercase tracking-widest font-mono">OSS! CAMPEÃO DA ARENA</p>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">Método: <span className="text-amber-500 font-bold">{matchResultData?.winReason}</span></p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-red-950/60 border border-red-500/50 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg">
                    💔
                  </div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">O OPONENTE AJUSTOU O GOLPE!</h3>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">Você bateu em desistência. Revise os termos chave do dicionário antes de subir de faixa.</p>
                  <p className="text-xs text-neutral-500 font-mono mt-1">Método: {matchResultData?.winReason}</p>
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto bg-neutral-900 border border-neutral-850 p-5 rounded-2xl">
                <div className="p-3 bg-neutral-950 rounded-xl text-center leading-tight">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase font-black">Recompensa</span>
                  <p className="text-lg font-black text-amber-500 mt-1 flex items-center justify-center gap-1">
                    <Zap className="w-4 h-4 fill-current" />
                    +{user?.id === matchResultData?.player1.id ? matchResultData?.player1.xpGained : matchResultData?.player2.xpGained} XP
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl text-center leading-tight">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase font-black">Novo Ranking de Combate</span>
                  <p className="text-lg font-black text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    {user?.id === matchResultData?.player1.id ? matchResultData?.player1.newElo : matchResultData?.player2.newElo} ELO
                    <span className="text-[10px] font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-850">
                      {user?.id === matchResultData?.player1.id ? (matchResultData.player1.eloDiff >= 0 ? `+${matchResultData.player1.eloDiff}` : matchResultData.player1.eloDiff) : (matchResultData.player2.eloDiff >= 0 ? `+${matchResultData.player2.eloDiff}` : matchResultData.player2.eloDiff)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={quitActiveMatch}
                  className="py-3 px-8 bg-amber-500 hover:bg-amber-600 hover:scale-[1.01] active:scale-[0.99] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
                >
                  Voltar ao Lobby
                </button>
              </div>

            </motion.div>
          )}

        </div>
      )}

      {/* LOBBY INTERFACE LAYOUT (Displays if not actively in combat room) */}
      {!combatRoomId && (
        <div className="bg-neutral-950 border border-neutral-900 rounded-3xl overflow-hidden shadow-xl">
          
          {/* Tabs header */}
          <div className="flex border-b border-neutral-900 bg-neutral-900/40 p-1">
            <button
               onClick={() => setActiveTab('arena')}
               className={`flex-1 py-3.5 text-xs font-mono uppercase tracking-wider font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                 activeTab === 'arena' 
                   ? 'bg-neutral-900 text-white border-b-2 border-red-500 shadow'
                   : 'text-neutral-400 hover:text-white hover:bg-neutral-900/20'
               }`}
            >
              <Sword className="w-4 h-4" />
              <span>Octógono PvP</span>
            </button>

            <button
               onClick={() => setActiveTab('ranking')}
               className={`flex-1 py-3.5 text-xs font-mono uppercase tracking-wider font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                 activeTab === 'ranking' 
                   ? 'bg-neutral-900 text-white border-b-2 border-red-500 shadow'
                   : 'text-neutral-400 hover:text-white hover:bg-neutral-900/20'
               }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Ranking Geral</span>
            </button>

            <button
               onClick={() => setActiveTab('history')}
               className={`flex-1 py-3.5 text-xs font-mono uppercase tracking-wider font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                 activeTab === 'history' 
                   ? 'bg-neutral-900 text-white border-b-2 border-red-500 shadow'
                   : 'text-neutral-400 hover:text-white hover:bg-neutral-900/20'
               }`}
            >
              <History className="w-4 h-4" />
              <span>Seus Combates</span>
            </button>
          </div>

          <div className="p-6">
            
            {/* VIEW 1: ARENA MATCHMAKING SEARCH PANELS */}
            {activeTab === 'arena' && (
              <div className="space-y-6">

                {/* Secure auth checkpoints matching strict rules! */}
                {!user ? (
                  /* Standard warning display requested in specifications */
                  <div className="text-center py-10 max-w-md mx-auto space-y-5 animate-fade-in">
                    <div className="w-16 h-16 bg-neutral-900 border border-neutral-850 rounded-full flex items-center justify-center text-3xl mx-auto text-neutral-400">
                      🔒
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-white">Luta Online Bloqueada</h4>
                      <p className="text-stone-300 text-xs leading-relaxed font-sans font-medium bg-neutral-900/50 border border-neutral-900 p-4 rounded-xl">
                        “Você precisa criar uma conta para participar da Arena JiuSpeak.”
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        onClick={() => triggerAuth('register')}
                        className="py-3 bg-gradient-to-r from-red-650 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
                      >
                        Criar Conta
                      </button>
                      <button 
                        onClick={() => triggerAuth('login')}
                        className="py-3 bg-neutral-900 hover:bg-neutral-800 text-stone-200 border border-neutral-800 font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
                      >
                        Fazer Login
                      </button>
                    </div>
                  </div>
                ) : !user.email_verified ? (
                  /* E-mail verified blocking constraint */
                  <div className="text-center py-10 max-w-md mx-auto space-y-5 animate-fade-in">
                    <div className="w-16 h-16 bg-red-950/20 border border-red-900/50 rounded-full flex items-center justify-center text-3xl mx-auto text-red-500">
                      <Mail className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-white">E-mail Não Verificado ✉️</h4>
                      <p className="text-neutral-400 text-xs leading-relaxed">
                        Verifique seu e-mail registrado (<span className="text-neutral-300">{user.email}</span>) para liberar as competições de lutas online.
                      </p>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-xl space-y-3">
                      <span className="text-[10px] font-mono uppercase text-amber-500 block">Simulador de Link de Verificação</span>
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Como este é um ambiente de testes local, você pode clicar no botão abaixo para verificar o cadastro simulado instantaneamente.
                      </p>
                      <a 
                        href={`/api/auth/verify/v_tok_local`} // fallback simple tokens
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block py-2 px-4 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition"
                      >
                        Verificar Conta Agora ⚡
                      </a>
                    </div>
                  </div>
                ) : (
                  /* Active PvP Queue Trigger cards */
                  <div className="space-y-6">
                    {queueStatus === 'idle' ? (
                      <div className="text-center py-8 space-y-5">
                        
                        {/* Spinning UFC-style shield overlay */}
                        <div className="w-24 h-24 rounded-full bg-red-950/20 border border-red-900/40 flex items-center justify-center text-5xl mx-auto shadow-inner relative">
                          <Sword className="w-10 h-10 text-red-500 animate-pulse" />
                        </div>

                        <div className="space-y-2 max-w-sm mx-auto">
                          <h4 className="text-lg font-black text-stone-100 italic uppercase">Pronto Para o Combate Verbal?</h4>
                          <p className="text-xs text-neutral-400 leading-normal">
                            O sistema fará matchmaking automático de conceitos aplicados de Jiu-Jítsu e tradução internacional em tempo real.
                          </p>
                        </div>

                        {queueError && (
                          <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3.5 max-w-md mx-auto text-xs text-red-400 font-medium leading-relaxed">
                            ⚠️ {queueError}
                          </div>
                        )}

                        <div className="pt-2 max-w-xs mx-auto">
                          <button
                            onClick={startMatchmaking}
                            disabled={cooldownCountdown > 0}
                            className={`w-full py-4 bg-gradient-to-r from-red-650 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                              cooldownCountdown > 0 ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.01] active:scale-[0.99]'
                            }`}
                          >
                            <Play className="w-4 h-4 fill-current" />
                            {cooldownCountdown > 0 ? `Cooldown (${cooldownCountdown}s)` : 'Buscar Adversário ⚡'}
                          </button>
                        </div>

                        {/* Anti-fraud secure flags label */}
                        <div className="flex justify-center items-center gap-2 text-[9px] font-mono text-neutral-500 pt-4 uppercase tracking-wider">
                          <Shield className="w-3.5 h-3.5 text-red-500" />
                          <span>Mecanismo Anti-Trapassa Ativo</span>
                          <span>•</span>
                          <span>Validação Server-side</span>
                          <span>•</span>
                          <span>Bot-Matchmaking Fallback</span>
                        </div>

                      </div>
                    ) : (
                      /* RADAR QUEUE SEEKING MATCH LOADING */
                      <div className="text-center py-12 space-y-6">
                        
                        {/* Radar Spinner animation */}
                        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-2 border-red-500/10 animate-ping" />
                          <div className="absolute inset-2 rounded-full border border-red-500/20 animate-pulse" />
                          <div className="w-16 h-16 rounded-full bg-neutral-900 border-2 border-red-600 flex items-center justify-center text-4xl animate-spin-slow">
                            🥋
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="text-sm font-bold text-white uppercase tracking-widest animate-pulse">Buscando Tatame Internacional...</h5>
                          <p className="text-xs text-neutral-400 font-mono tracking-wide">{queueMessage || 'Analisando competidores online na rede...'}</p>
                        </div>

                        <div className="max-w-xs mx-auto pt-2">
                          <button
                            onClick={cancelMatchmaking}
                            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
                          >
                            Cancelar Busca
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* VIEW 2: GLOBAL LEADERBOARD */}
            {activeTab === 'ranking' && (
              <div className="space-y-5 text-left">
                
                {/* Visual filter forms matching requirements */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Country Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">País</label>
                    <div className="relative">
                      <select 
                        value={filterCountry} 
                        onChange={(e) => setFilterCountry(e.target.value)}
                        className="w-full bg-[#070707] border border-neutral-900 text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 appearance-none font-sans"
                      >
                        <option value="">🌎 Todos os Países (Global)</option>
                        <option value="BR">🇧🇷 Brasil (BR)</option>
                        <option value="US">🇺🇸 Estados Unidos (US)</option>
                        <option value="JP">🇯🇵 Japão (JP)</option>
                        <option value="RU">🇷🇺 Rússia (RU)</option>
                        <option value="DE">🇩🇪 Alemanha (DE)</option>
                        <option value="AU">🇦🇺 Austrália (AU)</option>
                      </select>
                      <Globe className="w-4 h-4 text-neutral-500 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Academy Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">Academia / Dojo</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Ex: Alliance, Gracie..."
                        value={filterAcademy}
                        onChange={(e) => setFilterAcademy(e.target.value)}
                        className="w-full bg-[#070707] border border-neutral-900 text-xs text-stone-200 placeholder:text-neutral-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 font-sans"
                      />
                      <Search className="w-4 h-4 text-neutral-501 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Period selection filters */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">Temporada/Liga</label>
                    <div className="flex gap-2 bg-[#070707] p-1 border border-neutral-900 rounded-xl">
                      <button
                        onClick={() => setFilterPeriod('global')}
                        className={`flex-1 py-1.5 text-[10px] font-mono uppercase font-bold rounded-lg transition ${
                          filterPeriod === 'global' ? 'bg-red-650 text-white' : 'text-neutral-500'
                        }`}
                      >
                        Geral
                      </button>
                      <button
                        onClick={() => setFilterPeriod('weekly')}
                        className={`flex-1 py-1.5 text-[10px] font-mono uppercase font-bold rounded-lg transition ${
                          filterPeriod === 'weekly' ? 'bg-red-650 text-white' : 'text-neutral-500'
                        }`}
                      >
                        Semanal
                      </button>
                    </div>
                  </div>

                </div>

                {/* Leaderboard Table rows */}
                {rankingLoading ? (
                  <div className="text-center py-10 font-mono text-xs text-neutral-500">
                    Calculando chaves dos guerreiros...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-neutral-300 font-sans border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-900 font-mono uppercase tracking-wider text-[10px] text-neutral-500 font-bold">
                          <th className="py-2.5 px-3">Rank</th>
                          <th className="py-2.5 px-3">Guerreiro</th>
                          <th className="py-2.5 px-3">Faixa</th>
                          <th className="py-2.5 px-3">ELO</th>
                          <th className="py-2.5 px-3">Vitórias</th>
                          <th className="py-2.5 px-3">Streak</th>
                          <th className="py-2.5 px-3 text-right">País</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((item, index) => {
                          const isSelf = user?.id === item.userId;
                          
                          // Style medals based on rank
                          let rankBg = "text-neutral-400";
                          if (item.rank === 1) rankBg = "text-amber-500 font-black";
                          if (item.rank === 2) rankBg = "text-stone-300 font-black";
                          if (item.rank === 3) rankBg = "text-amber-700 font-black";

                          return (
                            <tr 
                              key={item.userId} 
                              className={`border-b border-neutral-900/40 hover:bg-neutral-900/30 transition-colors ${
                                isSelf ? 'bg-red-950/20 border-l-2 border-l-red-600' : ''
                              }`}
                            >
                              <td className="py-3 px-3">
                                <span className={`font-mono text-xs ${rankBg}`}>
                                  {item.rank === 1 ? '🥇 1º' : item.rank === 2 ? '🥈 2º' : item.rank === 3 ? '🥉 3º' : `${item.rank}º`}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                                <span className="text-xl shrink-0">{item.profile_image.length < 4 ? item.profile_image : '👤'}</span>
                                <div className="truncate">
                                  <span>{item.name}</span>
                                  {isSelf && <span className="ml-1.5 text-[8.5px] font-mono bg-red-950 text-red-500 border border-red-900 px-1 py-0.5 rounded">VOCÊ</span>}
                                  <span className="block text-[10px] text-neutral-500 font-mono uppercase font-black">{item.academy}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-[10px] font-mono tracking-wide bg-neutral-900 px-2 py-0.5 rounded border border-neutral-850 uppercase font-bold text-stone-300">
                                  {item.belt === 'White' ? 'Branca' : item.belt === 'Blue' ? 'Azul' : item.belt === 'Purple' ? 'Roxa' : item.belt === 'Brown' ? 'Marrom' : 'Preta'}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-black text-amber-500 font-mono">{item.elo} PTS</td>
                              <td className="py-3 px-3 font-mono text-neutral-400">{item.wins}W - {item.losses}L</td>
                              <td className="py-3 px-3">
                                {item.streak >= 3 ? (
                                  <span className="text-[9.5px] font-bold text-emerald-400 font-mono bg-emerald-950/30 border border-emerald-900 px-1.5 py-0.5 rounded-sm">
                                    🔥 {item.streak} seg.
                                  </span>
                                ) : (
                                  <span className="text-neutral-500 font-mono text-xs">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-bold font-mono">
                                {item.country === 'BR' ? '🇧🇷 BR' : 
                                 item.country === 'US' ? '🇺🇸 US' : 
                                 item.country === 'JP' ? '🇯🇵 JP' : 
                                 item.country === 'RU' ? '🇷🇺 RU' : 
                                 item.country === 'DE' ? '🇩🇪 DE' : '🇦🇺 AU'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            )}

            {/* VIEW 3: MATCH HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-4 text-left">
                
                {!user ? (
                  <div className="text-center py-10 font-mono text-xs text-neutral-500">
                    Faça login para salvar e analisar seu histórico oficial de lutas aplicadas.
                  </div>
                ) : historyLoading ? (
                  <div className="text-center py-10 font-mono text-xs text-neutral-500">
                    Carregando histórico de finalizações...
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <div className="text-3xl text-neutral-600">🥋</div>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto">Você ainda não competiu na Arena PvP JiuSpeak. Agende seu primeiro rola verbal clicando na aba "Octógono PvP"!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyList.map((match) => {
                      const isWinner = (match.winner === 'player_one' && match.player_one === user.id) || 
                                       (match.winner === 'player_two' && match.player_two === user.id);
                      const isDraw = match.winner === 'draw';
                      const opponentName = match.player_one === user.id ? match.player_two_name : match.player_one_name;
                      const opponentBelt = match.player_one === user.id ? match.player_two_belt : match.player_one_belt;
                      
                      return (
                        <div 
                          key={match.id}
                          className="bg-neutral-900/50 border border-neutral-900 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-neutral-900/80 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                              isDraw 
                                ? 'bg-neutral-950 text-stone-400 border border-neutral-850' 
                                : isWinner 
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                  : 'bg-red-950/30 text-red-500 border border-red-950'
                            }`}>
                              {isDraw ? '🤝' : isWinner ? 'W' : 'L'}
                            </div>

                            <div>
                              <h5 className="text-xs font-bold text-white flex items-center gap-2">
                                <span>Rola contra: {opponentName}</span>
                                <span className="text-[10px] font-mono text-amber-500 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-850 truncate">{opponentBelt} Belt</span>
                              </h5>
                              <p className="text-[10px] text-neutral-500 font-mono mt-1">
                                {new Date(match.created_at).toLocaleDateString('pt-BR')} às {new Date(match.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center md:text-right gap-4 justify-between md:justify-end border-t border-neutral-900/30 pt-2.5 md:pt-0 md:border-t-0">
                            <div>
                              <span className="text-[9px] font-mono text-neutral-500 block uppercase">Recompensa</span>
                              <span className="text-xs font-black text-amber-500 flex items-center gap-1 mt-0.5 justify-end">
                                <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                                +{match.xp_gained} XP
                              </span>
                            </div>
                            
                            <div className="text-right">
                              <span className="text-[9px] font-mono text-neutral-500 block uppercase">Resultado</span>
                              <span className={`text-xs font-black uppercase mt-0.5 ${
                                isDraw ? 'text-stone-400' : isWinner ? 'text-amber-500' : 'text-red-500'
                              }`}>
                                {isDraw ? 'Empate' : isWinner ? 'Vitória' : 'Derrota'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
