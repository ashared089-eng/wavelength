export default function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader__line" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
