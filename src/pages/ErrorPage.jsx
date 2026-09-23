import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unknown error';

  return (
    <div className="lost lost--error" role="alert">
      <p className="eyebrow">Something broke</p>
      <h1 className="lost__title">It crashed</h1>
      <p className="lost__text">The page died on us. Refresh and it usually comes straight back.</p>
      <p className="lost__detail">{detail}</p>
      <button type="button" className="about__link" onClick={() => window.location.assign(import.meta.env.BASE_URL)}>
        <span>Reload</span>
      </button>
    </div>
  );
}
