import { useEffect, useRef, useState } from 'react';
import {
    archiveConversation,
    createRoom,
    getConversation,
    getConversationSummaries,
    getMembersOnline,
    getOlderMessages,
    getUnreadTotal,
    joinRoom,
    leaveConversation,
    markConversationRead,
    markConversationUnread,
    markSessionStale,
    sendMessage,
    setActiveRoom,
    setConversationMuted,
    startRealtime,
    subscribeChatEvents,
} from '../services/chatService';
import type { Conversation, ConversationSummary, Message, UserMessage } from '../types';
import { startMessageNotifications } from '../services/notificationService';
import { wsService } from '../services/websocketService';
import { parseDateTime } from '../utils/helpers';
import { useAsyncData } from './useAsyncData';

const SEND_FAILED_MESSAGE = 'Không gửi được tin nhắn. Vui lòng thử lại.';
const LOAD_OLDER_FAILED_MESSAGE = 'Không tải được tin nhắn cũ hơn. Vui lòng thử lại.';
const LEAVE_FAILED_MESSAGE = 'Không thể rời phòng. Vui lòng thử lại.';
const CONNECTION_POLL_MS = 1000;
const OFFLINE_AFTER_POLLS = 2;
const PRESENCE_REFRESH_MS = 30000;

interface Presence {
    roomId: string;
    online: Record<string, boolean>;
}

const sortByRecent = (items: ConversationSummary[]): ConversationSummary[] =>
    [...items].sort(
        (first, second) =>
            parseDateTime(second.lastMessageAt).getTime() - parseDateTime(first.lastMessageAt).getTime(),
    );

const findFirstUnreadId = (messages: Message[], unreadCount: number): string | undefined =>
    unreadCount > 0 ? messages[Math.max(messages.length - unreadCount, 0)]?.id : undefined;

const toPreview = (message: UserMessage, fromMe: boolean): string =>
    `${fromMe ? 'Bạn' : message.senderId}: ${message.text}`;

const withPresence = (conversation: Conversation | null, presence: Presence | null): Conversation | null => {
    if (!conversation) return null;
    const known = presence?.roomId === conversation.id ? presence.online : {};
    return {
        ...conversation,
        members: conversation.members.map((member) => ({
            ...member,
            online: member.id === conversation.currentUserId || Boolean(known[member.id]),
        })),
    };
};

export const useOffline = (): boolean => {
    const [offline, setOffline] = useState(false);
    const missedPolls = useRef(0);

    useEffect(() => {
        const timer = window.setInterval(() => {
            missedPolls.current = wsService.isConnected() ? 0 : missedPolls.current + 1;
            setOffline(missedPolls.current >= OFFLINE_AFTER_POLLS);
        }, CONNECTION_POLL_MS);
        return () => window.clearInterval(timer);
    }, []);

    return offline;
};

export const useChatRealtime = () => {
    useEffect(() => {
        const stopRealtime = startRealtime();
        const stopNotifications = startMessageNotifications();
        return () => {
            stopRealtime();
            stopNotifications();
        };
    }, []);
};

export const useUnreadTotal = (): number => {
    const [total, setTotal] = useState(getUnreadTotal);

    useEffect(
        () =>
            subscribeChatEvents((event) => {
                if (event.type === 'unread') setTotal(event.total);
            }),
        [],
    );

    return total;
};

