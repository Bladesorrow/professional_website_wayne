// All site content lives here. Edit this file to make the site yours.
// Lines marked TODO are drafts or placeholders: replace them with your own words and numbers.
export const profile = {
  brand: "Wild Atlantic Wrafters",
  name: "Wayne Wrafter",
  tagline: "Three wheels. One wild coast.",
  intro:
    "I'm Wayne. I live with cerebral palsy and I ride a recumbent trike. This is where I share the rides, the kit and the crew behind them, for friends, family and the wider trike community.",
  email: "wayne@graftondigital.com",
  // TODO: add Strava / Instagram / YouTube / Facebook links here. Hidden when empty.
  links: [] as { label: string; href: string }[],
  // TODO: add real figures (distance, rides, funds raised). Hidden when empty.
  stats: [] as { value: string; label: string }[],
  rider: {
    heading: "Meet the rider",
    // TODO: draft copy. Rewrite in your own words.
    story: [
      "I'm Wayne Wrafter. I have cerebral palsy, and I ride a recumbent trike because it gives me stability, support and the freedom to just go.",
      "Wild Atlantic Wrafters is my crew and my banner: a place for the rides, the gear and the stories, with room for anyone who wants to roll along.",
    ],
    quote: "Cerebral palsy is part of my story. It doesn't set the pace. I do.",
  },
  trike: {
    heading: "The machine",
    // Read from the HP Velotechnik logo and "Gekko" lettering in the photo. TODO: confirm the exact variant (e.g. Gekko 20).
    model: "HP Velotechnik Gekko",
    intro:
      "A recumbent trike puts me in a supportive reclined seat with two wheels at the front and one at the back. It stays upright at a standstill and takes the strain off hands, wrists and back.",
    points: [
      { title: "Stable", text: "Three wheels means no balancing at junctions or on slow climbs." },
      { title: "Supported", text: "A full seat with back support, so long rides stay enjoyable." },
      { title: "Set up for me", text: "Seat, pedals and controls adjusted around my body and my needs." },
    ],
  },
  rides: {
    heading: "The ride so far",
    // TODO: add real rides and milestones.
    items: [
      { name: "First ride", period: "Add date", summary: "Where it started and what it felt like." },
      { name: "A ride I'm proud of", period: "Add date", summary: "Distance, place, and what made it special." },
      { name: "Next big goal", period: "Coming up", summary: "What I'm training for." },
    ],
  },
  tribe: {
    heading: "For the trike tribe",
    intro: "Whether you ride a trike, a handcycle or a two-wheeler, you're welcome in the crew.",
    cards: [
      { title: "Ride together", text: "Meet up for a spin. All speeds and abilities welcome." },
      { title: "Swap set-ups", text: "Seats, pedals, controls: share what works for you and learn what works for me." },
      { title: "Find better routes", text: "Smooth, scenic and accessible routes are gold. Send yours my way." },
    ],
  },
  join: {
    heading: "Join the crew",
    text: "Friends and family, fellow riders, or just curious: send a message, say hello, or come for a ride.",
  },
};
