/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Flame, Search, ArrowUp } from 'lucide-react';
import { LeaderboardUser } from '../types';
import { useAuth } from './AuthContext';

const INITIAL_RANKING: LeaderboardUser[] = [
  { rank: 1, name: "Mestre Gabriel Souza", belt: "Black", xp: 12450, accuracy: 98, avatar: "🥋", country: "BR" },
  { rank: 2, name: "Marcus Miller", belt: "Brown", xp: 10890, accuracy: 95, avatar: "🇬🇧", country: "US" },
  { rank: 3, name: "Yuki 'Samurai' Sato", belt: "Purple", xp: 9540, accuracy: 92, avatar: "🇯🇵", country: "JP" },
  { rank: 4, name: "Elena Petrova", belt: "Purple", xp: 8710, accuracy: 91, avatar: "🇷🇺", country: "RU" },
  { rank: 5, name: "Gabriel 'Leão' Souza", belt: "Blue", xp: 7920, accuracy: 89, avatar: "🇧🇷", country: "BR" },
  { rank: 6, name: "Você (BJJ Student)", belt: "White", xp: 3450, accuracy: 82, avatar: "🇧🇷", country: "BR", isCurrentUser: true },
  { rank: 7, name: "Hans Müller", belt: "Blue", xp: 3220, accuracy: 80, avatar: "🇩🇪", country: "DE" },
  { rank: 8, name: "Emily Watson", belt: "White", xp: 2980, accuracy: 78, avatar: "🇦🇺", country: "AU" }
];

