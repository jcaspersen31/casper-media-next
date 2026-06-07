export default function Home() {
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
        .nav-cta:hover { background: var(--orange-light); }
        .hero { padding: 120px 24px 100px; text-align: center; border-bottom: 0.5px solid var(--border); position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(216,90,48,0.12) 0%, transparent 70%); pointer-events: none; }
        .hero-inner { max-width: 700px; margin: 0 auto; position: relative; }
        .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: var(--orange-dim); border: 0.5px solid rgba(216,90,48,0.3); color: var(--orange-light); font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 6px 16px; border-radius: 999px; margin-bottom: 28px; }
        .hero h1 { font-size: clamp(40px, 7vw, 72px); font-weight: 800; line-height: 1.05; letter-spacing: -1.5px; margin-bottom: 20px; color: var(--text); }
        .hero h1 span { color: var(--orange); }
        .hero p { font-size: clamp(16px, 2.5vw, 20px); color: var(--text-muted); max-width: 500px; margin: 0 auto 40px; line-height: 1.6; }
        .hero-meta { display: flex; gap: 32px; justify-content: center; flex-wrap: wrap; }
        .hero-meta-num { font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
        .hero-meta-label { font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.8px; }
        .section-inner { max-width: 1100px; margin: 0 auto; }
        .section-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--orange); margin-bottom: 12px; }
        .section-title { font-size: clamp(28px, 4vw, 42px); font-weight: 800; letter-spacing: -0.5px; margin-bottom: 48px; color: var(--text); }
        .projects { padding: 80px 24px; border-bottom: 0.5px solid var(--border); }
        .projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .project-card { background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 28px; text-decoration: none; transition: border-color 0.2s, background 0.2s; display: flex; flex-direction: column; }
        .project-card:hover { border-color: var(--border-hover); background: var(--surface2); }
        .project-card.featured { border-color: rgba(216,90,48,0.3); background: linear-gradient(135deg, var(--surface) 0%, rgba(216,90,48,0.05) 100%); }
        .project-card.featured:hover { border-color: rgba(216,90,48,0.5); }
        .project-card.coming-soon { opacity: 0.5; cursor: default; }
        .project-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .project-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--orange-dim); border: 0.5px solid rgba(216,90,48,0.2); display: flex; align-items: center; justify-content: center; font-size: 22px; }
        .project-badge { font-size: 10px; font-weight: 600; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 999px; }
        .badge-live { background: rgba(59,109,17,0.2); color: #7DC443; border: 0.5px solid rgba(59,109,17,0.3); }
        .badge-soon { background: rgba(136,136,136,0.1); color: var(--text-dim); border: 0.5px solid var(--border); }
        .badge-dev { background: rgba(216,90,48,0.15); color: var(--orange-light); border: 0.5px solid rgba(216,90,48,0.2); }
        .project-name { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 8px; letter-spacing: -0.3px; }
        .project-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px; flex: 1; }
        .project-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .project-tag { font-size: 11px; color: var(--text-dim); background: var(--surface2); border: 0.5px solid var(--border); padding: 3px 10px; border-radius: 999px; }
        .project-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 20px; font-size: 13px; font-weight: 600; color: var(--orange-light); }
        .project-link::after { content: '→'; }
        .about { padding: 80px 24px; border-bottom: 0.5px solid var(--border); }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .about-text h2 { font-size: clamp(28px, 4vw, 40px); font-weight: 800; letter-spacing: -0.5px; margin-bottom: 20px; line-height: 1.1; }
        .about-text p { font-size: 15px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.7; }
        .about-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .stat-card { background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--radius); padding: 20px; }
        .stat-num { font-size: 32px; font-weight: 800; color: var(--orange); letter-spacing: -1px; margin-bottom: 4px; }
        .stat-label { font-size: 13px; color: var(--text-muted); }
        .stack { padding: 80px 24px; border-bottom: 0.5px solid var(--border); }
        .stack-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 48px; }
        .stack-item { background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--radius); padding: 16px; text-align: center; }
        .stack-item-name { font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 3px; }
        .stack-item-desc { font-size: 11px; color: var(--text-dim); }
        .contact { padding: 80px 24px; text-align: center; }
        .contact h2 { font-size: clamp(28px, 4vw, 48px); font-weight: 800; letter-spacing: -0.5px; margin-bottom: 12px; }
        .contact p { font-size: 16px; color: var(--text-muted); margin-bottom: 32px; }
        .contact-email { display: inline-flex; align-items: center; gap: 8px; background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--radius); padding: 14px 28px; font-size: 16px; color: var(--orange-light); text-decoration: none; font-weight: 500; transition: border-color 0.2s; }
        .contact-email:hover { border-color: var(--border-hover); }
        footer { border-top: 0.5px solid var(--border); padding: 28px 24px; text-align: center; }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        footer p { font-size: 13px; color: var(--text-dim); }
        .footer-links { display: flex; gap: 20px; }
        .footer-links a { font-size: 13px; color: var(--text-dim); text-decoration: none; }
        .footer-links a:hover { color: var(--text-muted); }
        @media (max-width: 700px) {
          .nav-links { display: none; }
          .about-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-inner { justify-content: center; text-align: center; }
        }
      `}</style>

      <nav>
        <div className="nav-inner">
          <a href="#" className="logo">Casper <span>Media</span></a>
          <ul className="nav-links">
            <li><a href="#projects">Projects</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <a href="#contact" className="nav-cta">Get in touch</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">Casper Media LLC · Pennsylvania</div>
          <h1>Digital products<br/>that <span>solve</span> real problems.</h1>
          <p>We build apps, tools, and platforms for everyday people and the businesses that serve them.</p>
          <div className="hero-meta">
            <div className="hero-meta-item">
              <div className="hero-meta-num">2+</div>
              <div className="hero-meta-label">Products in development</div>
            </div>
            <div className="hero-meta-item">
              <div className="hero-meta-num">50,000+</div>
              <div className="hero-meta-label">Restaurants indexed</div>
            </div>
            <div className="hero-meta-item">
              <div className="hero-meta-num">PA</div>
              <div className="hero-meta-label">Based in Pennsylvania</div>
            </div>
          </div>
        </div>
      </section>

      <section className="projects" id="projects">
        <div className="section-inner">
          <div className="section-eyebrow">What we build</div>
          <h2 className="section-title">Our products</h2>
          <div className="projects-grid">
            <a href="https://findurdinner.com" className="project-card featured" target="_blank" rel="noreferrer">
              <div className="project-header">
                <div className="project-icon">🍜</div>
                <span className="project-badge badge-live">Live</span>
              </div>
              <div className="project-name">FindUrDinner</div>
              <div className="project-desc">Stop debating where to eat. FindUrDinner spins local restaurants based on your filters — cuisine, budget, distance, and dietary needs.</div>
              <div className="project-tags">
                <span className="project-tag">React Native</span>
                <span className="project-tag">Node.js</span>
                <span className="project-tag">Android</span>
                <span className="project-tag">iOS</span>
              </div>
              <div className="project-link">Visit findurdinner.com</div>
            </a>
            <a href="https://worksitetrack.com" className="project-card featured" target="_blank" rel="noreferrer">
              <div className="project-header">
                <div className="project-icon">🏗</div>
                <span className="project-badge badge-dev">In development</span>
              </div>
              <div className="project-name">WorksiteTrack</div>
              <div className="project-desc">A private internal platform for construction companies — project tracking, document management, team communication, and job site coordination.</div>
              <div className="project-tags">
                <span className="project-tag">React</span>
                <span className="project-tag">Node.js</span>
                <span className="project-tag">Enterprise</span>
                <span className="project-tag">Android</span>
                <span className="project-tag">iOS</span>
              </div>
              <div className="project-link">Visit worksitetrack.com</div>
            </a>
            <div className="project-card coming-soon">
              <div className="project-header">
                <div className="project-icon">⚡</div>
                <span className="project-badge badge-soon">Coming soon</span>
              </div>
              <div className="project-name">More coming</div>
              <div className="project-desc">We're always building. New products in the pipeline — stay tuned.</div>
              <div className="project-tags"><span className="project-tag">TBD</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="section-inner">
          <div className="about-grid">
            <div className="about-text">
              <div className="section-eyebrow">About us</div>
              <h2>Small team.<br/>Real products.</h2>
              <p>Casper Media LLC is an independent software company based in Pennsylvania. We build digital products that solve genuine everyday problems.</p>
              <p>Every product we build starts with a real frustration. We design for regular people, not for tech demos. Clean interfaces, fast performance, and features that actually matter.</p>
              <p>We're just getting started.</p>
            </div>
            <div className="about-stats">
              <div className="stat-card"><div className="stat-num">2026</div><div className="stat-label">Founded in Pennsylvania</div></div>
              <div className="stat-card"><div className="stat-num">50,000+</div><div className="stat-label">Restaurants in FindUrDinner</div></div>
              <div className="stat-card"><div className="stat-num">2</div><div className="stat-label">Active products</div></div>
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
            {[["React Native","Mobile apps"],["React","Web frontends"],["Node.js","API & backend"],["PostgreSQL","Primary database"],["Prisma","ORM & migrations"],["Railway","API hosting"],["Vercel","Frontend hosting"],["Stripe","Payments"]].map(([name,desc])=>(
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
          <p>Questions, partnerships, or just want to say hi — we'd love to hear from you.</p>
          <a href="mailto:hello@findurdinner.com" className="contact-email">hello@findurdinner.com</a>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <p>© 2026 Casper Media LLC · Pennsylvania</p>
          <div className="footer-links">
            <a href="https://findurdinner.com">FindUrDinner</a>
            <a href="#projects">Projects</a>
            <a href="#about">About</a>
            <a href="mailto:hello@findurdinner.com">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
