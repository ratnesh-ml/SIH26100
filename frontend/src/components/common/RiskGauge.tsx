import React from 'react';

interface RiskGaugeProps {
  score: number;
  level?: 'LOW' | 'MEDIUM' | 'HIGH';
  size?: number;
  strokeWidth?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  level = score > 60 ? 'HIGH' : score > 30 ? 'MEDIUM' : 'LOW',
  size = 144,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score > 60 ? '#e11d48' : score > 30 ? '#f59e0b' : '#10b981';
  const badgeColor =
    score > 60
      ? 'bg-rose-100 text-rose-800 border-rose-200'
      : score > 30
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono leading-none">
            {score}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">/ 100</span>
          <span className={`mt-1 px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-full border uppercase ${badgeColor}`}>
            {level} RISK
          </span>
        </div>
      </div>
    </div>
  );
};
