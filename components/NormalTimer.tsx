
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { TimerDisplay } from './TimerDisplay';
import { playAlertSound } from '../utils/sound';

const DEFAULT_TIME_MS = 4 * 60 * 1000; // 4 minutes

interface NormalTimerProps {
  initialDuration?: number; // in minutes
  speakerLabel?: string;
}

export const NormalTimer: React.FC<NormalTimerProps> = ({ initialDuration, speakerLabel }) => {
  // Convert minutes to ms if provided, else default
  const startDuration = initialDuration ? initialDuration * 60 * 1000 : DEFAULT_TIME_MS;

  const [duration, setDuration] = useState(startDuration);
  const [remaining, setRemaining] = useState(startDuration);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const initialRemainingRef = useRef<number>(startDuration);

  // Reset whenever the initial configuration changes (e.g. changing rounds)
  useEffect(() => {
    const newDuration = initialDuration ? initialDuration * 60 * 1000 : DEFAULT_TIME_MS;
    setDuration(newDuration);
    setRemaining(newDuration);
    setIsRunning(false);
  }, [initialDuration]);

  const handleStartPause = useCallback(() => {
    setIsRunning(prev => {
      const willRun = !prev;
      if (willRun) {
        // Starting or Resuming
        startTimeRef.current = Date.now();
        initialRemainingRef.current = remaining;
      }
      return willRun;
    });
  }, [remaining]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setRemaining(duration);
  }, [duration]);

  const adjustTime = (mins: number) => {
    const newTime = mins * 60 * 1000;
    setDuration(newTime);
    setRemaining(newTime);
    setIsRunning(false);
  };

  useEffect(() => {
    if (isRunning && remaining > 0) {
      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const nextTime = Math.max(0, initialRemainingRef.current - elapsed);
        
        setRemaining(prev => {
           // Sound Triggers
           // 1. 30s Warning: Trigger if we crossed the 30000ms mark
           if (prev > 30000 && nextTime <= 30000) {
             playAlertSound('warning');
           }

           // 2. Time Up
           if (nextTime <= 0) {
             playAlertSound('end');
             setIsRunning(false);
             return 0;
           }
           return nextTime;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  return (
    <div className="flex flex-col items-center justify-center space-y-12 h-full w-full py-8">
      <div className="flex flex-col items-center space-y-4">
        <h2 className="text-white text-xl font-medium uppercase tracking-widest">
          {speakerLabel || "当前发言"}
        </h2>
        <TimerDisplay milliseconds={remaining} isLowTime={remaining < 30000 && remaining > 0} />
      </div>

      {/* Controls */}
      <div className="pt-2 pb-4 flex items-center justify-center gap-6 px-4">
        <Button variant="secondary" onClick={handleReset}>
          <RotateCcw className="w-5 h-5 mr-2" /> 重置
        </Button>

        {!isRunning && remaining === duration ? (
          <Button variant="primary" size="lg" onClick={handleStartPause} className="w-48">
            开始计时
          </Button>
        ) : (
          <Button
            variant={!isRunning ? "primary" : "danger"}
            size="lg"
            onClick={handleStartPause}
            className="w-48"
          >
            {!isRunning ? (
              <><Play className="w-5 h-5 mr-2" /> 继续</>
            ) : (
              <><Pause className="w-5 h-5 mr-2" /> 暂停</>
            )}
          </Button>
        )}
      </div>

      {/* Settings - Hide predefined buttons if controlled by flow (initialDuration passed) */}
      {!initialDuration && (
        <div className="flex gap-2 mt-8 bg-slate-800/50 p-2 rounded-xl">
          {[3, 3.5, 4, 5, 7, 10].map(min => (
            <button
              key={min}
              onClick={() => adjustTime(min)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${duration === min * 60 * 1000
                  ? 'bg-brand-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
            >
              {min}分钟
            </button>
          ))}
        </div>
      )}
    </div>
  );
};