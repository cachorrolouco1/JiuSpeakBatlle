/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Award, Sparkles, CheckCircle2, Play, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const BJJ_TERMS = [
  { term: "Double Leg Takedown", meaning: "Baiana", tip: "Pronounce 'Double' like 'Dah-buhl' and 'Leg' with a short e sound." },
  { term: "Rear Naked Choke", meaning: "Mata-Leão", tip: "Keep 'Naked' as 'Nay-kid'. Focus on the sharp 'Ch' in 'Choke'." },
  { term: "Rear Mount", meaning: "Pegada de costas", tip: "Say 'Rear' like 'Reer'. Ensure the 't' in 'Mount' is crisp." },
  { term: "Sweep the guard", meaning: "Raspar da guarda", tip: "Stretch the 'ee' in 'Sweep'. Make 'guard' sound like 'gard'." },
  { term: "Tap Out", meaning: "Bater (desistir)", tip: "Keep 'Tap' short and punchy, then blend it with 'Out'." },
  { term: "Underhook", meaning: "Esgrima (braço por baixo)", tip: "Stress the first syllable: 'UN-der-hook'." },
  { term: "Scissor Sweep", meaning: "Raspagem de tesoura", tip: "Say 'Scis-sor' like 'Siz-zer'. Quick and sharp transition." },
  { term: "Sprawl", meaning: "Espalmada / Defesa de queda", tip: "Drag the 'aw' sound slightly like 'Spr-all'." }
];

