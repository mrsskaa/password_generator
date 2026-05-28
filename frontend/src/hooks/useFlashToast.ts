import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { showAppToast } from '../components/AppToast/AppToastProvider';

const shownFlashKeys = new Set<string>();

export function useFlashToast(durationMs = 1000): void {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const flashMessage = (location.state as { flashMessage?: string } | null)?.flashMessage;
        if (!flashMessage) {
            return;
        }
        const key = `${location.pathname}:${flashMessage}`;
        if (shownFlashKeys.has(key)) {
            return;
        }
        shownFlashKeys.add(key);
        showAppToast(flashMessage, durationMs);
        navigate(location.pathname + location.search, { replace: true, state: null });
    }, [durationMs, location.pathname, location.search, location.state, navigate]);
}
