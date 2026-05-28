import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import './AppToast.css';

type ToastItem = {
    id: number;
    message: string;
};

type AppToastContextValue = {
    showToast: (message: string, durationMs?: number) => void;
};

const AppToastContext = createContext<AppToastContextValue | null>(null);

let externalShowToast: ((message: string, durationMs?: number) => void) | null = null;

export function showAppToast(message: string, durationMs = 1000): void {
    externalShowToast?.(message, durationMs);
}

export function AppToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const idRef = useRef(0);

    const showToast = useCallback((message: string, durationMs = 1000) => {
        const trimmed = message.trim();
        if (!trimmed) {
            return;
        }
        const id = ++idRef.current;
        setToasts((prev) => [...prev, { id, message: trimmed }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((item) => item.id !== id));
        }, durationMs);
    }, []);

    useEffect(() => {
        externalShowToast = showToast;
        return () => {
            externalShowToast = null;
        };
    }, [showToast]);

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <AppToastContext.Provider value={value}>
            {children}
            <div className="app-toast-host" aria-live="polite" aria-atomic="true">
                {toasts.map((toast) => (
                    <div key={toast.id} className="app-toast">
                        {toast.message}
                    </div>
                ))}
            </div>
        </AppToastContext.Provider>
    );
}

export function useAppToast(): AppToastContextValue {
    const ctx = useContext(AppToastContext);
    if (!ctx) {
        throw new Error('useAppToast must be used within AppToastProvider');
    }
    return ctx;
}
