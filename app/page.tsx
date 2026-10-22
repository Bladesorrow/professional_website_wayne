import { profile } from "../content/profile";

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
            <p className="eyebrow"><span aria-hidden="true">&gt; </span>{profile.title}</p>
            <h1>{profile.name}</h1>
            <p className="lead">{profile.tagline}</p>
            <div className="actions">
              <a className="button" href={`mailto:${profile.email}`}>Get in touch</a>
              <a className="button ghost" href="#rides">See my rides</a>
            </div>
          </div>
          <div className="hero-art"><img
              src="/trike.webp"
              width={880}
              height={590}
              alt="My recumbent trike: a red-framed three-wheeler with a black mesh reclined seat"
              className="trike-photo"
            /></div>
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
            {profile.trike.points.map((p, i) => (
              <li key={p.title} className="card">
                <span className="idx" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
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
