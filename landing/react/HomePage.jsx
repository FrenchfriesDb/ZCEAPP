

import { useEffect } from "react";
import logo from "../assets/logo.png";

export default function HomePage() {
  useEffect(() => {
    // Move app.js logic into React
    const appStoreUrl = 'https://apps.apple.com/app/id6759347826';
    function openApp() {
      window.location.href = appStoreUrl;
    }
    document.querySelectorAll('[data-open-app]').forEach(function (el) {
      el.addEventListener('click', openApp);
    });
    // ...other app.js logic can be ported here as needed...
    return () => {
      document.querySelectorAll('[data-open-app]').forEach(function (el) {
        el.removeEventListener('click', openApp);
      });
    };
  }, []);

  return (
    <div data-page="home">
      <div className="noise"></div>
      <div className="data-grid"></div>
      <div className="glow glow-a"></div>
      <div className="glow glow-b"></div>

      <header className="nav">
        <a className="brand" href="/">
          <img src={logo} alt="ZCE logo" />
          <span>ZCE</span>
        </a>
        <button className="nav-toggle" type="button" aria-label="Toggle navigation" aria-controls="site-nav" aria-expanded="false" data-nav-toggle>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav className="nav-links nav-tabs" id="site-nav" data-nav-menu>
          <a href="/" data-nav="home">Home</a>
          <a href="/product" data-nav="product">Product</a>
          <a href="/plans" data-nav="plans">Free vs Pro</a>
          <a href="/support" data-nav="support">Support</a>
        </nav>
        <button className="btn btn-main nav-cta" data-open-app>Get App</button>
      </header>

      <main className="site-shell">
        <section className="hero hero-home reveal">
          <div className="hero-copy">
            <p className="eyebrow">Z.A.N.E. PROTOCOL</p>
            <h1>Bruce Wayne discipline. Street-level charisma. Zero excuses.</h1>
            <p className="lead">
              ZCE is not motivational fluff. It is a command center for execution: Aura Heatmap, Velocity Monitor, quests, social drills, Sky-Sync themes, and hard Zane AI direction when pressure spikes.
            </p>
            <div className="hero-actions">
              <button className="btn btn-main" data-open-app>Download on iOS</button>
              <a className="btn btn-ghost" href="/plans">See Free vs Pro</a>
            </div>
          </div>

          <div className="hero-showcase reveal" data-delay="120" aria-hidden="true" data-tilt-scene>
            <div className="stack-scene">
              <div className="glass-phone" data-tilt-layer="base">
                <div className="phone-topbar"></div>
                <div className="phone-screen">
                  <div className="screen-glow"></div>
                  <div className="screen-title">Aura Rankings</div>
                  <div className="screen-bars">
                    <span style={{"--w": "88%"}}></span>
                    <span style={{"--w": "74%"}}></span>
                    <span style={{"--w": "62%"}}></span>
                    <span style={{"--w": "93%"}}></span>
                  </div>
                </div>
              </div>

              <div className="float-chip chip-streak" data-tilt-layer="front">Streak +1</div>
              <div className="float-chip chip-director" data-tilt-layer="front">Director</div>
              <div className="float-chip chip-sync" data-tilt-layer="mid">Sky-Sync Active</div>
            </div>
            <p className="showcase-note">Operating table preview</p>
          </div>
        </section>
        {/* ...rest of the sections... */}
      </main>
    </div>
  );
}
