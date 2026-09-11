// The "Refresh" mechanic: one of these is picked at random on every page load.
export const THEMES = [
  {
    id: 1,
    slug: 'marble-hand',
    label: 'Carrara · The Offering',
    src: '/media/theme-1.mp4',
    poster: '/media/theme-1.jpg',
    caption: 'A marble hand, a strawberry, a void.',
  },
  {
    id: 2,
    slug: 'cherub',
    label: 'Chiaroscuro · The Cherub',
    src: '/media/theme-2.mp4',
    poster: '/media/theme-2.jpg',
    caption: 'A cherub carrying wild strawberries.',
  },
  {
    id: 3,
    slug: 'plinth',
    label: 'Macro · The Plinth',
    src: '/media/theme-3.mp4',
    poster: '/media/theme-3.jpg',
    caption: 'One strawberry on cracked marble.',
  },
];

export function pickRandomTheme() {
  // Avoid showing the same theme twice in a row when possible.
  let last = null;
  try { last = Number(sessionStorage.getItem('strawberry:lastTheme')); } catch (e) {}
  const pool = THEMES.filter((t) => t.id !== last);
  const theme = pool[Math.floor(Math.random() * pool.length)] || THEMES[0];
  try { sessionStorage.setItem('strawberry:lastTheme', String(theme.id)); } catch (e) {}
  return theme;
}
