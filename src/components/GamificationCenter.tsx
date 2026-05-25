/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Award, Zap, Flame, Trophy, ShieldAlert, Star, Calendar, RefreshCw } from 'lucide-react';
import { Achievement } from '../types';

// Let's import the user-generated BJJ Championship belt image path
const CHAMPIONSHIP_BELT_URL = "/src/assets/images/bjj_championship_belt_1779667876346.png";

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ac1',
    title: "Primeiro Rola Verbal",
    description: "Concluiu com sucesso um mini-duelo contra Coach John na arena PvP.",
    imageUrl: "🥋",
    xpReward: 200,
    unlocked: true,
    category: "arena",
    progress: 1,
    maxProgress: 1
  },
  {
    id: 'ac2',
    title: "Sotaque de Faixa Preta",
    description: "Obteve pontuação de precisão de 90% ou mais com o analisador de voz da IA.",
    imageUrl: "🎙️",
    xpReward: 350,
    unlocked: true,
    category: "pronunciation",
    progress: 1,
    maxProgress: 1
  },
  {
    id: 'ac3',
    title: "Casca Grossa Vocal",
    description: "Mantenha a ofensiva e complete um streak de 7 dias consecutivos.",
    imageUrl: "🔥",
    xpReward: 500,
    unlocked: false,
    category: "streak",
    progress: 3,
    maxProgress: 7
  },
  {
    id: 'ac4',
    title: "Guardião Supremo",
    description: "Acerte perfeitamente 5 exames de certificações digitais sem falha.",
    imageUrl: "🎖️",
    xpReward: 800,
    unlocked: false,
    category: "quiz",
    progress: 1,
    maxProgress: 5
  }
];

