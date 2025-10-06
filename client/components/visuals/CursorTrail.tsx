import React, { useEffect, useRef } from "react";

const DOT_COUNT = 6;
const LERP = (a: number, b: number, f: number) => a + (b - a) * f;

export default function CursorTrail() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef(
    Array.from({ length: DOT_COUNT }).map(() => ({ x: -100, y: -100 })),
  );
  const mouseRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onLeave = () => {
      mouseRef.current.x = -100;
      mouseRef.current.y = -100;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    const tick = () => {
      const dots = posRef.current;
      let mx = mouseRef.current.x;
      let my = mouseRef.current.y;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.x = LERP(d.x, mx, 0.22 + i * 0.04);
        d.y = LERP(d.y, my, 0.22 + i * 0.04);
        mx = d.x;
        my = d.y;
      }

      if (containerRef.current) {
        const children = containerRef.current.children;
        for (let i = 0; i < children.length; i++) {
          const el = children[i] as HTMLElement;
          const d = dots[i];
          el.style.transform = `translate3d(${d.x - 6}px, ${d.y - 6}px, 0)`;
          el.style.opacity = `${Math.max(0, 1 - i * 0.14)}`;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
      ref={containerRef}
    >
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <div
          key={i}
          className={`cursor-dot transition-transform duration-150 ease-out`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 12,
            height: 12,
            borderRadius: 9999,
          }}
        />
      ))}
    </div>
  );
}
