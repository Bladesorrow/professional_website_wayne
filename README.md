# Professional Website

Personal portfolio/CV site built with Next.js (static export).

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static site in ./out
```

## Customize

- Content: edit `content/profile.ts` (name, bio, experience, projects, links).
- Styling: edit `app/globals.css` (colors are CSS variables at the top).
- Layout/sections: edit `app/page.tsx`.

## Deploy

`npm run build` produces a static `out/` folder. Connect the repo to Vercel
(zero config) or publish `out/` to GitHub Pages/Netlify.
