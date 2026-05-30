import { Server, Socket } from 'socket.io';
import express from 'express';
import jwt from 'jsonwebtoken';
import { dbStore, MatchRow, PVPRankingRow, UserRow } from './server_db';

const JWT_SECRET = process.env.JWT_SECRET || 'jiuspeak-master-secret';

export interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export const PVP_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Como se diz 'Raspagem' no Jiu-Jítsu aplicado em inglês?",
    options: ["Guard Pass", "Sweep", "Takedown", "Submission"],
    answer: "Sweep",
    explanation: "Raspagem pé de apoio é traduzida como 'Sweep'. Ex: 'Fantastic sweep from closed guard!'"
  },
  {
    id: 2,
    question: "Qual o termo ideal para o adversário que está parado, travando/amarrando a luta?",
    options: ["Rushing", "Stalling", "Sweeping", "Stacking"],
    answer: "Stalling",
    explanation: "Segurar ou amarrar o combate é designado como 'Stalling' (trancar/evitar avanço de luta)."
  },
  {
    id: 3,
    question: "Como se traduz o termo técnico 'Passagem de Guarda' em competições internacionais?",
    options: ["Guard Pass", "Guard Pull", "Sweep Guard", "Close Guard"],
    answer: "Guard Pass",
    explanation: "A transição de passar a guarda do adversário é referida como 'Guard Pass'."
  },
  {
    id: 4,
    question: "O atleta está 'gassed'. O que essa gíria muito comum do Jiu-Jítsu significa?",
    options: ["Extremamente forte", "Completamente exausto / sem gás", "Rápido como um raio", "Estratégico"],
    answer: "Completely exausto / sem gás",
    explanation: "Estar 'gassed' significa que a stamina (gás) acabou completamente durante um rola duro."
  },
  {
    id: 5,
    question: "Qual é a tradução em inglês de gola, aba ou lapela do quimono de Jiu-Jítsu?",
    options: ["Sleeves", "Lapels", "Pants", "Collar-tabs"],
    answer: "Lapels",
    explanation: "As abas do quimono onde fazemos as pegadas são chamadas de 'Lapels'."
  },
  {
    id: 6,
    question: "Como os árbitros internacionais de Jiu-Jítsu traduzem o comando 'Parou!'?",
    options: ["Pause", "Stop", "Combat", "Freeze"],
    answer: "Stop",
    explanation: "Em arenas globais da IBJJF, a interrupção oficial de luta é referida verbalmente como 'Stop' pelo árbitro."
  },
  {
    id: 7,
    question: "Qual o nome da finalização clássica 'Chave de Calcanhar' em inglês?",
    options: ["Ankle Lock", "Kneebar", "Heel Hook", "Toe Hold"],
    answer: "Heel Hook",
    explanation: "Chave de calcanhar é traduzida como 'Heel Hook'. Uma finalização extremamente perigosa e eficiente."
  },
  {
    id: 8,
    question: "Se o seu professor diz para fazer um 'Stack' para escapar do Armbar, o que ele está sugerindo?",
    options: ["Empilhar e amassar o oponente", "Rolar por cima do ombro", "Puxar o braço com força extrema", "Desistir da luta"],
    answer: "Empilhar e amassar o oponente",
    explanation: "A defesa de 'Stack' (empilhada) amassa o oponente tirando o ângulo e o quadril dele do chão."
  },
  {
    id: 9,
    question: "Qual o significado da expressão 'Tap Out' nas lutas?",
    options: ["Iniciar o cronômetro do tatame", "Desistir por batida / três tapinhas", "Amarrar a faixa corretamente", "Fazer drill técnico"],
    answer: "Desistir por batida / três tapinhas",
    explanation: "Bater em desistência é chamado de 'Tap out' ou 'to tap'."
  },
  {
    id: 10,
    question: "Quantos pontos um atleta ganha no Jiu-Jítsu ao encaixar com perfeição a 'Pegada de Costas' (Back Take) com ganchos?",
    options: ["2 pontos", "3 pontos", "4 pontos", "1 ponto"],
    answer: "4 pontos",
    explanation: "A montada e a pegada de costas com ganchos ativos garantem 4 pontos pela tabela regulamentar IBJJF."
  },
  {
    id: 11,
    question: "Como dizemos gola ou pescoço no termo das pegadas do quimono?",
    options: ["Collar", "Sleeve", "Gi-Flap", "Seam"],
    answer: "Collar",
    explanation: "Gola é referida como 'Collar'. Pegadas de gola e lapela são determinantes para estrangulamentos."
  },
  {
    id: 12,
    question: "O termo 'Rolling' em um ambiente de Jiu-Jítsu significa o quê?",
    options: ["Competição oficial", "Treinar / fazer rola livre", "Rolar no carpete", "Alongamento inicial"],
    answer: "Treinar / fazer rola livre",
    explanation: "Fazer o rola livre ou treinar solto é referido em inglês como 'Rolling'."
  }
];

