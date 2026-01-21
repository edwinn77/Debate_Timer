import React from 'react';

interface TimerDisplayProps {
  milliseconds: number;
  isLowTime?: boolean;
  size?: 'sm' | 'lg' | 'xl';
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ milliseconds, isLowTime = false, size = 'lg' }) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const sizeClasses = {
    sm: "text-4xl",
    lg: "text-6xl md:text-8xl",
    xl: "text-7xl md:text-8xl lg:text-9xl"
  };

  return (
    <div className={`font-mono font-bold tracking-tighter ${sizeClasses[size]} ${isLowTime ? 'text-red-500 animate-pulse' : 'text-white'}`}>
      {formattedTime}
    </div>
  );
};