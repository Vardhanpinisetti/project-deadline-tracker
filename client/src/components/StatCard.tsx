import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  accent?: 'gold' | 'green' | 'red' | 'blue';
  helperText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
}) => {
  return (
    <div className="solar-glass p-3.5 sm:p-4 rounded-[18px]">
      <span className="block text-xs font-normal text-muted whitespace-nowrap">
        {label}
      </span>
      <b
        style={{ color: '#FFF6EA' }}
        className="block mt-1 font-display text-[28px] font-semibold text-[#FFF6EA] tabular-nums leading-tight"
      >
        {value}
      </b>
    </div>
  );
};