// Curated Bot profile pool for matchmaking variety
const BOT_POOL = [
  { id: 'bot_marcus', first_name: 'Marcus', last_name: 'Miller (BOT)', bjj_belt: 'Brown', avatar: '🇺🇸', accuracy: 0.82, country: 'US', academy: 'Alliance Miami' },
  { id: 'bot_yuki', first_name: 'Yuki', last_name: '\'Samurai\' (BOT)', bjj_belt: 'Purple', avatar: '🇯🇵', accuracy: 0.74, country: 'JP', academy: 'Shibuya Dojo' },
  { id: 'bot_elena', first_name: 'Elena', last_name: 'Petrova (BOT)', bjj_belt: 'Purple', avatar: '🇷🇺', accuracy: 0.72, country: 'RU', academy: 'Moscow BJJ Club' },
  { id: 'bot_gabriel', first_name: 'Gabriel', last_name: '\'Leão\' (BOT)', bjj_belt: 'Blue', avatar: '🇧🇷', accuracy: 0.64, country: 'BR', academy: 'Gracie Barra Rio' },
  { id: 'bot_hans', first_name: 'Hans', last_name: 'Müller (BOT)', bjj_belt: 'Blue', avatar: '🇩🇪', accuracy: 0.60, country: 'DE', academy: 'Munich Grapplers' }
];

interface PlayerState {
  id: string;
  name: string;
  belt: string;
  image: string;
  socketId?: string;
  isBot: boolean;
  stamina: number;
  score: number;
  advantages: number;
  hasAnswered: boolean;
  selectedAnswer: string | null;
  roundCorrect: boolean | null;
  botAccuracy?: number;
  country?: string;
  academy?: string;
}

interface PVPGameRoom {
  roomId: string;
  player1: PlayerState;
  player2: PlayerState;
  questions: Question[];
  currentRound: number;
  status: 'starting' | 'round_active' | 'round_ended' | 'finished';
  timer: number;
  timerInterval?: NodeJS.Timeout;
}

const activeRooms = new Map<string, PVPGameRoom>();
const playerInRoom = new Map<string, string>(); // userId -> roomId
const socketsMap = new Map<string, string>(); // socketId -> userId

// Simple matchmaking queue
let matchmakingQueue: { userId: string; socketId: string }[] = [];

// Protection system tracker for cooldown between matchmaking searches to avoid spamming
const matchmakingCooldown = new Map<string, number>(); // userId -> timestamp

