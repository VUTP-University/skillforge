const VARIANT_CLASS = {
  green: "badge badge-green",
  blue: "badge badge-blue",
  amber: "badge badge-amber",
  red: "badge badge-red",
  neutral: "badge badge-neutral",
  // legacy variant names, mapped onto the new palette
  gold: "badge badge-amber",
  crimson: "badge badge-red",
  emerald: "badge badge-green",
};

/**
 * Small pill label. Use `variant` for the standard palette, or pass
 * `color`/`bg`/`border` to override (e.g. per-rank tinting that doesn't
 * fit a fixed variant enum).
 */
export default function Badge({ variant = "neutral", color, bg, border, className = "", style: styleProp, children }) {
  const style = { ...styleProp };
  if (color)  style.color = color;
  if (bg)     style.background = bg;
  if (border) style.borderColor = border;

  return (
    <span className={`${VARIANT_CLASS[variant] ?? VARIANT_CLASS.neutral} ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}
