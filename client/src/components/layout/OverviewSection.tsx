import React, { useEffect, useRef, useState } from 'react';
import { ProjectStats } from '../../types';

interface OverviewSectionProps {
  stats: ProjectStats;
  onOpenModal: () => void;
  reduceEffects?: boolean;
}

const CountUp: React.FC<{
  target: number;
  active: boolean;
  reduceMotion?: boolean;
}> = ({ target, active, reduceMotion }) => {
  const [val, setVal] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) {
      setVal(target);
      return;
    }
    if (!active) return;

    const duration = 900;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(easeOut * target));
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setVal(target);
      }
    };

    requestAnimationFrame(frame);
  }, [active, target, reduceMotion]);

  return <span>{val}</span>;
};

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  stats,
  onOpenModal,
  reduceEffects = false,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasRevealed, setHasRevealed] = useState(reduceEffects);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
      id="overview"
      ref={sectionRef}
      className="relative z-10 w-full text-center flex flex-col items-center
        px-[16px] pt-[110px] pb-[80px]
        min-[821px]:px-[calc(64*var(--u,1px))] min-[821px]:pt-[calc(300*var(--u,1px))] min-[821px]:pb-[calc(150*var(--u,1px))]
      "
      aria-label="Platform Overview"
    >
      {/* Headline (reveal, 52u, max-width 1240u) */}
      <h2
        data-reveal
        className="solar-headline mx-auto
          text-[32px] max-w-full
          min-[821px]:text-[calc(52*var(--u,1px))] min-[821px]:max-w-[calc(1240*var(--u,1px))]
        "
      >
        Know what's due, what's late, and what's{' '}
        <span className="solar-serif-accent">over budget.</span>
      </h2>

      {/* Lede (reveal, 18u, max-width 600u) */}
      <p
        data-reveal
        className="text-ink-2 mx-auto mt-4
          text-[16px] max-w-full
          min-[821px]:text-[calc(18*var(--u,1px))] min-[821px]:max-w-[calc(600*var(--u,1px))]
        "
      >
        Track client projects, deadlines and spend in one calm workspace.
      </p>

      {/* Buttons (reveal) */}
      <div
        data-reveal
        className="flex items-center justify-center gap-3 mt-8"
      >
        <button
          type="button"
          onClick={onOpenModal}
          className="solar-btn-primary"
        >
          New project
        </button>
        <a
          href="#projects"
          onClick={scrollTo('projects')}
          className="solar-btn-ghost"
        >
          View projects
        </a>
      </div>

      {/* Stats row (reveal): 4-column grid, max-width 1060u, hairline dividers */}
      <div
        data-reveal
        className="w-full mx-auto mt-14
          max-w-full
          min-[821px]:max-w-[calc(1060*var(--u,1px))]
        "
      >
        <div
          className="grid grid-cols-2 min-[821px]:grid-cols-4 border-t border-b border-line divide-y min-[821px]:divide-y-0 min-[821px]:divide-x divide-line"
        >
          {/* Cell 1: Total projects */}
          <div className="py-6 min-[821px]:py-[calc(28*var(--u,1px))] px-4 text-center">
            <div className="solar-headline font-light text-[32px] min-[821px]:text-[calc(40*var(--u,1px))] tabular-nums text-ink">
              <CountUp
                target={stats.total}
                active={hasRevealed}
                reduceMotion={reduceEffects}
              />
            </div>
            <div
              style={{ fontSize: 'max(13px, calc(13 * var(--u, 1px)))' }}
              className="text-ink-3 mt-1 font-normal"
            >
              Total projects
            </div>
          </div>

          {/* Cell 2: Active */}
          <div className="py-6 min-[821px]:py-[calc(28*var(--u,1px))] px-4 text-center">
            <div className="solar-headline font-light text-[32px] min-[821px]:text-[calc(40*var(--u,1px))] tabular-nums text-[#35D49A]">
              <CountUp
                target={stats.active}
                active={hasRevealed}
                reduceMotion={reduceEffects}
              />
            </div>
            <div
              style={{ fontSize: 'max(13px, calc(13 * var(--u, 1px)))' }}
              className="text-ink-3 mt-1 font-normal"
            >
              Active
            </div>
          </div>

          {/* Cell 3: Overdue */}
          <div className="py-6 min-[821px]:py-[calc(28*var(--u,1px))] px-4 text-center">
            <div className="solar-headline font-light text-[32px] min-[821px]:text-[calc(40*var(--u,1px))] tabular-nums text-[#FF4D5E]">
              <CountUp
                target={stats.overdue}
                active={hasRevealed}
                reduceMotion={reduceEffects}
              />
            </div>
            <div
              style={{ fontSize: 'max(13px, calc(13 * var(--u, 1px)))' }}
              className="text-ink-3 mt-1 font-normal"
            >
              Overdue
            </div>
          </div>

          {/* Cell 4: Over budget */}
          <div className="py-6 min-[821px]:py-[calc(28*var(--u,1px))] px-4 text-center">
            <div className="solar-headline font-light text-[32px] min-[821px]:text-[calc(40*var(--u,1px))] tabular-nums text-[#FF4D5E]">
              <CountUp
                target={stats.overBudget}
                active={hasRevealed}
                reduceMotion={reduceEffects}
              />
            </div>
            <div
              style={{ fontSize: 'max(13px, calc(13 * var(--u, 1px)))' }}
              className="text-ink-3 mt-1 font-normal whitespace-nowrap"
            >
              Over budget
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
