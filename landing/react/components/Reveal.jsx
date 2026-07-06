import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1];

const VARIANTS = {
  up: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94, y: 12 },
    visible: { opacity: 1, scale: 1, y: 0 },
  },
  clip: {
    hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
    visible: { opacity: 1, clipPath: "inset(0 0 0% 0)" },
  },
  side: {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0 },
  },
};

function motionTag(as) {
  return motion[as] || motion.div;
}

// Single-element scroll reveal. Replaces the old IntersectionObserver + CSS
// class approach with real Motion variants so different sections can use
// different entrance treatments instead of one uniform fade-up everywhere.
export function Reveal({ children, as = "div", variant = "up", delay = 0, duration = 0.7, className, once = true, amount = 0.2, ...rest }) {
  const reduce = useReducedMotion();
  const Plain = as;
  if (reduce) {
    return <Plain className={className}>{children}</Plain>;
  }
  const MotionTag = motionTag(as);
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={VARIANTS[variant] || VARIANTS.up}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

// Parent for staggered children reveals (stat rows, feature grids, tiles).
export function RevealGroup({ children, as = "div", className, stagger = 0.08, amount = 0.15, ...rest }) {
  const reduce = useReducedMotion();
  const Plain = as;
  if (reduce) {
    return <Plain className={className}>{children}</Plain>;
  }
  const MotionTag = motionTag(as);
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      transition={{ staggerChildren: stagger }}
      variants={{ hidden: {}, visible: {} }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

// Child of RevealGroup — inherits stagger timing from the parent's variants.
export function RevealItem({ children, as = "div", variant = "up", duration = 0.6, className, ...rest }) {
  const reduce = useReducedMotion();
  const Plain = as;
  if (reduce) {
    return <Plain className={className}>{children}</Plain>;
  }
  const MotionTag = motionTag(as);
  return (
    <MotionTag
      className={className}
      variants={VARIANTS[variant] || VARIANTS.up}
      transition={{ duration, ease: EASE }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