export const useChat = () => {
    const [initialId, setInitialId] = useState<string | null>(null);
    const summaries = useAsyncData(async () => {
        const items = await getConversationSummaries();
        setInitialId((current) => current ?? items.find((item) => !item.archived)?.id ?? null);
        return items;
    }, 'summaries');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [presence, setPresence] = useState<Presence | null>(null);
    const [presenceTick, setPresenceTick] = useState(0);
    const offline = useOffline();
    const wasOffline = useRef(false);
    const pagesRef = useRef<Record<string, number>>({});

    const list = summaries.data ?? [];
    const chosenId = list.some((item) => item.id === selectedId)
        ? selectedId
        : list.find((item) => item.id === initialId && !item.archived)?.id;
    const activeId = chosenId ?? list.find((item) => !item.archived)?.id ?? null;
    const nextRoomId = (leavingId: string): string | null =>
        list.find((item) => item.id !== leavingId && !item.archived)?.id ?? null;

    const conversation = useAsyncData<Conversation | null>(async () => {
        if (!activeId) return null;
        pagesRef.current[activeId] = 1;
        const unreadAtOpen = list.find((item) => item.id === activeId)?.unreadCount ?? 0;
        const data = await getConversation(activeId);
        return { ...data, firstUnreadMessageId: findFirstUnreadId(data.messages, unreadAtOpen) };
    }, activeId ?? 'none');

    const updateSummaries = summaries.updateData;
    const updateConversation = conversation.updateData;
    const roomId = conversation.data?.id ?? null;
    const currentUserId = conversation.data?.currentUserId ?? '';
    const memberKey = conversation.data?.members.map((member) => member.id).join('|') ?? '';

    useEffect(() => {
        setActiveRoom(activeId);
        return () => setActiveRoom(null);
    }, [activeId]);

    useEffect(() => {
        if (!roomId) return;
        void markConversationRead(roomId);
        updateSummaries((current) =>
            current.map((item) => (item.id === roomId ? { ...item, unreadCount: 0 } : item)),
        );
    }, [roomId, updateSummaries]);

    const refreshSummaries = summaries.refresh;
    const refreshConversation = conversation.refresh;

    useEffect(() => {
        if (offline) {
            wasOffline.current = true;
            markSessionStale();
            return;
        }
        if (wasOffline.current) {
            wasOffline.current = false;
            refreshSummaries();
            refreshConversation();
        }
    }, [offline, refreshSummaries, refreshConversation]);

    useEffect(() => {
        const timer = window.setInterval(() => setPresenceTick((value) => value + 1), PRESENCE_REFRESH_MS);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!roomId || !memberKey) return;
        let cancelled = false;
        const names = memberKey.split('|').filter((name) => name !== currentUserId);
        void getMembersOnline(names).then((online) => {
            if (!cancelled) setPresence({ roomId, online });
        });
        return () => {
            cancelled = true;
        };
    }, [roomId, memberKey, currentUserId, presenceTick]);

    useEffect(
        () =>
            subscribeChatEvents((event) => {
                if (event.type === 'message') {
                    const { message, fromMe } = event;
                    if (event.roomId === activeId) {
                        updateConversation((current) =>
                            current && !current.messages.some((item) => item.id === message.id)
                                ? { ...current, messages: [...current.messages, message] }
                                : current,
                        );
                    }
                    updateSummaries((current) =>
                        sortByRecent(
                            current.map((item) =>
                                item.id === event.roomId
                                    ? {
                                        ...item,
                                        lastMessagePreview: toPreview(message, fromMe),
                                        lastMessageAt: message.sentAt,
                                        unreadCount: event.unreadCount,
                                        archived: event.archived,
                                    }
                                    : item,
                            ),
                        ),
                    );
                }
                if (event.type === 'sendError') {
                    updateConversation((current) =>
                        current
                            ? { ...current, messages: current.messages.filter((item) => item.id !== event.messageId) }
                            : current,
                    );
                    setNotice(event.reason);
                }
            }),
        [activeId, updateConversation, updateSummaries],
    );

    const selectConversation = (id: string) => {
        setSelectedId(id);
        setNotice(null);
        if (id === activeId) {
            void markConversationRead(id);
            updateSummaries((current) =>
                current.map((item) => (item.id === id ? { ...item, unreadCount: 0 } : item)),
            );
        }
    };

    const send = async (text: string): Promise<boolean> => {
        if (!activeId) return false;
        try {
            const message = await sendMessage(activeId, text);
            setNotice(null);
            updateConversation((current) =>
                current ? { ...current, messages: [...current.messages, message] } : current,
            );
            updateSummaries((current) =>
                sortByRecent(
                    current.map((item) =>
                        item.id === activeId
                            ? { ...item, lastMessagePreview: toPreview(message, true), lastMessageAt: message.sentAt }
                            : item,
                    ),
                ),
            );
            return true;
        } catch (error) {
            setNotice(error instanceof Error ? error.message : SEND_FAILED_MESSAGE);
            return false;
        }
    };

    const loadOlder = async () => {
        if (!activeId || loadingOlder) return;
        const nextPage = (pagesRef.current[activeId] ?? 1) + 1;
        setLoadingOlder(true);
        try {
            const { messages, hasMore } = await getOlderMessages(activeId, nextPage);
            pagesRef.current[activeId] = nextPage;
            updateConversation((current) =>
                current && current.id === activeId
                    ? { ...current, messages: [...messages, ...current.messages], hasMoreMessages: hasMore }
                    : current,
            );
        } catch {
            setNotice(LOAD_OLDER_FAILED_MESSAGE);
        } finally {
            setLoadingOlder(false);
        }
    };

    const markUnread = async (id: string) => {
        await markConversationUnread(id);
        updateSummaries((current) =>
            current.map((item) => (item.id === id ? { ...item, unreadCount: Math.max(item.unreadCount, 1) } : item)),
        );
    };

    const toggleArchive = async (id: string) => {
        const target = list.find((item) => item.id === id);
        if (!target) return;
        await archiveConversation(id, !target.archived);
        updateSummaries((current) =>
            current.map((item) => (item.id === id ? { ...item, archived: !target.archived } : item)),
        );
        if (id === activeId && !target.archived) setSelectedId(nextRoomId(id));
    };

    const addRoom = (room: ConversationSummary) => {
        updateSummaries((current) =>
            current.some((item) => item.id === room.id) ? current : sortByRecent([room, ...current]),
        );
        setSelectedId(room.id);
        setNotice(null);
    };

    const createNewRoom = async (name: string) => addRoom(await createRoom(name));

    const joinExistingRoom = async (name: string) => addRoom(await joinRoom(name));

    const leaveRoom = async (id: string) => {
        try {
            await leaveConversation(id);
        } catch (error) {
            setNotice(error instanceof Error ? error.message : LEAVE_FAILED_MESSAGE);
            return;
        }
        updateSummaries((current) => current.filter((item) => item.id !== id));
        if (id === activeId) setSelectedId(nextRoomId(id));
        setNotice(null);
    };

    const toggleMuted = async (muted: boolean) => {
        if (!activeId) return;
        await setConversationMuted(activeId, muted);
        updateConversation((current) => (current ? { ...current, muted } : current));
    };

    return {
        summaries: { status: summaries.status, retry: summaries.retry, items: list },
        conversation: {
            status: conversation.status,
            retry: conversation.retry,
            data: withPresence(conversation.data ?? null, presence),
        },
        activeId,
        loadingOlder,
        notice,
        offline,
        actions: {
            selectConversation,
            send,
            loadOlder,
            markUnread,
            toggleArchive,
            toggleMuted,
            createNewRoom,
            joinExistingRoom,
            leaveRoom,
            dismissNotice: () => setNotice(null),
        },
    };
};