import { startTransition, useEffect, useMemo, useState } from "react";
import { Reveal, RevealGroup, RevealItem } from "./components/Reveal.jsx";
import { MagneticButton } from "./components/MagneticButton.jsx";
import { SpotlightCard } from "./components/SpotlightCard.jsx";
import { KineticHeadline } from "./components/KineticHeadline.jsx";
import { Parallax } from "./components/Parallax.jsx";
import { ScrollStory } from "./components/ScrollStory.jsx";
import { InteractiveShowcase } from "./components/InteractiveShowcase.jsx";

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

const STORY_STEPS = [
  {
    eyebrow: "01 — AURA HEATMAP",
    title: "See exactly where discipline is slipping.",
    body: "Most habit trackers give you a streak number and call it a day. ZCE maps every rep across a live grid, so a quiet slump shows up before it becomes a pattern — not after.",
    visual: (
      <div className="story-mock story-mock-grid">
        <p className="story-mock-label">AURA RANKINGS</p>
        <div className="mock-grid">
          {[92, 44, 78, 30, 61, 85, 20, 55, 70, 40, 95, 15].map((v, i) => (
            <span key={i} className={v > 60 ? "is-hot" : v < 35 ? "is-cold" : ""}></span>
          ))}
        </div>
      </div>
    ),
  },
  {
    eyebrow: "02 — Z.A.N.E. PROTOCOL",
    title: "An AI that pushes back, not one that cheerleads.",
    body: "Switch between Classic, Coach, and Nervous System modes. Zane doesn't do generic affirmations — it reads your pressure data and tells you the one thing you're avoiding.",
    visual: (
      <div className="story-mock story-mock-chat">
        <p className="story-mock-label">Z.A.N.E. — CLASSIC MODE</p>
        <div className="mock-bubble">Stop stalling. Execute now.</div>
        <div className="mock-bubble mock-bubble-r">Ran the drill. Felt rough.</div>
        <div className="mock-bubble">Rough reps still count. Log it, go again.</div>
      </div>
    ),
  },
  {
    eyebrow: "03 — QUEST SYSTEM",
    title: "Built so quitting takes more effort than showing up.",
    body: "Daily missions with real streak pressure. No vague “be your best self” prompts — a queued list of specific reps, timestamped, that either get done or visibly don't.",
    visual: (
      <div className="story-mock story-mock-quests">
        <p className="story-mock-label">TODAY — 3 QUESTS</p>
        <div className="mock-quest is-done"><span></span>Open with eye contact + name</div>
        <div className="mock-quest is-done"><span></span>Run one story rep in public</div>
        <div className="mock-quest"><span></span>Record nightly harvest report</div>
      </div>
    ),
  },
  {
    eyebrow: "04 — RECOVERY PROTOCOL",
    title: "Falling off doesn't end the run.",
    body: "One missed day used to mean starting over. ZCE triggers a focused 72-hour rescue sequence instead — high-priority drills that get momentum back before the streak actually breaks.",
    visual: (
      <div className="story-mock story-mock-recovery">
        <div className="mock-recovery-badge">
          <span className="mock-recovery-time">72h</span>
          <span className="mock-recovery-label">Streak Rescue</span>
        </div>
        <div className="mock-recovery-steps">
          <p>1. Cold-start drill</p>
          <p>2. Social exposure</p>
          <p>3. Nightly reset</p>
        </div>
      </div>
    ),
  },
];

