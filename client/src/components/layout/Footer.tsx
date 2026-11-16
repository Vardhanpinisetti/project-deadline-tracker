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
      {/* Glass CTA Panel (max-width 880u, centred, only 1px top highlight, NO bottom-left orange glow) */}
      <div
        data-reveal
        className="w-full text-center relative mx-auto
          max-w-full pt-[40px] px-[22px] pb-[34px] rounded-[18px]
          min-[821px]:max-w-[calc(880*var(--u,1px))] min-[821px]:p-[calc(56*var(--u,1px))_calc(60*var(--u,1px))_calc(50*var(--u,1px))] min-[821px]:rounded-[calc(18*var(--u,1px))]
        "
        style={{
          background: 'linear-gradient(160deg, rgba(255, 180, 84, 0.08), rgba(20, 15, 12, 0.65))',
          border: '1px solid rgba(255, 200, 140, 0.16)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 calc(24 * var(--u, 1px)) calc(60 * var(--u, 1px)) rgba(0,0,0,0.4)',
        }}
      >
        {/* 1px top highlight line from 15% to 85% of the width */}
        <div
          className="absolute top-0 left-[15%] right-[15%] h-[1px] pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,210,160,0.8), transparent)',
          }}
        />

        {/* Headline 72u (42px on mobile) */}
        <h2
          className="solar-headline mx-auto
            text-[42px]
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
          className="text-ink-3 font-normal mb-3
            text-[12px]
            min-[821px]:text-[calc(13*var(--u,1px))]
          "
        >
          ©2026 EnvisionStudio · Project Deadline Tracker
        </p>

        {/* Huge Ghost Wordmark "EnvisionStudio" (clamp(56px, 15.5vw, 236px), white-space nowrap, text-align center, line-height .8, overflow hidden on wrapper, centred, no horizontal scroll) */}
        <div
          aria-hidden="true"
          className="w-full flex justify-center pointer-events-none text-center"
          style={{ overflow: 'hidden' }}
        >
          <span
            className="font-light tracking-[-0.05em] block select-none pointer-events-none"
            style={{
              fontSize: 'clamp(56px, 15.5vw, 236px)',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              lineHeight: 0.8,
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

export default Footer;
