import Avatar from "./Avatar";
import ProgressBar from "./ProgressBar";
import { getRankStyle } from "../constants/ranks";

/**
 * Player stat widget — avatar, username, rank, level, mini XP bar.
 * `desktop`: compact two-row block sized for the navbar trigger.
 * `mobile`: larger avatar + full-width bar with an explicit XP caption,
 * for the drawer's extra room.
 */
export default function PlayerHUD({ user, variant = "desktop" }) {
  if (!user) return null;

  const rankStyle = getRankStyle(user.rank);
  const level = user.level ?? 1;
  const xpPct = user.level_progress_pct ?? 0;

  if (variant === "mobile") {
    return (
      <div className="flex items-center gap-3">
        <Avatar src={user.avatar_url} username={user.username} size={40} />
        <div className="flex-1 min-w-0">
          <div className="hud-name-row">
            <span className="hud-name">{user.username}</span>
            <span className="level-pill">LV {level}</span>
          </div>
          <span className="hud-rank" style={{ color: rankStyle.color }}>{user.rank ?? "Novice"}</span>
          <div className="mt-1.5">
            <ProgressBar value={xpPct} size="xs" />
          </div>
          <span className="hud-xp-caption">
            {(user.xp_into_level ?? 0).toLocaleString()} / {(user.xp_level_range ?? 0).toLocaleString()} XP
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Avatar src={user.avatar_url} username={user.username} size={30} />
      <div className="hud-meta">
        <div className="hud-name-row">
          <span className="hud-name">{user.username}</span>
          <span className="level-pill">LV {level}</span>
        </div>
        <div className="hud-sub-row">
          <span className="hud-rank" style={{ color: rankStyle.color }}>{user.rank ?? "Novice"}</span>
          <span className="hud-dot">·</span>
          <span className="hud-xp-caption">xp</span>
          <ProgressBar value={xpPct} ascii chars={8} variant="blue" className="hud-ascii" />
          <span className="hud-xp-caption">{xpPct}%</span>
        </div>
      </div>
    </>
  );
}
