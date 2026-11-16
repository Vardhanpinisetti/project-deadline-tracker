import React, { useEffect, useRef } from 'react';
import { ArrowDown } from 'lucide-react';

interface HeroProps {
  onOpenModal: () => void;
  reduceEffects?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onOpenModal, reduceEffects = false }) => {
  const heroRef = useRef<HTMLElement>(null);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Section 9: Hero Entrance Timeline using Web Animations API
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const htmlEl = document.documentElement;
    const isReduced =
      reduceEffects || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReduced) {
      htmlEl.classList.remove('anim');
      return;
    }

    htmlEl.classList.add('anim');

    const easing = 'cubic-bezier(.2,.75,.2,1)';
    const navEl = document.querySelector('[data-in="nav"]');
    const h1Line1 = document.querySelector('[data-in="h1-1"]');
    const h1Line2 = document.querySelector('[data-in="h1-2"]');
    const subEl = document.querySelector('[data-in="sub"]');
    const btnsEl = document.querySelector('[data-in="btn"]');
    const cardEl = document.querySelector('[data-in="card"]');

    if (navEl) {
      navEl.animate(
        [
          { opacity: 0, transform: 'translateY(-14px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 900, delay: 0, easing, fill: 'backwards' }
      );
    }

    if (h1Line1) {
      h1Line1.animate(
        [
          { opacity: 0, transform: 'translateY(105%)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 1100, delay: 250, easing, fill: 'backwards' }
      );
    }

    if (h1Line2) {
      h1Line2.animate(
        [
          { opacity: 0, transform: 'translateY(105%)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 1100, delay: 370, easing, fill: 'backwards' }
      );
    }

    if (subEl) {
      subEl.animate(
        [
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 900, delay: 620, easing, fill: 'backwards' }
      );
    }

    if (btnsEl) {
      btnsEl.animate(
        [
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 900, delay: 740, easing, fill: 'backwards' }
      );
    }

    if (cardEl) {
      cardEl.animate(
        [
          { opacity: 0, transform: 'translateY(40px) scale(0.96)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ],
        { duration: 1100, delay: 880, easing, fill: 'backwards' }
      );
    }

    // Remove 'anim' class on next animation frame with 3s failsafe
    const raf = requestAnimationFrame(() => {
      htmlEl.classList.remove('anim');
    });

    const timer = setTimeout(() => {
      htmlEl.classList.remove('anim');
    }, 3000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      htmlEl.classList.remove('anim');
    };
  }, [reduceEffects]);

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative w-full h-[100vh] min-h-[100svh] min-[821px]:min-h-[calc(900*var(--u,1px))] overflow-hidden select-none"
    >
      {/* Desktop (min-width: 821px) 1440x900 scaled frame */}
      <div className="hidden min-[821px]:block absolute inset-0 w-full h-full pointer-events-none">
        {/* Headline at left 67u, top 526u */}
        <div
          className="absolute pointer-events-auto"
          style={{
            left: 'calc(67 * var(--u, 1px))',
            top: 'calc(526 * var(--u, 1px))',
          }}
        >
          <h1
            className="solar-headline"
            style={{
              fontSize: 'calc(74 * var(--u, 1px))',
              lineHeight: 'calc(68 * var(--u, 1px))',
              letterSpacing: '-0.025em',
              fontWeight: 300,
            }}
          >
            <div className="overflow-hidden pb-[calc(6*var(--u,1px))]">
              <span data-in="h1-1" className="block">
                Every deadline,
              </span>
            </div>
            <div className="overflow-hidden pb-[calc(6*var(--u,1px))]">
              <span data-in="h1-2" className="block">
                in <span className="solar-serif-accent">orbit.</span>
              </span>
            </div>
          </h1>
        </div>

        {/* Subline at left 67u, top 684u */}
        <div
          data-in="sub"
          className="absolute pointer-events-auto text-ink-2 font-normal"
          style={{
            left: 'calc(67 * var(--u, 1px))',
            top: 'calc(684 * var(--u, 1px))',
            fontSize: 'calc(20 * var(--u, 1px))',
          }}
        >
          Project Deadline Tracker
        </div>

        {/* Buttons at left 67u, top 742u (gap 11u) */}
        <div
          data-in="btn"
          className="absolute flex items-center pointer-events-auto"
          style={{
            left: 'calc(67 * var(--u, 1px))',
            top: 'calc(742 * var(--u, 1px))',
            gap: 'calc(11 * var(--u, 1px))',
          }}
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

        {/* Scroll Card Button at left 1202u, top 703u (193u x 152u) */}
        <button
          type="button"
          data-in="card"
          onClick={scrollTo('overview')}
          className="absolute group text-left cursor-pointer pointer-events-auto transition-transform duration-300 hover:-translate-y-[calc(4*var(--u,1px))]"
          style={{
            left: 'calc(1202 * var(--u, 1px))',
            top: 'calc(703 * var(--u, 1px))',
            width: 'calc(193 * var(--u, 1px))',
            height: 'calc(152 * var(--u, 1px))',
            borderRadius: 'calc(10 * var(--u, 1px))',
            padding: 'calc(16 * var(--u, 1px)) calc(17 * var(--u, 1px))',
            background:
              'linear-gradient(160deg, rgba(255,170,90,.7), rgba(230,110,60,.6))',
            border: '1px solid rgba(255,230,200,.3)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 calc(12 * var(--u, 1px)) calc(30 * var(--u, 1px)) rgba(0,0,0,0.25)',
          }}
          aria-label="Scroll down and discover overview"
        >
          <div
            className="font-medium text-[#05060B] tracking-tight"
            style={{
              fontSize: 'calc(27 * var(--u, 1px))',
              lineHeight: 1.18,
            }}
          >
            Scroll down
            <br />
            & discover
          </div>

          {/* Bobbing 22u down arrow (5u bob over 2.2s infinite) */}
          <div
            className="absolute bottom-[calc(14*var(--u,1px))] right-[calc(15*var(--u,1px))] text-[#05060B] transition-transform"
            style={{
              animation: reduceEffects ? 'none' : 'bob 2.2s ease-in-out infinite',
            }}
          >
            <ArrowDown
              style={{
                width: 'calc(22 * var(--u, 1px))',
                height: 'calc(22 * var(--u, 1px))',
              }}
            />
          </div>
        </button>
      </div>

      {/* Mobile / Tablet (<= 820px) viewport positioning */}
      <div className="block min-[821px]:hidden absolute inset-0 w-full h-full px-5 pointer-events-none">
        {/* Headline: left 20px, bottom 250px, 46px / 44px line-height */}
        <div className="absolute left-[20px] right-[20px] bottom-[250px] pointer-events-auto">
          <h1 className="solar-headline text-[46px] leading-[44px] tracking-[-0.025em] font-light">
            <div className="overflow-hidden pb-1">
              <span data-in="h1-1" className="block">
                Every deadline,
              </span>
            </div>
            <div className="overflow-hidden pb-1">
              <span data-in="h1-2" className="block">
                in <span className="solar-serif-accent">orbit.</span>
              </span>
            </div>
          </h1>
        </div>

        {/* Subline: bottom 212px, 16px */}
        <div
          data-in="sub"
          className="absolute left-[20px] bottom-[212px] text-ink-2 text-[16px] pointer-events-auto"
        >
          Project Deadline Tracker
        </div>

        {/* Buttons: bottom 140px, 46px tall */}
        <div
          data-in="btn"
          className="absolute left-[20px] bottom-[140px] flex items-center gap-3 pointer-events-auto"
        >
          <button
            type="button"
            onClick={onOpenModal}
            className="solar-btn-primary h-[46px] px-5 text-sm rounded-xl"
          >
            New project
          </button>
          <a
            href="#projects"
            onClick={scrollTo('projects')}
            className="solar-btn-ghost h-[46px] px-5 text-sm rounded-xl"
          >
            View projects
          </a>
        </div>

        {/* Scroll Card: right 20px, bottom 28px, 150x92, 18px text */}
        <button
          type="button"
          data-in="card"
          onClick={scrollTo('overview')}
          className="absolute right-[20px] bottom-[28px] w-[150px] h-[92px] p-3 text-left rounded-xl cursor-pointer pointer-events-auto"
          style={{
            background:
              'linear-gradient(160deg, rgba(255,170,90,.7), rgba(230,110,60,.6))',
            border: '1px solid rgba(255,230,200,.3)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
          aria-label="Scroll down and discover overview"
        >
          <div className="font-medium text-[#05060B] text-[18px] leading-[1.18]">
            Scroll down
            <br />
            & discover
          </div>
          <div
            className="absolute bottom-2.5 right-2.5 text-[#05060B]"
            style={{
              animation: reduceEffects ? 'none' : 'bob 2.2s ease-in-out infinite',
            }}
          >
            <ArrowDown className="w-4 h-4" />
          </div>
        </button>
      </div>

      <style>{`
        @keyframes bob {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(calc(5 * var(--u, 1px)));
          }
        }
      `}</style>
    </section>
  );
};
