import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  BookOpen, 
  Sword, 
  Crown, 
  Award, 
  User, 
  ChevronRight, 
  Flame, 
  Trophy, 
  Plus, 
  CheckCircle, 
  Play, 
  ChevronDown, 
  Sparkles, 
  LogOut, 
  Lock, 
  Check, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  GraduationCap,
  Volume2,
  Users,
  ShoppingBag
} from 'lucide-react';
import { Lesson, DailyChallenge, LeaderboardUser } from '../types';
import { useAuth } from './AuthContext';
import SocialHub from './SocialHub';
import VirtualStore from './VirtualStore';
import FinanceAdminDashboard from './FinanceAdminDashboard';

// Let's import the user-generated assets
const CHAMPIONSHIP_BELT_URL = "/src/assets/images/bjj_championship_belt_1779667876346.png";

const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'l1',
    title: 'Referee Commands: Combative English',
    description: 'Aprenda os comandos cruciais de arbitragem internacional: "Fight", "Stop", "Don\'t stall" e pontuações.',
    xpReward: 150,
    duration: '8 min',
    completed: true,
    category: 'Ref-Commands',
    level: 'White Belt',
    terms: [
      {
        english: 'Fight!',
        translation: 'Lutem! / Comecem!',
        ipa: '/faɪt/',
        example: 'The referee centered both athletes and shouted: "Fight!"',
        exampleTranslation: 'O árbitro centralizou ambos os atletas e gritou: "Lutem!"',
        context: 'Usado para mandar os atletas iniciarem o combate ou reiniciarem após uma interrupção técnica.'
      },
      {
        english: 'Stop!',
        translation: 'Parem!',
        ipa: '/stɒp/',
        example: 'When competitors rolled out of bounds, the referee blew the whistle and called "Stop!"',
        exampleTranslation: 'Quando os competidores rolaram fora da área de luta, o árbitro apitou e gritou "Parem!"',
        context: 'Usado para interromper o rola ou luta imediatamente. Qualquer ataque após o "Stop" incorre em desclassificação.'
      },
      {
        english: "Don't stall",
        translation: 'Não amarre / Trabalhe para progredir',
        ipa: '/dəʊnt stɔːl/',
        example: 'The referee warned: "Don\'t stall! You must open your guard and look to advance."',
        exampleTranslation: 'O árbitro advertiu: "Não amarre! Você deve abrir sua guarda e tentar avançar."',
        context: 'Grito técnico dado para penalizar a falta de combatividade ativa (stalling) no combate.'
      }
    ]
  },
  {
    id: 'l2',
    title: 'Essential Mat Slang: "Tap Out" & "Sweep"',
    description: 'Explore os termos diários dos dojos internacionais: como bater em desistência e raspar da guarda fechada.',
    xpReward: 200,
    duration: '10 min',
    completed: false,
    category: 'Basics',
    level: 'White Belt',
    terms: [
      {
        english: 'Tap out',
        translation: 'Bater / Desistir',
        ipa: '/tæp aʊt/',
        example: 'His collar choke was too tight, so I had to tap out immediately.',
        exampleTranslation: 'O estrangulamento de gola dele estava muito justo, então eu precisei bater imediatamente.',
        context: 'O ato físico (três tapinhas leves) ou verbal (gritar "Tap") para sinalizar desistência e garantir segurança.'
      },
      {
        english: 'Sweep',
        translation: 'Raspagem / Raspar',
        ipa: '/swiːp/',
        example: 'She secured the arm and executed a beautiful scissor sweep for two points.',
        exampleTranslation: 'Ela dominou o braço e executou uma bela raspagem de tesoura para marcar dois pontos.',
        context: 'Inversão em que o atleta que está por baixo (fazendo guarda) consegue subir e manter o controle superior.'
      },
      {
        english: 'BJJ Mat',
        translation: 'Tatame de BJJ',
        ipa: '/biː-dʒeɪ-dʒeɪ mæt/',
        example: 'Always step onto the BJJ mat barefoot and bow as a sign of respect.',
        exampleTranslation: 'Sempre pise no tatame de BJJ descalço e faça uma reverência como sinal de respeito.',
        context: 'A área de treinamento acolchoada oficial do dojo. Espaço considerado sagrado nas artes marciais.'
      }
    ]
  },
  {
    id: 'l3',
    title: 'Defensive vocabulary: Escapes & Sprawl',
    description: 'Como resistir à pressão e reverter ataques usando termos como "Sprawl", "Escape" e "Bridge".',
    xpReward: 250,
    duration: '12 min',
    completed: false,
    category: 'Defense',
    level: 'White Belt',
    terms: [
      {
        english: 'Sprawl',
        translation: 'Espalhar / Defender queda',
        ipa: '/sprɔːl/',
        example: 'His defensive sprawl was so heavy that my double leg attack failed.',
        exampleTranslation: 'A defesa de espalho dele foi tão pesada que meu ataque de queda double leg falhou.',
        context: 'Chutar as duas pernas para trás e pesar o quadril no ombro do oponente para anular quedas nas pernas.'
      },
      {
        english: 'Escape',
        translation: 'Fuga / Saída técnica',
        ipa: '/ɪˈskeɪp/',
        example: 'Focus on your hip escape to recreate full guard against side control.',
        exampleTranslation: 'Foque na sua fuga de quadril para repor a guarda fechada contra o controle lateral (cem quilos).',
        context: 'Movimento técnico para sair de uma posição de desvantagem (cem quilos, montada, costas) para uma neutra.'
      },
      {
        english: 'Bridge',
        translation: 'Ponte / Barrigada',
        ipa: '/brɪdʒ/',
        example: 'Use an explosive bridge to off-balance the opponent mounted on you.',
        exampleTranslation: 'Use uma ponte explosiva para desequilibrar o oponente montado em você.',
        context: 'Elevação rápida de quadril usando os pés apoiados no chão. Base de todas as saídas de montada.'
      }
    ]
  },
  {
    id: 'l4',
    title: 'Attacking Sequences: Submissions Nomenclature',
    description: 'Domine a nomenclatura das finalizações: "Rear Naked Choke", "Armbar" e "Guillotine".',
    xpReward: 300,
    duration: '15 min',
    completed: false,
    category: 'Attacking',
    level: 'Blue Belt',
    terms: [
      {
        english: 'Rear Naked Choke (RNC)',
        translation: 'Mata-Leão',
        ipa: '/rɪə ˈneɪ.kɪd tʃəʊk/',
        example: 'He sank a deep rear naked choke and secured his victory via submission.',
        exampleTranslation: 'Ele encaixou um mata-leão profundo e garantiu sua vitória por finalização.',
        context: 'O clássico estrangulamento aplicado pelas costas usando os próprios braços, sem pegada em quimono.'
      },
      {
        english: 'Armbar',
        translation: 'Chave de braço / Armlock',
        ipa: '/ˈɑːm.bɑːr/',
        example: 'She transitioned smoothly from mount to a straight armbar.',
        exampleTranslation: 'Ela transitou suavemente da posição montada para uma chave de braço reta.',
        context: 'Chave articular que estica completamente o braço do oponente, hiperestendendo a articulação do cotovelo.'
      },
      {
        english: 'Guillotine',
        translation: 'Guilhotina',
        ipa: '/ˈɡɪl.ə.tiːn/',
        example: 'Don\'t leave your neck exposed! He is setting up a tight guillotine.',
        exampleTranslation: 'Não deixe seu pescoço exposto! Ele está preparando uma guilhotina justa.',
        context: 'Estrangulamento frontal que envolve o pescoço do adversário sob a axila.'
      }
    ]
  },
  {
    id: 'l5',
    title: 'Advanced Sweep Protocols: Delariva & X-Guard',
    description: 'Aprofunde-se no jogo estratégico refinado e pegadas sob o corpo com "Underhook", "Hooks" e "X-Guard".',
    xpReward: 350,
    duration: '18 min',
    completed: false,
    category: 'Basics',
    level: 'Blue Belt',
    terms: [
      {
        english: 'Underhook',
        translation: 'Esgrima de braço/perna',
        ipa: '/ˈʌn.də.hʊk/',
        example: 'You must secure the underhook first in order to take their back.',
        exampleTranslation: 'Você deve garantir a esgrima primeiro para conseguir ir para as costas deles.',
        context: 'Passar o braço por baixo do braço ou perna do oponente, ganhando controle total e alavanca pivotante.'
      },
      {
        english: 'Butterfly hooks',
        translation: 'Ganchos de borboleta',
        ipa: '/ˈbʌt.ə.flaɪ hʊks/',
        example: 'Insert your butterfly hooks to lift their hips and complete the sweep.',
        exampleTranslation: 'Insira seus ganchos de borboleta para elevar o quadril deles e completar a raspagem.',
        context: 'Uso técnico dos peitos do pé por dentro das pernas do oponente para controlá-lo a partir de baixo.'
      },
      {
        english: 'X-Guard',
        translation: 'Guarda X',
        ipa: '/eks-ɡɑːd/',
        example: 'He entered the X-guard and put his opponent off balance with a leg sweep.',
        exampleTranslation: 'Ele entrou na guarda X e desequilibrou seu oponente com uma raspagem de perna.',
        context: 'Uma guarda aberta altamente ofensiva onde as pernas do guardeiro formam uma presilha "X" sob a coxa do oponente.'
      }
    ]
  }
];

