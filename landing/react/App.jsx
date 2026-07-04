import { startTransition, useEffect, useMemo, useState } from "react";

const APP_STORE_URL = "https://apps.apple.com/app/id6759347826";

const HOME_STATS = [
  { count: 14, label: "core drills", delay: 0 },
  { count: 10, label: "free AI msgs / hr", delay: 60 },
  { count: 24, label: "hour pressure loop", delay: 120 },
  { count: 6, label: "core system modules", delay: 180 },
];

const HOME_TILES = [
  {
    href: "/product",
    tag: "PROTOCOL FEATURES",
    title: "Product",
    body: "Aura Heatmap, Velocity Monitor, drills overview, quests, Share the Protocol tools, Sky-Sync themes, and Zane AI protocol.",
    delay: 20,
  },
  {
    href: "/plans",
    tag: "ACCESS",
    title: "Free vs Pro",
    body: "Clear breakdown of the free experience and what Director mode unlocks.",
    delay: 80,
  },
  {
    href: "/support",
    tag: "SUPPORT",
    title: "Customer Service",
    body: "Email + social support lines for billing, account access, bugs, and feature requests.",
    delay: 140,
  },
];

const PRODUCT_FEATURES = [
  ["feature-aura.svg", "AURA", "Aura Heatmap", "Your consistency shows up on a visual grid so you can see exactly where discipline is hot or slipping cold."],
  ["feature-velocity.svg", "VELOCITY", "Velocity Monitor", "Tracks execution tempo, mission output, and momentum drift so you can correct fast before you fall off pace."],
  ["feature-drills.svg", "DRILLS", "Drills Overview", "Mirror, Eye Combat, banter, story, and high-pressure social reps designed to force real-world confidence gains."],
  ["feature-zane.svg", "Z.A.N.E.", "Zane AI Channel", "Classic, Coach, and Nervous System modes with hard-edged guidance, tactical language, and execution-first feedback."],
  ["feature-quests.svg", "QUESTS", "Quest System", "Daily missions and streak pressure loop that keep you in the game when discipline starts to fade."],
  ["feature-skysync.svg", "THEMES", "Sky-Sync Themes", "Premium dynamic visual modes tied to your progression and app state for that modern high-tech command-center feel. Example above: static dark vs dynamic Sky-Sync gradient."],
  ["feature-share.svg", "SHARE", "Share the Protocol", "Capture and export your wins, drill proof, and progress visuals to post clean receipts and keep your circle accountable."],
  ["feature-analysis.svg", "ANALYSIS", "AI Analysis Engine", "Breaks down your habits, pressure patterns, and weak links so the app can give exact next moves instead of generic advice."],
  ["feature-recovery.svg", "RECOVERY", "Recovery Protocol", "When momentum drops, the app triggers a focused rescue sequence with high-priority drills to restore streak and execution speed fast."],
];

const PLAN_ROWS = [
  ["Daily quests", "3/day", "Unlimited"],
  ["AI chat", "10/hr", "Unlimited"],
  ["Drills", "Core set", "All drills"],
  ["Aura Heatmap", "Included", "Included"],
  ["Velocity Monitor", "Included", "Advanced tuning"],
  ["Themes", "Static dark", "Sky-Sync"],
  ["Leaderboard", "Basic", "Premium tier"],
  ["Proof verification", "Standard", "Advanced"],
  ["Pro billing options", "-", "$9.99/month or $59.99/year"],
];

const SUPPORT_ROWS = [
  ["Billing / Subscription", "Apple receipt screenshot + account email", "Email"],
  ["Login / Account Access", "Username + error screenshot", "Email"],
  ["Bug Report", "Screen recording + steps to reproduce", "Email"],
  ["Feature Request", "Use-case and expected behavior", "Instagram or TikTok DM"],
];

