import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Apple-style scroll narrative: a sticky visual frame on one side, stepped
// copy scrolling past on the other. GSAP ScrollTrigger tracks which step is
// centered in the viewport and toggles the matching visual frame — no GSAP
// pin() involved (that fights CSS Grid track sizing), just plain `position:
// sticky` for the stick, GSAP for precise "which step is active" detection.
export function ScrollStory({ steps, className }) {
  const stepRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      const triggers = stepRefs.current.map((step, i) => {
        if (!step) return null;
        return ScrollTrigger.create({
          trigger: step,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) setActiveIndex(i);
          },
        });
      });
      return () => triggers.forEach((t) => t && t.kill());
    });

    return () => ctx.revert();
  }, [steps.length]);

  return (
    <section className={`story-section${className ? ` ${className}` : ""}`}>
      <div className="story-visual-wrap">
        <div className="story-visual">
          {steps.map((step, i) => (
            <div className={`story-frame${i === activeIndex ? " is-active" : ""}`} key={step.eyebrow}>
              {step.visual}
            </div>
          ))}
        </div>
      </div>
      <div className="story-steps">
        {steps.map((step, i) => (
          <div
            className={`story-step${i === activeIndex ? " is-active" : ""}`}
            key={step.eyebrow}
            ref={(el) => (stepRefs.current[i] = el)}
          >
            <p className="story-eyebrow">{step.eyebrow}</p>
            <h3>{step.title}</h3>
            <p className="story-body">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
