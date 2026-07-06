import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// True scroll-linked parallax (not mouse-tracked): the wrapped element moves
// at `speed`x the scroll rate relative to its own section, so background
// layers drift slower than foreground content as the user scrolls past.
// speed < 1 = drifts up slower than scroll (feels "further back").
// speed > 1 = drifts faster (feels "closer").
export function Parallax({ children, speed = 0.35, className, style }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: (1 - speed) * -28,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement || el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    });

    return () => ctx.revert();
  }, [speed]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