export default function GlobalRanking() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'daily' | 'weekly' | 'all'>('weekly');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [search, setSearch] = useState("");

  const refreshRanking = async () => {
    try {
      const resp = await fetch('/api/ranking');
      if (resp.ok) {
        const data = await resp.json();
        // If logged in, mark user as current user
        const mapped = data.ranking.map((u: any) => {
          let isCurrentUser = false;
          if (user) {
            const normalizedUserName = `${user.first_name} ${user.last_name}`.toLowerCase().trim();
            isCurrentUser = u.name.toLowerCase().trim() === normalizedUserName;
          } else {
            isCurrentUser = u.name.includes('Você');
          }
          return {
            ...u,
            isCurrentUser
          };
        });
        setUsers(mapped);
      } else {
        setUsers(INITIAL_RANKING);
      }
    } catch (e) {
      // Fallback
      setUsers(INITIAL_RANKING);
    }
  };

  useEffect(() => {
    refreshRanking();
  }, [user]);

  const handleRankUp = () => {
    // Simulate user gaining 600 XP and jumping over Gabriel
    setUsers(prev => {
      return prev.map(u => {
        if (u.isCurrentUser) {
          const newXp = u.xp + 4500;
          return { ...u, xp: newXp, accuracy: 93 };
        }
        return u;
      }).sort((a, b) => b.xp - a.xp).map((u, i) => ({ ...u, rank: i + 1 }));
    });
  };

  const getBeltBadgeColor = (belt: string) => {
    switch (belt) {
      case 'Black': return 'bg-neutral-900 text-white border-neutral-700 font-black';
      case 'Brown': return 'bg-amber-900 text-amber-200 border-amber-800';
      case 'Purple': return 'bg-purple-900 text-purple-200 border-purple-800';
      case 'Blue': return 'bg-blue-900 text-blue-200 border-blue-800';
      default: return 'bg-neutral-100 text-neutral-850 border-neutral-300';
    }
  };

  const filteredUsers = users.filter(usr => 
    usr.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="global_ranking_module" className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
      
      {/* Header and filter tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
            Ranking Geral dos Tatames (Rank Global)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Dispute o topo contra lutadores brasileiros e gringos. Quem estuda mais, pontua e sobe.
          </p>
        </div>

        {/* Buttons to select interval */}
        <div className="bg-neutral-900 p-1 rounded-xl border border-neutral-800/80 flex items-center shrink-0 self-start md:self-auto">
          <button
            onClick={() => setFilter('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              filter === 'daily' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Diário
          </button>
          <button
            onClick={() => setFilter('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              filter === 'weekly' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              filter === 'all' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Geral
          </button>
        </div>
      </div>

      {/* Middle action helper & search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-neutral-500" />
          </span>
          <input
            type="text"
            className="w-full bg-neutral-900 text-white placeholder-neutral-500 text-xs rounded-xl pl-9 pr-4 py-2.5 border border-neutral-800 focus:outline-none focus:border-amber-500/80 transition-all font-mono"
            placeholder="Filtrar competidor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={handleRankUp}
          className="w-full sm:w-auto py-2 px-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider shadow-lg shadow-amber-500/10 active:scale-95 shrink-0"
        >
          <ArrowUp className="w-4 h-4 text-black" />
          Treinar + Subir No Ranking
        </button>
      </div>

      {/* UFC Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-900/80 bg-neutral-900/20">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800/80 text-neutral-500 font-mono text-[10px] uppercase tracking-wider bg-neutral-950/30">
              <th className="py-3 px-4 text-center w-12">Pos</th>
              <th className="py-3 px-4">Lutador</th>
              <th className="py-3 px-4 text-center">Faixa BJJ</th>
              <th className="py-3 px-4 text-right">Potência (XP)</th>
              <th className="py-3 px-4 text-center">Precisão</th>
              <th className="py-3 px-4 text-center w-20">Idioma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {filteredUsers.map((u, idx) => {
              const isFirst = u.rank === 1;
              const isSecond = u.rank === 2;
              const isThird = u.rank === 3;

              return (
                <tr 
                  key={idx}
                  className={`transition-colors ${
                    u.isCurrentUser 
                      ? 'bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-l-amber-500' 
                      : 'hover:bg-neutral-900/35'
                  }`}
                >
                  <td className="py-3 px-4 text-center font-bold font-mono">
                    {isFirst ? (
                      <span className="inline-flex items-center justify-center p-1.5 bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/20 text-xs">
                        🥇
                      </span>
                    ) : isSecond ? (
                      <span className="inline-flex items-center justify-center p-1.5 bg-slate-100/10 text-slate-300 rounded-full border border-slate-300/20 text-xs">
                        🥈
                      </span>
                    ) : isThird ? (
                      <span className="inline-flex items-center justify-center p-1.5 bg-amber-700/10 text-amber-600 rounded-full border border-amber-600/20 text-xs">
                        🥉
                      </span>
                    ) : (
                      <span className="text-neutral-500">{u.rank}</span>
                    )}
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{u.avatar}</span>
                      <div>
                        <span className={`font-bold block ${u.isCurrentUser ? 'text-amber-400 font-extrabold' : 'text-stone-100'}`}>
                          {u.name}
                        </span>
                        {u.isCurrentUser && (
                          <span className="text-[9px] bg-amber-500 text-black font-semibold px-1.5 py-0.5 rounded uppercase font-mono">
                            Você
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block text-[9px] font-mono tracking-wider font-bold py-1 px-2.5 rounded border ${getBeltBadgeColor(u.belt)}`}>
                      {u.belt === 'White' && "Branca"}
                      {u.belt === 'Blue' && "Azul"}
                      {u.belt === 'Purple' && "Roxa"}
                      {u.belt === 'Brown' && "Marrom"}
                      {u.belt === 'Black' && "Preta"}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-black font-mono text-white">
                    {u.xp.toLocaleString()} <span className="text-amber-500 text-[10px]">XP</span>
                  </td>

                  <td className="py-3 px-4 text-center font-bold text-neutral-400 font-mono">
                    <div className="inline-flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span>{u.accuracy}%</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-bold text-neutral-400">
                    <span className="bg-neutral-900 border border-neutral-800 text-[10px] px-2 py-1 rounded">
                      PT {u.country === 'BR' ? '➔ EN' : '➔ PT'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
