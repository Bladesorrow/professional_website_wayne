import { profile } from "../content/profile";

function Wave({ from, to }: { from: string; to: string }) {
  return (
    <div className="wave" style={{ background: `var(--${from})`, color: `var(--${to})` }} aria-hidden="true">
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
        <path d="M0 45 C 180 0, 360 90, 540 45 S 900 0, 1080 45 S 1320 90, 1440 40 V90 H0 Z" fill="currentColor" />
      </svg>
    </div>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 64 64" width="36" height="36" aria-hidden="true">
      <circle cx="32" cy="32" r="24" fill="none" stroke="var(--teal)" strokeWidth="6" />
      <path d="M12 34c7-9 13-9 20 0s13 9 20 0" fill="none" stroke="var(--sun)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const first = profile.name.split(" ")[0];
  return (
    <>
      <a className="skip" href="#main">Skip to main content</a>

      <div className="band dark hero-band">
        <header className="wrap nav">
          <a href="#top" className="brand"><Mark /><span>{profile.brand}</span></a>
          <nav aria-label="Main">
            <a href="#rider">Rider</a>
            <a href="#machine">Trike</a>
            <a href="#rides">Rides</a>
            <a href="#tribe">Tribe</a>
            <a className="nav-cta" href="#join">Join</a>
          </nav>
        </header>

        <main id="main" tabIndex={-1}>
          <section className="wrap hero" id="top" aria-labelledby="top-h">
            <div className="hero-text">
              <p className="eyebrow">Recumbent trike · Cerebral palsy · Open road</p>
              <h1 id="top-h">
                <span>Wild</span>
                <span className="teal">Atlantic</span>
                <span className="sun">Wrafters</span>
              </h1>
              <p className="tagline">{profile.tagline}</p>
              <p className="lead">{profile.intro}</p>
              <div className="actions">
                <a className="button" href="#rides">Follow the ride</a>
                <a className="button ghost" href={`mailto:${profile.email}`}>Say hello</a>
              </div>
            </div>
            <div className="hero-art">
              <div className="sun-disc" aria-hidden="true" />
              <img
                src="/trike.webp"
                width={880}
                height={590}
                alt="Wayne's recumbent trike: a red-framed three-wheeler with a black mesh reclined seat"
                className="trike-photo"
              />
            </div>
          </section>

          {profile.stats.length > 0 && (
            <section className="wrap stats" aria-label="Highlights">
              <dl>
                {profile.stats.map((s) => (
                  <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
                ))}
              </dl>
            </section>
          )}

          <Wave from="deep" to="foam" />

          <div className="band light">
            <section className="wrap" id="rider" aria-labelledby="rider-h">
              <p className="kicker">01</p>
              <h2 id="rider-h">{profile.rider.heading}</h2>
              <div className="two">
                <div>{profile.rider.story.map((p) => <p key={p}>{p}</p>)}</div>
                <blockquote>{profile.rider.quote}</blockquote>
              </div>
            </section>
          </div>

          <Wave from="foam" to="deep" />

          <div className="band dark">
            <section className="wrap" id="machine" aria-labelledby="machine-h">
              <p className="kicker">02</p>
              <h2 id="machine-h">{profile.trike.heading}</h2>
              <p className="model"><span>Model</span> {profile.trike.model}</p>
              <p className="wide">{profile.trike.intro}</p>
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
          </div>

          <Wave from="deep" to="foam" />

          <div className="band light">
            <section className="wrap" id="rides" aria-labelledby="rides-h">
              <p className="kicker">03</p>
              <h2 id="rides-h">{profile.rides.heading}</h2>
              <ol className="timeline">
                {profile.rides.items.map((r) => (
                  <li key={r.name}>
                    <div className="item-head"><h3>{r.name}</h3><span>{r.period}</span></div>
                    <p>{r.summary}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <Wave from="foam" to="ocean" />

          <div className="band ocean">
            <section className="wrap" id="tribe" aria-labelledby="tribe-h">
              <p className="kicker">04</p>
              <h2 id="tribe-h">{profile.tribe.heading}</h2>
              <p className="wide">{profile.tribe.intro}</p>
              <ul className="grid">
                {profile.tribe.cards.map((c) => (
                  <li key={c.title} className="card">
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <Wave from="ocean" to="sun" />

          <div className="band sunband">
            <section className="wrap cta" id="join" aria-labelledby="join-h">
              <h2 id="join-h">{profile.join.heading}</h2>
              <p>{profile.join.text}</p>
              <a className="button navy" href={`mailto:${profile.email}`}>Email {first}</a>
              {profile.links.length > 0 && (
                <p className="links">
                  {profile.links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
                </p>
              )}
            </section>
          </div>
        </main>

        <footer className="wrap">
          <p>© {new Date().getFullYear()} {profile.brand}</p>
          <p>Built to be accessible: keyboard friendly, high contrast, reduced-motion aware.</p>
        </footer>
      </div>
    </>
  );
}
