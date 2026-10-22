"use client";

import { useEffect, useRef, useState } from "react";

/** Scroll-reveal for [data-reveal] elements plus a top progress bar. Content stays visible without JS. */
export function ScrollEffects() {
  const bar = useRef<HTMLDivElement>(null);

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

  return <div className="progress" ref={bar} aria-hidden="true" />;
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
