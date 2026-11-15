import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: 'gold' | 'green' | 'red' | 'blue';
  helperText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accent,
  helperText,
}) => {
  const chipStyles = {
    gold: 'bg-accent/15 text-accent border-accent/30',
    green: 'bg-[#35D49A]/15 text-[#35D49A] border-[#35D49A]/30',
    red: 'bg-[#FF4D5E]/15 text-[#FF4D5E] border-[#FF4D5E]/30',
    blue: 'bg-[#5B93FF]/15 text-[#5B93FF] border-[#5B93FF]/30',
  }[accent];

  return (
    <div className="solar-glass p-5 rounded-[18px] transition-all duration-150 ease-out hover:border-[rgba(255,180,84,0.45)]">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider font-semibold text-muted">
          {label}
        </p>
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-xl border ${chipStyles}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-[28px] font-semibold text-[#FFF6EA] tabular-nums leading-none">
          {value}
        </span>
        {helperText && (
          <span className="text-xs text-muted font-normal">
            {helperText}
          </span>
        )}
      </div>
    </div>
  );
};
