import { useState } from 'react';
import {
    archiveConversation,
    blockConversation,
    getConversation,
    getConversationSummaries,
    leaveConversation,
    markConversationRead,
    markConversationUnread,
    reportConversation,
    sendMessage,
    setConversationMuted,
} from '../services/chatService';
import type { Conversation, ConversationSummary, ConversationType } from '../types';
import { parseDateTime } from '../utils/helpers';
import { useAsyncData } from './useAsyncData';

const INITIAL_CONVERSATION_TYPE: ConversationType = 'group';

const sortByRecent = (items: ConversationSummary[]): ConversationSummary[] =>
    [...items].sort((first, second) => parseDateTime(second.lastMessageAt).getTime() - parseDateTime(first.lastMessageAt).getTime());

export const useChat = () => {
    const summaries = useAsyncData(getConversationSummaries, 'summaries');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const list = summaries.data ?? [];
    const activeId =
        selectedId ?? list.find((item) => item.type === INITIAL_CONVERSATION_TYPE)?.id ?? list[0]?.id ?? null;

    const conversation = useAsyncData<Conversation | null>(
        () => (activeId ? getConversation(activeId) : Promise.resolve(null)),
        activeId ?? 'none',
    );

    const patchSummary = (id: string, patch: Partial<ConversationSummary>) =>
        summaries.updateData((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));

    const removeSummary = (id: string) => {
        summaries.updateData((current) => current.filter((item) => item.id !== id));
        if (id === activeId) setSelectedId(null);
    };

    const selectConversation = (id: string) => {
        setSelectedId(id);
        const target = list.find((item) => item.id === id);
        if (target && target.unreadCount > 0) {
            patchSummary(id, { unreadCount: 0 });
            void markConversationRead(id);
        }
    };

    const send = async (text: string) => {
        if (!activeId) return;
        const message = await sendMessage(activeId, text);
        conversation.updateData((current) =>
            current ? { ...current, messages: [...current.messages, message] } : current,
        );
        summaries.updateData((current) =>
            sortByRecent(
                current.map((item) =>
                    item.id === activeId
                        ? { ...item, lastMessagePreview: `Bạn: ${text}`, lastMessageAt: message.sentAt }
                        : item,
                ),
            ),
        );
    };

    const markUnread = async (id: string) => {
        await markConversationUnread(id);
        patchSummary(id, { unreadCount: Math.max(list.find((item) => item.id === id)?.unreadCount ?? 0, 1) });
    };

    const archive = async (id: string) => {
        await archiveConversation(id);
        removeSummary(id);
    };

    const block = async (id: string) => {
        await blockConversation(id);
        removeSummary(id);
    };

    const report = (id: string) => reportConversation(id);

    const toggleMuted = async (muted: boolean) => {
        if (!activeId) return;
        await setConversationMuted(activeId, muted);
        conversation.updateData((current) => (current ? { ...current, muted } : current));
    };

    const leave = async () => {
        if (!activeId) return;
        await leaveConversation(activeId);
        removeSummary(activeId);
    };

    return {
        summaries: { status: summaries.status, retry: summaries.retry, items: list },
        conversation: { status: conversation.status, retry: conversation.retry, data: conversation.data ?? null },
        activeId,
        actions: { selectConversation, send, markUnread, archive, block, report, toggleMuted, leave },
    };
};