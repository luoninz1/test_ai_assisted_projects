import { useState, useEffect, useRef } from 'react';

const GAME_DURATION_OPTIONS = [10, 30, 60];

export const GAME_STATES = {
    MENU: 'MENU',
    COUNTDOWN: 'COUNTDOWN',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

export function useGameEngine() {
    const [gameState, setGameState] = useState(GAME_STATES.MENU);
    const [gameMode, setGameMode] = useState('single'); // 'single' | 'double'
    const [duration, setDuration] = useState(10);
    const [timeLeft, setTimeLeft] = useState(0);
    const [winner, setWinner] = useState(null); // 'p1' | 'p2' | 'draw' | null

    // Countdown state
    const [countdown, setCountdown] = useState(3);

    const timerRef = useRef(null);

    const startGame = (mode, selectedDuration) => {
        setGameMode(mode);
        setDuration(selectedDuration);
        setGameState(GAME_STATES.COUNTDOWN);
        setCountdown(3);
        setWinner(null);
    };

    // Handle Countdown
    useEffect(() => {
        let interval;
        if (gameState === GAME_STATES.COUNTDOWN) {
            interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        setGameState(GAME_STATES.PLAYING);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    // Handle Game Timer
    useEffect(() => {
        if (gameState === GAME_STATES.PLAYING) {
            setTimeLeft(duration);
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        return 0; // Don't call endGame here directly to avoid update loop issues
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState, duration]);

    // End Game Trigger
    useEffect(() => {
        if (gameState === GAME_STATES.PLAYING && timeLeft === 0) {
            endGame();
        }
    }, [timeLeft, gameState]);

    const endGame = () => {
        clearInterval(timerRef.current);
        setGameState(GAME_STATES.GAME_OVER);
    };

    const determineWinner = (p1Score, p2Score) => {
        if (gameMode === 'single') {
            return 'p1';
        }
        if (p1Score > p2Score) return 'p1';
        if (p2Score > p1Score) return 'p2';
        return 'draw';
    };

    return {
        gameState,
        gameMode,
        duration,
        timeLeft,
        countdown,
        winner,
        startGame,
        setWinner: (p1, p2) => setWinner(determineWinner(p1, p2)),
        resetGame: () => setGameState(GAME_STATES.MENU),
        GAME_DURATION_OPTIONS
    };
}
