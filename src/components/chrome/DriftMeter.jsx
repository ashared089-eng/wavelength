export default function DriftMeter() {
  return (
    <div className="drift" aria-hidden="true">
      <span className="drift__line" />
      <span className="drift__label">
        <span className="drift__label-hold">keep holding…</span>
        <span className="drift__label-go">here we go</span>
      </span>
    </div>
  );
}
