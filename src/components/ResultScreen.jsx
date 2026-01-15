import React from 'react';
import { RefreshCw, Trophy } from 'lucide-react';

const ResultScreen = ({ winner, p1Score, p2Score, onRestart }) => {
    const isDraw = winner === 'draw';
    const isSingle = winner === 'p1' && !p2Score; // Heuristic for single player if p2Score is 0/undefined, or we pass mode.

    // Better to pass mode prop, but let's just infer or use generic "Game Over"
    let title = "Game Over";
    let message = `You scored ${p1Score} claps!`;

    if (p2Score !== undefined && p2Score !== null) {
        // Two player logic
        if (winner === 'draw') {
            title = "It's a Draw!";
            message = `${p1Score} - ${p2Score}`;
        } else if (winner === 'p1') {
            title = "Player 1 Wins!";
            message = `${p1Score} - ${p2Score}`;
        } else {
            title = "Player 2 Wins!";
            message = `${p1Score} - ${p2Score}`;
        }
    }

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="glass-panel p-10 w-[90%] max-w-lg text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20 animate-bounce">
                    <Trophy className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-5xl font-black text-white mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500">
                    {title}
                </h1>
                <p className="text-2xl font-mono text-gray-300 mb-10 font-bold">{message}</p>

                <div className="grid grid-cols-2 gap-8 w-full mb-8">
                    <div className="bg-slate-800/50 p-4 rounded-xl">
                        <p className="text-xs uppercase font-bold text-gray-500">Player 1</p>
                        <p className="text-3xl font-black text-cyan-400">{p1Score}</p>
                    </div>
                    {(p2Score !== undefined && p2Score !== null) && (
                        <div className="bg-slate-800/50 p-4 rounded-xl">
                            <p className="text-xs uppercase font-bold text-gray-500">Player 2</p>
                            <p className="text-3xl font-black text-violet-400">{p2Score}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={onRestart}
                    className="btn-primary w-full flex items-center justify-center gap-2 group"
                >
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> Play Again
                </button>
            </div>
        </div>
    );
};

export default ResultScreen;
