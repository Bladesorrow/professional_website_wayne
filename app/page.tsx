import { profile } from "../content/profile";
import { Marquee, ScrollEffects } from "./Effects";

function Wave({ from, to }: { from: string; to: string }) {
  return (
    <div className="wave" style={{ background: `var(--${from})`, color: `var(--${to})` }} aria-hidden="true">
      <svg viewBox="0 0 2880 90" preserveAspectRatio="none">
        <path d="M0 45 C 180 0, 360 90, 540 45 S 900 0, 1080 45 S 1260 90, 1440 45 C 1620 0, 1800 90, 1980 45 S 2340 0, 2520 45 S 2700 90, 2880 45 V90 H0 Z" fill="currentColor" />
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
      <ScrollEffects />

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
              <p className="eyebrow rise" style={{ "--d": "0ms" } as React.CSSProperties}>Recumbent trike · Cerebral palsy · Open road</p>
              <h1 id="top-h">
                <span className="rise" style={{ "--d": "120ms" } as React.CSSProperties}>Wild</span>
                <span className="teal rise" style={{ "--d": "240ms" } as React.CSSProperties}>Atlantic</span>
                <span className="sun rise" style={{ "--d": "360ms" } as React.CSSProperties}>Wrafters</span>
              </h1>
              <p className="tagline rise" style={{ "--d": "520ms" } as React.CSSProperties}>{profile.tagline}</p>
              <p className="lead rise" style={{ "--d": "640ms" } as React.CSSProperties}>{profile.intro}</p>
              <div className="actions rise" style={{ "--d": "760ms" } as React.CSSProperties}>
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

          <Marquee items={["Three wheels", "One wild coast", "Low to the ground", "Big on the horizon", "All welcome in the crew"]} />

          <Wave from="deep" to="foam" />

          <div className="band light">
            <section className="wrap" id="rider" aria-labelledby="rider-h">
              <p className="kicker">01</p>
              <h2 id="rider-h" data-reveal>{profile.rider.heading}</h2>
              <div className="two">
                <div data-reveal>{profile.rider.story.map((p) => <p key={p}>{p}</p>)}</div>
                <blockquote data-reveal style={{ "--d": "150ms" } as React.CSSProperties}>{profile.rider.quote}</blockquote>
              </div>
            </section>
          </div>

          <Wave from="foam" to="deep" />

          <div className="band dark">
            <section className="wrap" id="machine" aria-labelledby="machine-h">
              <p className="kicker">02</p>
              <h2 id="machine-h" data-reveal>{profile.trike.heading}</h2>
              <p className="model"><span>Model</span> {profile.trike.model}</p>
              <p className="wide">{profile.trike.intro}</p>
              <ul className="grid">
                {profile.trike.points.map((p, i) => (
                  <li key={p.title} className="card" data-reveal style={{ "--d": `${i * 120}ms` } as React.CSSProperties}>
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
              <h2 id="rides-h" data-reveal>{profile.rides.heading}</h2>
              <ol className="timeline">
                {profile.rides.items.map((r, i) => (
                  <li key={r.name} data-reveal style={{ "--d": `${i * 140}ms` } as React.CSSProperties}>
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
              <h2 id="tribe-h" data-reveal>{profile.tribe.heading}</h2>
              <p className="wide">{profile.tribe.intro}</p>
              <ul className="grid">
                {profile.tribe.cards.map((c, i) => (
                  <li key={c.title} className="card" data-reveal style={{ "--d": `${i * 120}ms` } as React.CSSProperties}>
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
              <h2 id="join-h" data-reveal>{profile.join.heading}</h2>
              <p data-reveal>{profile.join.text}</p>
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