export default function GamificationCenter() {
  const [streak, setStreak] = useState(5);
  const [xp, setXp] = useState(3450);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  const handleClaimReward = (id: string) => {
    // Collect achievement bonus XP
    const target = achievements.find(a => a.id === id);
    if (target && target.unlocked) {
      setXp(prev => prev + target.xpReward);
      // Change progress or lock it to avoid endless abuse
      setAchievements(prev => prev.map(a => a.id === id ? { ...a, xpReward: 0 } : a));
    }
  };

  const getBeltName = (currentXp: number) => {
    if (currentXp >= 10000) return { name: "Faixa Preta (Black Belt)", next: "Grau Supremo", percent: 100, color: "border-neutral-500 bg-neutral-900 text-white" };
    if (currentXp >= 7500) return { name: "Faixa Marrom (Brown Belt)", next: "Faixa Preta", percent: Math.floor(((currentXp - 7500) / 2500) * 100), color: "border-amber-700 bg-amber-950 text-amber-200" };
    if (currentXp >= 5000) return { name: "Faixa Roxa (Purple Belt)", next: "Faixa Marrom", percent: Math.floor(((currentXp - 5000) / 2500) * 100), color: "border-purple-600 bg-purple-950 text-purple-200" };
    if (currentXp >= 3000) return { name: "Faixa Azul (Blue Belt)", next: "Faixa Roxa", percent: Math.floor(((currentXp - 3000) / 2000) * 100), color: "border-blue-600 bg-blue-950 text-blue-200" };
    return { name: "Faixa Branca (White Belt)", next: "Faixa Azul", percent: Math.floor((currentXp / 3000) * 100), color: "border-neutral-700 bg-neutral-900 text-neutral-300" };
  };

  const beltInfo = getBeltName(xp);

  return (
    <div id="gamification_center_module" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Col 1: Belt progression & level */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 bg-gradient-to-bl from-amber-500/5 via-transparent to-transparent -mr-4 -mt-4 rounded-full blur-2xl" />
        
        <div>
          <span className="text-[10px] font-mono tracking-wider bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded border border-neutral-850">
            GRADUAÇÃO ATIVA
          </span>
          
          <div className="my-5 text-center">
            <span className="text-4xl">🥋</span>
            <h4 className="text-xl font-black text-white mt-3">{beltInfo.name}</h4>
            <span className={`inline-block text-[10px] font-mono tracking-wider font-bold py-1 px-3 mt-2 rounded border uppercase ${beltInfo.color}`}>
              {xp.toLocaleString()} XP TOTAL
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-neutral-400 font-mono">
              <span>Progresso para {beltInfo.next}</span>
              <span>{beltInfo.percent}%</span>
            </div>
            <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden border border-neutral-800 p-0.5">
              <div 
                className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${beltInfo.percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-neutral-900 pt-4 flex items-center justify-between text-xs text-neutral-400">
          <span>Próximo Grau em:</span>
          <span className="font-mono text-amber-500 font-bold">
            {xp < 3000 ? `${3000 - xp} XP` : xp < 5000 ? `${5000 - xp} XP` : xp < 7500 ? `${7500 - xp} XP` : xp < 10000 ? `${10000 - xp} XP` : "Nível Máximo"}
          </span>
        </div>
      </div>

      {/* Col 2: Daily Streak (Duolingo Style) + Championship Belt */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 bg-gradient-to-bl from-red-500/5 via-transparent to-transparent -mr-4 -mt-4 rounded-full blur-2xl" />

        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono tracking-wider bg-neutral-900 text-red-400 px-2 py-0.5 rounded border border-neutral-850">
              OFFENSIVE STREAK
            </span>
            <h4 className="text-xl font-bold text-white mt-1.5 flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-red-500 fill-current" />
              {streak} Dias Seguidos
            </h4>
          </div>

          <div className="bg-neutral-900 p-2 border border-neutral-800 text-xs text-red-400 font-bold font-mono rounded-lg flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>OSS!</span>
          </div>
        </div>

        {/* Premium Championship Belt Image & Motivation */}
        <div className="my-4 flex items-center gap-4 bg-neutral-900/40 p-3.5 rounded-xl border border-neutral-800/60 font-sans">
          <img 
            src={CHAMPIONSHIP_BELT_URL}
            alt="Cinturão de Campeão BJJ"
            className="w-16 h-16 rounded-lg object-contain bg-neutral-950 border border-neutral-800 shadow-md flex-shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-[10px] font-mono text-amber-500 font-bold block uppercase">Cinturão Adquirido</span>
            <h5 className="text-xs font-bold text-white mt-0.5">Grandmaster BJJ Vocab</h5>
            <p className="text-[10px] text-neutral-400 leading-snug mt-1">
              Desbloqueado ao manter regularidade de 5 dias ofensivos. Você tem bônus de +20% XP em todos os rolas verbais.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-neutral-500 border-t border-neutral-900 pt-3">
          <span>Estudo de hoje pendente?</span>
          <button 
            onClick={() => setStreak(p => p + 1)} 
            className="text-red-400 font-bold hover:text-red-300 font-mono text-xs uppercase transition"
          >
            Treinar Hoje Já (+1)
          </button>
        </div>
      </div>

      {/* Col 3: Achievements list */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
        
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-mono tracking-wider bg-neutral-900 text-neutral-400 px-2.5 py-1 rounded border border-neutral-850">
                MEDALHAS ATIVAS
              </span>
              <h4 className="text-base font-bold text-white mt-2">Conquistas & Badges</h4>
            </div>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3">
            {achievements.slice(0, 3).map((ach) => (
              <div 
                key={ach.id}
                className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors ${
                  ach.unlocked 
                    ? 'bg-neutral-900/80 border-neutral-800/80' 
                    : 'bg-neutral-950 border-neutral-900 opacity-60'
                }`}
              >
                <div className="text-2xl p-1.5 bg-neutral-950 rounded-lg border border-neutral-800 leading-none shrink-0">
                  {ach.imageUrl}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h5 className="text-xs font-bold text-neutral-100 truncate">{ach.title}</h5>
                    {ach.xpReward > 0 && ach.unlocked && (
                      <button 
                        onClick={() => handleClaimReward(ach.id)}
                        className="text-[9px] bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider"
                      >
                        Coletar {ach.xpReward} XP
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-snug truncate mt-0.5">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="text-center text-[11px] font-mono text-neutral-400 hover:text-white transition mt-4 underline self-center">
          Ver todas as 24 conquistas trancadas
        </button>
      </div>

    </div>
  );
}