export function setupPvP(io: Server, app: express.Express) {

  // --- REST ENDPOINTS FOR PVP HISTORY, SEASONS, & STATS ---

  // 1. Get user PvP stats and record profile details
  app.get('/api/pvp/profile/:userId', (req, res) => {
    const { userId } = req.params;
    const user = dbStore.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Atleta não localizado.' });
    }

    const rank = dbStore.getRankingByUserId(userId);
    res.json({
      wins: rank.wins,
      losses: rank.losses,
      elo: rank.elo,
      streak: rank.streak,
      accuracy: user.id.startsWith('usr_') ? 88 : 82,
      belt: user.belt_rank,
      xp: user.xp,
      name: `${user.first_name} ${user.last_name}`,
      profile_image: user.profile_image
    });
  });

  // 2. Fetch matches log database records
  app.get('/api/pvp/history/:userId', (req, res) => {
    const { userId } = req.params;
    const matches = dbStore.getMatches().filter(m => m.player_one === userId || m.player_two === userId);
    res.json({ history: matches.slice(-15).reverse() }); // return last 15 matches 
  });

  // 3. PvP Rankings with filters (country, academy, etc.)
  app.get('/api/pvp/leaderboard', (req, res) => {
    const { country, academy, period } = req.query; // weekly, monthly, global
    
    const allUsers = dbStore.getUsers();
    const rankings = dbStore.getPvpRankings();

    let list = allUsers.map(usr => {
      const pvpRank = rankings.find(r => r.user_id === usr.id) || {
        user_id: usr.id,
        elo: 1000,
        wins: 0,
        losses: 0,
        streak: 0
      };

      // Simulated categories for academies if not registered
      let userAcademy = "JiuSpeak Alliance";
      if (usr.id === 'u1') userAcademy = "Alliance SP";
      if (usr.id === 'u2') userAcademy = "Alliance Miami";
      if (usr.id === 'u3') userAcademy = "Shibuya Dojo";
      if (usr.id === 'u4') userAcademy = "Moscow BJJ Club";
      if (usr.id === 'u5') userAcademy = "Gracie Barra Rio";
      if (usr.id === 'u7') userAcademy = "Munich Grapplers";
      if (usr.id === 'u8') userAcademy = "Alliance Sydney";

      const userCountry = usr.id === 'u1' || usr.id === 'u5' ? 'BR' :
                         usr.id === 'u2' ? 'US' :
                         usr.id === 'u3' ? 'JP' :
                         usr.id === 'u4' ? 'RU' :
                         usr.id === 'u7' ? 'DE' : 'AU';

      return {
        userId: usr.id,
        name: `${usr.first_name} ${usr.last_name}`,
        profile_image: usr.profile_image,
        belt: usr.belt_rank,
        elo: pvpRank.elo,
        wins: pvpRank.wins,
        losses: pvpRank.losses,
        streak: pvpRank.streak,
        country: userCountry,
        academy: userAcademy,
        xp: usr.xp
      };
    });

    // Apply country filters if specified
    if (country) {
      list = list.filter(item => item.country === country);
    }

    // Apply academy filters if specified
    if (academy) {
      list = list.filter(item => item.academy.toLowerCase().includes(String(academy).toLowerCase()));
    }

    // If period is monthly/weekly, introduce structured ELO multipliers for realism
    if (period === 'weekly') {
      list.forEach(x => {
        // slightly fluctuate scores to represent dynamic weekly league
        x.elo = Math.floor(x.elo * 0.95) + (x.wins * 2);
      });
    }

    // Sort by ELO primarily, then wins
    list.sort((a, b) => b.elo - a.elo || b.wins - a.wins);

    // Append ranks
    const finalLeaderboard = list.map((item, idx) => ({
      rank: idx + 1,
      ...item
    }));

    res.json({ leaderboard: finalLeaderboard });
  });

  // 4. Seasons prizes and awards claims
  app.post('/api/pvp/claim-season', (req, res) => {
    // Return verified rewards simulation match
    res.json({
      success: true,
      reward_xp: 500,
      reward_badge: "🥋 PVP Gladiator Medal",
      message: "Recompensas de temporada adicionadas com extremo sucesso no seu perfil!"
    });
  });

  // --- WEBSOCKET REAL-TIME MATCH COORDINATOR ---

  io.on('connection', (socket: Socket) => {
    console.log(`[PVP Net] Novo atleta conectado: ${socket.id}`);

    // Helper to extract JWT token securely
    const verifyToken = (token: string): UserRow | null => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
        const user = dbStore.getUserById(decoded.id);
        return user || null;
      } catch {
        return null;
      }
    };

    // User leaves queue or room on direct disconnect
    socket.on('disconnect', () => {
      const userId = socketsMap.get(socket.id);
      if (!userId) return;

      console.log(`[PVP Net] Atleta desconectou: ${userId}`);
      
      // Remove from matchmaking queue
      matchmakingQueue = matchmakingQueue.filter(q => q.userId !== userId);
      socketsMap.delete(socket.id);

      // Handle running match forfeiting
      const roomId = playerInRoom.get(userId);
      if (roomId) {
        handlePlayerAbandonment(roomId, userId);
      }
    });

    // Handle Manual Join Search Queue
    socket.on('join_queue', (data: { token: string }) => {
      const user = verifyToken(data.token);
      if (!user) {
        socket.emit('queue_error', { message: "Sua autenticação falhou ou expirou." });
        return;
      }

      // Check verified email and active user constraint as required!
      if (!user.email_verified) {
        socket.emit('queue_error', { message: "Você precisa conter seu e-mail verificado para participar da Arena PvP JiuSpeak." });
        return;
      }

      // Cooldown between matchmaking searches to avoid search spam (Anti-fraud!)
      const now = Date.now();
      const userCooldown = matchmakingCooldown.get(user.id);
      if (userCooldown && now - userCooldown < 4000) {
        socket.emit('queue_error', { message: "Por favor, aguarde 4 segundos entre as buscas de lutas." });
        return;
      }
      matchmakingCooldown.set(user.id, now);

      // Avoid double entries
      if (matchmakingQueue.some(q => q.userId === user.id)) {
        socket.emit('queue_status', { message: "Você já está na fila oficial de buscas." });
        return;
      }

      // Safeguard: close current rooms if already active to prevent duplicates/ghosting
      const currentRoomId = playerInRoom.get(user.id);
      if (currentRoomId) {
        handlePlayerAbandonment(currentRoomId, user.id);
      }

      // Register socket mapping
      socketsMap.set(socket.id, user.id);
      matchmakingQueue.push({ userId: user.id, socketId: socket.id });

      socket.emit('queue_joined', { message: "Encontrando adversário qualificado..." });
      console.log(`[PVP Net] ${user.first_name} entrou na fila de matchmaking. Comprimento: ${matchmakingQueue.length}`);

      // Perform quick Matchmaking resolution
      // Run on next tick or standard loop
      setTimeout(() => {
        resolveMatchmaking();
      }, 1000);
    });

    // Abandon/Leave queue manual action
    socket.on('leave_queue', () => {
      const userId = socketsMap.get(socket.id);
      if (!userId) return;

      matchmakingQueue = matchmakingQueue.filter(q => q.userId !== userId);
      socket.emit('queue_left', { message: "Busca cancelada com sucesso." });
      console.log(`[PVP Net] ${userId} cancelou busca por luta.`);
    });

    // Submitting answer to ongoing question
    socket.on('submit_answer', (data: { answer: string }) => {
      const userId = socketsMap.get(socket.id);
      if (!userId) return;

      const roomId = playerInRoom.get(userId);
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (!room || room.status !== 'round_active') return;

      const player = room.player1.id === userId ? room.player1 : room.player2;
      if (player.hasAnswered) return; // ignore multiple answers

      player.hasAnswered = true;
      player.selectedAnswer = data.answer;
      
      const q = room.questions[room.currentRound - 1];
      player.roundCorrect = (data.answer.toLowerCase() === q.answer.toLowerCase());
      
      const timeElapsed = 15 - room.timer;
      player.score += player.roundCorrect ? Math.max(10, Math.floor(10 + (room.timer / 15) * 40)) : -10;
      
      if (!player.roundCorrect) {
        // Lose stamina immediately on mistakes (Loses Stamina!)
        player.stamina = Math.max(0, player.stamina - 20);
      }

      console.log(`[PVP Combate] Jogador ${player.name} submeteu: ${data.answer} (Correto? ${player.roundCorrect})`);

      // Notify clients that opponent answered (without exposing whether correctness or exact selection)
      const opSocket = room.player1.id === userId ? room.player2.socketId : room.player1.socketId;
      if (opSocket) {
        io.to(opSocket).emit('opponent_action', { action: 'answered' });
      }

      // If everyone in room resolved answers, advance immediately for snappier experience!
      if (room.player1.hasAnswered && room.player2.hasAnswered) {
        resolveRound(roomId);
      }
    });

    // Chat micro-interaction during PvP
    socket.on('send_chat', (data: { message: string }) => {
      const userId = socketsMap.get(socket.id);
      if (!userId) return;

      const roomId = playerInRoom.get(userId);
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      const senderName = room.player1.id === userId ? room.player1.name : room.player2.name;
      
      // Broadcast to all sockets connected to this room
      if (room.player1.socketId) io.to(room.player1.socketId).emit('chat_message', { senderId: userId, senderName, message: data.message });
      if (room.player2.socketId) io.to(room.player2.socketId).emit('chat_message', { senderId: userId, senderName, message: data.message });

      // Bot reactive feedback simulation!
      const receiver = room.player1.id === userId ? room.player2 : room.player1;
      if (receiver.isBot) {
        // reactive reply text
        setTimeout(() => {
          const replies = [
            "OSS! Boa luta! 🥋",
            "Tamo junto! Força nos treinos 💪",
            "Good fight! Defesa implacável!",
            "Tough fight! Vamos!",
            "OSS! 🔥",
            "Oops! Essa foi raspagem técnica!",
            "No excuses! Vamos lutar!"
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          socket.emit('chat_message', {
            senderId: receiver.id,
            senderName: receiver.name,
            message: randomReply
          });
        }, 1500);
      }
    });
  });

  // --- PVP RESOLVING ENGINES ---

  function resolveMatchmaking() {
    // Attempt human matchups first
    while (matchmakingQueue.length >= 2) {
      const p1 = matchmakingQueue.shift()!;
      const p2 = matchmakingQueue.shift()!;

      const user1 = dbStore.getUserById(p1.userId);
      const user2 = dbStore.getUserById(p2.userId);

      if (!user1 || !user2) continue; // clean up dead queues

      createMatchRoom(p1, p2, user1, user2);
    }

    // Fallback: If player waiting in queue for over 2.5 seconds, provision clean simulated BOT
    if (matchmakingQueue.length === 1) {
      const p1 = matchmakingQueue[0];
      const timeInQueue = 3000; // instant matching to keep sandbox app highly interactive and fast!
      
      setTimeout(() => {
        // Re-check queue presence
        const idx = matchmakingQueue.findIndex(q => q.userId === p1.userId);
        if (idx !== -1) {
          matchmakingQueue.splice(idx, 1);
          const user = dbStore.getUserById(p1.userId);
          if (user) {
            createBotMatch(p1, user);
          }
        }
      }, 2500);
    }
  }

  function createMatchRoom(
    p1: { userId: string; socketId: string },
    p2: { userId: string; socketId: string },
    user1: UserRow,
    user2: UserRow
  ) {
    const roomId = 'room_' + Math.random().toString(36).substr(2, 9);
    
    // Choose 5 random questions
    const shuffledQ = [...PVP_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);

    const r1 = dbStore.getRankingByUserId(user1.id);
    const r2 = dbStore.getRankingByUserId(user2.id);

    const newRoom: PVPGameRoom = {
      roomId,
      player1: {
        id: user1.id,
        name: `${user1.first_name} ${user1.last_name}`,
        belt: user1.belt_rank,
        image: user1.profile_image,
        socketId: p1.socketId,
        isBot: false,
        stamina: 100,
        score: 0,
        advantages: 0,
        hasAnswered: false,
        selectedAnswer: null,
        roundCorrect: null,
        country: user1.address.toLowerCase().includes('br') ? 'BR' : 'US',
        academy: 'Alliance SP'
      },
      player2: {
        id: user2.id,
        name: `${user2.first_name} ${user2.last_name}`,
        belt: user2.belt_rank,
        image: user2.profile_image,
        socketId: p2.socketId,
        isBot: false,
        stamina: 100,
        score: 0,
        advantages: 0,
        hasAnswered: false,
        selectedAnswer: null,
        roundCorrect: null,
        country: user2.address.toLowerCase().includes('br') ? 'BR' : 'US',
        academy: 'Alliance Miami'
      },
      questions: shuffledQ,
      currentRound: 0,
      status: 'starting',
      timer: 15
    };

    activeRooms.set(roomId, newRoom);
    playerInRoom.set(user1.id, roomId);
    playerInRoom.set(user2.id, roomId);

    // Notify clients of match start
    io.to(p1.socketId).emit('match_ready', {
      roomId,
      opponent: {
        id: user2.id,
        name: `${user2.first_name} ${user2.last_name}`,
        belt: user2.belt_rank,
        image: user2.profile_image,
        elo: r2.elo,
        wins: r2.wins,
        losses: r2.losses,
        streak: r2.streak,
        country: 'US',
        academy: 'Alliance Miami'
      },
      selfElo: r1.elo
    });

    io.to(p2.socketId).emit('match_ready', {
      roomId,
      opponent: {
        id: user1.id,
        name: `${user1.first_name} ${user1.last_name}`,
        belt: user1.belt_rank,
        image: user1.profile_image,
        elo: r1.elo,
        wins: r1.wins,
        losses: r1.losses,
        streak: r1.streak,
        country: 'BR',
        academy: 'Alliance SP'
      },
      selfElo: r2.elo
    });

    console.log(`[PVP Combate] Partida Humana criada: ${user1.first_name} VS ${user2.first_name}`);

    // Schedule round 1 start 
    setTimeout(() => {
      startNextRound(roomId);
    }, 4000);
  }

  function createBotMatch(
    p1: { userId: string; socketId: string },
    user: UserRow
  ) {
    const roomId = 'room_' + Math.random().toString(36).substr(2, 9);
    
    // Choose 5 random questions
    const shuffledQ = [...PVP_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);

    // Pick random simulated bot profile
    const bot = BOT_POOL[Math.floor(Math.random() * BOT_POOL.length)];
    const r1 = dbStore.getRankingByUserId(user.id);

    const newRoom: PVPGameRoom = {
      roomId,
      player1: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        belt: user.belt_rank,
        image: user.profile_image,
        socketId: p1.socketId,
        isBot: false,
        stamina: 100,
        score: 0,
        advantages: 0,
        hasAnswered: false,
        selectedAnswer: null,
        roundCorrect: null,
        country: 'BR',
        academy: 'Alliance SP'
      },
      player2: {
        id: bot.id,
        name: bot.first_name + ' ' + bot.last_name,
        belt: bot.bjj_belt,
        image: bot.avatar,
        isBot: true,
        stamina: 100,
        score: 0,
        advantages: 0,
        hasAnswered: false,
        selectedAnswer: null,
        roundCorrect: null,
        botAccuracy: bot.accuracy,
        country: bot.country,
        academy: bot.academy
      },
      questions: shuffledQ,
      currentRound: 0,
      status: 'starting',
      timer: 15
    };

    activeRooms.set(roomId, newRoom);
    playerInRoom.set(user.id, roomId);

    // Notify client of matchmaking result
    io.to(p1.socketId).emit('match_ready', {
      roomId,
      opponent: {
        id: bot.id,
        name: bot.first_name + ' ' + bot.last_name,
        belt: bot.bjj_belt,
        image: bot.avatar,
        elo: Math.floor(1100 + bot.accuracy * 400),
        wins: Math.floor(bot.accuracy * 50),
        losses: Math.floor((1 - bot.accuracy) * 30),
        streak: 3,
        country: bot.country,
        academy: bot.academy
      },
      selfElo: r1.elo
    });

    console.log(`[PVP Combate] Criando arena de robô: ${user.first_name} VS Bot ${bot.first_name}`);

    // Schedule round 1 start 
    setTimeout(() => {
      startNextRound(roomId);
    }, 4000);
  }

  function startNextRound(roomId: string) {
    const room = activeRooms.get(roomId);
    if (!room || room.status === 'finished') return;

    room.currentRound += 1;
    room.status = 'round_active';
    room.timer = 15;

    // Reset round-specific player metadata
    room.player1.hasAnswered = false;
    room.player1.selectedAnswer = null;
    room.player1.roundCorrect = null;

    room.player2.hasAnswered = false;
    room.player2.selectedAnswer = null;
    room.player2.roundCorrect = null;

    const currentQuestion = room.questions[room.currentRound - 1];

    // Build sanitised payload
    const roundPayload = {
      roundNum: room.currentRound,
      totalRounds: room.questions.length,
      question: {
        id: currentQuestion.id,
        question: currentQuestion.question,
        options: currentQuestion.options
      },
      player1Stamina: room.player1.stamina,
      player2Stamina: room.player2.stamina,
      player1Score: room.player1.score,
      player2Score: room.player2.score,
      timer: room.timer
    };

    // Dispatch to alive players
    if (room.player1.socketId) io.to(room.player1.socketId).emit('round_start', roundPayload);
    if (room.player2.socketId) io.to(room.player2.socketId).emit('round_start', roundPayload);

    // Start 1-second interval tracker
    if (room.timerInterval) clearInterval(room.timerInterval);
    room.timerInterval = setInterval(() => {
      room.timer -= 1;
      
      const countdownTick = { timer: room.timer };
      if (room.player1.socketId) io.to(room.player1.socketId).emit('timer_tick', countdownTick);
      if (room.player2.socketId) io.to(room.player2.socketId).emit('timer_tick', countdownTick);

      if (room.timer <= 0) {
        clearInterval(room.timerInterval);
        resolveRound(roomId);
      }
    }, 1000);

    // If opponent is a Bot, schedule bot choice
    if (room.player2.isBot) {
      // decide a realistic response time delay between 3 and 7 seconds
      const botDelay = 3000 + Math.random() * 4000;
      setTimeout(() => {
        // safety check if round still ongoing
        const activeRoomNow = activeRooms.get(roomId);
        if (activeRoomNow && activeRoomNow.status === 'round_active' && activeRoomNow.currentRound === room.currentRound) {
          simulateBotAnswer(activeRoomNow);
        }
      }, botDelay);
    }
  }

  function simulateBotAnswer(room: PVPGameRoom) {
    if (room.player2.hasAnswered) return;

    room.player2.hasAnswered = true;
    const q = room.questions[room.currentRound - 1];
    
    // Skill roll accuracy determining correctness
    const botRoll = Math.random();
    const isBotCorrect = botRoll <= (room.player2.botAccuracy || 0.7);

    room.player2.roundCorrect = isBotCorrect;
    if (isBotCorrect) {
      room.player2.selectedAnswer = q.answer;
      room.player2.score += Math.max(10, Math.floor(10 + (room.timer / 15) * 40));
    } else {
      // Pick random incorrect choice
      const wrongOpts = q.options.filter(o => o.toLowerCase() !== q.answer.toLowerCase());
      room.player2.selectedAnswer = wrongOpts[Math.floor(Math.random() * wrongOpts.length)] || wrongOpts[0];
      room.player2.score += -10;
      room.player2.stamina = Math.max(0, room.player2.stamina - 20);
    }

    // Notify human that adversary selected and answered
    if (room.player1.socketId) {
      io.to(room.player1.socketId).emit('opponent_action', { action: 'answered' });
    }

    // If human already completed answer, finish round immediately
    if (room.player1.hasAnswered) {
      clearInterval(room.timerInterval);
      resolveRound(room.roomId);
    }
  }

  function resolveRound(roomId: string) {
    const room = activeRooms.get(roomId);
    if (!room || room.status === 'round_ended' || room.status === 'finished') return;

    if (room.timerInterval) clearInterval(room.timerInterval);
    room.status = 'round_ended';

    const q = room.questions[room.currentRound - 1];

    // Handle unresponsive status (didn't submit anything!)
    if (!room.player1.hasAnswered) {
      room.player1.hasAnswered = true;
      room.player1.roundCorrect = false;
      room.player1.selectedAnswer = "[NENHUMA RESPOSTA / EXPIROU]";
      room.player1.stamina = Math.max(0, room.player1.stamina - 20);
      room.player1.score += -10;
    }

    if (!room.player2.hasAnswered) {
      room.player2.hasAnswered = true;
      room.player2.roundCorrect = false;
      room.player2.selectedAnswer = "[NENHUMA RESPOSTA / EXPIROU]";
      room.player2.stamina = Math.max(0, room.player2.stamina - 20);
      room.player2.score += -10;
    }

    // Allocate technical points / Advantage counters (Sufre vantagem!)
    if (room.player1.roundCorrect && !room.player2.roundCorrect) {
      room.player1.advantages += 1; // player 1 gained technical advantage over player 2
    } else if (!room.player1.roundCorrect && room.player2.roundCorrect) {
      room.player2.advantages += 1; // player 2 gained advantage
    }

    const roundResultPayload = {
      roundNum: room.currentRound,
      question: q,
      player1: {
        id: room.player1.id,
        name: room.player1.name,
        selectedAnswer: room.player1.selectedAnswer,
        isCorrect: room.player1.roundCorrect,
        stamina: room.player1.stamina,
        score: room.player1.score,
        advantages: room.player1.advantages
      },
      player2: {
        id: room.player2.id,
        name: room.player2.name,
        selectedAnswer: room.player2.selectedAnswer,
        isCorrect: room.player2.roundCorrect,
        stamina: room.player2.stamina,
        score: room.player2.score,
        advantages: room.player2.advantages
      }
    };

    if (room.player1.socketId) io.to(room.player1.socketId).emit('round_end', roundResultPayload);
    if (room.player2.socketId) io.to(room.player2.socketId).emit('round_end', roundResultPayload);

    // Check Submissions! (Anti-cheat/loss condition: stamina reaches 0 means instant tapout submission!)
    let isInstantSubmission = false;
    let submissionWinner: PlayerState | null = null;
    let submissionLoser: PlayerState | null = null;

    if (room.player1.stamina <= 0 && room.player2.stamina > 0) {
      isInstantSubmission = true;
      submissionWinner = room.player2;
      submissionLoser = room.player1;
    } else if (room.player2.stamina <= 0 && room.player1.stamina > 0) {
      isInstantSubmission = true;
      submissionWinner = room.player1;
      submissionLoser = room.player2;
    } else if (room.player1.stamina <= 0 && room.player2.stamina <= 0) {
      // Both critical, resolve on score differences instead
      isInstantSubmission = false;
    }

    // Decide if match concluded
    const isLastRound = room.currentRound === room.questions.length;
    if (isLastRound || isInstantSubmission) {
      setTimeout(() => {
        finishMatch(roomId, isInstantSubmission, submissionWinner, submissionLoser);
      }, 4000);
    } else {
      setTimeout(() => {
        startNextRound(roomId);
      }, 4500); // 4.5 seconds to read correct solution details and review
    }
  }

  function finishMatch(
    roomId: string, 
    isInstantSubmission: boolean,
    subWinner: PlayerState | null,
    subLoser: PlayerState | null
  ) {
    const room = activeRooms.get(roomId);
    if (!room || room.status === 'finished') return;

    room.status = 'finished';

    // Highlight winner
    let winnerId = 'draw';
    let winnerName = 'Empate Técnico';
    let winReason = 'Pontuação final de estudo';

    if (isInstantSubmission && subWinner && subLoser) {
      winnerId = subWinner.id;
      winnerName = subWinner.name;
      winReason = `Finalização por falta de fôlego do oponente! (TAPOUT)`;
    } else {
      // Resolve based on score, then advantages, then random
      if (room.player1.score > room.player2.score) {
        winnerId = room.player1.id;
        winnerName = room.player1.name;
        winReason = "Pontos de Domínio Técnico";
      } else if (room.player2.score > room.player1.score) {
        winnerId = room.player2.id;
        winnerName = room.player2.name;
        winReason = "Pontos de Domínio Técnico";
      } else {
        // check advantages
        if (room.player1.advantages > room.player2.advantages) {
          winnerId = room.player1.id;
          winnerName = room.player1.name;
          winReason = "Superioridade de Vantagens";
        } else if (room.player2.advantages > room.player1.advantages) {
          winnerId = room.player2.id;
          winnerName = room.player2.name;
          winReason = "Superioridade de Vantagens";
        } else {
          winnerId = 'draw';
          winnerName = 'Empate Técnico';
          winReason = 'Empate técnico na pontuação e vantagens';
        }
      }
    }

    // ELO and XP payouts
    let p1EloDiff = 0;
    let p2EloDiff = 0;
    let p1XpGain = 0;
    let p2XpGain = 0;

    if (winnerId === 'draw') {
      p1EloDiff = +5;
      p2EloDiff = +5;
      p1XpGain = 50;
      p2XpGain = 50;
    } else if (winnerId === room.player1.id) {
      p1EloDiff = +25;
      p2EloDiff = -12;
      p1XpGain = 100;
      p2XpGain = 25;
    } else {
      p1EloDiff = -12;
      p2EloDiff = +25;
      p1XpGain = 25;
      p2XpGain = 100;
    }

    // Gravamos no DB se player1 é humano (não bot)
    if (!room.player1.isBot) {
      dbStore.updatePvpRanking(room.player1.id, p1EloDiff, winnerId === room.player1.id);
      
      const user1 = dbStore.getUserById(room.player1.id);
      if (user1) {
        // synchronize XP increment matches standard system
        dbStore.updateUser(room.player1.id, { xp: user1.xp + p1XpGain });
      }
    }

    // Gravamos no DB se player2 é humano (não bot)
    if (!room.player2.isBot) {
      dbStore.updatePvpRanking(room.player2.id, p2EloDiff, winnerId === room.player2.id);
      
      const user2 = dbStore.getUserById(room.player2.id);
      if (user2) {
        dbStore.updateUser(room.player2.id, { xp: user2.xp + p2XpGain });
      }
    }

    // Create a database historical MATCH MATCHES row as requested!
    dbStore.addMatch({
      player_one: room.player1.id,
      player_two: room.player2.id,
      player_one_name: room.player1.name,
      player_two_name: room.player2.name,
      player_one_belt: room.player1.belt,
      player_two_belt: room.player2.belt,
      player_one_image: room.player1.image,
      player_two_image: room.player2.image,
      winner: winnerId === room.player1.id ? 'player_one' : winnerId === room.player2.id ? 'player_two' : 'draw',
      xp_gained: p1XpGain
    });

    const isMatchDraw = winnerId === 'draw';
    const isP1Win = winnerId === room.player1.id;
    const isP2Win = winnerId === room.player2.id;

    // Send the detailed match summary
    const finalPayload = {
      winnerId,
      winnerName,
      winReason,
      player1: {
        id: room.player1.id,
        score: room.player1.score,
        advantages: room.player1.advantages,
        stamina: room.player1.stamina,
        eloDiff: p1EloDiff,
        xpGained: p1XpGain,
        newElo: dbStore.getRankingByUserId(room.player1.id).elo
      },
      player2: {
        id: room.player2.id,
        score: room.player2.score,
        advantages: room.player2.advantages,
        stamina: room.player2.stamina,
        eloDiff: p2EloDiff,
        xpGained: p2XpGain,
        newElo: room.player2.isBot ? 1150 : dbStore.getRankingByUserId(room.player2.id).elo
      }
    };

    if (room.player1.socketId) io.to(room.player1.socketId).emit('match_finished', finalPayload);
    if (room.player2.socketId) io.to(room.player2.socketId).emit('match_finished', finalPayload);

    // Clean up memory maps
    playerInRoom.delete(room.player1.id);
    playerInRoom.delete(room.player2.id);
    activeRooms.delete(roomId);

    console.log(`[PVP Combate] Luta finalizada! Vencedor: ${winnerName}. Razão: ${winReason}`);
  }

  function handlePlayerAbandonment(roomId: string, abandonedUserId: string) {
    const room = activeRooms.get(roomId);
    if (!room || room.status === 'finished') return;

    if (room.timerInterval) clearInterval(room.timerInterval);
    room.status = 'finished';

    const op = room.player1.id === abandonedUserId ? room.player2 : room.player1;
    const loser = room.player1.id === abandonedUserId ? room.player1 : room.player2;

    const opEloDiff = +25;
    const loserEloDiff = -15;
    const opXp = 100;
    const loserXp = 10;

    // Save rankings
    if (!op.isBot) {
      dbStore.updatePvpRanking(op.id, opEloDiff, true);
      const user = dbStore.getUserById(op.id);
      if (user) dbStore.updateUser(op.id, { xp: user.xp + opXp });
    }

    if (!loser.isBot) {
      dbStore.updatePvpRanking(loser.id, loserEloDiff, false);
      const user = dbStore.getUserById(loser.id);
      if (user) dbStore.updateUser(loser.id, { xp: Math.max(0, user.xp + loserXp) });
    }

    // Store match record
    dbStore.addMatch({
      player_one: room.player1.id,
      player_two: room.player2.id,
      player_one_name: room.player1.name,
      player_two_name: room.player2.name,
      player_one_belt: room.player1.belt,
      player_two_belt: room.player2.belt,
      player_one_image: room.player1.image,
      player_two_image: room.player2.image,
      winner: op.id === room.player1.id ? 'player_one' : 'player_two',
      xp_gained: opXp
    });

    const finishPayload = {
      winnerId: op.id,
      winnerName: op.name,
      winReason: "Desistência / Abandono do Oponente (W.O.)",
      player1: {
        id: room.player1.id,
        score: room.player1.score,
        advantages: room.player1.advantages,
        stamina: room.player1.stamina,
        eloDiff: room.player1.id === abandonedUserId ? loserEloDiff : opEloDiff,
        xpGained: room.player1.id === abandonedUserId ? loserXp : opXp,
        newElo: dbStore.getRankingByUserId(room.player1.id).elo
      },
      player2: {
        id: room.player2.id,
        score: room.player2.score,
        advantages: room.player2.advantages,
        stamina: room.player2.stamina,
        eloDiff: room.player2.id === abandonedUserId ? loserEloDiff : opEloDiff,
        xpGained: room.player2.id === abandonedUserId ? loserXp : opXp,
        newElo: room.player2.isBot ? 1150 : dbStore.getRankingByUserId(room.player2.id).elo
      }
    };

    if (op.socketId) {
      io.to(op.socketId).emit('match_finished', finishPayload);
    }

    playerInRoom.delete(room.player1.id);
    playerInRoom.delete(room.player2.id);
    activeRooms.delete(roomId);

    console.log(`[PVP Combate] Abandono registrado! ${loser.name} abandonou. Vencedor W.O.: ${op.name}`);
  }
}
