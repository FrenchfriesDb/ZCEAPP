import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1];

// Headline enters word-by-word on mount, then each word tilts a few degrees
// in response to cursor position while the pointer is over the hero — a
// restrained kinetic-type treatment rather than a per-letter gimmick.
export function KineticHeadline({ text, as: Tag = "h1", className }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const springX = useSpring(mx, { stiffness: 120, damping: 20 });
  const springY = useSpring(my, { stiffness: 120, damping: 20 });
  const rotate = useTransform(springX, [0, 1], [-1.6, 1.6]);
  const skew = useTransform(springY, [0, 1], [0.6, -0.6]);

  const words = text.split(" ");

  if (reduce) {
    const Plain = Tag;
    return <Plain className={className}>{text}</Plain>;
  }

  const handlePointerMove = (event) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((event.clientX - rect.left) / rect.width);
    my.set((event.clientY - rect.top) / rect.height);
  };

  const handlePointerLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  const MotionTag = motion[Tag] || motion.h1;

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={{ rotate, skewX: skew, display: "inline-block", transformOrigin: "left center" }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {words.map((word, i) => (
        <span key={`${word}-${i}`} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
          <motion.span
            style={{ display: "inline-block" }}
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.08 * i, ease: EASE }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
