import React from 'react';
import { Play, Loader2 } from 'lucide-react';

const MenuScreen = ({ onStart, isLoaded }) => {
    const [mode, setMode] = React.useState('single');
    const [time, setTime] = React.useState(30);

    return (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-transparent pointer-events-none p-4 overflow-y-auto">
            <div className="glass-panel p-8 w-[90%] max-w-md pointer-events-auto flex flex-col items-center animate-in fade-in zoom-in duration-300 my-auto">
                <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">CLAP BATTLE</h1>
                <p className="text-center text-gray-400 mb-8 text-sm">Face the camera. Clap your hands to score!</p>

                {/* Mode Selection */}
                <div className="w-full mb-6">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Game Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setMode('single')}
                            className={`p-3 rounded-xl font-bold transition-all border-2 ${mode === 'single' ? 'bg-indigo-600 border-white text-white shadow-lg' : 'bg-slate-800/50 border-transparent text-gray-500 hover:bg-slate-700'}`}
                        >
                            Single
                        </button>
                        <button
                            onClick={() => setMode('double')}
                            className={`p-3 rounded-xl font-bold transition-all border-2 ${mode === 'double' ? 'bg-cyan-600 border-white text-white shadow-lg' : 'bg-slate-800/50 border-transparent text-gray-500 hover:bg-slate-700'}`}
                        >
                            Versus
                        </button>
                    </div>
                </div>

                {/* Time Selection */}
                <div className="w-full mb-8">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Duration</label>
                    <div className="flex gap-2">
                        {[10, 30, 60].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTime(t)}
                                className={`flex-1 py-2 rounded-lg font-mono font-bold text-sm transition-all border-2 ${time === t ? 'bg-slate-700 border-white text-white shadow-sm' : 'bg-slate-800/30 border-transparent text-gray-500 hover:bg-slate-800'}`}
                            >
                                {t}s
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    disabled={!isLoaded}
                    onClick={() => onStart(mode, time)}
                    className="w-full btn-primary py-4 text-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoaded ? (
                        <>
                            Start Game <Play className="w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" />
                        </>
                    ) : (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Loading AI...
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default MenuScreen;
