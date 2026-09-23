import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import PageLoader from './components/chrome/PageLoader.jsx';
import Shell from './components/chrome/Shell.jsx';
import { PlayerProvider } from './context/PlayerContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { UIProvider } from './context/UIContext.jsx';
import ErrorPage from './pages/ErrorPage.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import TrackPage from './pages/TrackPage.jsx';

const lazyPage = (load) => () => load().then((module) => ({ Component: module.default }));
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

const router = createBrowserRouter(
  [
    {
      element: <Shell />,
      errorElement: <ErrorPage />,
      hydrateFallbackElement: <PageLoader />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'track/:trackId', element: <TrackPage /> },
        { path: 'collection', lazy: lazyPage(() => import('./pages/CollectionPage.jsx')) },
        { path: 'about', lazy: lazyPage(() => import('./pages/AboutPage.jsx')) },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename },
);

export default function App() {
  return (
    <ToastProvider>
      <PlayerProvider>
        <UIProvider>
          <RouterProvider router={router} />
        </UIProvider>
      </PlayerProvider>
    </ToastProvider>
  );
}
