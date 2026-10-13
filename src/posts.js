// ---------------------------------------------------------------------------
// Sample posts. Later these come from Supabase instead.
//
// Each post needs:
//   name      - first name / nickname (shown publicly)
//   country   - MUST match the `name` property in countries.geo.json
//               (e.g. "Austria", "Germany", "United States of America")
//   lat, lng  - where the dot sits. For Austrians use the city; for others
//               a point inside their country is fine.
//   text      - the one-liner about USTP
//
// The FIRST post is the anchor: Austria / St. Pölten.
// ---------------------------------------------------------------------------

export const posts = [
  {
    name: "Iosif",
    country: "Austria",
    lat: 48.2047,          // St. Pölten
    lng: 15.6256,
    text: "This is home — where the whole journey starts.",
  },
  {
    name: "Lena",
    country: "Austria",
    lat: 48.2082,          // Vienna
    lng: 16.3738,
    text: "The campus feels small until you meet everyone on it.",
  },
  {
    name: "Jukka",
    country: "Finland",
    lat: 62.2426,          // Jyväskylä (Jamk)
    lng: 25.7473,
    text: "Came for a semester, stayed for the people.",
  },
  {
    name: "Sofia",
    country: "Portugal",
    lat: 38.5244,          // Setúbal
    lng: -8.8882,
    text: "The sunsets back home, the winters here — I'll take both.",
  },
  {
    name: "Mateusz",
    country: "Romania",
    lat: 45.7489,          // Timișoara (Politehnica)
    lng: 21.2087,
    text: "Nine universities, one network. I'm part of it now.",
  },
  {
    name: "Nora",
    country: "Netherlands",
    lat: 52.2215,          // Deventer (Saxion)
    lng: 6.8937,
    text: "Everything's a bike ride away — just like at home.",
  },
  {
    name: "Elias",
    country: "Germany",
    lat: 50.5558,          // Fulda
    lng: 9.6808,
    text: "St. Pölten is closer than Berlin and twice as friendly.",
  },
  {
    name: "Maya",
    country: "Latvia",
    lat: 57.5356,          // Valmiera (Vidzeme)
    lng: 25.4247,
    text: "Small town, big ideas. Sounds familiar.",
  },
];