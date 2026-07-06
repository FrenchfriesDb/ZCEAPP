import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, animate, useReducedMotion } from "motion/react";

const SCREENS = [
  {
    title: "Aura Rankings",
    body: (
      <div className="screen-bars">
        <span style={{ "--w": "88%" }}></span>
        <span style={{ "--w": "74%" }}></span>
        <span style={{ "--w": "62%" }}></span>
        <span style={{ "--w": "93%" }}></span>
      </div>
    ),
  },
  {
    title: "Z.A.N.E. — Classic",
    body: (
      <div className="screen-chat">
        <p className="screen-bubble">Stop stalling. Execute now.</p>
        <p className="screen-bubble screen-bubble-r">Ran the drill.</p>
        <p className="screen-bubble">Log it, go again.</p>
      </div>
    ),
  },
  {
    title: "Streak Rescue",
    body: (
      <div className="screen-streak">
        <span className="screen-streak-num">72h</span>
        <span className="screen-streak-label">Recovery window</span>
      </div>
    ),
  },
];

// Drag horizontally to rotate the phone in 3D, with momentum on release.
// A tap (pointer down/up with negligible movement) cycles the screen instead.
// Vertical mouse position still drives a subtle hover-tilt when not dragging.
export function InteractiveShowcase() {
  const reduce = useReducedMotion();
  const sceneRef = useRef(null);
  const dragRef = useRef({ startX: 0, moved: false, lastX: 0, lastTime: 0, velocity: 0 });
  const [screenIndex, setScreenIndex] = useState(0);

  const rotateY = useMotionValue(0);
  const rotateX = useSpring(0, { stiffness: 150, damping: 20 });

  if (reduce) {
    const screen = SCREENS[0];
    return (
      <div className="stack-scene">
        <div className="glass-phone">
          <div className="phone-topbar"></div>
          <div className="phone-screen">
            <div className="screen-glow"></div>
            <div className="screen-title">{screen.title}</div>
            {screen.body}
          </div>
        </div>
        <div className="float-chip chip-streak">Streak +1</div>
        <div className="float-chip chip-director">Director</div>
        <div className="float-chip chip-sync">Sky-Sync Active</div>
      </div>
    );
  }

  const handlePointerDown = (event) => {
    dragRef.current = {
      startX: event.clientX,
      moved: false,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const info = dragRef.current;
    if (event.buttons !== 1) {
      const rect = sceneRef.current.getBoundingClientRect();
      const y = (event.clientY - rect.top) / rect.height;
      rotateX.set((0.5 - y) * 10);
      return;
    }
    const dx = event.clientX - info.startX;
    if (Math.abs(dx) > 6) info.moved = true;
    const now = performance.now();
    const dt = now - info.lastTime || 16;
    const frameDx = event.clientX - info.lastX;
    info.velocity = (frameDx / dt) * 1000;
    info.lastX = event.clientX;
    info.lastTime = now;
    rotateY.set(rotateY.get() + frameDx * 0.4);
  };

  const handlePointerUp = () => {
    const info = dragRef.current;
    if (!info.moved) {
      setScreenIndex((i) => (i + 1) % SCREENS.length);
      return;
    }
    animate(rotateY, rotateY.get() + info.velocity * 0.15, {
      type: "inertia",
      velocity: info.velocity,
      power: 0.4,
      timeConstant: 300,
      restDelta: 0.5,
      min: -50,
      max: 50,
      bounceStiffness: 200,
      bounceDamping: 18,
    });
  };

  const handlePointerLeave = () => {
    rotateX.set(0);
  };

  const screen = SCREENS[screenIndex];

  return (
    <motion.div
      ref={sceneRef}
      className="stack-scene"
      style={{ rotateX, rotateY, transformPerspective: 1200, touchAction: "none", cursor: "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <div className="glass-phone" data-tilt-layer="base">
        <div className="phone-topbar"></div>
        <motion.div
          className="phone-screen"
          key={screenIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="screen-glow"></div>
          <div className="screen-title">{screen.title}</div>
          {screen.body}
        </motion.div>
      </div>
      <div className="float-chip chip-streak" data-tilt-layer="front">Streak +1</div>
      <div className="float-chip chip-director" data-tilt-layer="front">Director</div>
      <div className="float-chip chip-sync" data-tilt-layer="mid">Sky-Sync Active</div>
      <div className="screen-dots" aria-hidden="true">
        {SCREENS.map((_, i) => (
          <span key={i} className={i === screenIndex ? "is-active" : ""}></span>
        ))}
      </div>
    </motion.div>
  );
}
