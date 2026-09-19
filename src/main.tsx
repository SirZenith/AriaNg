import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n';
import './styles/index.css';

const hash = window.location.hash;

if (hash.indexOf('#!/') === 0) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search + '#/' + hash.substring(3));
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => undefined);
    });
}
