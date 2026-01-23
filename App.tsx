
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, GuessRecord, AIResponse } from './types';
import { getAIFeedback } from './services/geminiService';

const MAX_GUESSES = 10;
const RANGE_MAX = 100;

const App: React.FC = () => {
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [history, setHistory] = useState<GuessRecord[]>([]);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [aiFeedback, setAiFeedback] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startNewGame = useCallback(() => {
    const random = Math.floor(Math.random() * RANGE_MAX) + 1;
    setTargetNumber(random);
    setHistory([]);
    setCurrentGuess('');
    setStatus(GameStatus.PLAYING);
    setAiFeedback({ message: "자, 제가 생각하는 1에서 100 사이의 숫자를 맞춰보세요!", emoji: "🔮" });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleGuess = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const guess = parseInt(currentGuess);

    if (isNaN(guess) || guess < 1 || guess > RANGE_MAX || status !== GameStatus.PLAYING) return;
    if (history.some(h => h.value === guess)) {
      setAiFeedback({ message: "이미 입력했던 숫자예요!", emoji: "⚠️" });
      return;
    }

    setIsLoading(true);
    let hint: 'UP' | 'DOWN' | 'CORRECT' = 'CORRECT';
    if (guess < targetNumber) hint = 'UP';
    else if (guess > targetNumber) hint = 'DOWN';

    const newRecord: GuessRecord = { value: guess, hint, timestamp: Date.now() };
    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    setCurrentGuess('');

    if (hint === 'CORRECT') {
      setStatus(GameStatus.WON);
    } else if (updatedHistory.length >= MAX_GUESSES) {
      setStatus(GameStatus.LOST);
    }

    const feedback = await getAIFeedback(
      guess, 
      targetNumber, 
      updatedHistory.map(h => h.value), 
      hint
    );
    setAiFeedback(feedback);
    setIsLoading(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white text-center relative">
          <h1 className="text-2xl font-bold tracking-tight">Gemini Mind Reader</h1>
          <p className="text-indigo-100 text-sm mt-1">숫자 맞추기 챌린지</p>
          <div className="absolute top-4 right-4 bg-indigo-500 rounded-full px-3 py-1 text-xs font-semibold">
            {history.length} / {MAX_GUESSES}
          </div>
        </div>

        {/* AI Character Section */}
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl border border-slate-200">
              {aiFeedback?.emoji || "🤖"}
            </div>
            <div className="flex-1">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 text-slate-700 text-sm min-h-[50px] flex items-center">
                {isLoading ? (
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                ) : (
                  aiFeedback?.message
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 space-y-6">
          {status === GameStatus.PLAYING ? (
            <form onSubmit={handleGuess} className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="number"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value)}
                  placeholder="1-100 사이 숫자"
                  className="w-full text-4xl font-bold text-center py-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none transition-all"
                  min="1"
                  max="100"
                  autoFocus
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 font-medium">
                  Guess
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !currentGuess}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all transform active:scale-95"
              >
                확인하기
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className={`text-6xl ${status === GameStatus.WON ? 'animate-bounce' : ''}`}>
                {status === GameStatus.WON ? '🏆' : '💀'}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800">
                  {status === GameStatus.WON ? '정답입니다!' : '게임 오버'}
                </h2>
                <p className="text-slate-500 mt-2">
                  정답은 <span className="font-bold text-indigo-600">{targetNumber}</span> 이었습니다.
                </p>
              </div>
              <button
                onClick={startNewGame}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
              >
                다시 시작하기
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {status === GameStatus.PLAYING && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-semibold px-1">
                <span>Attempt Tracker</span>
                <span>{MAX_GUESSES - history.length} chances left</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    history.length > 7 ? 'bg-red-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${(history.length / MAX_GUESSES) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* History List */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Previous Guesses</h3>
              <div className="grid grid-cols-5 gap-2">
                {history.slice().reverse().map((record, idx) => (
                  <div 
                    key={record.timestamp}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-sm font-bold transition-all animate-in slide-in-from-bottom-2 duration-300
                      ${record.hint === 'UP' ? 'bg-blue-50 border-blue-100 text-blue-600' : 
                        record.hint === 'DOWN' ? 'bg-orange-50 border-orange-100 text-orange-600' : 
                        'bg-green-50 border-green-100 text-green-600'}`}
                  >
                    <span>{record.value}</span>
                    <span className="text-[10px] mt-0.5">
                      {record.hint === 'UP' ? '▲' : record.hint === 'DOWN' ? '▼' : '★'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-8 text-slate-400 text-xs text-center space-y-1">
        <p>Built with Gemini AI Engine</p>
        <p>© 2024 Gemini Number Challenge</p>
      </div>
    </div>
  );
};

export default App;