const INITIAL_CHALLENGES: DailyChallenge[] = [
  {
    id: 'c1',
    task: 'Concluir 1 Rola Verbal de Pronúncia',
    xpReward: 100,
    completed: false,
    progress: 0,
    target: 1
  },
  {
    id: 'c2',
    task: 'Treinar 10 termos técnicos no Dicionário',
    xpReward: 150,
    completed: false,
    progress: 4,
    target: 10
  },
  {
    id: 'c3',
    task: 'Vencer 1 sparring na Arena PvP',
    xpReward: 200,
    completed: false,
    progress: 0,
    target: 1
  }
];

interface StudentDashboardProps {
  onBackToHome: () => void;
  // Sub-components can be rendered here directly
  AIPronunciationComponent: React.ComponentType;
  MatSlangComponent: React.ComponentType;
  PvPArenaComponent: React.ComponentType;
  GlobalRankingComponent: React.ComponentType;
  CertificatesComponent: React.ComponentType;
}

export default function StudentDashboard({ 
  onBackToHome,
  AIPronunciationComponent: AIPronunciation,
  MatSlangComponent: MatSlang,
  PvPArenaComponent: PvPArena,
  GlobalRankingComponent: GlobalRanking,
  CertificatesComponent: Certificates
}: StudentDashboardProps) {
  
  const { user, updateUserProfile, logout: authLogout } = useAuth();

  // Dashboard & State management
  const [activeTab, setActiveTab] = useState<'home' | 'lessons' | 'pvp' | 'ranking' | 'certificates' | 'profile' | 'social' | 'store' | 'finance'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [xp, setXp] = useState(3450);
  const [streak, setStreak] = useState(5);
  const [streakClaimed, setStreakClaimed] = useState(false);
  
  // Profile edit states
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editProfileImage, setEditProfileImage] = useState('');
  const [editBiography, setEditBiography] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editLanguage, setEditLanguage] = useState('pt');
  const [editTheme, setEditTheme] = useState('dark');
  const [editPrivacy, setEditPrivacy] = useState('public');
  const [editPassword, setEditPassword] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editStatusMsg, setEditStatusMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync state when user changes
  useEffect(() => {
    if (user) {
      setXp(user.xp);
      setStreak(user.streak);
      setEditFirstName(user.first_name || '');
      setEditLastName(user.last_name || '');
      setEditPhone(user.phone || '');
      setEditAddress(user.address || '');
      setEditProfileImage(user.profile_image || '');
      setEditBiography(user.biography || '');
      setEditInstagram(user.social_instagram || '');
      setEditTwitter(user.social_twitter || '');
      setEditLanguage(user.language || 'pt');
      setEditTheme(user.theme_visual || 'dark');
      setEditPrivacy(user.privacy_profile || 'public');
      setEditUsername(user.username || '');
      setEditPassword('');
    }
  }, [user]);

  // Sub-level values
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [challenges, setChallenges] = useState<DailyChallenge[]>(INITIAL_CHALLENGES);
  
  // Interactive lesson modal/overlay
  const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState<Lesson | null>(null);
  const [lessonPhase, setLessonPhase] = useState<'study' | 'quiz' | 'result'>('study');
  const [studyTermIndex, setStudyTermIndex] = useState(0);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [floatingXp, setFloatingXp] = useState<{ id: number; amount: number; x: number; y: number }[]>([]);
  const [xpCounter, setXpCounter] = useState(0); // tracker for floating items

  // Persistent storage loaders
  useEffect(() => {
    const cachedXp = localStorage.getItem('jiuspeak_xp');
    if (cachedXp) setXp(Number(cachedXp));

    const cachedStreak = localStorage.getItem('jiuspeak_streak');
    if (cachedStreak) setStreak(Number(cachedStreak));

    const cachedStreakClaimed = localStorage.getItem('jiuspeak_streak_claimed');
    if (cachedStreakClaimed) setStreakClaimed(cachedStreakClaimed === 'true');

    const cachedLessons = localStorage.getItem('jiuspeak_lessons');
    if (cachedLessons) {
      try {
        setLessons(JSON.parse(cachedLessons));
      } catch (e) {
        console.log("No stored lessons to parse");
      }
    }

    const cachedChallenges = localStorage.getItem('jiuspeak_challenges');
    if (cachedChallenges) {
      try {
        setChallenges(JSON.parse(cachedChallenges));
      } catch (e) {
        console.log("No stored challenges to parse");
      }
    }
  }, []);

  // Persistent storage savers
  useEffect(() => {
    if (xp !== 3450) {
      localStorage.setItem('jiuspeak_xp', xp.toString());
    }
  }, [xp]);

  useEffect(() => {
    if (streak !== 5) {
      localStorage.setItem('jiuspeak_streak', streak.toString());
    }
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('jiuspeak_streak_claimed', streakClaimed.toString());
  }, [streakClaimed]);

  useEffect(() => {
    if (lessons !== INITIAL_LESSONS) {
      localStorage.setItem('jiuspeak_lessons', JSON.stringify(lessons));
    }
  }, [lessons]);

  useEffect(() => {
    if (challenges !== INITIAL_CHALLENGES) {
      localStorage.setItem('jiuspeak_challenges', JSON.stringify(challenges));
    }
  }, [challenges]);

  // Belt thresholds helper
  const getBeltInfo = (currentXp: number) => {
    if (currentXp >= 10000) return { name: "Faixa Preta (Black Belt)", next: "Grau Lendário", limit: 20000, minXp: 10000, percent: 100, color: "border-neutral-700 bg-neutral-900 text-stone-100" };
    if (currentXp >= 7500) return { name: "Faixa Marrom (Brown Belt)", next: "Faixa Preta", limit: 10000, minXp: 7500, percent: Math.floor(((currentXp - 7500) / 2500) * 100), color: "border-amber-700 bg-amber-950 text-amber-200" };
    if (currentXp >= 5000) return { name: "Faixa Roxa (Purple Belt)", next: "Faixa Marrom", limit: 7500, minXp: 5000, percent: Math.floor(((currentXp - 5000) / 2500) * 100), color: "border-purple-600 bg-purple-950 text-purple-200" };
    if (currentXp >= 3000) return { name: "Faixa Azul (Blue Belt)", next: "Faixa Roxa", limit: 5000, minXp: 3000, percent: Math.floor(((currentXp - 3000) / 2000) * 100), color: "border-blue-600 bg-[#0c1a30] text-blue-200 animate-pulse-subtle" };
    return { name: "Faixa Branca (White Belt)", next: "Faixa Azul", limit: 3000, minXp: 0, percent: Math.floor((currentXp / 3000) * 100), color: "border-neutral-800 bg-neutral-900 text-neutral-300" };
  };

  const belt = getBeltInfo(xp);

  // Trigger floating XP effect
  const awardXp = (amount: number, e?: React.MouseEvent) => {
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY : window.innerHeight / 2;
    
    setXp(prev => {
      const nextXp = prev + amount;
      localStorage.setItem('jiuspeak_xp', nextXp.toString());
      updateUserProfile({ xp: nextXp });
      return nextXp;
    });
    
    const newId = xpCounter + 1;
    setXpCounter(newId);
    setFloatingXp(prev => [...prev, { id: newId, amount, x, y }]);
    
    setTimeout(() => {
      setFloatingXp(prev => prev.filter(item => item.id !== newId));
    }, 2000);
  };

  // Complete a challenge manually via click
  const completeChallenge = (challengeId: string, e: React.MouseEvent) => {
    const target = challenges.find(ch => ch.id === challengeId);
    if (target && !target.completed) {
      awardXp(target.xpReward, e);
      setChallenges(prev => prev.map(ch => {
        if (ch.id === challengeId) {
          return { ...ch, completed: true, progress: ch.target };
        }
        return ch;
      }));
    }
  };

  // Voice Pronunciation Synthesis engine
  const speakTerm = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[^a-zA-Z\s!\?,]/g, ''); // strip IPA symbols or punctuation for speech
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; // beautiful understandable pace
      
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.startsWith('en'));
      if (enVoice) {
        utterance.voice = enVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Lesson mini study engine questions
  const MOCK_LESSON_QUIZZES: { [key: string]: { question: string; options: string[]; correctIdx: number; explanation: string }[] } = {
    'l1': [
      {
        question: 'Qual comando o árbitro internacional de Jiu-Jítsu utiliza para dar início ou reiniciar a luta?',
        options: [
          'Stop!',
          'Fight! (Combat!)',
          'Don\'t stall!',
          'Start!'
        ],
        correctIdx: 1,
        explanation: 'O comando "Fight!" é a instrução mandatória do árbitro internacional para dar início ou reiniciar o combate após paralisação.'
      },
      {
        question: 'Se o juiz disser "Don\'t stall!", qual a atitude esperada de você?',
        options: [
          'Bater no tatame desistindo do combate.',
          'Passar a esgrima para bloquear a passagem de guarda.',
          'Buscar combatividade e progredir posição (evitar amarrar).',
          'Interromper a luta imediatamente.'
        ],
        correctIdx: 2,
        explanation: '"Stalling" refere-se à falta de combatividade ativa. "Don\'t stall" quer dizer "Não amarre!".'
      }
    ],
    'l2': [
      {
        question: 'O que a expressão suprema "Tap out" representa no tatame internacional?',
        options: [
          'Executar uma raspagem agressiva por cima.',
          'O ato de bater em desistência (verbal ou físico) para manter sua integridade física.',
          'Apertar a faixa do quimono entre os rounds.',
          'Fazer um movimento de giro para pegar o ombro.'
        ],
        correctIdx: 1,
        explanation: '"Tap out" (bater) é a desistência formal para interromper uma chave ou estrangulamento perigoso de forma segura.'
      },
      {
        question: 'Se o seu técnico grita para você "Sweep! Sweep!", o que ele deseja que você execute?',
        options: [
          'Defenda um ataque de pernas esparramando o quadril.',
          'Consiga uma finalização rápida de estrangulamento.',
          'Inverta a luta saindo de baixo (guardeiro) para cima no controle por 2 pontos (raspagem).',
          'Fuga técnica de cotovelo saindo do controle lateral.'
        ],
        correctIdx: 2,
        explanation: 'O termo "Sweep" representa a famosa raspagem de guarda.'
      }
    ],
    'l3': [
      {
        question: 'Quando um oponente avança nas suas pernas para uma derrubada e você decide mimetizar um "Sprawl", o que se deve fazer?',
        options: [
          'Chutar as pernas para trás e esparramar o peso do seu quadril sobre as costas do oponente.',
          'Subir o quadril com as pernas apoiadas no tatame fazendo uma ponte.',
          'Dar as costas facilitando a pegada de cinto.',
          'Aceitar a queda recolhendo-se em meia-guarda.'
        ],
        correctIdx: 0,
        explanation: 'O "Sprawl" é o espatifado defensivo essencial contra ataques de queda às pernas como double ou single leg.'
      },
      {
        question: 'Para decolar o oponente montado através de um impulso violento de quadril empurrando os calcanhares no tatame, você usa o movimento chamado:',
        options: [
          'Sprawl',
          'Escape',
          'Bridge (Ponte)',
          'Underhook'
        ],
        correctIdx: 2,
        explanation: 'A ponte ou "Bridge" (barrigada) projeta seu quadril para desequilibrar a montada e abrir caminho para a fuga.'
      }
    ],
    'l4': [
      {
        question: 'Qual o nome correto em inglês para o tradicional estrangulamento "Mata-Leão"?',
        options: [
          'Guillotine Choke',
          'Rear Naked Choke (RNC)',
          'Armbar Submission',
          'Underhook Lock'
        ],
        correctIdx: 1,
        explanation: 'Mata-Leão é traduzido mundialmente como "Rear Naked Choke", já que envolve estrangular pelas costas (Rear) sem auxílio de pano (Naked).'
      },
      {
        question: 'A finalização traumática que encaixa uma chave reta hiperextendendo a articulação do cotovelo é:',
        options: [
          'Guillotine',
          'Underhook',
          'Armbar',
          'Butterfly Sweep'
        ],
        correctIdx: 2,
        explanation: 'O "Armbar" é a clássica chave de braço reta (armlock).'
      }
    ],
    'l5': [
      {
        question: 'O termo "Underhook" designa qual recurso estratégico indispensável de domínio posicional e alavanca?',
        options: [
          'A esgrima de braço ou perna sob a axila ou articulação do adversário.',
          'O uso de pés como ganchos de elevação de guarda de borboleta.',
          'Esticar as pernas cruzando o quadril sob forma de X.',
          'Derrubar com gancho calcanhar por fora.'
        ],
        correctIdx: 0,
        explanation: 'O "Underhook" é a nossa esgrima técnica, usada para dominar posições ou preparar passagens e raspagens de meia-guarda.'
      },
      {
        question: 'A "X-Guard" é uma guarda aberta muito ativa. Nela, onde suas pernas se posicionam?',
        options: [
          'Atrás do pescoço em pegada dupla de gola.',
          'Formando um fechamento cruzado semelhante a um "X" em volta da coxa do adversário em pé.',
          'No quadril agindo sob formato de borboleta debaixo dos glúteos.',
          'Enroscando o dedão do pé na lapela aberta.'
        ],
        correctIdx: 1,
        explanation: 'Na guarda X ("X-Guard"), as duas pernas do atleta de baixo formam pegadas em "X" e gancho controlando a coxa e equilíbrio do adversário.'
      }
    ]
  };

  const handleStartLesson = (lesson: Lesson) => {
    setSelectedLessonForQuiz(lesson);
    setLessonPhase('study');
    setStudyTermIndex(0);
    setQuizStep(0);
    setSelectedAnswer(null);
    setQuizChecked(false);
    setIsCorrectAnswer(false);
    setQuizAnswers([]);
    setQuizScore(null);
    
    // Auto voice output for the first term
    if (lesson.terms && lesson.terms[0]) {
      setTimeout(() => speakTerm(lesson.terms![0].english), 350);
    }
  };

  const handleNextStudyTerm = () => {
    if (!selectedLessonForQuiz || !selectedLessonForQuiz.terms) return;
    
    if (studyTermIndex + 1 < selectedLessonForQuiz.terms.length) {
      const nextIdx = studyTermIndex + 1;
      setStudyTermIndex(nextIdx);
      setTimeout(() => speakTerm(selectedLessonForQuiz.terms![nextIdx].english), 300);
    } else {
      // Transition directly to active quiz check!
      setLessonPhase('quiz');
      setQuizStep(0);
      setSelectedAnswer(null);
      setQuizChecked(false);
      setIsCorrectAnswer(false);
    }
  };

  const handleSelectAnswer = (idx: number) => {
    if (quizChecked) return; // ignore selection after verified
    setSelectedAnswer(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null || !selectedLessonForQuiz) return;
    
    const quizSet = MOCK_LESSON_QUIZZES[selectedLessonForQuiz.id] || MOCK_LESSON_QUIZZES['l1'];
    const currentQuestion = quizSet[quizStep];
    const isCorrect = selectedAnswer === currentQuestion.correctIdx;
    
    setIsCorrectAnswer(isCorrect);
    setQuizChecked(true);
    
    // Register this response
    setQuizAnswers(prev => [...prev, isCorrect ? 'correct' : 'incorrect']);
  };

  const handleNextQuizQuestion = () => {
    if (!selectedLessonForQuiz) return;
    
    const quizSet = MOCK_LESSON_QUIZZES[selectedLessonForQuiz.id] || MOCK_LESSON_QUIZZES['l1'];
    
    // reset selection flags
    setQuizChecked(false);
    setSelectedAnswer(null);
    
    if (quizStep + 1 < quizSet.length) {
      setQuizStep(prev => prev + 1);
    } else {
      // Evaluate totals from answers
      const correctsCount = quizAnswers.filter(a => a === 'correct').length;
      const scorePercent = Math.round((correctsCount / quizSet.length) * 100);
      setQuizScore(scorePercent);
      setLessonPhase('result');
      
      // Award Lesson XP
      if (scorePercent >= 50) {
        awardXp(selectedLessonForQuiz.xpReward);
        
        // Update lesson status in state
        setLessons(prev => prev.map(l => {
          if (l.id === selectedLessonForQuiz.id) {
            return { ...l, completed: true };
          }
          return l;
        }));

        // Dynamically increment challenge progress
        setChallenges(prev => prev.map(ch => {
          if (ch.id === 'c2') {
            const nextProg = Math.min(ch.progress + 2, ch.target);
            return { ...ch, progress: nextProg, completed: nextProg >= ch.target };
          }
          return ch;
        }));
      }
    }
  };

  const closeQuizModal = () => {
    setSelectedLessonForQuiz(null);
    setLessonPhase('study');
    setStudyTermIndex(0);
    setQuizStep(0);
    setQuizAnswers([]);
    setSelectedAnswer(null);
    setQuizChecked(false);
    setIsCorrectAnswer(false);
    setQuizScore(null);
  };

  const handleStreakClaim = (e: React.MouseEvent) => {
    if (!streakClaimed) {
      setStreak(prev => prev + 1);
      awardXp(120, e);
      setStreakClaimed(true);
      // Increment progress for pronunciation challenge as well
      setChallenges(prev => prev.map(ch => {
        if (ch.id === 'c1') {
          return { ...ch, progress: 1, completed: true };
        }
        return ch;
      }));
    }
  };

  // Find next learning target
  const nextLesson = lessons.find(l => !l.completed) || lessons[lessons.length - 1];

  return (
    <div className="min-h-screen bg-[#030303] text-stone-100 flex flex-col md:flex-row font-sans selection:bg-red-650 selection:text-white relative">
      
      {/* Absolute floating XP effects renderer */}
      <AnimatePresence>
        {floatingXp.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: item.y - 20, x: item.x }}
            animate={{ opacity: 0, y: item.y - 120, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none z-50 font-mono font-black text-amber-500 text-lg flex items-center gap-1.5 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]"
          >
            <Sparkles className="w-5 h-5 fill-current" />
            <span>+{item.amount} XP</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* --- RESPONSIVE SIDEBAR --- */}
      <aside className="w-full md:w-64 bg-neutral-950 border-r border-neutral-900 flex flex-col justify-between shrink-0 md:h-screen md:sticky md:top-0 z-40">
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-neutral-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-red-650 flex items-center justify-center font-black text-white italic tracking-tighter text-sm border border-neutral-950">
                JS
              </span>
              <div>
                <h1 className="text-base font-extrabold text-white tracking-tight italic">
                  JIUSPEAK
                </h1>
                <span className="text-[10px] font-mono text-neutral-500 font-bold block -mt-1 uppercase tracking-widest">
                  PORTAL DO ALUNO
                </span>
              </div>
            </div>
            
            {/* Mobile menu trigger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden border border-neutral-800 p-1.5 rounded-lg hover:bg-neutral-900 transition"
              aria-label="Toggle menu"
            >
              <ChevronDown className={`w-4 h-4 transform transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation Links (responsive collapsible) */}
          <nav className={`p-4 space-y-1.5 ${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
            
            <button
              onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
              className={`w-full text-left py-3 px-3.5 rounded-xl font-medium text-xs font-mono uppercase tracking-wider flex items-center gap-3 transition-all ${
                activeTab === 'home'
                  ? 'bg-gradient-to-r from-red-650/15 via-red-950/20 to-transparent text-red-500 border-l-2 border-red-600 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-red-500' : 'text-neutral-400'}`} />
              <span>Dojo Início (Home)</span>
            </button>

            <button
              onClick={() => { setActiveTab('lessons'); setMobileMenuOpen(false); }}
              className={`w-full text-left py-3 px-3.5 rounded-xl font-medium text-xs font-mono uppercase tracking-wider flex items-center gap-3 transition-all ${
                activeTab === 'lessons'
                  ? 'bg-gradient-to-r from-red-650/15 via-red-950/20 to-transparent text-red-500 border-l-2 border-red-600 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'lessons' ? 'text-red-500' : 'text-neutral-400'}`} />
              <span>Aulas de Luta</span>
            </button>

            <button
              onClick={() => { setActiveTab('pvp'); setMobileMenuOpen(false); }}
              className={`w-full text-left py-3 px-3.5 rounded-xl font-medium text-xs font-mono uppercase tracking-wider flex items-center gap-3 transition-all ${
                activeTab === 'pvp'
                  ? 'bg-gradient-to-r from-red-650/15 via-red-950/20 to-transparent text-red-500 border-l-2 border-red-600 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              <Sword className={`w-4 h-4 ${activeTab === 'pvp' ? 'text-red-500' : 'text-neutral-400'}`} />
              <span>Arena PvP</span>
              <span className="ml-auto bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-sans font-black px-1.5 py-0.5 rounded uppercase">
                Ao Vivo
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('ranking'); setMobileMenuOpen(false); }}
              className={`w-full text-left py-3 px-3.5 rounded-xl font-medium text-xs font-mono uppercase tracking-wider flex items-center gap-3 transition-all ${
                activeTab === 'ranking'
                  ? 'bg-gradient-to-r from-red-650/15 via-red-950/20 to-transparent text-red-500 border-l-2 border-red-600 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              <Crown className={`w-4 h-4 ${activeTab === 'ranking' ? 'text-red-500' : 'text-neutral-400'}`} />
              <span>Ranking Global</span>
            </button>

            <button
              onClick={() => { setActiveTab('certificates'); setMobileMenuOpen(false); }}
              className={`w-full text-left py-3 px-3.5 rounded-xl font-medium text-xs font-mono uppercase tracking-wider flex items-center gap-3 transition-all ${
                activeTab === 'certificates'
                  ? 'bg-gradient-to-r from-red-650/15 via-red-950/20 to-transparent text-red-500 border-l-2 border-red-600 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              <Award className={`w-4 h-4 ${activeTab === 'certificates' ? 'text-red-500' : 'text-neutral-400'}`} />
              <span>Certificados</span>
            </button>

            <button
              onClick={() => { setActiveTab('social'); setMobileMenuOpen(false); }}
              className={`w-full text-left py-3 px-3.5 rounded-xl font-medium text-xs font-mono uppercase tracking-wider flex items-center gap-3 relative transition-all ${
                activeTab === 'social'
                  ? 'bg-gradient-to-r from-red-650/15 via-red-950/20 to-transparent text-red-500 border-l-2 border-red-600 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'social' ? 'text-red-500' : 'text-neutral-400'}`} />
              <span>Rede Social & Feed</span>
              <span className="ml-auto bg-red-600 border border-red-500 text-white text-[7px] font-sans font-black px-1 py-0.5 rounded-full uppercase leading-none">
                Feed
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('store'); setMobileMenuOpen(false); }}
              className={`w-full text-left py-3 px-3.5 rounded-xl font-medium text-xs font-mono uppercase tracking-wider flex items-center gap-3 relative transition-all ${
                activeTab === 'store'
                  ? 'bg-gradient-to-r from-red-650/15 via-red-950/20 to-transparent text-amber-500 border-l-2 border-amber-600 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              <ShoppingBag className={`w-4 h-4 ${activeTab === 'store' ? 'text-amber-500 animate-pulse' : 'text-neutral-400'}`} />
              <span>Loja Virtual</span>
              <span className="ml-auto bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[7px] font-sans font-black px-1.5 py-0.5 rounded uppercase leading-none">
                Loja 🪙
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
              className={`w-full text-left py-3 px-3.5 rounded-xl font-medium text-xs font-mono uppercase tracking-wider flex items-center gap-3 transition-all ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-red-650/15 via-red-950/20 to-transparent text-red-500 border-l-2 border-red-600 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-red-500' : 'text-neutral-400'}`} />
              <span>Perfil & Faixa</span>
            </button>

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => { setActiveTab('finance'); setMobileMenuOpen(false); }}
                className={`w-full text-left py-3 px-3.5 rounded-xl font-medium text-xs font-mono uppercase tracking-wider flex items-center gap-3 transition-all ${
                  activeTab === 'finance'
                    ? 'bg-gradient-to-r from-amber-500/15 via-amber-950/20 to-transparent text-amber-500 border-l-2 border-amber-600 font-bold shadow'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <TrendingUp className={`w-4 h-4 ${activeTab === 'finance' ? 'text-amber-500' : 'text-neutral-400'}`} />
                <span>Painel Financeiro Admin</span>
                <span className="ml-auto bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-sans font-black px-1.5 py-0.5 rounded uppercase leading-none animate-pulse">
                  SaaS 📊
                </span>
              </button>
            )}

          </nav>
        </div>

        {/* Sidebar Footer with leave toggle */}
        <div className="p-4 border-t border-neutral-900/80 bg-neutral-950 gap-4 flex flex-col">
          <div className="flex items-center gap-3 bg-[#0c0c0c] border border-neutral-900 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-black text-xs">
              M
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-stone-100 block truncate">Marcos 'Spider'</span>
              <span className="text-[10px] text-amber-500 block truncate font-mono uppercase">Faixa Azul 2ºg</span>
            </div>
          </div>

          <button
            onClick={onBackToHome}
            className="w-full py-2.5 px-3 border border-neutral-900 hover:border-neutral-850 hover:bg-neutral-900 text-neutral-400 hover:text-stone-100 text-[10px] font-mono uppercase tracking-widest font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-500" />
            <span>Voltar ao Site</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN INTERACTIVE WORKSPACE --- */}
      <main className="flex-1 bg-[#030303] flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        
        {/* TOP STATUS BAR (Dynamic HUD Header) */}
        <header className="sticky top-0 z-30 bg-[#030303]/90 backdrop-blur-md border-b border-neutral-900 py-3.5 px-6 flex items-center justify-between gap-4">
          
          {/* Active section Title indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-600 rounded-full" />
            <h2 className="text-sm font-extrabold tracking-wider text-white font-mono uppercase placeholder-opacity-70">
              {activeTab === 'home' && 'Dojo Dashboard Overview'}
              {activeTab === 'lessons' && 'Plano de Estudos / Aulas'}
              {activeTab === 'pvp' && 'Fisiologia PvP Arena'}
              {activeTab === 'ranking' && 'Arena Leaderboard'}
              {activeTab === 'certificates' && 'Digital Credentials'}
              {activeTab === 'social' && 'Rede Social & Social Hub'}
              {activeTab === 'profile' && 'Perfil do Guerreiro'}
              {activeTab === 'store' && 'Vitrine da Loja Virtual'}
              {activeTab === 'finance' && 'Painel Administrativo Financeiro / SaaS'}
            </h2>
          </div>

          {/* Core HUD stats metrics (Duolingo Header) */}
          <div className="flex items-center gap-3 md:gap-4 font-mono text-xs">
            
            {/* XP bar simplified look */}
            <div className="hidden lg:flex items-center gap-2.5 bg-[#090909] border border-neutral-900 px-3 py-1.5 rounded-xl">
              <span className="text-[10px] text-neutral-500 uppercase font-black">BELT:</span>
              <span className="font-bold text-stone-100">{belt.name}</span>
              <div className="w-16 bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-850">
                <div className="bg-gradient-to-r from-red-650 to-amber-500 h-full" style={{ width: `${belt.percent}%` }} />
              </div>
            </div>

            {/* Total XP with visual plus button */}
            <div className="flex items-center gap-1.5 bg-[#090909] border border-neutral-900 px-3 py-1.5 rounded-xl text-neutral-300">
              <span className="text-amber-500 text-xs font-bold font-mono">⚡ {xp}</span>
              <span className="text-[9px] text-neutral-500 uppercase font-black">XP</span>
            </div>

            {/* Flame streak */}
            <button 
              onClick={handleStreakClaim}
              disabled={streakClaimed}
              className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl transition-all ${
                streakClaimed 
                  ? 'bg-neutral-900/50 border-neutral-900/80 text-neutral-500' 
                  : 'bg-red-950/20 hover:bg-red-950/40 border-red-900/60 text-red-500 animate-pulse-slow'
              }`}
              title="Sua chama diária. Clique para herdar XP extra hoje!"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span className="font-bold">{streak}d</span>
            </button>

          </div>
        </header>

        {/* SCROLLABLE MAIN BODY RENDERER */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* --- VIEW: HOME (OVERVIEW) --- */}
          {activeTab === 'home' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="space-y-6"
            >
              {/* CONTINUAR APRENDIZADO BANNER (Ultimate Call To Action) */}
              <div className="bg-gradient-to-r from-red-900/40 via-neutral-900 to-neutral-950 border border-red-900/50 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="absolute top-0 right-0 p-10 bg-gradient-to-bl from-red-500/10 via-transparent to-transparent -mr-6 -mt-6 rounded-full blur-2xl" />
                
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-650 text-white font-mono font-black text-[9px] px-2 py-0.5 rounded tracking-widest uppercase animate-pulse">
                      RECOMENDADO
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">Próxima aula da grade de estudo</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-stone-100 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>{nextLesson.title}</span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {nextLesson.description}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-500 pt-1">
                    <span>🥋 Nível: {nextLesson.level}</span>
                    <span>⏱️ Duração: {nextLesson.duration}</span>
                    <span className="text-amber-500 font-bold">💎 Ganho: +{nextLesson.xpReward} XP</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleStartLesson(nextLesson)}
                    className="w-full md:w-auto py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition hover:scale-[1.03] shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                  >
                    <span>Continuar Aprendizado</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>

              {/* GRID WITH PROGRESS GAUGE & DAILY CHALLENGES */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* DOJO PROGRESS GAUGE (XP BAR & BELT) */}
                <div className="lg:col-span-4 bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-wider bg-[#0c1a30]/30 text-blue-400 border border-blue-900/40 px-2 py-0.5 rounded uppercase font-bold">
                      DOJO ROLA STATUS
                    </span>
                    
                    <div className="my-5 text-center">
                      <div className="w-16 h-16 rounded-full bg-neutral-900 border-2 border-dashed border-red-900/50 flex items-center justify-center text-3xl mx-auto shadow-inner">
                        🥋
                      </div>
                      <h4 className="text-base font-black text-stone-100 mt-2.5">{belt.name}</h4>
                      <p className="text-[10px] text-neutral-500 uppercase font-mono mt-0.5">Pontuação acumulada no tatame</p>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
                        <span>Progresso para {belt.next}</span>
                        <span className="text-stone-100">{belt.percent}%</span>
                      </div>
                      <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-850">
                        <div 
                          className="bg-gradient-to-r from-red-650 to-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${belt.percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 mt-4 border-t border-neutral-900/60 pt-3">
                      <span>Total: {xp} XP</span>
                      <span>{xp}/{belt.limit} XP</span>
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 bg-[#0a0a0a] border border-neutral-900/80 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-100">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>Estatísticas de Combate</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400">
                      <div className="bg-[#040404] p-2 rounded border border-neutral-950">
                        <span className="text-neutral-500 block">AULAS CONCLUÍDAS</span>
                        <span className="font-bold text-white text-xs">{lessons.filter(l => l.completed).length} de {lessons.length}</span>
                      </div>
                      <div className="bg-[#040404] p-2 rounded border border-neutral-950">
                        <span className="text-neutral-500 block">DESAFIOS HOJE</span>
                        <span className="font-bold text-white text-xs">{challenges.filter(ch => ch.completed).length} de {challenges.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DAILY CHALLENGES (DESAFIOS DIÁRIOS) */}
                <div className="lg:col-span-8 bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[10px] font-mono tracking-wider bg-red-950/20 text-red-500 border border-red-900/45 px-2.5 py-1 roundeduppercase font-bold">
                          TREINO DO DIA (CONVOCATÓRIA)
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5">Desafios Diários</h4>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">Reseta a cada 24 horas</span>
                    </div>

                    <div className="space-y-2.5">
                      {challenges.map(ch => (
                        <div 
                          key={ch.id}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all ${
                            ch.completed 
                              ? 'bg-neutral-900/40 border-neutral-850 text-neutral-500' 
                              : 'bg-[#090909] border-neutral-900 text-stone-200'
                          }`}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2.5">
                              {ch.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-neutral-800 shrink-0" />
                              )}
                              <span className={`text-xs font-bold ${ch.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                                {ch.task}
                              </span>
                            </div>
                            
                            {/* Linear progress metric */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${ch.completed ? 'bg-neutral-600' : 'bg-red-600'} transition-all`}
                                  style={{ width: `${(ch.progress / ch.target) * 100}%` }}
                                />
                              </div>
                              <span className="text-[9px] font-mono text-neutral-500 shrink-0">
                                {ch.progress}/{ch.target}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 justify-end shrink-0">
                            <span className={`text-[11px] font-mono font-bold ${ch.completed ? 'text-neutral-500' : 'text-amber-500'}`}>
                              +{ch.xpReward} XP
                            </span>
                            
                            {!ch.completed && (
                              <button
                                onClick={(e) => completeChallenge(ch.id, e)}
                                className="py-1 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-mono font-bold text-neutral-300 rounded uppercase"
                              >
                                Praticar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-500 font-mono italic text-center mt-4">
                    "O guerreiro herda o XP e a técnica mantendo os reflexos em dia."
                  </p>
                </div>

              </div>

              {/* RECENT LESSONS & MAT CLINICS */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h4 className="text-base font-bold text-white">Últimas Aulas Disponíveis</h4>
                    <p className="text-xs text-neutral-500">Módulos fundamentais regulamentados pelas maiores federações</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('lessons')} 
                    className="text-xs text-red-500 font-mono font-bold hover:underline"
                  >
                    Ver todas as aulas
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {lessons.slice(0, 3).map((l) => (
                    <div 
                      key={l.id} 
                      className={`p-4 rounded-xl border flex flex-col justify-between transition group ${
                        l.completed 
                          ? 'bg-neutral-900/40 border-neutral-900/80 hover:border-neutral-800' 
                          : 'bg-[#090909] border-neutral-900 hover:border-neutral-800'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start text-[10px] font-mono mb-2.5">
                          <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850 text-neutral-500">
                            {l.category}
                          </span>
                          {l.completed ? (
                            <span className="text-green-500 font-bold uppercase flex items-center gap-1">
                              <Check className="w-3 h-3" /> Concluída
                            </span>
                          ) : (
                            <span className="text-amber-500 font-bold uppercase">Disponível</span>
                          )}
                        </div>

                        <h5 className="text-xs font-bold text-stone-200 mt-1 line-clamp-1 group-hover:text-amber-500 transition-colors">
                          {l.title}
                        </h5>
                        <p className="text-[10px] text-neutral-400 mt-1 line-clamp-2">
                          {l.description}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-neutral-900/60 pt-3 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-neutral-500">⏱️ {l.duration}</span>
                        <button
                          onClick={() => handleStartLesson(l)}
                          className={`py-1 px-3 rounded uppercase text-[10px] font-bold ${
                            l.completed 
                              ? 'bg-neutral-900 hover:bg-neutral-850 text-neutral-400' 
                              : 'bg-red-650 hover:bg-red-700 text-white'
                          }`}
                        >
                          {l.completed ? 'Revisar' : 'Estudar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DIGITAL CERTIFICATES / BADGES UNLOCKED SNAPSHOT */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl p-2.5 bg-[#0a0a0a] border border-neutral-900 rounded-xl leading-none">
                    🏆
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Certificações Digitais JiuSpeak</h4>
                    <p className="text-xs text-neutral-500 max-w-lg mt-0.5">
                      Desbloqueie testes de banca avaliados por inteligência artificial para obter certificados digitais de proficiência linguística de tatame internacional.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('certificates')}
                    className="py-2.5 px-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-mono uppercase text-[10px] font-bold rounded-xl transition-all"
                  >
                    Ver Credenciais
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- VIEW: LESONS TRACK --- */}
          {activeTab === 'lessons' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-6"
            >
              {/* LESSONS HEADER */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-stone-100 uppercase italic">Combate Linguístico: Árvore de Aprendizado</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Avance nas aulas de Luta organizadas por nível para melhorar seu score e dominar gírias</p>
                  </div>
                  
                  {/* Category Filter indicators */}
                  <div className="flex flex-wrap gap-1.5 text-[9px] font-mono uppercase font-bold text-neutral-400">
                    <span className="p-1 px-2.5 bg-[#040404] border border-neutral-900 rounded text-red-400">Basics</span>
                    <span className="p-1 px-2.5 bg-[#040404] border border-neutral-900 rounded text-amber-500">Defense</span>
                    <span className="p-1 px-2.5 bg-[#040404] border border-neutral-900 rounded text-blue-400">Attacking</span>
                    <span className="p-1 px-2.5 bg-[#040404] border border-neutral-900 rounded text-purple-400">Ref-Commands</span>
                  </div>
                </div>
              </div>

              {/* CURRICULUM LAYOUT */}
              <div className="space-y-6">
                
                {/* SECTION 1: WHITE BELT FUNDAMENTALS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-11 h-1 bg-white rounded" />
                    <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">White Belt Fundamentals</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lessons.filter(l => l.level === 'White Belt').map(lesson => (
                      <div 
                        key={lesson.id} 
                        className={`p-4 rounded-xl border flex flex-col justify-between transition group ${
                          lesson.completed 
                            ? 'bg-neutral-900/40 border-neutral-900/80 hover:border-neutral-800' 
                            : 'bg-neutral-950 border-neutral-900 hover:border-neutral-800'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-red-400 font-bold uppercase">{lesson.category}</span>
                            {lesson.completed && (
                              <span className="text-green-500 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> CERTIFICADO XP
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-stone-200 group-hover:text-amber-500">
                            {lesson.title}
                          </h4>
                          <p className="text-xs text-neutral-400">
                            {lesson.description}
                          </p>
                        </div>

                        <div className="mt-5 border-t border-neutral-900/60 pt-3 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                          <span>⏱️ {lesson.duration}</span>
                          <span className="text-amber-500">💎 +{lesson.xpReward} XP</span>
                          
                          <button
                            onClick={() => handleStartLesson(lesson)}
                            className="py-1.5 px-3.5 bg-red-650 hover:bg-red-700 hover:scale-102 transition text-white text-[10px] font-bold rounded uppercase shrink-0"
                          >
                            {lesson.completed ? 'Revisar Rola' : 'Iniciar Aula'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 2: BLUE BELT ADVANCED PROTOCOLS */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="w-11 h-1 bg-blue-600 rounded" />
                    <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">Blue Belt Tactical Maneuvers</span>
                    <Lock className="w-3 h-3 text-neutral-600 ml-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lessons.filter(l => l.level === 'Blue Belt').map(lesson => {
                      const isLocked = xp < 3000;
                      return (
                        <div 
                          key={lesson.id} 
                          className={`p-4 rounded-xl border flex flex-col justify-between transition relative ${
                            isLocked 
                              ? 'bg-[#060606] border-neutral-950 opacity-60' 
                              : lesson.completed 
                                ? 'bg-neutral-900/40 border-neutral-900/80 hover:border-neutral-800' 
                                : 'bg-neutral-950 border-neutral-900 hover:border-neutral-800'
                          }`}
                        >
                          {isLocked && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center text-center z-10 p-4">
                              <Lock className="w-6 h-6 text-amber-500 mb-2" />
                              <span className="text-xs font-mono text-neutral-400">Trancado. Requer graduação Faixa Azul</span>
                              <span className="text-[10px] text-amber-500 font-bold mt-1">Requer 3.000 XP (Você tem {xp} XP)</span>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-blue-400 font-bold uppercase">{lesson.category}</span>
                            </div>
                            <h4 className="text-sm font-bold text-stone-200">
                              {lesson.title}
                            </h4>
                            <p className="text-xs text-neutral-400">
                              {lesson.description}
                            </p>
                          </div>

                          <div className="mt-5 border-t border-neutral-900/60 pt-3 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                            <span>⏱️ {lesson.duration}</span>
                            <span className="text-amber-500">💎 +{lesson.xpReward} XP</span>
                            
                            <button
                              onClick={() => handleStartLesson(lesson)}
                              disabled={isLocked}
                              className="py-1.5 px-3.5 bg-red-650 hover:bg-red-700 text-white text-[10px] font-bold rounded uppercase shrink-0"
                            >
                              Iniciar Aula
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DICIONÁRIO INTEGRADO ADVERT */}
                <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-amber-500 font-bold uppercase">Material de Apoio</span>
                    <h4 className="text-sm font-bold text-white">Prefere focar puramente em pronúncia de palavras técnicas?</h4>
                    <p className="text-xs text-neutral-500 max-w-xl">
                      Nosso sistema de inteligência artificial de pronúncia escuta suas respostas reais e valida o sotaque em tempo real.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => { setActiveTab('home'); }}
                    className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[10px] font-mono font-bold text-neutral-300 rounded-xl transition uppercase shrink-0"
                  >
                    Abrir Praticador de Voz (Aba Home)
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* --- VIEW: ARENA PVP --- */}
          {activeTab === 'pvp' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-4"
            >
              <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-5">
                <div className="mb-4">
                  <span className="text-[10px] font-mono tracking-wider bg-red-950/20 text-red-500 border border-red-900/50 px-2.5 py-1 roundeduppercase font-bold">
                    DOJO MULTIPLAYER LOBBY
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">Duele verbalmente com adversários estrangeiros do mundo inteiro</p>
                </div>
                
                {/* Embed the PvPArena components */}
                <PvPArena />
              </div>
            </motion.div>
          )}

          {/* --- VIEW: LEADERBOARD --- */}
          {activeTab === 'ranking' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-4"
            >
              <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-5">
                <div className="mb-4">
                  <span className="text-[10px] font-mono tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 roundeduppercase font-bold">
                    GLOBAL CAMPIONSHIP
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">Lutadores brasileiros treinando lá fora e estrangeiros treinando no Brasil</p>
                </div>
                
                {/* Embed the GlobalLeaderboard component */}
                <GlobalRanking />
              </div>
            </motion.div>
          )}

          {/* --- VIEW: CERTIFICATES --- */}
          {activeTab === 'certificates' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-4"
            >
              <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-5">
                <div className="mb-4 animate-pulse-subtle">
                  <span className="text-[10px] font-mono tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-sm uppercase font-bold">
                    IBJJF COMPLIANT EXAMS
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">Gere seus badges de proficiência de arbitragem e ensino de Jiu-Jítsu</p>
                </div>
                
                {/* Embed Certificates */}
                <Certificates />
              </div>
            </motion.div>
          )} 

          {/* --- VIEW: SOCIAL HUB --- */}
          {activeTab === 'store' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-6"
            >
              <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6">
                <VirtualStore />
              </div>
            </motion.div>
          )}

          {activeTab === 'finance' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-6"
            >
              {user?.role === 'ADMIN' ? (
                <FinanceAdminDashboard />
              ) : (
                <div className="bg-[#030303] border border-red-950 rounded-3xl p-8 max-w-lg mx-auto text-center my-12 shadow-2xl">
                  <span className="text-4xl">🔒</span>
                  <h3 className="text-lg font-black font-sans uppercase tracking-wider text-red-500 mt-4">Acesso restrito.</h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    Você não possui as permissões (RBAC ADMIN) necessárias para acessar o painel financeiro. Se você for um administrador, acesse pelo portal administrativo com verificação de duas etapas (2FA).
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'social' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-6"
            >
              <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6">
                <div className="mb-4">
                  <span className="text-[10px] font-mono tracking-wider bg-red-650/10 text-red-500 border border-red-900/40 px-3 py-1 rounded-sm uppercase font-bold">
                    JiuSpeak Arena Social Core
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">Conecte-se com lutadores, compartilhe conquistas, gere cards esportivos e verifique seu perfil público</p>
                </div>
                
                <SocialHub />
              </div>
            </motion.div>
          )} 

          {/* --- VIEW: PROFILE --- */}
          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-6"
            >
              {/* Dynamic Profile Header Card */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-gradient-to-bl from-amber-500/5 via-transparent to-transparent -mr-6 -mt-6 rounded-full blur-2xl" />
                
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                  {/* Photo Uploader Circular Ring */}
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-full bg-neutral-900 border-2 border-amber-500/80 flex items-center justify-center text-4xl relative overflow-hidden shadow-lg transition-transform group-hover:scale-105">
                      {editProfileImage ? (
                        <img 
                          src={editProfileImage} 
                          alt="Foto do Atleta" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>🥋</span>
                      )}
                      
                      {/* Upload overlay hover trigger */}
                      <label 
                        htmlFor="profile-image-file" 
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-mono tracking-wider transition-opacity cursor-pointer text-center"
                      >
                        <span>Alterar Foto</span>
                        <span className="text-amber-500 font-bold mt-0.5">Mudar 📷</span>
                      </label>
                    </div>
                    
                    <input 
                      type="file"
                      id="profile-image-file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            setEditErrorMsg('Foto muito pesada (limite 2MB).');
                            return;
                          }
                          const r = new FileReader();
                          r.onloadend = () => {
                            setEditProfileImage(r.result as string);
                          };
                          r.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />

                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase border border-black shadow">
                      {user ? (user.belt_rank === 'White' ? 'BRANCA' : user.belt_rank.toUpperCase()) : 'GUEST'}
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1 p-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <h3 className="text-xl font-bold text-white">
                        {user ? `${editFirstName} ${editLastName}` : 'Convidado (BJJ Student)'}
                      </h3>
                      <span className="md:ml-2 text-[10px] font-mono tracking-wider bg-red-950/40 text-red-500 px-2 py-0.5 rounded border border-red-900/30 uppercase font-black">
                        {user ? 'Acesso Authenticado ⚡' : 'Modo Convidado'}
                      </span>
                    </div>
                    
                    <p className="text-xs text-neutral-400">
                      {user ? `E-mail registrado: ${user.email}` : 'Crie uma conta JiuSpeak para registrar seus progressos de aula e ranking global.'}
                    </p>
                    
                    <div className="flex items-center justify-center md:justify-start gap-4 text-[11px] font-mono text-neutral-500 pt-1">
                      <span>🥋 Faixa {user?.belt_rank || 'Branca'}</span>
                      <span className="truncate">🌍 {editAddress || 'Tatame virtual'}</span>
                      <span>📆 Desde: {user ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Hoje'}</span>
                    </div>
                  </div>
                </div>

                {/* HISTORICAL XP ANALYTICS OR SHIELD STATS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t border-neutral-900 pt-6">
                  <div className="bg-[#070707] border border-neutral-900 rounded-xl p-3">
                    <span className="text-neutral-500 text-[9px] block uppercase font-mono font-bold">XP TOTAL ACUMULADO</span>
                    <span className="text-xl font-black text-white block mt-0.5 font-mono">{xp} XP</span>
                  </div>
                  <div className="bg-[#070707] border border-[#ff3131]/10 rounded-xl p-3">
                    <span className="text-neutral-500 text-[9px] block uppercase font-mono font-bold">STREAK ATIVO (DIA)</span>
                    <span className="text-xl font-black text-red-500 block mt-0.5 font-mono">🔥 {streak} dias</span>
                  </div>
                  <div className="bg-[#070707] border border-neutral-900 rounded-xl p-3">
                    <span className="text-neutral-500 text-[9px] block uppercase font-mono font-bold">VERSÕES CERTIFICADAS</span>
                    <span className="text-xl font-black text-amber-500 block mt-0.5 font-mono">3 Badges</span>
                  </div>
                  <div className="bg-[#070707] border border-neutral-900 rounded-xl p-3">
                    <span className="text-neutral-500 text-[9px] block uppercase font-mono font-bold">SPARRING PVP SCORE</span>
                    <span className="text-xl font-black text-blue-500 block mt-0.5 font-mono">9 - 2</span>
                  </div>
                </div>
              </div>

              {/* Editable Credential Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Form Col */}
                <div className="md:col-span-2 bg-neutral-950 border border-neutral-900 rounded-2xl p-6 space-y-5">
                  <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider border-b border-neutral-900 pb-3 flex items-center gap-2">
                    <span>🥋 Ficha de Inscrição Oficial</span>
                  </h4>

                  {editStatusMsg && (
                    <div className="bg-green-950/40 border border-green-900/50 rounded-xl p-3 text-xs text-green-400">
                      {editStatusMsg}
                    </div>
                  )}

                  {editErrorMsg && (
                    <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3 text-xs text-red-400">
                      {editErrorMsg}
                    </div>
                  )}

                  {!user ? (
                    <div className="text-center py-6 space-y-3">
                      <p className="text-xs text-neutral-400 font-mono">Faça log-in primeiro para habilitar o painel de cadastro oficial do atleta.</p>
                      <button 
                        onClick={onBackToHome}
                        className="py-2.5 px-5 bg-gradient-to-r from-red-650 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                      >
                        Ir pra Home e Logar
                      </button>
                    </div>
                  ) : (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSavingProfile(true);
                        setEditStatusMsg('');
                        setEditErrorMsg('');

                        if (!editPhone || !editAddress) {
                          setEditErrorMsg('Preencha os campos obrigatórios (Telefone e Endereço).');
                          setIsSavingProfile(false);
                          return;
                        }

                        const result = await updateUserProfile({
                          phone: editPhone,
                          address: editAddress,
                          profile_image: editProfileImage,
                          biography: editBiography,
                          social_instagram: editInstagram,
                          social_twitter: editTwitter,
                          language: editLanguage,
                          theme_visual: editTheme,
                          privacy_profile: editPrivacy as 'public' | 'private',
                          password: editPassword
                        });

                        setIsSavingProfile(false);
                        if (result.success) {
                          setEditStatusMsg('Perfil atualizado com sucesso no JiuSpeak! 🥋');
                          setEditPassword('');
                          setTimeout(() => setEditStatusMsg(''), 4000);
                        } else {
                          setEditErrorMsg(result.message);
                        }
                      }}
                      className="space-y-4 text-left"
                    >
                      {/* Restricted Name Area */}
                      <div className="bg-neutral-900/60 border border-neutral-850 rounded-xl p-4 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <Lock className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-mono text-neutral-400 font-bold block uppercase tracking-wider">🔒 Identidade Travada</span>
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                              Seu nome, sobrenome e username único não podem ser alterados após o cadastro por motivos de autenticidade no ranking global e emissão de certificados oficiais.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                          <div>
                            <label className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold block mb-1">Primeiro Nome</label>
                            <input 
                              type="text"
                              disabled
                              value={editFirstName}
                              className="w-full bg-[#141414] border border-neutral-850 text-xs text-neutral-500 rounded-lg px-3 py-2 cursor-not-allowed font-sans select-none"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold block mb-1">Sobrenome</label>
                            <input 
                              type="text"
                              disabled
                              value={editLastName}
                              className="w-full bg-[#141414] border border-neutral-850 text-xs text-neutral-500 rounded-lg px-3 py-2 cursor-not-allowed font-sans select-none"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold block mb-1">Username Único</label>
                            <input 
                              type="text"
                              disabled
                              value={editUsername ? `@${editUsername}` : ''}
                              className="w-full bg-[#141414] border border-neutral-850/80 text-xs text-neutral-500 rounded-lg px-3 py-2 cursor-not-allowed font-mono select-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Telefone de Contato *</label>
                          <input 
                            type="text"
                            required
                            value={editPhone}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 11) val = val.slice(0, 11);
                              if (val.length > 6) {
                                val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
                              } else if (val.length > 2) {
                                val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                              } else if (val.length > 0) {
                                val = `(${val}`;
                              }
                              setEditPhone(val);
                            }}
                            className="w-full bg-[#0a0a0a] border border-neutral-850 text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-650 transition-all font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Endereço de Correspondência *</label>
                          <input 
                            type="text"
                            required
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-neutral-850 text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-650 transition-all font-sans"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Biografia / Sobre Você</label>
                        <textarea 
                          rows={3}
                          value={editBiography}
                          onChange={(e) => setEditBiography(e.target.value)}
                          placeholder="Fale um pouco sobre sua caminhada no Jiu-Jitsu brasileiro..."
                          className="w-full bg-[#0a0a0a] border border-neutral-850 text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-650 transition-all font-sans resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Instagram (@)</label>
                          <input 
                            type="text"
                            value={editInstagram}
                            onChange={(e) => setEditInstagram(e.target.value)}
                            placeholder="bjj_athlete"
                            className="w-full bg-[#0a0a0a] border border-neutral-850 text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-650 transition-all font-sans"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Twitter / X (@)</label>
                          <input 
                            type="text"
                            value={editTwitter}
                            onChange={(e) => setEditTwitter(e.target.value)}
                            placeholder="bjj_warrior"
                            className="w-full bg-[#0a0a0a] border border-neutral-850 text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-650 transition-all font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Idioma de Preferência</label>
                          <select 
                            value={editLanguage}
                            onChange={(e) => setEditLanguage(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-neutral-850 text-xs text-white rounded-xl px-3 py-3 focus:outline-none focus:border-red-650 transition-all"
                          >
                            <option value="pt">Português (Brasil)</option>
                            <option value="en">English (US)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Tema Visual</label>
                          <select 
                            value={editTheme}
                            onChange={(e) => setEditTheme(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-neutral-850 text-xs text-white rounded-xl px-3 py-3 focus:outline-none focus:border-red-650 transition-all"
                          >
                            <option value="dark">Carbono Premium (Escuro)</option>
                            <option value="light">Kimono Alvo (Claro)</option>
                            <option value="cosmic">Nebulosa Cosmic (Roxo)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Privacidade de Perfil</label>
                          <select 
                            value={editPrivacy}
                            onChange={(e) => setEditPrivacy(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-neutral-850 text-xs text-white rounded-xl px-3 py-3 focus:outline-none focus:border-red-650 transition-all"
                          >
                            <option value="public">Público (Visível no Ranking)</option>
                            <option value="private">Privado (Invisível)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold block">Nova Senha de Acesso (Deixe em branco para manter a atual)</label>
                        <input 
                          type="password"
                          placeholder="Substituir senha de acesso atual..."
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-neutral-850 text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-all font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="w-full py-3 bg-gradient-to-r from-red-650 to-red-700 hover:from-red-700 hover:to-red-800 disabled:bg-neutral-900 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSavingProfile ? 'Gravando Arquivos...' : 'Atualizar Dados do Lutador ⚡'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Sidebar Badge Col */}
                <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase font-mono tracking-wider mb-3">CONVÊNIOS ATIVOS</h4>
                    
                    <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-850 flex items-center gap-3">
                      <img 
                        src={CHAMPIONSHIP_BELT_URL} 
                        alt="Cinturão de Campeão BJJ"
                        className="w-12 h-12 rounded-lg object-contain bg-neutral-950 border border-neutral-800"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="text-[9px] font-mono text-amber-500 font-extrabold block uppercase">CINTURÃO DE CONSTÂNCIA</span>
                        <h5 className="text-[11px] font-bold text-white mt-0.5">Grandmaster Vocab</h5>
                        <p className="text-[9px] text-neutral-400 leading-snug mt-1">Concede multiplicador de +20% XP.</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3.5 bg-neutral-900/50 rounded-xl border border-neutral-850 text-xs space-y-2">
                      <span className="text-neutral-500 font-mono text-[9px] block uppercase font-bold">LIGA DE TEMBOLO</span>
                      <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">Você está qualificado e ranqueado na Divisão Diamante.</p>
                    </div>
                  </div>

                  <p className="text-[9px] text-neutral-500 font-mono mt-4 italic">
                    "O Jiu-Jítsu desenvolve a perseverança sob pressão."
                  </p>
                </div>

              </div>
            </motion.div>
          )}

        </div>

      </main>

      {/* --- FLOATING QUIT EXAM MODAL (Dojo Interactive Lesson Overlay) --- */}
      <AnimatePresence>
        {selectedLessonForQuiz && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0b0c0e] border border-neutral-800/80 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col justify-between animate-fade-in"
            >
              {/* Header */}
              <div className="bg-neutral-900/40 px-5 py-4 border-b border-neutral-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-amber-500 font-black tracking-widest uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Aula de Vocabulário Técnico
                  </span>
                  <h4 className="text-xs font-bold text-white">
                    {selectedLessonForQuiz.title}
                  </h4>
                </div>
                <button 
                  onClick={closeQuizModal}
                  className="px-2 py-1 text-[10px] font-mono border border-neutral-850 text-neutral-400 hover:text-white rounded-md bg-neutral-950/60 hover:bg-neutral-900 transition"
                >
                  Sair
                </button>
              </div>

              {/* Progress Tracker bar */}
              <div className="w-full bg-neutral-950 h-1.5 flex gap-1 px-5 pt-3">
                {lessonPhase === 'study' ? (
                  Array(selectedLessonForQuiz.terms?.length || 0).fill(null).map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-full flex-1 rounded transition-all duration-300 ${
                        idx < studyTermIndex 
                          ? 'bg-amber-500' 
                          : idx === studyTermIndex 
                            ? 'bg-amber-400 animate-pulse' 
                            : 'bg-neutral-900'
                      }`} 
                    />
                  ))
                ) : (
                  (() => {
                    const quizSet = MOCK_LESSON_QUIZZES[selectedLessonForQuiz.id] || MOCK_LESSON_QUIZZES['l1'];
                    return Array(quizSet.length).fill(null).map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-full flex-1 rounded transition-all duration-300 ${
                          idx < quizStep 
                            ? 'bg-red-500' 
                            : idx === quizStep 
                              ? 'bg-amber-400 animate-pulse' 
                              : 'bg-neutral-900'
                        }`} 
                      />
                    ));
                  })()
                )}
              </div>

              {/* Body */}
              <div className="p-5 md:p-6 min-h-[385px] flex flex-col justify-between">
                
                {lessonPhase === 'study' ? (
                  // --- PHASE 1: STUDY VOCABULARY TERMS ---
                  (() => {
                    const currentTerm = selectedLessonForQuiz.terms && selectedLessonForQuiz.terms[studyTermIndex];
                    if (!currentTerm) return <div className="text-stone-300 text-xs text-center py-6">Carregando termos...</div>;
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-neutral-500 uppercase">
                            Termo {studyTermIndex + 1} de {selectedLessonForQuiz.terms?.length || 0}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-950/40 text-amber-500 rounded border border-amber-900/40">
                            Fase de Estudo 🥋
                          </span>
                        </div>

                        {/* Big Term Card */}
                        <div className="bg-[#050607] border border-neutral-850 rounded-xl p-5 relative overflow-hidden space-y-3.5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <h5 className="text-xl font-normal text-white font-sans tracking-tight">
                                {currentTerm.english}
                              </h5>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-neutral-400 font-black">IPA:</span>
                                <span className="text-[11px] font-mono text-amber-500 bg-amber-950/30 border border-amber-900/20 px-1.5 py-0.5 rounded font-medium">
                                  {currentTerm.ipa}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={() => speakTerm(currentTerm.english)}
                              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 text-amber-500 border border-neutral-800 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <Volume2 className="w-4 h-4" />
                              <span className="text-[10px] font-mono uppercase font-black">Áudio</span>
                            </button>
                          </div>

                          <div className="border-t border-neutral-900/70 pt-3.5 space-y-3">
                            <div>
                              <span className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider font-black">Tradução técnica</span>
                              <p className="text-sm font-bold text-stone-100">{currentTerm.translation}</p>
                            </div>

                            <div>
                              <span className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider font-black font-semibold">Explicação & Contexto</span>
                              <p className="text-xs text-neutral-300 leading-relaxed font-sans">{currentTerm.context}</p>
                            </div>
                          </div>
                        </div>

                        {/* Example Dialogue box */}
                        <div className="bg-[#0b101b]/70 border border-blue-950/40 rounded-xl p-4 space-y-2">
                          <span className="text-[9.5px] font-mono text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            💬 EXEMPLO NO TATAME (MAT DIALOGUE)
                          </span>
                          <div className="space-y-1">
                            <p className="text-xs italic text-blue-100 leading-relaxed font-sans">
                              "{currentTerm.example}"
                            </p>
                            <p className="text-[11px] text-neutral-400 leading-relaxed">
                              👉 {currentTerm.exampleTranslation}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()

                ) : lessonPhase === 'quiz' ? (
                  // --- PHASE 2: ACTIVE QUIZ ---
                  <div>
                    {(() => {
                      const quizSet = MOCK_LESSON_QUIZZES[selectedLessonForQuiz.id] || MOCK_LESSON_QUIZZES['l1'];
                      const curQuestion = quizSet[quizStep];
                      return (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-neutral-500 font-semibold">
                              Pergunta {quizStep + 1} de {quizSet.length}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-red-950/20 text-red-500 rounded border border-red-900/30 font-semibold">
                              Teste de Reflexo 🥊
                            </span>
                          </div>
                          
                          <h5 className="text-sm font-bold text-stone-100 leading-relaxed font-sans">
                            {curQuestion.question}
                          </h5>

                          <div className="space-y-2 pt-1">
                            {curQuestion.options.map((opt, oIdx) => {
                              const isSelected = selectedAnswer === oIdx;
                              const isCorrectAnswerOption = oIdx === curQuestion.correctIdx;
                              
                              let optionStyle = 'bg-[#060606] border-neutral-900 hover:border-neutral-850 text-neutral-400 hover:text-white';
                              
                              if (quizChecked) {
                                if (isCorrectAnswerOption) {
                                  optionStyle = 'bg-green-950/20 border-green-500/80 text-green-200';
                                } else if (isSelected) {
                                  optionStyle = 'bg-red-950/20 border-red-500/80 text-red-300';
                                } else {
                                  optionStyle = 'bg-[#060606] border-neutral-900 opacity-40 text-neutral-600';
                                }
                              } else if (isSelected) {
                                optionStyle = 'bg-red-950/20 border-red-500 text-stone-100';
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleSelectAnswer(oIdx)}
                                  disabled={quizChecked}
                                  className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-2.5 ${optionStyle}`}
                                >
                                  <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    isSelected ? 'bg-red-500 text-white' : 'bg-neutral-900 text-neutral-500'
                                  }`}>
                                    {['A', 'B', 'C', 'D'][oIdx]}
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                  {quizChecked && isCorrectAnswerOption && (
                                    <span className="text-green-500 ml-auto font-mono text-[10px] font-bold">CORRETO</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation with AnimatePresence */}
                          <AnimatePresence>
                            {quizChecked && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                                  isCorrectAnswer 
                                    ? 'bg-green-950/20 border-green-900/30 text-green-200' 
                                    : 'bg-red-950/20 border-red-900/30 text-red-300'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 font-bold uppercase font-mono text-[10px]">
                                  {isCorrectAnswer ? '🎯 Execução Perfeita!' : '⚠️ Guarda Aberta!'}
                                </div>
                                <p className="text-neutral-300 text-[11px] leading-relaxed">{curQuestion.explanation}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </div>

                ) : (
                  // --- PHASE 3: RESULT REPORT ---
                  <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-neutral-900 border border-green-500 flex items-center justify-center text-3xl mx-auto shadow-lg animate-bounce">
                      {quizScore !== null && quizScore >= 50 ? '🥋' : '🤕'}
                    </div>

                    <h5 className="text-sm font-black text-stone-100">
                      {quizScore !== null && quizScore >= 50 ? 'Rola Concluído com Sucesso!' : 'Estudo Incompleto'}
                    </h5>

                    <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed font-sans">
                      {quizScore !== null && quizScore >= 50 
                        ? `Oss! Você completou os ciclos de estudos de conceito e provou seus reflexos com assertividade. O aprendizado técnico foi agregado ao seu perfil.`
                        : `O vocabulário técnico escapou de sua guarda ativa neste treino. Retorne e repasse os áudios e exemplos técnicos antes do próximo combate.`}
                    </p>

                    <div className="flex justify-center gap-6 py-2">
                      <div className="p-3 bg-[#0d0d0e] border border-neutral-800 rounded-xl leading-none w-28">
                        <span className="text-[9px] text-neutral-500 block uppercase font-mono">ACURÁCIA</span>
                        <span className="text-lg font-mono font-black text-white mt-1.5 block">{quizScore}%</span>
                      </div>
                      <div className="p-3 bg-[#0c180e] border border-green-950 rounded-xl leading-none w-28">
                        <span className="text-[9px] text-green-500 block uppercase font-mono">XP HERDADO</span>
                        <span className="text-lg font-mono font-black text-green-400 mt-1.5 block">
                          {quizScore !== null && quizScore >= 50 ? `+${selectedLessonForQuiz.xpReward} XP` : '0 XP'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer controllers */}
              <div className="bg-neutral-900/60 px-5 py-4 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-500 font-semibold">
                  {lessonPhase === 'study' ? 'Estude antes de entrar em combate.' : 'Aperte os cintos no tatame.'}
                </span>

                <div className="flex gap-2">
                  {lessonPhase === 'study' ? (
                    <>
                      {studyTermIndex > 0 && (
                        <button
                          onClick={() => {
                            const prevIdx = studyTermIndex - 1;
                            setStudyTermIndex(prevIdx);
                            speakTerm(selectedLessonForQuiz.terms![prevIdx].english);
                          }}
                          className="py-2 px-4 border border-neutral-850 text-neutral-400 text-xs font-mono font-bold uppercase rounded-lg bg-neutral-950/40 hover:bg-neutral-900 hover:text-white transition"
                        >
                          Anterior
                        </button>
                      )}
                      <button
                        onClick={handleNextStudyTerm}
                        className="py-2 px-5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-mono font-extrabold uppercase rounded-lg transition-all flex items-center gap-1.5"
                      >
                        {studyTermIndex + 1 < (selectedLessonForQuiz.terms?.length || 0) ? (
                          <>Próximo Termo</>
                        ) : (
                          <>Começar Quiz 🥋</>
                        )}
                      </button>
                    </>
                  ) : lessonPhase === 'quiz' ? (
                    <>
                      {!quizChecked ? (
                        <button
                          disabled={selectedAnswer === null}
                          onClick={handleCheckAnswer}
                          className={`py-2 px-5 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
                            selectedAnswer === null
                              ? 'bg-neutral-850 text-neutral-600 cursor-not-allowed border border-neutral-900'
                              : 'bg-red-650 hover:bg-red-700 text-white shadow-lg'
                          }`}
                        >
                          Verificar Resposta ✔️
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuizQuestion}
                          className="py-2.5 px-6 bg-green-500 hover:bg-green-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md"
                        >
                          Continuar ➡️
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={closeQuizModal}
                      className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all"
                    >
                      Oss! Concluir e Voltar
                    </button>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
