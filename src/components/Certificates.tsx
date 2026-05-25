/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState } from 'react';
import { Award, ShieldCheck, Printer, Download, Sparkles, CheckSquare, BrainCircuit, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const EXAM_QUESTIONS = [
  {
    text: "Qual das opções descreve corretamente uma chave de braço estendida partindo da guarda fechada?",
    options: ["Rear Naked Choke", "Kimura lock", "Guillotine choke", "Straight Armbar"],
    correct: 3,
    hint: "Pense em 'arm' mais barra ('bar') reta ('straight')."
  },
  {
    text: "O que o árbitro quer dizer quando grita 'Comba' ou diz 'Fight!' para evitar passividade?",
    options: ["Avoid stalling", "Pull guard", "Stop playing", "Go back to feet"],
    correct: 0,
    hint: "Amarrar a luta ou amasso no BJJ em inglês é conhecido como 'stalling'."
  },
  {
    text: "Qual termo descreve o controle lateral clássico com o peito colado no peito?",
    options: ["Side control / 100 kilos", "Back mount", "De La Riva", "Half guard"],
    correct: 0,
    hint: "Em inglês, 100 quilos é conhecido pelo termo de posicionamento lateral."
  }
];

export default function Certificates() {
  const [examState, setExamState] = useState<'intro' | 'exam' | 'passed' | 'failed'>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Cert state
  const [certOwner, setCertOwner] = useState("STUDENT OF THE TATAME");
  const [examBelt, setExamBelt] = useState("Azul (Blue Belt)");

  const startExam = (belt: string) => {
    setExamBelt(belt);
    setExamState('exam');
    setCurrentIdx(0);
    setCorrectCount(0);
    setSelectedOpt(null);
    setShowHint(false);
  };

  const handleNext = () => {
    if (selectedOpt === null) return;
    
    const isCorrect = selectedOpt === EXAM_QUESTIONS[currentIdx].correct;
    if (isCorrect) {
      setCorrectCount(p => p + 1);
    }

    if (currentIdx < EXAM_QUESTIONS.length - 1) {
      setCurrentIdx(p => p + 1);
      setSelectedOpt(null);
      setShowHint(false);
    } else {
      // Evaluate if passed (needs at least 2 correct answers out of 3)
      const finalCount = isCorrect ? correctCount + 1 : correctCount;
      if (finalCount >= 2) {
        setExamState('passed');
      } else {
        setExamState('failed');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="certificates_module" className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
      
      {/* Intro state */}
      {examState === 'intro' && (
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="flex-1">
            <span className="text-[10px] font-mono tracking-widest bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 font-bold uppercase">
              Certificação Profissional
            </span>
            <h3 className="text-xl font-bold text-white mt-3">Comprove seu Inglês de Tatame</h3>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Responda o miniteste de aptidão e adquira o seu certificado digital oficial para colocar no Linkedin ou apresentar em academias gringas quando viajar para treinar.
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                <span>Alinhado às diretrizes de seminários internacionais IBJJF.</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                <span>Libera medalhas raras no ranking global de JiuSpeak.</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button 
                onClick={() => startExam("Meia-Guarda (Half-Guard Specialist)")}
                className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition"
              >
                Exame de Meia-Guarda
              </button>
              <button 
                onClick={() => startExam("Passador (Guard Passing Master)")}
                className="py-2.5 px-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl hover:text-white transition"
              >
                Exame de Passador de Guarda
              </button>
            </div>
          </div>

          <div className="w-full lg:w-72 bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between self-stretch relative">
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-50">
              <div className="w-1.5 h-1.5 bg-red-650 rounded-full" />
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
            </div>

            <div>
              <span className="text-[9px] font-mono text-neutral-500 uppercase">Amostra Digital</span>
              <div className="border border-dashed border-amber-500/30 rounded-lg p-3 text-center mt-2 bg-neutral-950/60 font-serif">
                <span className="text-[10px] text-amber-500/80 font-mono tracking-widest uppercase block mb-1">JiuSpeak Academy</span>
                <span className="text-[8px] text-neutral-500 uppercase block">This is to certify that</span>
                <span className="text-xs text-white block my-1 font-bold underline decoration-amber-500">YOUR NAME HERE</span>
                <span className="text-[8px] text-neutral-400 block max-w-xs mx-auto">has successfully completed the BJJ English Proficiency Exam.</span>
                <div className="h-4 w-4 bg-amber-500 rounded-full mx-auto mt-2 flex items-center justify-center text-[5px] text-black font-bold font-sans">
                  OK
                </div>
              </div>
            </div>

            <p className="text-[10px] text-neutral-500 text-center mt-3">
              Insira o nome desejado no certificado após aprovação no exame de 3 perguntas.
            </p>
          </div>
        </div>
      )}

      {/* Exam layout */}
      {examState === 'exam' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[9px] font-mono bg-neutral-900 text-amber-400 px-2 py-0.5 rounded border border-neutral-850">
                PROVA: {examBelt}
              </span>
              <h4 className="text-sm font-bold text-white mt-1">Questão {currentIdx + 1} de {EXAM_QUESTIONS.length}</h4>
            </div>
            <button 
              onClick={() => setShowHint(p => !p)}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition"
            >
              Ajuda / Dica?
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-4">
            <p className="text-sm font-bold text-neutral-200 leading-snug mb-4">
              {EXAM_QUESTIONS[currentIdx].text}
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {EXAM_QUESTIONS[currentIdx].options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => setSelectedOpt(oIdx)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                    selectedOpt === oIdx 
                      ? 'border-amber-500 bg-amber-950/20 text-white font-bold' 
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <span>{opt}</span>
                  {selectedOpt === oIdx && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {showHint && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-neutral-950/80 p-3.5 rounded-lg border border-neutral-850 text-xs text-neutral-400 mt-3 leading-relaxed"
                >
                  💡 <span className="font-bold text-neutral-300">Dica do professor:</span> {EXAM_QUESTIONS[currentIdx].hint}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setExamState('intro')}
              className="py-2.5 px-4 text-xs font-mono text-neutral-500 hover:text-white transition"
            >
              Cancelar Prova
            </button>
            <button
              onClick={handleNext}
              disabled={selectedOpt === null}
              className={`py-2 px-6 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                selectedOpt !== null
                  ? 'bg-amber-500 hover:bg-amber-600 text-black'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-800/80'
              }`}
            >
              {currentIdx === EXAM_QUESTIONS.length - 1 ? 'Finalizar Prova' : 'Avançar Questão'}
            </button>
          </div>
        </div>
      )}

      {/* Passed State */}
      {examState === 'passed' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto text-green-400 text-3xl mb-3">
            🥋
          </div>
          <h3 className="text-xl font-black text-white">APROVADO NO EXAME PROFISSIONAL!</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
            Você garantiu os ensinamentos corretos de inglês técnico BJJ para o exame de <span className="text-green-400 font-bold">{examBelt}</span>.
          </p>

          <div className="my-5 max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="mb-3">
              <label className="block text-left text-[10px] font-mono text-neutral-500 uppercase mb-1">
                Nome para Imprimir no Certificado:
              </label>
              <input 
                type="text" 
                value={certOwner} 
                onChange={(e) => setCertOwner(e.target.value)}
                className="w-full bg-neutral-950 text-white placeholder-neutral-600 text-xs rounded-lg p-2.5 border border-neutral-800 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Printable Digital Certificate Design */}
            <div id="printable_certificate_area" className="border-2 border-double border-amber-500/50 bg-neutral-950/80 p-5 rounded-lg text-center font-serif relative">
              <div className="absolute top-2 right-2 border border-amber-500/40 text-[7px] text-amber-500 px-1 font-mono uppercase">
                DIGITAL SEAL
              </div>
              
              <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase mb-1">JiuSpeak Academy Certification</h4>
              <p className="text-[10px] text-neutral-400 block italic leading-tight">This certificate certifies that</p>
              
              <p className="text-sm font-extrabold text-white my-1 underline decoration-amber-500 decoration-1">
                {certOwner || "SEU NOME COMPLETO"}
              </p>
              
              <p className="text-[10px] text-neutral-400 block max-w-xs mx-auto leading-tight">
                has proven professional-level proficiency in tactical English vocabularies and interactive dialogues for BJJ under the theme:
              </p>
              <p className="text-xs font-bold font-mono text-amber-400 mt-1 uppercase">
                {examBelt}
              </p>
              
              <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500 mt-3 border-t border-neutral-800/40 pt-2">
                <span>VERIFY BY: jiuspeak.com/verify</span>
                <span>EMISSÃO: 25/05/2026</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2.5 max-w-md mx-auto">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={() => setExamState('intro')}
              className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 hover:text-white rounded-xl text-xs font-semibold hover:border-neutral-700 transition"
            >
              Outro Exame
            </button>
          </div>
        </motion.div>
      )}

      {/* Failed State */}
      {examState === 'failed' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 bg-red-950/50 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 text-3xl mb-3">
            ❌
          </div>
          <h3 className="text-lg font-bold text-white uppercase">REPROVADO NO EXAME</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
            Sua pontuação foi insuficiente (você acertou {correctCount} de 3 questões). Não desanime! Revise o dicionário de tatame e tente novamente imediatamente.
          </p>

          <div className="mt-6 flex justify-center gap-2.5">
            <button
              onClick={() => startExam(examBelt)}
              className="py-2.5 px-6 bg-red-650 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition"
            >
              Refazer Prova
            </button>
            <button
              onClick={() => setExamState('intro')}
              className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 rounded-xl text-xs font-semibold hover:border-neutral-700 transition"
            >
              Voltar aos Exames
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}
