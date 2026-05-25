/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ArrowLeftRight, Check, Volume2, Globe, Heart, ShieldAlert, Sparkles } from 'lucide-react';

const BRAZILIANS_ABROAD = [
  {
    id: 'ba1',
    situation: "O mestre estrangeiro passa as instruções rápidas no sparring:",
    targetText: "Heavy hips! Don't let him recover the half-guard, cross-face immediately!",
    translation: "Quadris pesados! Não mude para trás para ele recuperar a meia guarda, faça o cross-face (esgrima de cabeça) imediatamente!",
    tips: "Cross-face é quando você usa o ombro para girar a cabeça do oponente para o lado oposto, quebrando a postura dele."
  },
  {
    id: 'ba2',
    situation: "O árbitro gringo anuncia a pontuação na competição:",
    targetText: "Two points for the sweep! Underhook control established.",
    translation: "Dois pontos para a raspagem! Controle de esgrima estabelecido.",
    tips: "No cenário internacional da IBJJF, as marcações e pontuações ocorrem em inglês absoluto."
  },
  {
    id: 'ba3',
    situation: "Parceiro de treino pede ajuste amigável no tatame:",
    targetText: "Can we do a light flow roll? I have an active tournament next weekend.",
    translation: "Podemos fazer um rola solto e leve? Tenho campeonato marcado para o próximo fim de semana.",
    tips: "Seja cortês! Responder 'Sure, let's flow!' mostra alto domínio de etiqueta."
  }
];

const FOREIGNERS_IN_BRAZIL = [
  {
    id: 'fb1',
    situation: "O mestre brasileiro grita na beira do tatame para te orientar:",
    targetText: "Posta a mão e pesa no quadril dele! Não dá espaço para o berimbolo!",
    translation: "Post your hand on the mat and put pressure on his hip! Do not give room for the berimbolo!",
    tips: "Estrangeiros valorizam aprender gírias cariocas nativas para decifrar a gritaria em torneios de jiu-jítsu no Brasil."
  },
  {
    id: 'fb2',
    situation: "Na hora de escolher os oponentes na academia:",
    targetText: "Vamos amassar ou fazer um rolinha técnico sem força?",
    translation: "Should we crush each other or do a light technical roll with no force?",
    tips: "A palavra 'amassar' (to smash/crush/heavy pressure) é famosíssima no vocabulário internacional do BJJ."
  },
  {
    id: 'fb3',
    situation: "Sinalizando o fim do round ou batida física:",
    targetText: "Pegou! Bateu! Oss, boa luta companheiro.",
    translation: "It locked in! Tap out! Oss, great fight teammate.",
    tips: "Oss é o cumprimento universal, mas no Brasil possui papel quase pontuatório em todas as sentenças."
  }
];

export default function InternationalSection() {
  const [activeTab, setActiveTab] = useState<'abroad' | 'brazil'>('abroad');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const playlist = activeTab === 'abroad' ? BRAZILIANS_ABROAD : FOREIGNERS_IN_BRAZIL;
  const item = playlist[selectedIdx];

  const playUtterance = (text: string, lang: 'en-US' | 'pt-BR') => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div id="international_module" className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent -mr-4 -mt-4 rounded-full blur-2xl" />

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-neutral-900 pb-5">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-500" />
            Vencer no Exterior vs. Conectar no Brasil
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Compare o inglês exigido para brasileiros lá fora e o português técnico que turistas buscam no Brasil.
          </p>
        </div>

        {/* Abroad / Brazil tab switch selector */}
        <div className="flex bg-neutral-900 p-1 rounded-xl self-start md:self-auto border border-neutral-800/80">
          <button
            onClick={() => { setActiveTab('abroad'); setSelectedIdx(0); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 uppercase ${
              activeTab === 'abroad' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Brasileiros na Gringa
          </button>
          <button
            onClick={() => { setActiveTab('brazil'); setSelectedIdx(0); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 uppercase ${
              activeTab === 'brazil' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Gringos no Brasil
          </button>
        </div>
      </div>

      {/* Case Study Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Situation sidebar selections */}
        <div className="md:col-span-1 space-y-2.5">
          {playlist.map((x, i) => (
            <button
              key={x.id}
              onClick={() => setSelectedIdx(i)}
              className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-3 ${
                selectedIdx === i 
                  ? 'bg-neutral-900 border-amber-500 text-white' 
                  : 'bg-neutral-950/50 border-neutral-900 text-neutral-400 hover:border-neutral-800 hover:text-neutral-200'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                selectedIdx === i ? 'bg-amber-500 text-black' : 'bg-neutral-900'
              }`}>
                {i + 1}
              </div>
              <div>
                <span className="font-semibold block line-clamp-2 leading-tight">
                  {x.situation}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Translation details card with sound and advice */}
        <div className="md:col-span-2 bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-5 flex flex-col justify-between relative">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-mono tracking-wider bg-neutral-950 text-amber-500 px-2 py-0.5 rounded border border-neutral-850 uppercase font-bold">
                {activeTab === 'abroad' ? "Inglês Falado na Arena" : "Português das Academias Cariocas"}
              </span>

              <button
                onClick={() => playUtterance(item.targetText, activeTab === 'abroad' ? 'en-US' : 'pt-BR')}
                className="p-2 bg-neutral-950 hover:bg-neutral-800 text-amber-500 rounded-lg hover:text-amber-400 border border-neutral-850 transition"
                title="Play Audio"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="my-3">
              <h4 className="text-lg font-black text-white italic tracking-wide font-sans leading-relaxed">
                "{item.targetText}"
              </h4>
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs my-3">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Significado Traduzido</span>
              </div>
              <p className="text-sm text-neutral-200 leading-relaxed font-mono">
                {item.translation}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/60 border border-neutral-850 rounded-lg mt-4 text-xs text-neutral-400">
            <span className="font-bold text-amber-500 block mb-1">Dica de Atleta:</span>
            {item.tips}
          </div>
        </div>
      </div>

    </div>
  );
}
