// Cursor-tracked gold spotlight along the card's border. Uses
// event.currentTarget rather than a ref, so it works with plain elements and
// with custom components (like the app's AppLink) that don't forward refs.
// Sets CSS custom properties directly (no React state) so the pointer never
// triggers a re-render — same pattern the page already uses for the
// body-level --mx/--my spotlight.
export function SpotlightCard({ children, className, as: Component = "div", ...rest }) {
  const handlePointerMove = (event) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    el.style.setProperty("--spot-o", "1");
  };

  const handlePointerLeave = (event) => {
    event.currentTarget.style.setProperty("--spot-o", "0");
  };

  return (
    <Component
      className={`spotlight-card${className ? ` ${className}` : ""}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...rest}
    >
      {children}
    </Component>
  );
}