export default function AIPronunciation() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [audioWaves, setAudioWaves] = useState<number[]>(Array(15).fill(2));
  const [showTip, setShowTip] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const waveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentTerm = BJJ_TERMS[currentIndex];

  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API if supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setMicError(null);
        setScore(null);
        setRecognizedText("");
        // Start simulated audio wave visualization
        waveIntervalRef.current = setInterval(() => {
          setAudioWaves(prev => prev.map(() => Math.floor(Math.random() * 24) + 4));
        }, 120);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        setRecognizedText(transcript);
        evaluatePronunciation(transcript, confidence);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event);
        if (event.error === 'not-allowed') {
          setMicError("Permissão de microfone negada. Use a simulação abaixo!");
        } else {
          setMicError(`Erro: ${event.error}. Use a simulação manual!`);
        }
        stopRecordingState();
      };

      rec.onend = () => {
        stopRecordingState();
      };

      speechRecognitionRef.current = rec;
    }

    return () => {
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, [currentIndex]);

  const stopRecordingState = () => {
    setIsRecording(false);
    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
      waveIntervalRef.current = null;
    }
    setAudioWaves(Array(15).fill(2));
  };

  const startListening = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.start();
      } catch (e) {
        // Fallback if already running
        speechRecognitionRef.current.stop();
      }
    } else {
      setMicError("Microfone não suportado no seu navegador. Experimente a simulação de áudio!");
      // Automatically trigger simulated voice evaluation after 2 seconds
      simulateAudioRecording();
    }
  };

  const simulateAudioRecording = () => {
    setIsRecording(true);
    setScore(null);
    setMicError(null);
    setRecognizedText("Ouvindo...");
    
    let timer = 0;
    const interval = setInterval(() => {
      setAudioWaves(prev => prev.map(() => Math.floor(Math.random() * 32) + 2));
      timer += 100;
      if (timer >= 2000) {
        clearInterval(interval);
        // Randomly succeed with a good transcription
        const target = BJJ_TERMS[currentIndex].term;
        const qualityOptions = [
          { text: target, scoreValue: 97, msg: "Excellent! Your accent and emphasis are spotless. Oss!" },
          { text: target, scoreValue: 88, msg: "Great job! A small slip on the vowel, but totally understandable in the gym." },
          { text: target.split(" ")[0] + " ...", scoreValue: 61, msg: "Not bad, but try to punch the syllables more clearly. Listen to the example again." },
        ];
        const result = qualityOptions[Math.floor(Math.random() * qualityOptions.length)];
        setRecognizedText(result.text);
        setScore(result.scoreValue);
        setFeedbackMsg(result.msg);
        stopRecordingState();
      }
    }, 100);
  };

  const playTTS = () => {
    const utterance = new SpeechSynthesisUtterance(currentTerm.term);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // slightly slower for better learning
    window.speechSynthesis.speak(utterance);
  };

  const evaluatePronunciation = (transcript: string, confidence: number) => {
    const target = BJJ_TERMS[currentIndex].term.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanTranscript = transcript.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let finalScore = 0;
    
    if (cleanTranscript === target) {
      finalScore = Math.floor(confidence * 30) + 70; // 70 to 100
    } else if (cleanTranscript.includes(target) || target.includes(cleanTranscript)) {
      finalScore = Math.floor(confidence * 25) + 55; // 55 to 80
    } else {
      // Fuzzy comparison
      let matches = 0;
      const targetWords = target.split(" ");
      const transcriptWords = cleanTranscript.split(" ");
      targetWords.forEach(w => {
        if (transcriptWords.includes(w)) matches++;
      });
      finalScore = Math.floor((matches / Math.max(targetWords.length, 1)) * 60) + Math.floor(Math.random() * 20);
    }
    
    if (finalScore > 100) finalScore = 100;
    if (finalScore < 20) finalScore = 20 + Math.floor(Math.random() * 10);

    setScore(finalScore);
    
    if (finalScore >= 90) {
      setFeedbackMsg("Master Class! Sua pronúncia está digna de um faixa preta do tatame. Oss!");
    } else if (finalScore >= 75) {
      setFeedbackMsg("Ótimo trabalho! A pronúncia está clara e qualquer gringo entenderia perfeitamente.");
    } else {
      setFeedbackMsg("Bom início! Tente pronunciar de forma mais pausada, enfatizando as sílabas destacadas.");
    }
  };

  const handleNext = () => {
    setScore(null);
    setRecognizedText("");
    setFeedbackMsg("");
    setCurrentIndex((prev) => (prev + 1) % BJJ_TERMS.length);
    setShowTip(false);
  };

  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-amber-400 border-amber-400';
    if (s >= 75) return 'text-emerald-400 border-emerald-400';
    return 'text-red-500 border-red-500';
  };

  return (
    <div id="ai_pronunciation_module" className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent -mr-4 -mt-4 rounded-full blur-2xl" />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-[10px] font-mono tracking-wider bg-neutral-900 text-amber-500 px-2.5 py-1 rounded-full border border-neutral-800 font-bold">
            TECNOLOGIA IA ATIVA
          </span>
          <h3 className="text-xl font-bold text-white mt-2">Corretor de Pronúncia BJJ</h3>
          <p className="text-xs text-neutral-400 mt-1">
            Fale o termo em inglês e ganhe feedback imediato sobre seu sotaque técnico.
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-neutral-400 font-mono text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>XP x2</span>
        </div>
      </div>

      {/* Main Term Card */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-5 mb-6 shadow-inner relative">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-amber-500/80 font-mono tracking-widest uppercase">
            {currentIndex + 1} / {BJJ_TERMS.length}
          </span>
          <button 
            onClick={playTTS}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-amber-400 rounded-lg transition-all"
            title="Ouvir Exemplo de Pronúncia"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center py-4">
          <h4 className="text-2xl font-extrabold text-white tracking-normal font-sans">
            "{currentTerm.term}"
          </h4>
          <p className="text-neutral-400 text-sm mt-1.5 italic font-medium">
            Significa: {currentTerm.meaning}
          </p>
        </div>

        {/* Pronunciation tips trigger */}
        <div className="border-t border-neutral-800/50 pt-3 mt-2">
          <button 
            onClick={() => setShowTip(!showTip)}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1 mx-auto"
          >
            <Play className={`w-2.5 h-2.5 transform ${showTip ? 'rotate-90' : 'rotate-0'} transition-transform`} />
            {showTip ? "Ocultar dica de sotaque" : "Ver dica de pronúncia"}
          </button>
          
          <AnimatePresence>
            {showTip && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-lg text-xs leading-relaxed text-neutral-300">
                  <span className="font-bold text-amber-500">Dica:</span> {currentTerm.tip}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Analyzer Interface */}
      <div className="flex flex-col items-center justify-center p-4 bg-neutral-900/30 rounded-xl border border-neutral-800/40 mb-5 text-center min-h-[160px]">
        {isRecording ? (
          <div className="flex flex-col items-center justify-center py-4">
            {/* Pulsing visual */}
            <div className="flex items-end gap-1 h-12 mb-4 justify-center">
              {audioWaves.map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: h }}
                  className="w-1.5 bg-gradient-to-t from-red-600 to-amber-500 rounded-full"
                  transition={{ type: 'spring', damping: 5 }}
                />
              ))}
            </div>
            <p className="text-xs text-red-500 animate-pulse font-mono tracking-wider font-bold">
              ESTAMOS TE OUVINDO... FALE AGORA!
            </p>
            {recognizedText && (
              <p className="text-neutral-400 text-sm mt-2 font-mono">"{recognizedText}"</p>
            )}
          </div>
        ) : score !== null ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center"
          >
            {/* Circular score gauge */}
            <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center font-bold mb-3 ${getScoreColor(score)} bg-neutral-950 shadow-lg relative`}>
              <span className="text-2xl tracking-tighter">{score}%</span>
              <span className="text-[8px] uppercase tracking-wider font-mono">Precisão</span>
              {score >= 85 && (
                <div className="absolute -top-1 -right-1 bg-amber-500 text-black p-0.5 rounded-full">
                  <Award className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <p className="text-white font-mono text-sm max-w-sm mt-1">
              "{recognizedText || currentTerm.term}"
            </p>
            <p className="text-xs text-neutral-400 max-w-md mt-2 leading-relaxed bg-neutral-950/80 px-4 py-2.5 rounded-lg border border-neutral-800">
              {feedbackMsg}
            </p>
          </motion.div>
        ) : (
          <div className="text-neutral-500 flex flex-col items-center py-6">
            <Mic className="w-8 h-8 opacity-25 mb-2.5 text-neutral-400" />
            <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
              Clique no botão de microfone abaixo para habilitar o analisador de fala.
            </p>
          </div>
        )}

        {micError && (
          <p className="text-xs text-amber-500 mt-2.5 bg-amber-950/30 border border-amber-900/50 px-3 py-1.5 rounded-lg">
            ⚠️ {micError}
          </p>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={startListening}
          disabled={isRecording}
          className={`flex-1 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all duration-200 ${
            isRecording
              ? 'bg-red-800/50 text-red-200 border border-red-700/50 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 hover:shadow-red-900/25 text-white'
          }`}
        >
          {isRecording ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
          <span className="tracking-wide">
            {isRecording ? "Listening..." : "Pressionar para Falar"}
          </span>
        </button>

        {/* Simular Audio Button if micro fails or browser doesn't support */}
        <button
          onClick={simulateAudioRecording}
          disabled={isRecording}
          className="p-3.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded-xl transition-all font-mono text-xs flex items-center gap-1.5"
          title="Simular fala por software"
        >
          <RefreshCw className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">Simular Fala</span>
        </button>

        <button
          onClick={handleNext}
          disabled={isRecording}
          className="px-4 py-3.5 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800/80 hover:border-neutral-700 rounded-xl transition-all"
          title="Próximo Termo"
        >
          <span className="text-neutral-300 font-semibold text-sm">Próximo</span>
        </button>
      </div>

      {/* Pro tip footer inside AI panel */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 border-t border-neutral-800/30 pt-3">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        <span>Garantia de sotaque técnico americano e nativo. Oss!</span>
      </div>
    </div>
  );
}
