import { useState } from "react";

/**
 * Unified avatar: renders the user's image, falling back to an
 * initials circle when there's no avatar_url or the image fails to load.
 */
export default function Avatar({ src, username, size = 32, ring = "green", className = "" }) {
  const [imgError, setImgError] = useState(false);
  const initials = username?.[0]?.toUpperCase() ?? "?";

  if (src && !imgError) {
    const ringColor =
      ring === "red"  ? "rgba(255,95,86,0.40)"
      : ring === "none" ? "transparent"
      : "rgba(77,255,143,0.40)";

    return (
      <img
        src={src}
        alt={username}
        onError={() => setImgError(true)}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "3px",
          objectFit: "cover",
          border: `2px solid ${ringColor}`,
          flexShrink: 0,
        }}
      />
    );
  }

  const initialsCls = ring === "red" ? "avatar-initials avatar-initials--red" : "avatar-initials";

  return (
    <div
      className={`${initialsCls} ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials}
    </div>
  );
}
