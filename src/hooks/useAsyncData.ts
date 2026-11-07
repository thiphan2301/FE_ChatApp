import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { getCurrentUser } from '../services/accountService';
import type { UserProfile } from '../types';

type AsyncStatus = 'loading' | 'error' | 'ready';

interface AsyncResult<T> {
    requestKey: string;
    data?: T;
    failed: boolean;
}

export const useAsyncData = <T,>(load: () => Promise<T>, requestKey: string) => {
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState<AsyncResult<T> | null>(null);
    const loadRef = useRef(load);
    const fullKey = `${requestKey}:${attempt}`;

    useEffect(() => {
        loadRef.current = load;
    });

    useEffect(() => {
        let cancelled = false;
        loadRef
            .current()
            .then((data) => {
                if (!cancelled) setResult({ requestKey: fullKey, data, failed: false });
            })
            .catch(() => {
                if (!cancelled) setResult({ requestKey: fullKey, failed: true });
            });
        return () => {
            cancelled = true;
        };
    }, [fullKey]);

    const isCurrent = result?.requestKey === fullKey;
    const status: AsyncStatus = !isCurrent ? 'loading' : result.failed ? 'error' : 'ready';
    const data = isCurrent ? result.data : undefined;

    const retry = useCallback(() => setAttempt((value) => value + 1), []);

    const updateData = useCallback(
        (updater: (current: T) => T) => {
            setResult((previous) =>
                previous && previous.requestKey === fullKey && previous.data !== undefined
                    ? { ...previous, data: updater(previous.data) }
                    : previous,
            );
        },
        [fullKey],
    );

    return { status, data, retry, updateData };
};

export const useClickOutside = (
    ref: RefObject<HTMLElement | null>,
    onOutside: () => void,
    active: boolean,
) => {
    useEffect(() => {
        if (!active) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onOutside();
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [ref, onOutside, active]);
};

export const useCurrentUser = (refreshKey: string) => {
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        let cancelled = false;
        getCurrentUser()
            .then((profile) => {
                if (!cancelled) setUser(profile);
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    return user;
};