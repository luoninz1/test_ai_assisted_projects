import React, { useState, useEffect, useRef } from 'react';
import WebcamFeed from './components/WebcamFeed';
import MenuScreen from './components/MenuScreen';
import ResultScreen from './components/ResultScreen';
import { useMediaPipe } from './hooks/useMediaPipe';
import { useGameEngine, GAME_STATES } from './hooks/useGameEngine';
import clsx from 'clsx';
import { Timer } from 'lucide-react';

function App() {
  const [videoElement, setVideoElement] = useState(null);
  const [canvasElement, setCanvasElement] = useState(null); // Add state for canvas
  const webcamFeedRef = useRef(null);

  // Game Engine
  const {
    gameState,
    gameMode,
    timeLeft,
    countdown,
    winner,
    startGame,
    resetGame,
    setWinner // Needs score to determine
  } = useGameEngine();

  // AI Logic - Only count when PLAYING
  // Pass canvas element for drawing (visualization)
  const { isLoaded, p1Score, p2Score, setIsSinglePlayer, resetScores } = useMediaPipe(
    videoElement,
    canvasElement, // Pass the state not ref.current (ref.current is null initially)
    gameState === GAME_STATES.PLAYING
  );

  // Sync Game Engine with AI Props
  useEffect(() => {
    // Logic for Draw/Win is inside result screen usually, but game engine needs to know to set winner state
    // Actually useGameEngine has simple 'setWinner' logic but we can also just derive it.
    // But we need to lock the scores at game over.
    if (gameState === GAME_STATES.GAME_OVER) {
      // Pass scores to engine if needed? 
      // Actually let's just use the current scores for the ResultScreen
      // Use engine's determineWinner logic helper or just do it in ResultScreen
      setWinner(p1Score, p2Score);
    }
  }, [gameState, p1Score, p2Score, setWinner]);

  const handleStart = (mode, time) => {
    resetScores();
    setIsSinglePlayer(mode === 'single');
    startGame(mode, time);
  };

  const handleRestart = () => {
    resetGame();
  };

  return (
    <div className="relative w-full h-dvh bg-slate-900 text-white overflow-hidden font-body">
      {/* Background Video Layer */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        <WebcamFeed ref={webcamFeedRef} onVideoReady={setVideoElement} onCanvasReady={setCanvasElement} showSkeleton={true} />
      </div>

      {/* HUD - Always Visible during Game */}
      <div className={clsx(
        "absolute inset-0 z-10 p-8 flex flex-col justify-between pointer-events-none transition-opacity duration-500",
        (gameState === GAME_STATES.MENU || gameState === GAME_STATES.RESULT) ? "opacity-30" : "opacity-100"
      )}>
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          {/* Player 1 Score */}
          <div className="glass-panel p-6 min-w-[140px] text-center transform transition-all duration-300">
            <h2 className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Player 1 (Left)</h2>
            <p className="text-7xl font-black text-cyan-400 font-mono tracking-tighter leading-none">{p1Score}</p>
          </div>

          {/* Timer / Message */}
          <div className="flex flex-col items-center gap-4">
            {gameState === GAME_STATES.PLAYING && (
              <div className="glass-panel px-8 py-3 flex items-center gap-3">
                <Timer className={clsx("w-6 h-6", timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-white")} />
                <span className={clsx("text-4xl font-mono font-bold", timeLeft <= 5 ? "text-red-500" : "text-white")}>
                  {timeLeft}
                </span>
              </div>
            )}

            {gameState === GAME_STATES.COUNTDOWN && (
              <div className="text-8xl font-black text-white animate-ping">
                {countdown > 0 ? countdown : "GO!"}
              </div>
            )}
          </div>

          {/* Player 2 Score (Only Double Mode) */}
          <div className={clsx(
            "glass-panel p-6 min-w-[140px] text-center transform transition-all duration-300",
            gameMode === 'single' ? "opacity-0 translate-x-10" : "opacity-100 translate-x-0"
          )}>
            <h2 className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Player 2 (Right)</h2>
            <p className="text-7xl font-black text-violet-400 font-mono tracking-tighter leading-none">{p2Score}</p>
          </div>
        </div>
      </div>

      {/* Screens */}
      {gameState === GAME_STATES.MENU && (
        <MenuScreen onStart={handleStart} isLoaded={isLoaded} />
      )}

      {gameState === GAME_STATES.GAME_OVER && (
        <ResultScreen
          winner={winner}
          p1Score={p1Score}
          p2Score={gameMode === 'double' ? p2Score : null}
          onRestart={handleRestart}
        />
      )}

      {/* Loading Overlay if not loaded and not in menu structure (actually Menu handles loading disabled state) */}
    </div>
  );
}

export default App;
