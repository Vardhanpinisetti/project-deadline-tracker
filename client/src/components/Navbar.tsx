import React from 'react';
import { Layers } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-base/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gradient shadow-glow-primary text-white font-bold">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-text-primary text-base tracking-tight">
              EnvisionStudio
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-md bg-surface border border-border text-text-muted">
              Projects
            </span>
          </div>
        </div>

        {/* Right side live status indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/[0.12] border border-success/30 text-success text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="hidden sm:inline">Tracker Online</span>
            <span className="sm:hidden">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
};
