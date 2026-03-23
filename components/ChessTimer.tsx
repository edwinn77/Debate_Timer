
import React, { useState, useEffect, useRef } from 'react';
import { Pause, Play, RotateCcw, User } from 'lucide-react';
import { Button } from './Button';
import { TimerDisplay } from './TimerDisplay';
import { SpeakerState } from '../types';
import { playAlertSound } from '../utils/sound';

const DEFAULT_TIME_MS = 5 * 60 * 1000; // 5 minutes per side

interface ChessTimerProps {
  initialTime?: number; // in minutes per side
}

export const ChessTimer: React.FC<ChessTimerProps> = ({ initialTime }) => {
  // Calculate start time based on prop or default
  const startMs = initialTime ? initialTime * 60 * 1000 : DEFAULT_TIME_MS;

  const [timeA, setTimeA] = useState(startMs);
  const [timeB, setTimeB] = useState(startMs);
  const [activeSpeaker, setActiveSpeaker] = useState<SpeakerState>(SpeakerState.IDLE);
  const [pausedState, setPausedState] = useState<SpeakerState>(SpeakerState.IDLE);

  const timerRef = useRef<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const initialTimeRef = useRef<number>(0);

  // Reset when initialTime prop changes
  useEffect(() => {
    const newStartMs = initialTime ? initialTime * 60 * 1000 : DEFAULT_TIME_MS;
    setTimeA(newStartMs);
    setTimeB(newStartMs);
    setActiveSpeaker(SpeakerState.IDLE);
    setPausedState(SpeakerState.IDLE);
  }, [initialTime]);

  const toggleTimer = (speaker: 'A' | 'B') => {
    if (activeSpeaker === SpeakerState.IDLE) {
      // Start or Resume
      if (pausedState !== SpeakerState.IDLE) {
        // Resume
        setActiveSpeaker(pausedState);
      } else {
        // Start fresh
        setActiveSpeaker(speaker === 'A' ? SpeakerState.SPEAKER_A : SpeakerState.SPEAKER_B);
      }
    } else {
      // Switch turns
      if ((speaker === 'A' && activeSpeaker === SpeakerState.SPEAKER_A) ||
        (speaker === 'B' && activeSpeaker === SpeakerState.SPEAKER_B)) {
        setActiveSpeaker(speaker === 'A' ? SpeakerState.SPEAKER_B : SpeakerState.SPEAKER_A);
      }
    }
  };

  const handleGlobalPause = () => {
    if (activeSpeaker !== SpeakerState.IDLE) {
      setPausedState(activeSpeaker);
      setActiveSpeaker(SpeakerState.IDLE);
    } else if (pausedState !== SpeakerState.IDLE) {
      setActiveSpeaker(pausedState);
    }
  };

  const handleReset = () => {
    const resetTime = initialTime ? initialTime * 60 * 1000 : DEFAULT_TIME_MS;
    setActiveSpeaker(SpeakerState.IDLE);
    setPausedState(SpeakerState.IDLE);
    setTimeA(resetTime);
    setTimeB(resetTime);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (activeSpeaker === SpeakerState.SPEAKER_A) {
          setActiveSpeaker(SpeakerState.SPEAKER_B);
        } else if (activeSpeaker === SpeakerState.SPEAKER_B) {
          setActiveSpeaker(SpeakerState.SPEAKER_A);
        } else if (activeSpeaker === SpeakerState.IDLE) {
          if (pausedState !== SpeakerState.IDLE) {
            setActiveSpeaker(pausedState);
          } else {
            setActiveSpeaker(SpeakerState.SPEAKER_A);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSpeaker, pausedState]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (activeSpeaker !== SpeakerState.IDLE) {
      startTimeRef.current = Date.now();
      initialTimeRef.current = activeSpeaker === SpeakerState.SPEAKER_A ? timeA : timeB;

      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const nextTime = Math.max(0, initialTimeRef.current - elapsed);

        if (activeSpeaker === SpeakerState.SPEAKER_A) {
          setTimeA(prev => {
            // Sound Triggers
            if (prev > 30000 && nextTime <= 30000) playAlertSound('warning');
            if (nextTime === 0 && prev > 0) playAlertSound('end');
            return nextTime;
          });
        } else {
          setTimeB(prev => {
            // Sound Triggers
            if (prev > 30000 && nextTime <= 30000) playAlertSound('warning');
            if (nextTime === 0 && prev > 0) playAlertSound('end');
            return nextTime;
          });
        }
      }, 100);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSpeaker]);

  const isAActive = activeSpeaker === SpeakerState.SPEAKER_A;
  const isBActive = activeSpeaker === SpeakerState.SPEAKER_B;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 flex flex-col md:flex-row w-full h-full gap-4 p-4">

        {/* Speaker A Area */}
        <div
          onClick={() => activeSpeaker !== SpeakerState.IDLE && toggleTimer('A')}
          className={`flex-1 rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden border-4 ${isAActive
            ? 'bg-brand-600 border-brand-400 shadow-[0_0_40px_rgba(2,132,199,0.5)]'
            : 'bg-slate-800 border-slate-700 opacity-60 hover:opacity-80'
            }`}
        >
          <div className="flex items-center gap-2 mb-4 md:mb-8 mt-4 md:mt-8">
            <User className="w-6 h-6" />
            <span className="font-bold tracking-wider text-2xl">正方</span>
          </div>
          <TimerDisplay milliseconds={timeA} size="xl" isLowTime={timeA < 30000} />
          <p className="mt-4 text-sm uppercase tracking-widest opacity-75">
            {isAActive ? '计时中...' : '点击结束发言'}
          </p>
        </div>

        {/* Speaker B Area */}
        <div
          onClick={() => activeSpeaker !== SpeakerState.IDLE && toggleTimer('B')}
          className={`flex-1 rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden border-4 ${isBActive
            ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_40px_rgba(5,150,105,0.5)]'
            : 'bg-slate-800 border-slate-700 opacity-60 hover:opacity-80'
            }`}
        >
          <div className="flex items-center gap-2 mb-4 md:mb-8 mt-4 md:mt-8">
            <span className="font-bold tracking-wider text-2xl">反方</span>
            <User className="w-6 h-6" />
          </div>
          <TimerDisplay milliseconds={timeB} size="xl" isLowTime={timeB < 30000} />
          <p className="mt-4 text-sm uppercase tracking-widest opacity-75">
            {isBActive ? '计时中...' : '点击结束发言'}
          </p>
        </div>
      </div>

      {/* Central Controls */}
      <div className="h-24 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-6 px-4">

        <Button variant="secondary" onClick={handleReset}>
          <RotateCcw className="w-5 h-5 mr-2" /> 重置
        </Button>

        {activeSpeaker === SpeakerState.IDLE && pausedState === SpeakerState.IDLE ? (
          <Button variant="primary" size="lg" onClick={() => toggleTimer('A')} className="w-48">
            开始辩论
          </Button>
        ) : (
          <Button
            variant={activeSpeaker === SpeakerState.IDLE ? "primary" : "danger"}
            size="lg"
            onClick={handleGlobalPause}
            className="w-48"
          >
            {activeSpeaker === SpeakerState.IDLE ? (
              <><Play className="w-5 h-5 mr-2" /> 继续</>
            ) : (
              <><Pause className="w-5 h-5 mr-2" /> 暂停</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
