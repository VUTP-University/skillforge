// Rank -> color mapping shared across the app (navbar HUD, profile, leaderboard).
// 20 named ranks, graduated dim-green -> bright-green -> cyan -> blue-white as
// rank increases, matching the CRT phosphor palette instead of a rainbow.
const RANK_COLORS = [
  ["Novice",       "#5c7d6e"],
  ["Initiate",     "#3f9962"],
  ["Apprentice",   "#34ab6c"],
  ["Scribe",       "#2ebd77"],
  ["Acolyte",      "#29cf83"],
  ["Scholar",      "#2ee091"],
  ["Artisan",      "#38ec9e"],
  ["Adept",        "#4dff9f"],
  ["Journeyman",   "#4dffb0"],
  ["Crusader",     "#4de0c4"],
  ["Knight",       "#4dc7d8"],
  ["Champion",     "#4dafe6"],
  ["Sentinel",     "#4d9bf0"],
  ["Warden",       "#4d8bf7"],
  ["Paladin",      "#5e8dff"],
  ["Sage",         "#6f93ff"],
  ["Elder",        "#8aa4ff"],
  ["Archmage",     "#a3b8ff"],
  ["Master",       "#c2d4ff"],
  ["Grand Master", "#e8f0ff"],
];

export const RANK_STYLE = Object.fromEntries(
  RANK_COLORS.map(([name, color]) => [
    name,
    {
      color,
      bg: `color-mix(in srgb, ${color} 12%, transparent)`,
      border: `color-mix(in srgb, ${color} 32%, transparent)`,
    },
  ])
);

export function getRankStyle(rank) {
  return RANK_STYLE[rank] ?? RANK_STYLE["Novice"];
}
