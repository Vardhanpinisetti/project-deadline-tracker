import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden p-5 rounded-[18px] solar-glass space-y-4"
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

          <div className="flex justify-between items-start">
            <div className="space-y-2 w-2/3">
              <div className="h-4 bg-white/[0.08] rounded-md w-full" />
              <div className="h-2.5 bg-white/[0.04] rounded-md w-1/3" />
            </div>
            <div className="h-6 bg-white/[0.08] rounded-full w-20" />
          </div>

          <div className="h-3.5 bg-white/[0.08] rounded-md w-28" />

          <div className="space-y-2 pt-2 border-t border-[rgba(255,180,84,0.12)]">
            <div className="flex justify-between">
              <div className="h-3 bg-white/[0.08] rounded-md w-20" />
              <div className="h-3 bg-white/[0.04] rounded-md w-16" />
            </div>
            <div className="h-1.5 bg-white/[0.08] rounded-full w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