const PAGES = {
  "/": {
    key: "home",
    title: "ZCE | Confidence OS",
    description: "ZCE is the confidence operating system: Z.A.N.E. Protocol, Aura Heatmap, Velocity Monitor, drills, quests, Sky-Sync themes, and hard AI pressure coaching.",
    footerLabel: "ZCE Protocol",
    showDataGrid: true,
  },
  "/product": {
    key: "product",
    title: "ZCE | Product",
    description: "Explore ZCE core systems: Aura Heatmap, Velocity Monitor, drills overview, Zane AI, quests, and Sky-Sync themes.",
    footerLabel: "ZCE Product",
    showDataGrid: false,
  },
  "/plans": {
    key: "plans",
    title: "ZCE | Free vs Pro",
    description: "Compare the ZCE free plan and Pro Director access.",
    footerLabel: "ZCE Access",
    showDataGrid: false,
  },
  "/support": {
    key: "support",
    title: "ZCE | Support",
    description: "ZCE customer service and support channels for billing, account access, bug reports, and feature requests.",
    footerLabel: "ZCE Support",
    showDataGrid: false,
  },
  "/privacy": {
    key: "privacy",
    title: "ZCE | Privacy Policy",
    description: "ZCE Privacy Policy",
    footerLabel: "ZCE Privacy",
    showDataGrid: false,
  },
  "/terms": {
    key: "terms",
    title: "ZCE | Terms of Use",
    description: "ZCE Terms of Use",
    footerLabel: "ZCE Terms",
    showDataGrid: false,
  },
};

function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  if (pathname === "/faq" || pathname === "/intel") return "/support";
  return pathname.replace(/\/+$/, "");
}

