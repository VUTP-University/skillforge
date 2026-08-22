// Rank -> color mapping shared across the app (navbar HUD, profile, leaderboard).
// 20 named ranks, graduated dim-green -> bright-green -> cyan -> blue-white as
// rank increases, matching the CRT phosphor palette instead of a rainbow.
// Names trace a boot-to-root privilege-escalation arc instead of a fantasy
// hierarchy, matching the rest of the terminal rebrand.
const RANK_COLORS = [
  ["Guest",        "#5c7d6e"],
  ["Bootstrap",    "#3f9962"],
  ["Script Kid",   "#34ab6c"],
  ["Coder",        "#2ebd77"],
  ["Debugger",     "#29cf83"],
  ["Committer",    "#2ee091"],
  ["Contributor",  "#38ec9e"],
  ["Maintainer",   "#4dff9f"],
  ["Refactorer",   "#4dffb0"],
  ["Architect",    "#4de0c4"],
  ["Optimizer",    "#4dc7d8"],
  ["Toolsmith",    "#4dafe6"],
  ["Sentinel",     "#4d9bf0"],
  ["Sysadmin",     "#4d8bf7"],
  ["Daemon",       "#5e8dff"],
  ["Exploit Dev",  "#6f93ff"],
  ["Superuser",    "#8aa4ff"],
  ["Sudoer",       "#a3b8ff"],
  ["Root",         "#c2d4ff"],
  ["0-Day",        "#e8f0ff"],
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
  return RANK_STYLE[rank] ?? RANK_STYLE["Guest"];
}
