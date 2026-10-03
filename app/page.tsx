import { profile } from "../content/profile";

export default function Home() {
  return (
    <>
      <header className="nav">
        <a href="#top" className="brand">{profile.name}</a>
        <nav>
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <p className="eyebrow">{profile.title}</p>
          <h1>{profile.name}</h1>
          <p className="lead">{profile.tagline}</p>
          <a className="button" href={`mailto:${profile.email}`}>Get in touch</a>
        </section>

        <section id="about">
          <h2>About</h2>
          {profile.about.map((p) => <p key={p}>{p}</p>)}
          <ul className="chips">
            {profile.skills.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </section>

        <section id="experience">
          <h2>Experience</h2>
          {profile.experience.map((e) => (
            <article key={e.role + e.company} className="item">
              <div className="item-head">
                <h3>{e.role} · {e.company}</h3>
                <span>{e.period}</span>
              </div>
              <p>{e.summary}</p>
            </article>
          ))}
        </section>

        <section id="projects">
          <h2>Projects</h2>
          <div className="grid">
            {profile.projects.map((p) => (
              <a key={p.name} className="card" href={p.href}>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
              </a>
            ))}
          </div>
        </section>

        <section id="contact">
          <h2>Contact</h2>
          <p>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </p>
          <p className="links">
            {profile.links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </p>
        </section>
      </main>

      <footer>© {new Date().getFullYear()} {profile.name}</footer>
    </>
  );
}
