/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Volume2, BookOpen, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { motion } from 'motion/react';

const SLANG_DATA = [
  {
    id: 's1',
    term: "Underhook",
    translation: "Cavar esgrima / Esgrimar",
    category: "Position",
    example: "You need to fight for the underhook to secure the half-guard sweep.",
    ptContext: "Dominar o braço do oponente por baixo da axila, crucial no controle.",
    severity: "Essential"
  },
  {
    id: 's2',
    term: "Sweep",
    translation: "Raspagem",
    category: "Action",
    example: "He hits a beautiful scissor sweep to get the mount.",
    ptContext: "Inverter a posição quando se está fazendo guarda, terminando por cima.",
    severity: "Essential"
  },
  {
    id: 's3',
    term: "Tap Out / Tap",
    translation: "Bater / Desistir",
    category: "Etiquette",
    example: "If the armbar is tight, make sure to tap out immediately.",
    ptContext: "Dar batidinhas no oponente ou no tatame para sinalizar desistência física.",
    severity: "Critical"
  },
  {
    id: 's4',
    term: "Pulling Guard",
    translation: "Puxar para a guarda",
    category: "Action",
    example: "He dislikes double-leg skirmishes, so he prefers pulling guard.",
    ptContext: "Evitar a troca de quedas sentando e trazendo o oponente direto para sua guarda.",
    severity: "Common"
  },
  {
    id: 's5',
    term: "Sprawl",
    translation: "Defesa de queda (espalmada)",
    category: "Defense",
    example: "Great reaction! His fast sprawl stuffed the single-leg entry.",
    ptContext: "Jogar os quadris para trás para anular a tentativa de queda nas pernas.",
    severity: "Essential"
  },
  {
    id: 's6',
    term: "Berimbolo",
    translation: "Berimbolo (Giro invertido)",
    category: "Position",
    example: "Watch out for his De La Riva guard, he is setting up a berimbolo.",
    ptContext: "Técnica de giro de ponta-cabeça para chegar nas costas do oponente.",
    severity: "Advanced"
  },
  {
    id: 's7',
    term: "Choke",
    translation: "Estrangulamento",
    category: "Submission",
    example: "She locked in a tight rear naked choke from the back mount.",
    ptContext: "Finalização por estrangulamento de pescoço.",
    severity: "Critical"
  },
  {
    id: 's8',
    term: "Pass my Guard",
    translation: "Passar a minha guarda",
    category: "Defense",
    example: "Hold the collar sleeves, don't let him pass your guard!",
    ptContext: "Quando o atleta de cima tenta transpor as pernas do que faz guarda.",
    severity: "Essential"
  },
  {
    id: 's9',
    term: "Post",
    translation: "Apoiar / Fazer apoio (com membro)",
    category: "Defense",
    example: "Post your right hand on the mat to prevent the sweep.",
    ptContext: "Apoiar uma perna ou braço no chão para manter o equilíbrio e evitar queda.",
    severity: "Common"
  },
  {
    id: 's10',
    term: "Flow Roll",
    translation: "Treino solto / Treino sem força",
    category: "Etiquette",
    example: "Let's do a light flow roll, my ribs are still recovering.",
    ptContext: "Treino leve, técnico e contínuo, focado em movimentos fluidos e sem força bruta.",
    severity: "Common"
  }
];

const CATEGORIES = ["All", "Position", "Action", "Submission", "Defense", "Etiquette"];

