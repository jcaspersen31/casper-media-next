export default function Home() {
  const products = [
    {
      name: "FindUrDinner",
      icon: "🍜",
      badge: "Live",
      badgeClass: "badge-live",
      featured: true,
      desc: "Stop the \"where should we eat?\" debate. FindUrDinner randomly picks a local restaurant while filtering out cuisines you're not feeling. Restaurant owners can list their menus and run promotions.",
      tags: ["React Native", "iOS & Android", "Node.js", "PostgreSQL", "Google Maps"],
      link: "https://findurdinner.com",
      linkLabel: "findurdinner.com",
    },
    {
      name: "WorksiteTrack",
      icon: "🏗",
      badge: "Beta",
      badgeClass: "badge-dev",
      featured: true,
      desc: "A full construction management platform built for the field. Daily reports, PinPoint drawing markup, prevailing wage compliance, change orders, purchasing, tool inventory, and more — all in one place.",
      tags: ["React", "React Native", "Node.js", "Prisma", "PostgreSQL"],
      link: "https://worksitetrack.com",
      linkLabel: "worksitetrack.com",
    },
    {
      name: "Your Garage Log",
      icon: "🚗",
      badge: "In development",
      badgeClass: "badge-building",
      featured: false,
      desc: "Parts tracking, build journals, and tuning logs for car restorers, restomod builders, and track-day enthusiasts. Research parts anywhere, buy when ready, keep the history forever.",
      tags: ["React Native", "iOS & Android"],
      link: null,
    },
  ];

  const clientWork = [
    {
      name: "Gristmill Arms",
      icon: "🪵",
      desc: "Product catalog and deal-spinner site for a rustic gun shop in a historic gristmill. Showcases inventory with pricing, sale prices, and a daily spin wheel for special promotions.",
      tags: ["Next.js", "PostgreSQL"],
    },
  ];

  const stack = [
    ["React Native", "Mobile apps"],
    ["React / Next.js", "Web frontends"],
    ["Node.js", "API & backend"],
    ["PostgreSQL", "Primary database"],
    ["Prisma", "ORM & migrations"],
    ["Railway", "API hosting"],
    ["Vercel", "Frontend hosting"],
    ["Stripe", "Payments"],
  ];

  return (
    <>
      <style>{`
        nav {
          position: sticky; top: 0;
          background: rgba(13,13,13,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 0.5px solid var(--border);
          z-index: 100; padding: 0 24px;
        }
        .nav-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center;
          justify-content: space-between; height: 64px;
        }
        .logo { font-size: 18px; font-weight: 700; text-decoration: none; color: var(--text); letter-spacing: -0.3px; }
        .logo span { color: var(--orange); }
        .nav-links { display: flex; gap: 28px; list-style: none; }
        .nav-links a { font-size: 14px; color: var(--text-muted); text-decoration: none; transition: color 0.2s; }
        .nav-links a:hover { color: var(--text); }
        .nav-cta { background: var(--orange); color: white; padding: 8px 18px; border-radius: 999px; font-size: 13px; font-weight: 600; text-decoration: none; transition: background 0.2s; }
        .nav-cta:hover { background: var(--orange-light); color: white; }

        .hero { padding: 120px 24px 100px; text-align: center; border-bottom: 0.5px solid var(--border); position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(216,90,48,0.12) 0%, transparent 70%); pointer-events: none; }
        .hero-inner { max-width: 700px; margin: 0 auto; position: relative; }
        .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: var(--orange-dim); border: 0.5px solid rgba(216,90,48,0.3); color: var(--orange-light); font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 6px 16px; border-radius: 999px; margin-bottom: 28px; }
        .hero h1 { font-size: clamp(40px, 7vw, 72px); font-weight: 800; line-height: 1.05; letter-spacing: -1.5px; margin-bottom: 20px; color: var(--text); }
        .hero h1 span { color: var(--orange); }
        .hero p { font-size: clamp(16px, 2.5vw, 20px); color: var(--text-muted); max-width: 500px; margin: 0 auto 48px; line-height: 1.6; }
        .hero-stats { display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; }
        .hero-stat-num { font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
        .hero-stat-label { font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.8px; margin-top: 2px; }

        .section-inner { max-width: 1100px; margin: 0 auto; }
        .section-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--orange); margin-bottom: 12px; }
        .section-title { font-size: clamp(28px, 4vw, 42px); font-weight: 800; letter-spacing: -0.5px; margin-bottom: 12px; color: var(--text); }
        .section-sub { font-size: 15px; color: var(--text-muted); max-width: 520px; line-height: 1.7; margin-bottom: 40px; }

        .products { padding: 80px 24px; border-bottom: 0.5px solid var(--border); }
        .featured-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
        .secondary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }

        .project-card { background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 28px; text-decoration: none; transition: border-color 0.2s, background 0.2s; display: flex; flex-direction: column; color: var(--text); }
        .project-card:hover { border-color: var(--border-hover); background: var(--surface2); }
        .project-card.featured { border-color: rgba(216,90,48,0.25); }
        .project-card.featured:hover { border-color: rgba(216,90,48,0.45); }
        .project-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .project-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--orange-dim); border: 0.5px solid rgba(216,90,48,0.2); display: flex; align-items: center; justify-content: center; font-size: 22px; }
        .project-badge { font-size: 10px; font-weight: 600; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
        .badge-live { background: rgba(59,109,17,0.2); color: #7DC443; border: 0.5px solid rgba(59,109,17,0.3); }
        .badge-dev { background: rgba(216,90,48,0.15); color: var(--orange-light); border: 0.5px solid rgba(216,90,48,0.2); }
        .badge-building { background: rgba(136,136,136,0.1); color: var(--text-dim); border: 0.5px solid var(--border); }
        .project-name { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 8px; letter-spacing: -0.3px; }
        .project-desc { font-size: 14px; color: var(--text-muted); line-height: 1.65; margin-bottom: 16px; flex: 1; }
        .project-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 0; }
        .project-tag { font-size: 11px; color: var(--text-dim); background: var(--surface2); border: 0.5px solid var(--border); padding: 3px 10px; border-radius: 999px; }
        .project-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 20px; font-size: 13px; font-weight: 600; color: var(--orange-light); }
        .project-link::after { content: '→'; }

        .client-work { padding: 80px 24px; border-bottom: 0.5px solid var(--border); }
        .client-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .client-card { background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 28px; }
        .client-card:hover { border-color: var(--border-hover); background: var(--surface2); }
        .client-icon { font-size: 28px; margin-bottom: 12px; }
        .client-name { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px; letter-spacing: -0.3px; }
        .client-desc { font-size: 14px; color: var(--text-muted); line-height: 1.65; margin-bottom: 16px; }
        .client-placeholder { border-style: dashed; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 160px; opacity: 0.6; }
        .client-placeholder p { font-size: 14px; color: var(--text-muted); line-height: 1.6; }
        .client-placeholder a { color: var(--orange-light); text-decoration: none; }

        .about { padding: 80px 24px; border-bottom: 0.5px solid var(--border); }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .about-text h2 { font-size: clamp(28px, 4vw, 40px); font-weight: 800; letter-spacing: -0.5px; margin-bottom: 20px; line-height: 1.1; }
        .about-text p { font-size: 15px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.7; }
        .about-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .stat-card { background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--radius); padding: 20px; }
        .stat-num { font-size: 32px; font-weight: 800; color: var(--orange); letter-spacing: -1px; margin-bottom: 4px; }
        .stat-label { font-size: 13px; color: var(--text-muted); }

        .stack { padding: 80px 24px; border-bottom: 0.5px solid var(--border); }
        .stack-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
        .stack-item { background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--radius); padding: 16px; text-align: center; }
        .stack-item-name { font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 3px; }
        .stack-item-desc { font-size: 11px; color: var(--text-dim); }

        .contact { padding: 80px 24px; text-align: center; }
        .contact h2 { font-size: clamp(28px, 4vw, 48px); font-weight: 800; letter-spacing: -0.5px; margin-bottom: 12px; }
        .contact p { font-size: 16px; color: var(--text-muted); margin-bottom: 32px; }
        .contact-email { display: inline-flex; align-items: center; gap: 8px; background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--radius); padding: 14px 28px; font-size: 16px; color: var(--orange-light); text-decoration: none; font-weight: 500; transition: border-color 0.2s; }
        .contact-email:hover { border-color: var(--border-hover); }

        footer { border-top: 0.5px solid var(--border); padding: 28px 24px; }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        footer p { font-size: 13px; color: var(--text-dim); }
        .footer-links { display: flex; gap: 20px; }
        .footer-links a { font-size: 13px; color: var(--text-dim); text-decoration: none; }
        .footer-links a:hover { color: var(--text-muted); }

        @media (max-width: 700px) {
          .nav-links { display: none; }
          .featured-row { grid-template-columns: 1fr; }
          .about-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-inner { justify-content: center; text-align: center; }
        }
      `}</style>

      <nav>
        <div className="nav-inner">
          <a href="#" className="logo">Casper <span>Media</span></a>
          <ul className="nav-links">
            <li><a href="#products">Products</a></li>
            <li><a href="#client-work">Client work</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <a href="#contact" className="nav-cta">Get in touch</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">Casper Media LLC · Pennsylvania</div>
          <h1>Digital products that <span>solve</span> real problems.</h1>
          <p>From apps that settle the dinner debate to platforms that run construction sites — we build tools people actually use.</p>
          <div className="hero-stats">
            <div className="hero-stat-item">
              <div className="hero-stat-num">3+</div>
              <div className="hero-stat-label">Products in market</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-num">50,000+</div>
              <div className="hero-stat-label">Restaurants indexed</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-num">PA</div>
              <div className="hero-stat-label">Based in Pennsylvania</div>
            </div>
          </div>
        </div>
      </section>

      <section className="products" id="products">
        <div className="section-inner">
          <div className="section-eyebrow">Our products</div>
          <h2 className="section-title">Built from scratch. Built to last.</h2>
          <p className="section-sub">Every product starts with a real problem — something we encountered firsthand or heard directly from people doing the work.</p>

          <div className="featured-row">
            {products.filter(p => p.featured).map(p => (
              <a key={p.name} href={p.link || '#'} className="project-card featured" target={p.link ? "_blank" : undefined} rel="noreferrer">
                <div className="project-header">
                  <div className="project-icon">{p.icon}</div>
                  <span className={`project-badge ${p.badgeClass}`}>{p.badge}</span>
                </div>
                <div className="project-name">{p.name}</div>
                <div className="project-desc">{p.desc}</div>
                <div className="project-tags">
                  {p.tags.map(t => <span key={t} className="project-tag">{t}</span>)}
                </div>
                {p.linkLabel && <div className="project-link">{p.linkLabel}</div>}
              </a>
            ))}
          </div>

          <div className="secondary-row">
            {products.filter(p => !p.featured).map(p => (
              <div key={p.name} className="project-card">
                <div className="project-header">
                  <div className="project-icon">{p.icon}</div>
                  <span className={`project-badge ${p.badgeClass}`}>{p.badge}</span>
                </div>
                <div className="project-name">{p.name}</div>
                <div className="project-desc">{p.desc}</div>
                <div className="project-tags">
                  {p.tags.map(t => <span key={t} className="project-tag">{t}</span>)}
                </div>
              </div>
            ))}
            <div className="project-card" style={{opacity: 0.45}}>
              <div className="project-header">
                <div className="project-icon">⚡</div>
                <span className="project-badge badge-building">Coming soon</span>
              </div>
              <div className="project-name">More coming</div>
              <div className="project-desc">We're always building. New products in the pipeline — stay tuned.</div>
              <div className="project-tags"><span className="project-tag">TBD</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="client-work" id="client-work">
        <div className="section-inner">
          <div className="section-eyebrow">Client work</div>
          <h2 className="section-title">When others need something built.</h2>
          <p className="section-sub">We take on select client projects — interesting problems, real users, and room to build something worth being proud of.</p>
          <div className="client-grid">
            {clientWork.map(c => (
              <div key={c.name} className="client-card">
                <div className="client-icon">{c.icon}</div>
                <div className="client-name">{c.name}</div>
                <div className="client-desc">{c.desc}</div>
                <div className="project-tags">
                  {c.tags.map(t => <span key={t} className="project-tag">{t}</span>)}
                </div>
              </div>
            ))}
            <div className="client-card client-placeholder">
              <p>Interested in working together?<br/><a href="#contact">Let's talk →</a></p>
            </div>
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="section-inner">
          <div className="about-grid">
            <div className="about-text">
              <div className="section-eyebrow">About us</div>
              <h2>Small shop.<br/>Real products.</h2>
              <p>Casper Media LLC is an independent software studio based in Pennsylvania. We build consumer and B2B products across mobile, web, and API — from concept to production.</p>
              <p>Every product starts with a real problem. We don't build features for their own sake — we build tools that earn a permanent spot in someone's workflow, or save a dinner table from a 20-minute debate.</p>
              <p>We also take on select client work for businesses that need a capable partner to bring an idea to life.</p>
            </div>
            <div className="about-stats">
              <div className="stat-card"><div className="stat-num">3+</div><div className="stat-label">Products in market</div></div>
              <div className="stat-card"><div className="stat-num">50k+</div><div className="stat-label">Restaurants in FindUrDinner</div></div>
              <div className="stat-card"><div className="stat-num">2026</div><div className="stat-label">Founded in Pennsylvania</div></div>
              <div className="stat-card"><div className="stat-num">∞</div><div className="stat-label">Problems left to solve</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="stack" id="stack">
        <div className="section-inner">
          <div className="section-eyebrow">How we build</div>
          <h2 className="section-title">Our tech stack</h2>
          <div className="stack-grid">
            {stack.map(([name, desc]) => (
              <div className="stack-item" key={name}>
                <div className="stack-item-name">{name}</div>
                <div className="stack-item-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="section-inner">
          <div className="section-eyebrow">Get in touch</div>
          <h2>Let's talk.</h2>
          <p>Questions, partnerships, client projects, or just want to say hello.</p>
          <a href="mailto:hello@caspermediallc.com" className="contact-email">hello@caspermediallc.com</a>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <p>© 2026 Casper Media LLC · Pennsylvania</p>
          <div className="footer-links">
            <a href="https://findurdinner.com" target="_blank" rel="noreferrer">FindUrDinner</a>
            <a href="https://worksitetrack.com" target="_blank" rel="noreferrer">WorksiteTrack</a>
            <a href="#products">Products</a>
            <a href="mailto:hello@caspermediallc.com">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
