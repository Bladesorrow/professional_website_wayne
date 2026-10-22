"use client";

import { useEffect, useRef, useState } from "react";

/** Scroll-reveal for [data-reveal] elements plus a top progress bar. Content stays visible without JS. */
export function ScrollEffects() {
  const bar = useRef<HTMLDivElement>(null);
  const trike = useRef<HTMLDivElement>(null);
  const wheelA = useRef<SVGGElement>(null);
  const wheelB = useRef<SVGGElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("js");
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? window.scrollY / h : 0;
        if (bar.current) bar.current.style.transform = `scaleX(${p})`;
        if (trike.current) {
          const w = trike.current.offsetWidth;
          trike.current.style.transform = `translateX(${p * (window.innerWidth - w)}px)`;
        }
        // wheels turn with distance scrolled (rear wheel is larger, so it turns slower)
        if (wheelA.current) wheelA.current.style.transform = `rotate(${window.scrollY * 0.45}deg)`;
        if (wheelB.current) wheelB.current.style.transform = `rotate(${window.scrollY * 0.62}deg)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="progress" ref={bar} aria-hidden="true" />
      <div className="road" aria-hidden="true" />
      <div className="rider-trike" ref={trike} aria-hidden="true">
        <svg viewBox="0 0 160 72" width="100%" height="100%">
          {/* rear wheel */}
          <g ref={wheelA} className="wheel" style={{ transformOrigin: "34px 50px" }}>
            <circle cx="34" cy="50" r="18" fill="none" stroke="#062a3d" strokeWidth="5" />
            <circle cx="34" cy="50" r="18" fill="none" stroke="#22d3e0" strokeWidth="1.5" />
            <path d="M34 32V68M16 50H52M21 37L47 63M47 37L21 63" stroke="#e8fbff" strokeWidth="1.2" />
          </g>
          {/* front wheel */}
          <g ref={wheelB} className="wheel" style={{ transformOrigin: "128px 56px" }}>
            <circle cx="128" cy="56" r="12" fill="none" stroke="#062a3d" strokeWidth="5" />
            <circle cx="128" cy="56" r="12" fill="none" stroke="#22d3e0" strokeWidth="1.5" />
            <path d="M128 44V68M116 56H140M120 48L136 64M136 48L120 64" stroke="#e8fbff" strokeWidth="1.2" />
          </g>
          {/* frame and seat */}
          <path d="M34 50L58 44L118 48L128 56M58 44L52 24" fill="none" stroke="#ff6b1a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 46L66 46" stroke="#062a3d" strokeWidth="7" strokeLinecap="round" />
          {/* rider */}
          <circle cx="56" cy="20" r="7" fill="#f2fdff" stroke="#062a3d" strokeWidth="2" />
          <path d="M50 14a8 8 0 0 1 14 0z" fill="#22d3e0" stroke="#062a3d" strokeWidth="1.5" />
          <path d="M58 28L64 42L94 34L112 40" fill="none" stroke="#f2fdff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M58 28L64 42L94 34L112 40" fill="none" stroke="#062a3d" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".5" />
          <path d="M60 30L84 32L96 40" fill="none" stroke="#f2fdff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {/* crank */}
          <circle cx="118" cy="48" r="4" fill="#062a3d" stroke="#e8fbff" strokeWidth="1.5" />
        </svg>
      </div>
    </>
  );
}

/** Scrolling ribbon. Decorative, with a pause control (WCAG 2.2.2). */
export function Marquee({ items }: { items: string[] }) {
  const [paused, setPaused] = useState(false);
  const row = (
    <>
      {items.map((t) => (
        <span key={t}>{t}<i aria-hidden="true">◐</i></span>
      ))}
    </>
  );
  return (
    <div className="marquee-wrap">
      <div className={`marquee${paused ? " paused" : ""}`} aria-hidden="true">
        <div className="track">{row}{row}{row}{row}</div>
      </div>
      <button type="button" className="pause" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
        {paused ? "Play ribbon animation" : "Pause ribbon animation"}
      </button>
    </div>
  );
}
