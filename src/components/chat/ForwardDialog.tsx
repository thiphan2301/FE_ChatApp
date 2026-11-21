import { useEffect, useMemo, useRef, useState } from 'react';
import { UserAvatar } from '../common/UserAvatar';
import { useClickOutside } from '../../hooks/useAsyncData';
import { checkUserExists, getForwardTargets } from '../../services/chatService';
import type { ForwardTarget } from '../../types';
import { normalizeText } from '../../utils/helpers';

interface ForwardDialogProps {
    previewText: string;
    previewImageUrl?: string;
    initialTargets?: ForwardTarget[];
    onForward: (target: ForwardTarget) => Promise<void>;
    onClose: () => void;
}

export const ForwardDialog = ({
    previewText,
    previewImageUrl,
    initialTargets = [],
    onForward,
    onClose,
}: ForwardDialogProps) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    useClickOutside(dialogRef, onClose, true);

    const [targets, setTargets] = useState<ForwardTarget[]>(initialTargets);
    const [loading, setLoading] = useState(initialTargets.length === 0);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [sendingKey, setSendingKey] = useState<string | null>(null);
    const [sentKeys, setSentKeys] = useState<Record<string, boolean>>({});
    const [sendError, setSendError] = useState<string | null>(null);
    const [lookupState, setLookupState] = useState<'idle' | 'checking' | 'not-found' | 'error'>('idle');

    useEffect(() => {
        let cancelled = false;
        getForwardTargets()
            .then((items) => {
                if (cancelled) return;
                setTargets(items);
                setLoading(false);
                setLoadError(null);
            })
            .catch(() => {
                if (cancelled) return;
                setLoading(false);
                if (initialTargets.length === 0) {
                    setLoadError('Không tải được danh sách cuộc trò chuyện.');
                }
            });
        return () => {
            cancelled = true;
        };
    }, [initialTargets.length]);

    const normalizedQuery = normalizeText(query);
    const filteredTargets = useMemo(
        () =>
            normalizedQuery
                ? targets.filter((item) => normalizeText(item.name).includes(normalizedQuery))
                : targets,
        [targets, normalizedQuery],
    );

    const trimmedQuery = query.trim();
    const hasExactUserMatch = targets.some(
        (item) => item.type === 'direct' && item.name.toLowerCase() === trimmedQuery.toLowerCase(),
    );

    const targetKey = (target: ForwardTarget) => `${target.type}:${target.id}`;

    const handleSendTo = async (target: ForwardTarget) => {
        const key = targetKey(target);
        if (sendingKey || sentKeys[key]) return;
        setSendingKey(key);
        setSendError(null);
        try {
            await onForward(target);
            setSentKeys((prev) => ({ ...prev, [key]: true }));
        } catch (error) {
            setSendError(error instanceof Error ? error.message : 'Chuyển tiếp thất bại. Vui lòng thử lại.');
        } finally {
            setSendingKey(null);
        }
    };

    const handleLookupUser = async () => {
        if (!trimmedQuery || lookupState === 'checking') return;
        setLookupState('checking');
        setSendError(null);
        try {
            const exists = await checkUserExists(trimmedQuery);
            if (!exists) {
                setLookupState('not-found');
                return;
            }
            const added: ForwardTarget = { id: trimmedQuery, name: trimmedQuery, type: 'direct' };
            setTargets((prev) =>
                prev.some((item) => item.type === 'direct' && item.id.toLowerCase() === trimmedQuery.toLowerCase())
                    ? prev
                    : [added, ...prev],
            );
            setLookupState('idle');
        } catch {
            setLookupState('error');
        }
    };

    return (
        <div className="ui-isolated fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="forward-dialog-title"
                className="flex max-h-[82vh] w-full max-w-[440px] flex-col rounded-3xl bg-white p-6 shadow-xl"
            >
                <div className="flex items-center justify-between">
                    <h2 id="forward-dialog-title" className="text-lg font-semibold text-ink">
                        Chuyển tiếp tin nhắn
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition hover:bg-paper hover:text-ink"
                    >
                        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </div>

                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-paper p-3">
                    {previewImageUrl && (
                        <img
                            src={previewImageUrl}
                            alt="Xem trước ảnh chuyển tiếp"
                            className="h-12 w-12 shrink-0 rounded-xl object-cover"
                        />
                    )}
                    <p className="line-clamp-2 min-w-0 flex-1 text-xs text-slate">
                        {previewText || (previewImageUrl ? 'Hình ảnh' : '')}
                    </p>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 focus-within:border-forest-soft">
                    <i className="fa-solid fa-magnifying-glass text-xs text-mist" aria-hidden="true"></i>
                    <input
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setLookupState('idle');
                        }}
                        placeholder="Tìm phòng chat hoặc tên người dùng..."
                        aria-label="Tìm người nhận"
                        autoFocus
                        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-mist"
                    />
                </div>

                {sendError && (
                    <p role="alert" className="mt-2 rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger">
                        {sendError}
                    </p>
                )}

                <div className="mt-3 min-h-[180px] flex-1 overflow-y-auto">
                    {loading && (
                        <p className="py-8 text-center text-xs text-slate">Đang tải danh sách...</p>
                    )}
                    {!loading && loadError && (
                        <p className="py-8 text-center text-xs text-danger">{loadError}</p>
                    )}
                    {!loading && !loadError && (
                        <ul className="flex flex-col gap-1">
                            {filteredTargets.map((target) => {
                                const key = targetKey(target);
                                const isSending = sendingKey === key;
                                const isSent = Boolean(sentKeys[key]);
                                return (
                                    <li
                                        key={key}
                                        className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 transition hover:bg-paper"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <UserAvatar name={target.name} size="sm" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-ink">{target.name}</p>
                                                <p className="text-[11px] text-mist">
                                                    {target.type === 'group' ? 'Phòng nhóm' : 'Cá nhân'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={Boolean(sendingKey) || isSent}
                                            onClick={() => void handleSendTo(target)}
                                            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                                                isSent
                                                    ? 'bg-sage text-forest-soft'
                                                    : 'bg-forest-soft text-white hover:bg-forest-deep disabled:opacity-50'
                                            }`}
                                        >
                                            {isSent ? 'Đã gửi' : isSending ? 'Đang gửi...' : 'Gửi'}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {!loading && trimmedQuery && !hasExactUserMatch && (
                        <div className="mt-2 border-t border-line pt-2 text-center">
                            <button
                                type="button"
                                disabled={lookupState === 'checking'}
                                onClick={() => void handleLookupUser()}
                                className="text-xs font-medium text-forest-soft hover:underline disabled:opacity-50"
                            >
                                {lookupState === 'checking'
                                    ? 'Đang tìm người dùng...'
                                    : `Tìm người dùng "${trimmedQuery}" để chuyển tiếp`}
                            </button>
                            {lookupState === 'not-found' && (
                                <p className="mt-1 text-[11px] text-mist">Không tìm thấy tài khoản này.</p>
                            )}
                            {lookupState === 'error' && (
                                <p className="mt-1 text-[11px] text-danger">Không thể kiểm tra tên người dùng.</p>
                            )}
                        </div>
                    )}

                    {!loading && !loadError && filteredTargets.length === 0 && !trimmedQuery && (
                        <p className="py-8 text-center text-xs text-mist">Chưa có cuộc trò chuyện nào.</p>
                    )}
                </div>

                <div className="mt-4 flex justify-end border-t border-line pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-line px-4 py-2 text-xs font-medium text-ink transition hover:bg-paper"
                    >
                        Xong
                    </button>
                </div>
            </div>
        </div>
    );
};
