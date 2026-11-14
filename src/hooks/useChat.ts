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
    sendMessage,
    setActiveRoom,
    setConversationMuted,
    startRealtime,
    subscribeChatEvents,
} from '../services/chatService';
import type { Conversation, ConversationSummary, UserMessage } from '../types';
import { startMessageNotifications } from '../services/notificationService';
import { parseDateTime } from '../utils/helpers';
import { useAsyncData } from './useAsyncData';

const SEND_FAILED_MESSAGE = 'Không gửi được tin nhắn. Vui lòng thử lại.';
const LOAD_OLDER_FAILED_MESSAGE = 'Không tải được tin nhắn cũ hơn. Vui lòng thử lại.';
const LEAVE_FAILED_MESSAGE = 'Không thể rời phòng. Vui lòng thử lại.';

interface Presence {
    roomId: string;
    online: Record<string, boolean>;
}

const sortByRecent = (items: ConversationSummary[]): ConversationSummary[] =>
    [...items].sort(
        (first, second) =>
            parseDateTime(second.lastMessageAt).getTime() - parseDateTime(first.lastMessageAt).getTime(),
    );

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
    const summaries = useAsyncData(getConversationSummaries, 'summaries');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [presence, setPresence] = useState<Presence | null>(null);
    const pagesRef = useRef<Record<string, number>>({});

    const list = summaries.data ?? [];
    const activeId = list.some((item) => item.id === selectedId)
        ? selectedId
        : (list.find((item) => !item.archived)?.id ?? null);

    const conversation = useAsyncData<Conversation | null>(async () => {
        if (!activeId) return null;
        pagesRef.current[activeId] = 1;
        return getConversation(activeId);
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
    }, [roomId, memberKey, currentUserId]);

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
        if (id === activeId && !target.archived) setSelectedId(null);
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
        if (id === activeId) setSelectedId(null);
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