const WHY_ZCE = [
  {
    title: "Proof over vibes",
    body: "Export drills, streaks, and pressure data as clean receipts — not screenshots of a feelings journal.",
    big: true,
  },
  {
    title: "Pressure, on purpose",
    body: "Zane AI is built to apply friction, not remove it.",
  },
  {
    title: "Systems, not willpower",
    body: "A daily loop engineered to work on the days motivation doesn't show up.",
  },
  {
    title: "Streak-survival built in",
    body: "Recovery Protocol catches a slip before it becomes a reset.",
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

const HOW_IT_WORKS = [
  {
    title: "Track",
    body: "Every rep, drill, and pressure spike logs automatically into your Aura Heatmap and Velocity Monitor — no manual check-ins.",
  },
  {
    title: "Get pushed",
    body: "Zane AI reads your data and calls out exactly where you're avoiding pressure, not generic pep talks.",
  },
  {
    title: "Prove it",
    body: "Export clean receipts of your progress and hold a streak record that actually means something.",
  },
];

const FEATURE_GROUPS = [
  { label: "TRACKING & INTELLIGENCE", indexes: [0, 1, 7] },
  { label: "COACHING & DISCIPLINE", indexes: [2, 3, 8] },
  { label: "PROGRESS & IDENTITY", indexes: [4, 5, 6] },
];

const PLAN_GROUPS = [
  {
    label: "Training",
    rows: [
      ["Daily quests", "3/day", "Unlimited"],
      ["AI chat", "10/hr", "Unlimited"],
      ["Drills", "Core set", "All drills"],
    ],
  },
  {
    label: "Systems",
    rows: [
      ["Aura Heatmap", "Included", "Included"],
      ["Velocity Monitor", "Included", "Advanced tuning"],
      ["Themes", "Static dark", "Sky-Sync"],
    ],
  },
  {
    label: "Access & billing",
    rows: [
      ["Leaderboard", "Basic", "Premium tier"],
      ["Proof verification", "Standard", "Advanced"],
      ["Pro billing", "-", "$9.99/mo or $59.99/yr"],
    ],
  },
];

const SUPPORT_ROWS = [
  ["Billing / Subscription", "Apple receipt screenshot + account email", "Email"],
  ["Login / Account Access", "Username + error screenshot", "Email"],
  ["Bug Report", "Screen recording + steps to reproduce", "Email"],
  ["Feature Request", "Use-case and expected behavior", "Instagram or TikTok DM"],
];

const WHY_PRO = [
  {
    title: "Built for people who stopped negotiating with themselves",
    body: "Free mode is enough to test the system. Pro is for people who already know they're staying.",
    big: true,
  },
  {
    title: "No caps, ever",
    body: "Unlimited quests, unlimited AI chat, every drill unlocked.",
  },
  {
    title: "Full Zane access",
    body: "Classic, Coach, and Nervous System modes without hourly limits.",
  },
  {
    title: "Sky-Sync + premium rank",
    body: "Dynamic themes and leaderboard placement that reflects real consistency.",
  },
];

const PLAN_FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your Apple ID subscription settings at least 24 hours before renewal — no phone calls, no retention maze.",
  },
  {
    q: "What happens to my progress if I downgrade?",
    a: "Nothing gets deleted. Your streak, drills, and history stay intact — you just lose unlimited quests, AI chat, and Sky-Sync themes until you resubscribe.",
  },
  {
    q: "Do you offer refunds?",
    a: "Refunds are handled through Apple's standard subscription refund process, not through ZCE directly.",
  },
  {
    q: "Is there a family or multi-device plan?",
    a: "Pro is tied to your Apple ID and works across your own devices signed into the same account. There's no separate family tier right now.",
  },
];