function usePathname() {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => {
      startTransition(() => {
        setPathname(normalizePath(window.location.pathname));
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return [
    pathname,
    (href) => {
      const next = normalizePath(href);
      if (next === pathname) return;
      window.history.pushState({}, "", next);
      startTransition(() => setPathname(next));
      window.scrollTo(0, 0);
    },
  ];
}

function AppLink({ href, navigate, className, children, target, rel, onClick, ...rest }) {
  const isExternal = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={(event) => {
        if (onClick) onClick(event);
        if (
          event.defaultPrevented ||
          isExternal ||
          target === "_blank" ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        navigate(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

function NavItem({ href, label, pageKey, navigate }) {
  const active = (href === "/" && pageKey === "home") || href.replace("/", "") === pageKey;
  return (
    <AppLink href={href} navigate={navigate} className={active ? "is-active" : undefined}>
      {label}
    </AppLink>
  );
}

function SocialLink({ href, label, icon }) {
  return (
    <a className="social-link" href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {icon === "instagram" ? (
        <svg className="social-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5.25" stroke="currentColor" strokeWidth="1.8"></rect>
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8"></circle>
          <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor"></circle>
        </svg>
      ) : (
        <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M14.5 2h2.8c.2 2 1.8 3.5 3.7 3.6v2.9a6.4 6.4 0 0 1-3.7-1.2v7.6a6.3 6.3 0 1 1-6.3-6.3c.4 0 .9 0 1.3.1v3a3.3 3.3 0 0 0-1.3-.3 3.3 3.3 0 1 0 3.5 3.3z"></path>
        </svg>
      )}
      <span className="social-handle">@charismaengine</span>
    </a>
  );
}

function useDocumentMeta(page) {
  useEffect(() => {
    document.title = page.title;
    document.body.setAttribute("data-page", page.key);
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", page.description);
  }, [page]);
}

function useInteractiveEffects(pageKey) {
  useEffect(() => {
    const cleanups = [];
    const reveals = Array.from(document.querySelectorAll(".reveal"));
    reveals.forEach((el) => {
      const delay = Number(el.getAttribute("data-delay") || 0);
      if (delay) el.style.setProperty("--delay", String(delay));
      if (!el.classList.contains("is-visible")) {
        el.classList.remove("is-visible");
      }
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -10% 0px" }
    );
    reveals.forEach((el) => {
      if (!el.classList.contains("is-visible")) revealObserver.observe(el);
    });
    cleanups.push(() => revealObserver.disconnect());

    const animateCounter = (el) => {
      const target = Number(el.getAttribute("data-count") || 0);
      if (!target) return;
      const duration = 1100;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const numObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          numObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.7 }
    );
    document.querySelectorAll(".num[data-count]").forEach((el) => numObserver.observe(el));
    cleanups.push(() => numObserver.disconnect());

    const updateMouseVars = (event) => {
      document.body.style.setProperty("--mx", `${event.clientX}px`);
      document.body.style.setProperty("--my", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", updateMouseVars, { passive: true });
    cleanups.push(() => window.removeEventListener("pointermove", updateMouseVars));

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion && pageKey === "home") {
      document.querySelectorAll("[data-tilt-scene]").forEach((scene) => {
        const card = scene.querySelector(".stack-scene");
        const layers = Array.from(scene.querySelectorAll("[data-tilt-layer]"));
        if (!card) return;

        const onMove = (event) => {
          const rect = scene.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          const tiltY = (x - 0.5) * 18;
          const tiltX = (0.5 - y) * 14;
          card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
          card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);

          layers.forEach((el) => {
            const level = el.getAttribute("data-tilt-layer");
            const depth = level === "front" ? 22 : level === "mid" ? 14 : 8;
            const z = level === "front" ? 72 : level === "mid" ? 38 : 0;
            const dx = (x - 0.5) * depth;
            const dy = (y - 0.5) * depth;
            el.style.transform = `translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,${z}px)`;
          });
        };

        const onLeave = () => {
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
          layers.forEach((el) => {
            el.style.transform = "";
          });
        };

        scene.addEventListener("pointermove", onMove);
        scene.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          scene.removeEventListener("pointermove", onMove);
          scene.removeEventListener("pointerleave", onLeave);
        });
      });
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [pageKey]);
}

export default function App() {
  const [pathname, navigate] = usePathname();
  const page = useMemo(() => PAGES[pathname] || PAGES["/"], [pathname]);
  const [navOpen, setNavOpen] = useState(false);

  useDocumentMeta(page);
  useInteractiveEffects(page.key);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 860) setNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <div className="noise"></div>
      {page.showDataGrid ? <div className="data-grid"></div> : null}
      <div className="glow glow-a"></div>
      <div className="glow glow-b"></div>

      <header className="nav">
        <AppLink className="brand" href="/" navigate={navigate}>
          <img src="/assets/logo.png" alt="ZCE logo" />
          <span>ZCE</span>
        </AppLink>
        <button
          className={`nav-toggle${navOpen ? " is-open" : ""}`}
          type="button"
          aria-label="Toggle navigation"
          aria-controls="site-nav"
          aria-expanded={navOpen ? "true" : "false"}
          onClick={() => setNavOpen((value) => !value)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav className={`nav-links nav-tabs${navOpen ? " is-open" : ""}`} id="site-nav">
          <NavItem href="/" label="Home" pageKey={page.key} navigate={navigate} />
          <NavItem href="/product" label="Product" pageKey={page.key} navigate={navigate} />
          <NavItem href="/plans" label="Free vs Pro" pageKey={page.key} navigate={navigate} />
          <NavItem href="/support" label="Support" pageKey={page.key} navigate={navigate} />
        </nav>
        <button className="btn btn-main nav-cta" onClick={() => { window.location.href = APP_STORE_URL; }}>Get App</button>
      </header>

      <main className="site-shell">
        {page.key === "home" ? <HomePage navigate={navigate} /> : null}
        {page.key === "product" ? <ProductPage /> : null}
        {page.key === "plans" ? <PlansPage /> : null}
        {page.key === "support" ? <SupportPage /> : null}
        {page.key === "privacy" ? <PrivacyPage /> : null}
        {page.key === "terms" ? <TermsPage /> : null}
      </main>

      <footer className="footer">
        <span>{page.footerLabel}</span>
        <span className="footer-social">
          <SocialLink href="https://www.instagram.com/charismaengine/" label="Instagram @charismaengine" icon="instagram" />
          <SocialLink href="https://www.tiktok.com/@charismaengine" label="TikTok @charismaengine" icon="tiktok" />
        </span>
        <span className="footer-legal">
          <AppLink href="/privacy" navigate={navigate}>Privacy Policy</AppLink>
          {" · "}
          <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer">Terms of Use</a>
        </span>
        <button className="btn btn-main" onClick={() => { window.location.href = APP_STORE_URL; }}>Open App</button>
      </footer>
    </>
  );
}

function HomePage({ navigate }) {
  return (
    <>
      <section className="hero hero-home reveal">
        <div className="hero-copy">
          <p className="eyebrow">Z.A.N.E. PROTOCOL</p>
          <h1>Bruce Wayne discipline. Zero excuses.</h1>
          <p className="lead">ZCE is not motivational fluff. It is a command center for execution: Aura Heatmap, Velocity Monitor, quests, social drills, Sky-Sync themes, and hard Zane AI direction when pressure spikes.</p>
          <div className="hero-actions">
            <button className="btn btn-main" onClick={() => { window.location.href = APP_STORE_URL; }}>Download on iOS</button>
            <AppLink className="btn btn-ghost" href="/plans" navigate={navigate}>See Free vs Pro</AppLink>
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
                  <span style={{ "--w": "88%" }}></span>
                  <span style={{ "--w": "74%" }}></span>
                  <span style={{ "--w": "62%" }}></span>
                  <span style={{ "--w": "93%" }}></span>
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
      <section className="stats reveal">
        {HOME_STATS.map((item) => (
          <article className="stat reveal" data-delay={item.delay} key={item.label}>
            <span className="num" data-count={item.count}>0</span>
            <span className="label">{item.label}</span>
          </article>
        ))}
      </section>
      <section className="page-grid reveal">
        {HOME_TILES.map((tile) => (
          <AppLink key={tile.href} href={tile.href} navigate={navigate} className="page-tile reveal" data-delay={tile.delay}>
            <span className="tile-tag">{tile.tag}</span>
            <h2>{tile.title}</h2>
            <p>{tile.body}</p>
          </AppLink>
        ))}
      </section>
    </>
  );
}

function ProductPage() {
  return (
    <>
      <section className="page-hero reveal">
        <p className="eyebrow">PROTOCOL FEATURES</p>
        <h1>Every module is built to turn hesitation into controlled execution.</h1>
        <p className="lead">No fluff. This system tracks pressure, velocity, consistency, and social reps so progress is visible and unavoidable.</p>
      </section>
      <section className="feature-grid">
        {PRODUCT_FEATURES.map(([image, tag, title, body], index) => (
          <article className="feature-block reveal" data-delay={index * 70} key={title}>
            <img className="feature-media" src={`/assets/${image}`} alt={`${title} visual example`} />
            <span className="tile-tag">{tag}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
    </>
  );
}

function PlansPage() {
  return (
    <>
      <section className="page-hero reveal">
        <p className="eyebrow">ACCESS TIERS</p>
        <h1>Free gets you started. Pro turns the ceiling into a floor.</h1>
        <p className="lead">Basic mode is clean and usable. Director mode is for people who want no cap on drills, AI reps, and momentum systems.</p>
      </section>
      <section className="plan-grid reveal">
        <article className="price-card">
          <p className="tier">FREE</p>
          <h3>$0</h3>
          <p>Baseline training and pressure tracking.</p>
          <ul>
            <li>3 daily quests</li>
            <li>10 AI messages / hour</li>
            <li>Core drills</li>
            <li>Static dark theme</li>
          </ul>
        </article>
        <article className="price-card featured">
          <p className="tier">PRO</p>
          <h3>$9.99/mo or $59.99/yr</h3>
          <p>Director clearance for full access.</p>
          <ul>
            <li>Unlimited Z.A.N.E. chat</li>
            <li>Unlimited daily quests</li>
            <li>All drills unlocked</li>
            <li>Sky-Sync themes + premium rank</li>
            <li>Billing: monthly or yearly</li>
          </ul>
        </article>
      </section>
      <section className="panel reveal">
        <div className="panel-head">
          <h2>Feature Comparison</h2>
          <p>Clean breakdown for people who want the exact line between tiers.</p>
        </div>
        <div className="compare-wrap">
          <table className="compare-table" aria-label="Free vs Pro comparison">
            <thead>
              <tr><th>Feature</th><th>Free</th><th>Pro</th></tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SupportPage() {
  return (
    <>
      <section className="page-hero reveal">
        <p className="eyebrow">CUSTOMER SERVICE</p>
        <h1>Need backup? Contact command directly.</h1>
        <p className="lead">Send clean details and we move fast. Billing, account access, bugs, and feature requests each have a direct lane below.</p>
      </section>
      <section className="feature-grid">
        <article className="feature-block reveal">
          <span className="tile-tag">EMAIL</span>
          <h2 className="contact-handle">zaneprotocol@gmail.com</h2>
          <p>Include device type, app version, and what happened. Standard response window: within 24 hours, up to 48 on peak days.</p>
        </article>
        <article className="feature-block reveal" data-delay="70">
          <span className="tile-tag">INSTAGRAM</span>
          <h2 className="contact-handle">@charismaengine</h2>
          <p>Use DM for short support pings and urgent follow-up on existing tickets.</p>
        </article>
        <article className="feature-block reveal" data-delay="140">
          <span className="tile-tag">TIKTOK</span>
          <h2 className="contact-handle">@charismaengine</h2>
          <p>Message us there if Instagram is slow. Include your support email in line one.</p>
        </article>
      </section>
      <section className="panel reveal">
        <div className="panel-head">
          <h2>Issue Routing</h2>
          <p>Send the right details so resolution speed stays high.</p>
        </div>
        <div className="compare-wrap">
          <table className="compare-table" aria-label="Support routing">
            <thead>
              <tr><th>Issue Type</th><th>Send This</th><th>Best Channel</th></tr>
            </thead>
            <tbody>
              {SUPPORT_ROWS.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function PrivacyPage() {
  return (
    <section className="page-hero reveal is-visible">
      <p className="eyebrow">LEGAL</p>
      <h1>Privacy Policy</h1>
      <p className="lead">Effective date: April 26, 2026</p>
      <p className="lead">ZCE collects account data and app usage data needed to provide features like authentication, subscriptions, progress tracking, and support. We do not sell personal data. Data may be processed by service providers used to run the app (for example Firebase, RevenueCat, and Apple billing).</p>
      <p className="lead">You can request account deletion from inside the app settings. Contact: zaneprotocol@gmail.com.</p>
    </section>
  );
}

function TermsPage() {
  return (
    <section className="page-hero reveal is-visible">
      <p className="eyebrow">LEGAL</p>
      <h1>Terms of Use</h1>
      <p className="lead">ZCE is provided as-is for personal use. By using the app, you agree to these terms and Apple platform rules.</p>
      <p className="lead">Auto-renewable subscriptions: ZCE Pro Monthly (1 month, $9.99) and ZCE Pro Yearly (1 year, $59.99). Payment is charged to your Apple ID at confirmation. Subscription renews automatically unless canceled at least 24 hours before end of current period. Manage subscriptions in Apple account settings.</p>
      <p className="lead">For Apple Standard EULA terms, see: <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">https://www.apple.com/legal/internet-services/itunes/dev/stdeula/</a>.</p>
    </section>
  );
}
