import { CURRENT_USER_ID, mockConversations, mockConversationSummaries } from '../data/mockData';
import type { Conversation, ConversationSummary, UserMessage } from '../types';
import { simulateLatency } from '../utils/helpers';

let summaries: ConversationSummary[] = structuredClone(mockConversationSummaries);
const conversations: Conversation[] = structuredClone(mockConversations);

const findConversation = (conversationId: string): Conversation => {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) throw new Error('Không tìm thấy hội thoại');
    return conversation;
};

const removeSummary = (conversationId: string): void => {
    summaries = summaries.filter((summary) => summary.id !== conversationId);
};

export const getConversationSummaries = async (): Promise<ConversationSummary[]> => {
    await simulateLatency();
    return structuredClone(summaries);
};

export const getConversation = async (conversationId: string): Promise<Conversation> => {
    await simulateLatency();
    return structuredClone(findConversation(conversationId));
};

export const sendMessage = async (conversationId: string, text: string): Promise<UserMessage> => {
    await simulateLatency(120);
    const conversation = findConversation(conversationId);
    const message: UserMessage = {
        kind: 'user',
        id: `message-${Date.now()}`,
        senderId: CURRENT_USER_ID,
        text,
        sentAt: new Date().toISOString(),
        reactions: [],
        seenByIds: [],
    };
    conversation.messages.push(message);
    summaries = summaries.map((summary) =>
        summary.id === conversationId
            ? { ...summary, lastMessagePreview: `Bạn: ${text}`, lastMessageAt: message.sentAt }
            : summary,
    );
    return structuredClone(message);
};

export const markConversationUnread = async (conversationId: string): Promise<void> => {
    await simulateLatency(80);
    summaries = summaries.map((summary) =>
        summary.id === conversationId ? { ...summary, unreadCount: Math.max(summary.unreadCount, 1) } : summary,
    );
};

export const markConversationRead = async (conversationId: string): Promise<void> => {
    await simulateLatency(80);
    summaries = summaries.map((summary) =>
        summary.id === conversationId ? { ...summary, unreadCount: 0 } : summary,
    );
};

export const archiveConversation = async (conversationId: string): Promise<void> => {
    await simulateLatency(80);
    removeSummary(conversationId);
};

export const blockConversation = async (conversationId: string): Promise<void> => {
    await simulateLatency(80);
    removeSummary(conversationId);
};

export const reportConversation = async (conversationId: string): Promise<void> => {
    await simulateLatency(80);
    findConversation(conversationId);
};

export const setConversationMuted = async (conversationId: string, muted: boolean): Promise<void> => {
    await simulateLatency(80);
    findConversation(conversationId).muted = muted;
};

export const leaveConversation = async (conversationId: string): Promise<void> => {
    await simulateLatency(80);
    removeSummary(conversationId);
};