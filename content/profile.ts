// All site content lives here. Edit this file to make the site yours.
// Lines marked TODO are placeholders: replace them with your real story and numbers.
export const profile = {
  name: "Wayne Wrafter",
  title: "Recumbent trike rider",
  tagline:
    "Disability changed how I ride, not whether I ride. Three wheels, low to the ground, and every mile earned.",
  email: "wayne@graftondigital.com",
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/wayne-wrafter-b270b525/" },
    { label: "GitHub", href: "https://github.com/bladesorrow" },
  ],
  // TODO: add real figures (distance, rides, funds raised). Hidden when empty.
  stats: [] as { value: string; label: string }[],
  story: [
    // TODO: your story in your own words: what happened, why a trike, what cycling gives you.
    "I ride a recumbent trike. It's stable, comfortable and easy on the body, and it lets me get outside and move under my own power.",
    "This site is where I share my rides, what I've learned about adaptive cycling, and how to get in touch if you'd like to ride, talk or help.",
  ],
  trike: {
    heading: "The trike",
    // Read from the HP Velotechnik logo and "Gekko" lettering in the photo. TODO: confirm the exact variant (e.g. Gekko 20).
    model: "HP Velotechnik Gekko",
    intro:
      "A recumbent trike puts the rider in a supportive reclined seat with two wheels at the front and one at the back. It can't tip over at a standstill and it takes pressure off hands, wrists and back.",
    // TODO: swap in your actual make, model and set-up.
    points: [
      { title: "Stable", text: "Three wheels means no balancing at junctions or on slow climbs." },
      { title: "Comfortable", text: "A full seat with back support, so long rides stay enjoyable." },
      { title: "Adapted to me", text: "Seat, pedals and controls set up around my body and my needs." },
    ],
  },
  rides: [
    // TODO: add real rides and milestones.
    { name: "First ride", period: "Add date", summary: "Where it started and what it felt like." },
    { name: "A ride I'm proud of", period: "Add date", summary: "Distance, place, and what made it special." },
    { name: "Next goal", period: "Coming up", summary: "What I'm training for." },
  ],
  why: {
    heading: "Why I ride",
    text: "Adaptive cycling gives independence, fitness and community. If you're thinking about a trike, or want to support accessible cycling, I'd love to hear from you.",
  },
};
