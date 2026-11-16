import React, { useEffect, useRef, useState } from 'react';
import { Project } from '../../types';
import { isOverBudget } from '../../lib/projectRules';
import { formatCurrencyINR } from '../../lib/format';

interface BudgetOrbitSectionProps {
  projects: Project[];
  reduceEffects?: boolean;
}

export const BudgetOrbitSection: React.FC<BudgetOrbitSectionProps> = ({
  projects,
  reduceEffects = false,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasRevealed, setHasRevealed] = useState(reduceEffects);

  useEffect(() => {
    if (reduceEffects) {
      setHasRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [reduceEffects]);

  return (
    <section
      id="orbit"
      ref={sectionRef}
      className="relative z-10 w-full
        px-[16px] py-[110px_80px]
        min-[821px]:px-[calc(64*var(--u,1px))] min-[821px]:pt-[calc(190*var(--u,1px))] min-[821px]:pb-[calc(160*var(--u,1px))]
      "
      aria-label="Budget Orbit Visualization"
    >
      <div
        className="max-w-[1240px] mx-auto grid grid-cols-1 min-[900px]:grid-cols-2 items-center
          gap-10 min-[900px]:gap-[calc(80*var(--u,1px))]
        "
      >
        {/* Left Column: Content, Legend & Spend Bars */}
        <div className="space-y-6">
          <div data-reveal>
            <h2
              className="solar-headline
                text-[32px]
                min-[821px]:text-[calc(52*var(--u,1px))]
              "
            >
              Your budget, in <span className="solar-serif-accent">orbit.</span>
            </h2>
            <p
              className="text-ink-2 mt-3
                text-[15px]
                min-[821px]:text-[calc(17*var(--u,1px))] min-[821px]:max-w-[calc(520*var(--u,1px))]
              "
            >
              Each planet is a project. Size shows budget, colour shows status, and
              red means the spend has passed the budget.
            </p>
          </div>

          {/* Legend row of chips */}
          <div
            data-reveal
            className="flex flex-wrap items-center gap-2 pt-1"
            aria-label="Orbit status legend"
          >
            <span className="solar-chip bg-[#35D49A]/15 border border-[#35D49A]/40 text-[#35D49A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#35D49A]" />
              Active
            </span>
            <span className="solar-chip bg-[#5B93FF]/15 border border-[#5B93FF]/40 text-[#5B93FF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B93FF]" />
              Completed
            </span>
            <span className="solar-chip bg-[#E8C14A]/15 border border-[#E8C14A]/40 text-[#E8C14A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8C14A]" />
              On hold
            </span>
            <span className="solar-chip bg-[#FF4D5E]/15 border border-[#FF4D5E]/40 text-[#FF4D5E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D5E]" />
              Over budget
            </span>
          </div>

          {/* Real-data Spend bars panel */}
          <div
            data-reveal
            className="solar-glass p-5 min-[821px]:p-[calc(24*var(--u,1px))] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="text-xs uppercase tracking-wider text-ink-3 font-mono">
                Project Spend Tracking
              </span>
              <span className="text-xs text-ink-3 font-mono">
                {projects.length} Active Orbits
              </span>
            </div>

            <div className="space-y-3.5">
              {projects.map((proj) => {
                const overBudget = isOverBudget(proj);
                const percentage =
                  proj.budget > 0
                    ? Math.min(100, Math.round((proj.spentAmount / proj.budget) * 100))
                    : 100;

                const barWidth = hasRevealed ? `${percentage}%` : '0%';

                return (
                  <div key={proj.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-3">
                      <span className="text-ink font-medium truncate max-w-[60%]">
                        {proj.title}
                      </span>
                      <span
                        className={`font-mono tabular-nums ${
                          overBudget ? 'text-alert-red font-semibold' : 'text-ink-2'
                        }`}
                      >
                        {formatCurrencyINR(proj.spentAmount)}{' '}
                        <span className="text-ink-3 font-normal">
                          / {formatCurrencyINR(proj.budget)}
                        </span>
                      </span>
                    </div>

                    {/* Progress track */}
                    <div
                      className="w-full bg-white/[0.07] rounded-full overflow-hidden"
                      style={{ height: 'calc(6 * var(--u, 1px))', minHeight: '6px' }}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          overBudget ? 'bg-alert-red' : 'bg-accent-gradient'
                        }`}
                        style={{
                          width: barWidth,
                          transitionDuration: reduceEffects ? '0ms' : '1400ms',
                          transitionTimingFunction: 'cubic-bezier(.2,.7,.2,1)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Stage for Orbit (Reserved 3D space) */}
        <div className="relative min-h-[360px] min-[900px]:min-h-[520px] w-full flex items-center justify-center pointer-events-none">
          {/* Subtle backdrop circle highlight */}
          <div
            className="w-[300px] h-[300px] min-[900px]:w-[420px] min-[900px]:h-[420px] rounded-full opacity-20 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(255,180,84,0.3) 0%, rgba(255,122,89,0.08) 50%, transparent 70%)',
            }}
          />
        </div>
      </div>
    </section>
  );
};