export default function MatSlang() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const playTTS = (text: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent flipping card when clicking sound
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const filteredSlangs = SLANG_DATA.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.example.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-950/40 text-red-400 border-red-900/40';
      case 'Essential': return 'bg-amber-950/40 text-amber-400 border-amber-900/40';
      case 'Advanced': return 'bg-purple-950/40 text-purple-400 border-purple-900/40';
      default: return 'bg-neutral-900 text-neutral-400 border-neutral-800';
    }
  };

  return (
    <div id="mat_slang_module" className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
      
      {/* Title & Search Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            Voz do Tatame (Gírias & Termos)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Dicionário interativo de termos fundamentais com áudio e contextos práticos.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-neutral-500" />
          </span>
          <input
            type="text"
            className="w-full bg-neutral-900 text-white placeholder-neutral-500 text-xs rounded-xl pl-9 pr-4 py-2.5 border border-neutral-800 focus:outline-none focus:border-amber-500/80 transition-all font-mono"
            placeholder="Buscar termo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Horizontal Stream */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-4 scrollbar-none mb-6 border-b border-neutral-900">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 uppercase tracking-wider ${
              activeCategory === cat
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800/85 hover:border-neutral-700'
            }`}
          >
            {cat === "All" ? "Todos" : cat}
          </button>
        ))}
      </div>

      {/* Slangs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSlangs.slice(0, 8).map((item) => {
          const isFlipped = flippedCards[item.id] || false;
          return (
            <div
              key={item.id}
              onClick={() => toggleFlip(item.id)}
              className="h-48 cursor-pointer relative group perspective"
            >
              {/* Card container with exact flipping transition */}
              <div className={`w-full h-full relative duration-500 transform-style transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front Side */}
                <div className="absolute inset-0 bg-neutral-900 hover:bg-neutral-900/90 border border-neutral-800/80 hover:border-neutral-700 rounded-xl p-4 flex flex-col justify-between backface-hidden shadow-md">
                  
                  {/* Category & Badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono tracking-wider font-semibold bg-neutral-950 text-neutral-400 px-2 py-0.5 rounded-md uppercase border border-neutral-850">
                      {item.category}
                    </span>
                    <span className={`text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-md uppercase border ${getSeverityStyle(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>

                  {/* Deep English Term */}
                  <div className="my-2">
                    <h4 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                      {item.term}
                    </h4>
                    <span className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      Tap to reveal translation 
                      <ArrowRightLeft className="w-3 h-3 text-neutral-500 animate-pulse" />
                    </span>
                  </div>

                  {/* Audio Trigger & Example Sentence */}
                  <div className="flex justify-between items-center border-t border-neutral-800/60 pt-2 text-neutral-400">
                    <p className="text-[11px] truncate italic max-w-xs text-neutral-400">
                      "{item.example}"
                    </p>
                    <button
                      onClick={(e) => playTTS(item.term, e)}
                      className="p-1.5 bg-neutral-950 hover:bg-neutral-800 active:scale-90 text-amber-500 rounded-lg hover:text-amber-400 border border-neutral-850 transition-all self-end shrink-0"
                      title="Pronunciation play"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Back Side (Translation and Context) */}
                <div className="absolute inset-0 bg-neutral-950 border border-amber-500/50 rounded-xl p-4 flex flex-col justify-between rotate-y-180 backface-hidden shadow-xl">
                  
                  {/* Mini-header */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono tracking-wider text-amber-500 font-bold uppercase">
                      Tradução Tatame
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500">
                      Voltar ao termo
                    </span>
                  </div>

                  {/* Translated Concept */}
                  <div className="my-2">
                    <h4 className="text-lg font-bold text-amber-400">
                      {item.translation}
                    </h4>
                    <p className="text-xs text-neutral-300 leading-snug mt-1">
                      {item.ptContext}
                    </p>
                  </div>

                  {/* Useful note */}
                  <div className="flex items-center gap-1.5 border-t border-neutral-800/80 pt-2 text-[10px] text-neutral-400">
                    <AlertCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">Usado em seminários internacionais e gringos visitantes.</span>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
        
        {filteredSlangs.length === 0 && (
          <div className="col-span-2 text-center py-10 border border-dashed border-neutral-800 rounded-xl">
            <p className="text-neutral-500 text-sm">Nenhum termo encontrado para sua busca.</p>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between bg-neutral-900/40 p-3.5 rounded-xl border border-neutral-800/80">
        <span className="text-xs text-neutral-400">
          Você já domina <span className="text-amber-400 font-bold">14% de todo o vocabulário</span> do Tatame Gringo.
        </span>
        <button className="text-xs text-amber-500 font-bold hover:text-amber-400 transition-colors uppercase font-mono tracking-wider">
          Ver Dicionário Completo →
        </button>
      </div>

    </div>
  );
}