const SUPPORT_FAQ = [
  {
    q: "How fast do you respond?",
    a: "Within 24 hours on average, up to 48 hours during peak periods. Email is the most reliable channel for anything account-related.",
  },
  {
    q: "I lost my streak after switching devices — can it be restored?",
    a: "Progress is tied to your account, not the device. If it didn't sync, email us with your account details and we'll investigate.",
  },
  {
    q: "How do I cancel or change my subscription?",
    a: "Subscriptions are managed entirely through your Apple ID settings, not inside ZCE or through support.",
  },
  {
    q: "Is my data private?",
    a: "Yes — see our Privacy Policy for exactly what's collected and why. We don't sell personal data.",
  },
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
      // Depth-parallax for the floating chips + phone frame only — the
      // stack-scene's own rotation is driven by InteractiveShowcase's drag
      // handling now, not this hover tilt (they'd otherwise fight over the
      // same element's transform).
      document.querySelectorAll("[data-tilt-scene]").forEach((scene) => {
        const layers = Array.from(scene.querySelectorAll("[data-tilt-layer]"));
        if (!layers.length) return;

        const onMove = (event) => {
          const rect = scene.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;

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
        <MagneticButton as="button" strength={0.18} className="btn btn-main nav-cta" onClick={() => { window.location.href = APP_STORE_URL; }}>Get App</MagneticButton>
      </header>

      <main className="site-shell">
        {page.key === "home" ? <HomePage navigate={navigate} /> : null}
        {page.key === "product" ? <ProductPage navigate={navigate} /> : null}
        {page.key === "plans" ? <PlansPage navigate={navigate} /> : null}
        {page.key === "support" ? <SupportPage navigate={navigate} /> : null}
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
        <MagneticButton as="button" className="btn btn-main" onClick={() => { window.location.href = APP_STORE_URL; }}>Open App</MagneticButton>
      </footer>
    </>
  );
}

function HomePage({ navigate }) {
  return (
    <>
      <section className="hero hero-home">
        <div className="hero-copy">
          <Reveal variant="up"><p className="eyebrow">Z.A.N.E. PROTOCOL</p></Reveal>
          <KineticHeadline text="Bruce Wayne discipline. Zero excuses." className="kinetic-h1" />
          <Reveal variant="up" delay={0.12}>
            <p className="lead">ZCE is not motivational fluff. It is a command center for execution: Aura Heatmap, Velocity Monitor, quests, social drills, Sky-Sync themes, and hard Zane AI direction when pressure spikes.</p>
          </Reveal>
          <Reveal variant="up" delay={0.2} className="hero-actions">
            <MagneticButton as="button" className="btn btn-main" onClick={() => { window.location.href = APP_STORE_URL; }}>Download on iOS</MagneticButton>
            <MagneticButton as="a" className="btn btn-ghost" href="/plans" onClick={(event) => { event.preventDefault(); navigate("/plans"); }}>See Free vs Pro</MagneticButton>
          </Reveal>
        </div>
        <Reveal variant="scale" delay={0.15} className="hero-showcase" aria-hidden="true" data-tilt-scene>
          <InteractiveShowcase />
          <p className="showcase-note">Drag · Tap to explore</p>
        </Reveal>
      </section>
      <RevealGroup as="section" className="stats">
        {HOME_STATS.map((item) => (
          <RevealItem as="article" className="stat" key={item.label}>
            <span className="num" data-count={item.count}>0</span>
            <span className="label">{item.label}</span>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal as="div" className="section-head">
        <p className="eyebrow">HOW ZCE EXECUTES</p>
        <h2>Four systems. One pressure loop.</h2>
      </Reveal>
      <ScrollStory steps={STORY_STEPS} />

      <Reveal as="div" className="section-head">
        <p className="eyebrow">WHY ZCE</p>
        <h2>Built different, on purpose.</h2>
      </Reveal>
      <RevealGroup className="bento-grid">
        {WHY_ZCE.map((item) => (
          <RevealItem variant="scale" className={item.big ? "bento-big-wrap" : undefined} key={item.title}>
            <SpotlightCard as="article" className={`bento-card${item.big ? " bento-big" : ""}`}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </SpotlightCard>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal as="div" className="section-head">
        <p className="eyebrow">EXPLORE FURTHER</p>
        <h2>Product, pricing, and support — one tap away.</h2>
      </Reveal>
      <RevealGroup className="page-grid">
        {HOME_TILES.map((tile) => (
          <RevealItem variant="up" key={tile.href}>
            <SpotlightCard as={AppLink} href={tile.href} navigate={navigate} className="page-tile">
              <span className="tile-tag">{tile.tag}</span>
              <h2>{tile.title}</h2>
              <p>{tile.body}</p>
            </SpotlightCard>
          </RevealItem>
        ))}
      </RevealGroup>

      <ClosingCTA navigate={navigate} />
    </>
  );
}

function ClosingCTA({
  navigate,
  eyebrow = "Z.A.N.E. PROTOCOL",
  title = "Discipline isn't a mood. It's a system.",
  body = "Fourteen drills. Hard AI direction. A recovery protocol that catches you before you fall off. Zero motivational fluff.",
  secondaryLabel = "See Free vs Pro",
  secondaryHref = "/plans",
}) {
  return (
    <Reveal as="section" variant="scale" className="closing-cta">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="lead">{body}</p>
      <div className="closing-actions">
        <MagneticButton as="button" className="btn btn-main" onClick={() => { window.location.href = APP_STORE_URL; }}>Download on iOS</MagneticButton>
        <MagneticButton as="a" className="btn btn-ghost" href={secondaryHref} onClick={(event) => { event.preventDefault(); navigate(secondaryHref); }}>{secondaryLabel}</MagneticButton>
      </div>
    </Reveal>
  );
}

function ProductPage({ navigate }) {
  return (
    <>
      <Reveal as="section" className="page-hero">
        <p className="eyebrow">PROTOCOL FEATURES</p>
        <h1>Every module is built to turn hesitation into controlled execution.</h1>
        <p className="lead">No fluff. This system tracks pressure, velocity, consistency, and social reps so progress is visible and unavoidable.</p>
      </Reveal>

      <RevealGroup as="section" className="how-it-works" stagger={0.08}>
        {HOW_IT_WORKS.map((step, i) => (
          <RevealItem as="article" className="how-step glass-card" key={step.title}>
            <span className="how-step-index">{String(i + 1).padStart(2, "0")}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </RevealItem>
        ))}
      </RevealGroup>

      {FEATURE_GROUPS.map((group) => (
        <RevealGroup as="section" className="feature-grid feature-group" stagger={0.05} key={group.label}>
          <Reveal as="p" className="feature-group-label" style={{ gridColumn: "1 / -1" }}>{group.label}</Reveal>
          {group.indexes.map((idx) => {
            const [image, tag, title, body] = PRODUCT_FEATURES[idx];
            return (
              <RevealItem variant="up" key={title}>
                <SpotlightCard as="article" className="feature-block">
                  <div className="feature-media-frame">
                    <Parallax speed={0.6} className="feature-media-parallax">
                      <img className="feature-media" src={`/assets/${image}`} alt={`${title} visual example`} />
                    </Parallax>
                  </div>
                  <span className="tile-tag">{tag}</span>
                  <h2>{title}</h2>
                  <p>{body}</p>
                </SpotlightCard>
              </RevealItem>
            );
          })}
        </RevealGroup>
      ))}

      <ClosingCTA
        navigate={navigate}
        eyebrow="PROTOCOL FEATURES"
        title="Nine systems. Zero guesswork."
        body="Every module above is live in the app today — not a roadmap. See exactly what Free unlocks versus Director mode."
        secondaryLabel="See Free vs Pro"
        secondaryHref="/plans"
      />
    </>
  );
}

function PlansPage({ navigate }) {
  return (
    <>
      <Reveal as="section" className="page-hero">
        <p className="eyebrow">ACCESS TIERS</p>
        <h1>Free gets you started. Pro turns the ceiling into a floor.</h1>
        <p className="lead">Basic mode is clean and usable. Director mode is for people who want no cap on drills, AI reps, and momentum systems.</p>
      </Reveal>
      <RevealGroup as="section" className="plan-grid" stagger={0.1}>
        <RevealItem variant="side">
          <SpotlightCard as="article" className="price-card">
            <p className="tier">FREE</p>
            <h3>$0</h3>
            <p>Baseline training and pressure tracking.</p>
            <ul>
              <li>3 daily quests</li>
              <li>10 AI messages / hour</li>
              <li>Core drills</li>
              <li>Static dark theme</li>
            </ul>
          </SpotlightCard>
        </RevealItem>
        <RevealItem variant="side">
          <SpotlightCard as="article" className="price-card featured">
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
          </SpotlightCard>
        </RevealItem>
      </RevealGroup>

      <RevealGroup className="bento-grid">
        {WHY_PRO.map((item) => (
          <RevealItem variant="scale" className={item.big ? "bento-big-wrap" : undefined} key={item.title}>
            <SpotlightCard as="article" className={`bento-card${item.big ? " bento-big" : ""}`}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </SpotlightCard>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal as="section" className="panel">
        <div className="panel-head">
          <h2>Feature comparison</h2>
          <p>Clean breakdown for people who want the exact line between tiers.</p>
        </div>
        <div className="spec-groups">
          {PLAN_GROUPS.map((group) => (
            <div className="spec-group" key={group.label}>
              <p className="spec-group-label">{group.label}</p>
              <div className="spec-group-head">
                <span></span>
                <span>Free</span>
                <span>Pro</span>
              </div>
              {group.rows.map((row) => (
                <div className="spec-row" key={row[0]}>
                  <span className="spec-name">{row[0]}</span>
                  <span className="spec-free">{row[1]}</span>
                  <span className="spec-pro">{row[2]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="panel">
        <div className="panel-head">
          <h2>Billing questions</h2>
          <p>The stuff people actually ask before upgrading.</p>
        </div>
        <div className="faq-list">
          {PLAN_FAQ.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <ClosingCTA
        navigate={navigate}
        eyebrow="ACCESS TIERS"
        title="Stop testing. Start executing."
        body="Director mode removes every cap ZCE has. Unlimited quests, unlimited Zane AI, every drill unlocked."
        secondaryLabel="See Product"
        secondaryHref="/product"
      />
    </>
  );
}

function SupportPage({ navigate }) {
  return (
    <>
      <Reveal as="section" className="page-hero">
        <p className="eyebrow">CUSTOMER SERVICE</p>
        <h1>Need backup? Contact command directly.</h1>
        <p className="lead">Send clean details and we move fast. Billing, account access, bugs, and feature requests each have a direct lane below.</p>
      </Reveal>
      <RevealGroup as="section" className="feature-grid" stagger={0.08}>
        <RevealItem variant="up">
          <SpotlightCard as="article" className="feature-block">
            <span className="tile-tag">EMAIL</span>
            <h2 className="contact-handle">zaneprotocol@gmail.com</h2>
            <p>Include device type, app version, and what happened. Standard response window: within 24 hours, up to 48 on peak days.</p>
          </SpotlightCard>
        </RevealItem>
        <RevealItem variant="up">
          <SpotlightCard as="article" className="feature-block">
            <span className="tile-tag">INSTAGRAM</span>
            <h2 className="contact-handle">@charismaengine</h2>
            <p>Use DM for short support pings and urgent follow-up on existing tickets.</p>
          </SpotlightCard>
        </RevealItem>
        <RevealItem variant="up">
          <SpotlightCard as="article" className="feature-block">
            <span className="tile-tag">TIKTOK</span>
            <h2 className="contact-handle">@charismaengine</h2>
            <p>Message us there if Instagram is slow. Include your support email in line one.</p>
          </SpotlightCard>
        </RevealItem>
      </RevealGroup>
      <Reveal as="section" className="panel">
        <div className="panel-head">
          <h2>Issue routing</h2>
          <p>Send the right details so resolution speed stays high.</p>
        </div>
        <RevealGroup className="routing-grid" stagger={0.06}>
          {SUPPORT_ROWS.map((row) => (
            <RevealItem variant="up" key={row[0]}>
              <div className="routing-card">
                <p className="routing-type">{row[0]}</p>
                <p className="routing-send"><span>Send this</span>{row[1]}</p>
                <p className="routing-channel"><span>Best channel</span>{row[2]}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Reveal>

      <Reveal as="section" className="panel">
        <div className="panel-head">
          <h2>Common questions</h2>
          <p>Check here before sending a ticket — might save you the wait.</p>
        </div>
        <div className="faq-list">
          {SUPPORT_FAQ.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <ClosingCTA
        navigate={navigate}
        eyebrow="CUSTOMER SERVICE"
        title="Still stuck? We're one message away."
        body="Email is the fastest lane for anything account-related. Social DMs work best for quick pings."
        secondaryLabel="See Product"
        secondaryHref="/product"
      />
    </>
  );
}

function PrivacyPage() {
  return (
    <section className="page-hero">
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
    <section className="page-hero">
      <p className="eyebrow">LEGAL</p>
      <h1>Terms of Use</h1>
      <p className="lead">ZCE is provided as-is for personal use. By using the app, you agree to these terms and Apple platform rules.</p>
      <p className="lead">Auto-renewable subscriptions: ZCE Pro Monthly (1 month, $9.99) and ZCE Pro Yearly (1 year, $59.99). Payment is charged to your Apple ID at confirmation. Subscription renews automatically unless canceled at least 24 hours before end of current period. Manage subscriptions in Apple account settings.</p>
      <p className="lead">For Apple Standard EULA terms, see: <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">https://www.apple.com/legal/internet-services/itunes/dev/stdeula/</a>.</p>
    </section>
  );
}
