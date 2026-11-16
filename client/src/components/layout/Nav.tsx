import React from 'react';

interface NavProps {
  isScrolled: boolean;
  onOpenModal: () => void;
}

export const Nav: React.FC<NavProps> = ({ isScrolled, onOpenModal }) => {
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      data-in="nav"
      className={`fixed z-20 transition-all duration-300 flex items-center justify-between
        top-[14px] left-[16px] right-[16px] h-[44px]
        min-[821px]:top-[calc(24*var(--u,1px))] min-[821px]:left-[calc(36*var(--u,1px))] min-[821px]:right-[calc(32*var(--u,1px))] min-[821px]:h-[calc(52*var(--u,1px))]
      `}
      aria-label="Main Navigation"
    >
      {/* Left: Logo (links to #top) */}
      <a
        href="#top"
        onClick={scrollTo('top')}
        className="flex items-center gap-[10px] min-[821px]:gap-[calc(12*var(--u,1px))] group outline-none"
        aria-label="EnvisionStudio Home"
      >
        <span
          className="rounded-full shrink-0 transition-transform duration-300 group-hover:scale-105
            w-[28px] h-[28px]
            min-[821px]:w-[calc(34*var(--u,1px))] min-[821px]:h-[calc(34*var(--u,1px))]
          "
          style={{
            background:
              'radial-gradient(circle at 32% 30%, #fff 0 8%, #FFE0B0 22%, #FFB454 52%, #FF7A59 78%)',
            boxShadow: '0 0 calc(18 * var(--u, 1px)) rgba(255,180,84,.55)',
          }}
        />
        <span
          className="font-semibold text-ink tracking-tight
            text-[19px]
            min-[821px]:text-[calc(23*var(--u,1px))]
          "
        >
          EnvisionStudio
        </span>
      </a>

      {/* Centre: Glass Menu Pill (Hidden on mobile <= 820px) */}
      <div
        className={`hidden min-[821px]:flex items-center absolute left-1/2 -translate-x-1/2 rounded-[calc(12*var(--u,1px))] border transition-colors duration-300 backdrop-blur-[14px]`}
        style={{
          padding: 'calc(5 * var(--u, 1px))',
          backgroundColor: isScrolled ? 'rgba(20,12,6,.55)' : 'rgba(120,70,30,.28)',
          borderColor: 'rgba(255,220,180,.22)',
        }}
        role="menubar"
      >
        <a
          href="#overview"
          onClick={scrollTo('overview')}
          className="text-ink text-[calc(15*var(--u,1px))] font-medium rounded-[calc(8*var(--u,1px))] px-[calc(14*var(--u,1px))] py-[calc(10*var(--u,1px))] hover:bg-white/[0.12] transition-colors"
          role="menuitem"
        >
          Overview
        </a>
        <a
          href="#projects"
          onClick={scrollTo('projects')}
          className="text-ink text-[calc(15*var(--u,1px))] font-medium rounded-[calc(8*var(--u,1px))] px-[calc(14*var(--u,1px))] py-[calc(10*var(--u,1px))] hover:bg-white/[0.12] transition-colors"
          role="menuitem"
        >
          Projects
        </a>
        <a
          href="#orbit"
          onClick={scrollTo('orbit')}
          className="text-ink text-[calc(15*var(--u,1px))] font-medium rounded-[calc(8*var(--u,1px))] px-[calc(14*var(--u,1px))] py-[calc(10*var(--u,1px))] hover:bg-white/[0.12] transition-colors"
          role="menuitem"
        >
          Budget orbit
        </a>
      </div>

      {/* Right: Primary Button "New project" */}
      <button
        type="button"
        onClick={onOpenModal}
        className="solar-btn-primary
          h-[38px] px-[16px] text-[13px] rounded-full
          min-[821px]:h-[calc(49*var(--u,1px))] min-[821px]:px-[calc(18*var(--u,1px))] min-[821px]:text-[calc(15*var(--u,1px))] min-[821px]:rounded-[calc(11*var(--u,1px))]
        "
      >
        New project
      </button>
    </nav>
  );
};
