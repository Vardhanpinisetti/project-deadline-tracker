import React from 'react';

interface FooterProps {
  onOpenModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenModal }) => {
  return (
    <footer
      id="end"
      className="relative z-10 w-full min-h-[80vh] flex flex-col items-center justify-between overflow-hidden
        px-[16px] pt-[110px] pb-[40px]
        min-[821px]:px-[calc(64*var(--u,1px))] min-[821px]:pt-[calc(230*var(--u,1px))] min-[821px]:pb-[calc(36*var(--u,1px))]
      "
      aria-label="Footer and CTA"
    >
      {/* Glass CTA Panel (max-width 880u, centred, 1px top highlight) */}
      <div
        data-reveal
        className="solar-glass w-full text-center relative mx-auto
          max-w-full p-[40px_22px_34px] rounded-[18px]
          min-[821px]:max-w-[calc(880*var(--u,1px))] min-[821px]:p-[calc(56*var(--u,1px))_calc(60*var(--u,1px))_calc(50*var(--u,1px))] min-[821px]:rounded-[calc(18*var(--u,1px))]
        "
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.18), 0 calc(24 * var(--u, 1px)) calc(60 * var(--u, 1px)) rgba(0,0,0,0.35)',
        }}
      >
        {/* Top subtle highlight line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-[60%] opacity-40 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,220,180,0.8), transparent)',
          }}
        />

        {/* Headline 72u */}
        <h2
          className="solar-headline mx-auto
            text-[40px]
            min-[821px]:text-[calc(72*var(--u,1px))]
          "
        >
          Add your next <span className="solar-serif-accent">project</span> now.
        </h2>

        {/* Lede */}
        <p
          className="text-ink-2 mx-auto mt-4
            text-[15px] max-w-full
            min-[821px]:text-[calc(18*var(--u,1px))] min-[821px]:max-w-[calc(540*var(--u,1px))]
          "
        >
          Set a deadline and a budget, and watch it join the orbit.
        </p>

        {/* Primary CTA Button */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onOpenModal}
            className="solar-btn-primary"
          >
            New project
          </button>
        </div>

        {/* Note line (Fira Code 12u) */}
        <p
          className="text-ink-3 font-mono mt-7 uppercase tracking-wider
            text-[11px]
            min-[821px]:text-[calc(12*var(--u,1px))]
          "
        >
          Deadlines · Budgets · Status, all in one place
        </p>
      </div>

      {/* Footer Bottom (margin-top: auto) */}
      <div className="w-full mt-auto pt-16 flex flex-col items-center text-center select-none">
        {/* Legal Line: ©2026 EnvisionStudio · Project Deadline Tracker (13u ink-3) */}
        <p
          className="text-ink-3 font-normal mb-2
            text-[12px]
            min-[821px]:text-[calc(13*var(--u,1px))]
          "
        >
          ©2026 EnvisionStudio · Project Deadline Tracker
        </p>

        {/* Huge Ghost Wordmark "EnvisionStudio" (236u, tracking -0.05em, line-height .8, transparent clipped) */}
        <div
          aria-hidden="true"
          className="w-full overflow-hidden flex justify-center pointer-events-none"
        >
          <span
            className="font-light tracking-[-0.05em] leading-[0.8] whitespace-nowrap block
              text-[76px]
              min-[821px]:text-[calc(236*var(--u,1px))]
            "
            style={{
              background:
                'linear-gradient(180deg, rgba(255,200,140,0.22) 0%, rgba(255,200,140,0) 85%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            EnvisionStudio
          </span>
        </div>
      </div>
    </footer>
  );
};
