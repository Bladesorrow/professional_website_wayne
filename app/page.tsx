import { profile } from "../content/profile";

function TrikeIllustration() {
  return (
    <svg viewBox="0 0 400 240" role="img" aria-label="Illustration of a recumbent trike" className="trike-art">
      <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="90" cy="180" r="38" />
        <circle cx="90" cy="180" r="4" fill="currentColor" />
        <circle cx="300" cy="190" r="28" />
        <circle cx="300" cy="190" r="4" fill="currentColor" />
        <path d="M90 180 L160 150 L250 150 L300 190" />
        <path d="M160 150 L150 100 L190 90" strokeWidth="10" />
        <path d="M250 150 L270 100" />
        <path d="M262 100 L300 100" />
        <path d="M215 150 L240 175" />
      </g>
      <circle cx="205" cy="62" r="16" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">Skip to main content</a>

      <header className="nav">
        <a href="#top" className="brand">{profile.name}</a>
        <nav aria-label="Main">
          <a href="#story">My story</a>
          <a href="#trike">The trike</a>
          <a href="#rides">Rides</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero" id="top">
          <div className="hero-text">
            <p className="eyebrow">{profile.title}</p>
            <h1>{profile.name}</h1>
            <p className="lead">{profile.tagline}</p>
            <div className="actions">
              <a className="button" href={`mailto:${profile.email}`}>Get in touch</a>
              <a className="button ghost" href="#rides">See my rides</a>
            </div>
          </div>
          <div className="hero-art"><TrikeIllustration /></div>
        </section>

        {profile.stats.length > 0 && (
          <section aria-label="Highlights" className="stats">
            <dl>
              {profile.stats.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section id="story" aria-labelledby="story-h">
          <h2 id="story-h">My story</h2>
          {profile.story.map((p) => <p key={p}>{p}</p>)}
        </section>

        <section id="trike" aria-labelledby="trike-h">
          <h2 id="trike-h">{profile.trike.heading}</h2>
          <p>{profile.trike.intro}</p>
          <ul className="grid">
            {profile.trike.points.map((p) => (
              <li key={p.title} className="card">
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="rides" aria-labelledby="rides-h">
          <h2 id="rides-h">Rides &amp; milestones</h2>
          <ol className="timeline">
            {profile.rides.map((r) => (
              <li key={r.name}>
                <div className="item-head">
                  <h3>{r.name}</h3>
                  <span>{r.period}</span>
                </div>
                <p>{r.summary}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="contact" aria-labelledby="contact-h" className="cta">
          <h2 id="contact-h">{profile.why.heading}</h2>
          <p>{profile.why.text}</p>
          <a className="button accent" href={`mailto:${profile.email}`}>Email {profile.name.split(" ")[0]}</a>
          <p className="links">
            {profile.links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </p>
        </section>
      </main>

      <footer>© {new Date().getFullYear()} {profile.name}</footer>
    </>
  );
}
