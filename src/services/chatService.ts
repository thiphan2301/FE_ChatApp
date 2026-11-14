import { wsService } from './websocketService';
import type { ServerResponse } from './websocketService';
import type { ChatEvent, Conversation, ConversationMember, ConversationSummary, UserMessage } from '../types';
import { parseDateTime } from '../utils/helpers';

const ROOM_TYPE = 1;
const MESSAGE_PAGE_SIZE = 50;
const REQUEST_TIMEOUT_MS = 10000;
const SESSION_WAIT_MS = 5000;
const SEND_CONFIRM_WINDOW_MS = 10000;
const MAX_PRESENCE_CHECKS = 30;
const DEFAULT_ROOM_PREVIEW = 'Phòng chat nhóm';
const PREFS_STORAGE_PREFIX = 'chat-app.rooms.';

const GENERIC_ERROR = 'Có lỗi xảy ra. Vui lòng thử lại.';
const TIMEOUT_ERROR = 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.';
const DISCONNECTED_ERROR = 'Mất kết nối tới máy chủ. Vui lòng thử lại.';
const ERROR_MESSAGES: Record<string, string> = {
    'Room not found or You not in room': 'Không tìm thấy phòng hoặc bạn chưa tham gia phòng này.',
    'You are not in this room!': 'Bạn chưa tham gia phòng này nên không thể gửi tin nhắn.',
    'Room Exist or Error': 'Tên phòng đã tồn tại hoặc không hợp lệ.',
    'Room not found': 'Không tìm thấy phòng chat có tên này.',
    'Room not found, or you are not a member (or you are the room owner)':
        'Không thể rời phòng. Chủ phòng không thể tự rời phòng.',
};

interface RawUserListItem {
    name: string;
    type: number;
    actionTime?: string;
}

interface RawRoomMember {
    id: number;
    name: string;
}

interface RawRoomMessage {
    id?: number;
    name: string;
    to?: string;
    mes: string;
    createAt?: string;
    type?: number;
}

interface RawRoomData {
    name?: string;
    user?: RawRoomMember[];
    chatMess?: RawRoomMessage[];
}

interface RoomPrefs {
    mutedIds: string[];
    archivedIds: string[];
    unread: Record<string, number>;
}

interface PendingSend {
    roomId: string;
    messageId: string;
    text: string;
    expiresAt: number;
}

const getUsername = (): string => wsService.getSession()?.username ?? '';

const toErrorMessage = (serverMessage?: string): string =>
    (serverMessage && ERROR_MESSAGES[serverMessage]) || GENERIC_ERROR;

const isSessionSuccess = (response: ServerResponse): boolean =>
    (response.event === 'LOGIN' || response.event === 'RE_LOGIN') && response.status === 'success';

let sessionConfirmed = false;

const confirmSessionOnLogin = (response: ServerResponse): void => {
    if (isSessionSuccess(response)) sessionConfirmed = true;
};

let removeAuthListener = wsService.addListener(confirmSessionOnLogin);

export const resetChatSession = (): void => {
    sessionConfirmed = false;
    removeAuthListener();
    removeAuthListener = wsService.addListener(confirmSessionOnLogin);
};

const waitForSession = (): Promise<void> => {
    if (sessionConfirmed) return Promise.resolve();
    return new Promise((resolve) => {
        const finish = () => {
            clearTimeout(timer);
            removeListener();
            resolve();
        };
        const removeListener = wsService.addListener((response) => {
            if (isSessionSuccess(response)) finish();
        });
        const timer = setTimeout(finish, SESSION_WAIT_MS);
    });
};

const waitForResponse = (event: string, send: () => void): Promise<ServerResponse> =>
    new Promise((resolve, reject) => {
        const handler = (response: ServerResponse) => {
            if (response.event !== event) return;
            clearTimeout(timer);
            removeListener();
            if (response.status === 'error') reject(new Error(toErrorMessage(response.mes)));
            else resolve(response);
        };
        const removeListener = wsService.addListener(handler);
        const timer = setTimeout(() => {
            removeListener();
            reject(new Error(TIMEOUT_ERROR));
        }, REQUEST_TIMEOUT_MS);
        wsService.onOpen(send);
        wsService.connect();
    });

const requestQueues = new Map<string, Promise<unknown>>();

const request = (event: string, payload: Record<string, unknown> = {}): Promise<ServerResponse> => {
    const previous = requestQueues.get(event) ?? Promise.resolve();
    const run = previous
        .catch(() => undefined)
        .then(waitForSession)
        .then(() => waitForResponse(event, () => wsService.sendMessage(event, payload)));
    requestQueues.set(event, run.catch(() => undefined));
    return run;
};

const prefsKey = (): string => `${PREFS_STORAGE_PREFIX}${getUsername() || 'guest'}`;

const readPrefs = (): RoomPrefs => {
    const empty: RoomPrefs = { mutedIds: [], archivedIds: [], unread: {} };
    try {
        const stored = window.localStorage.getItem(prefsKey());
        return stored ? { ...empty, ...(JSON.parse(stored) as Partial<RoomPrefs>) } : empty;
    } catch {
        return empty;
    }
};

const writePrefs = (prefs: RoomPrefs): void => {
    window.localStorage.setItem(prefsKey(), JSON.stringify(prefs));
};

const sumUnread = (prefs: RoomPrefs): number =>
    Object.values(prefs.unread).reduce((total, count) => total + count, 0);

let localMessageCounter = 0;

const toUserMessage = (raw: RawRoomMessage): UserMessage => ({
    kind: 'user',
    id: raw.id === undefined ? `local-${Date.now()}-${(localMessageCounter += 1)}` : String(raw.id),
    senderId: raw.name,
    text: raw.mes,
    sentAt: raw.createAt ?? new Date().toISOString(),
    reactions: [],
    seenByIds: [],
});

const byTimeAscending = (first: UserMessage, second: UserMessage): number =>
    parseDateTime(first.sentAt).getTime() - parseDateTime(second.sentAt).getTime();

const toMessages = (rawMessages: RawRoomMessage[] = []): UserMessage[] =>
    rawMessages.map(toUserMessage).sort(byTimeAscending);

const toMembers = (rawMembers: RawRoomMember[] = []): ConversationMember[] =>
    [...rawMembers]
        .sort((first, second) => first.id - second.id)
        .map((member, index) => ({
            id: member.name,
            name: member.name,
            role: index === 0 ? 'admin' : 'member',
            online: false,
        }));

const toSummary = (raw: RawUserListItem, prefs: RoomPrefs): ConversationSummary => ({
    id: raw.name,
    type: 'group',
    name: raw.name,
    online: false,
    lastMessagePreview: DEFAULT_ROOM_PREVIEW,
    lastMessageAt: raw.actionTime ?? '',
    unreadCount: prefs.unread[raw.name] ?? 0,
    archived: prefs.archivedIds.includes(raw.name),
});

export const getConversationSummaries = async (): Promise<ConversationSummary[]> => {
    const response = await request('GET_USER_LIST');
    const items = Array.isArray(response.data) ? (response.data as RawUserListItem[]) : [];
    const prefs = readPrefs();
    return items
        .filter((item) => item.type === ROOM_TYPE)
        .map((item) => toSummary(item, prefs))
        .sort((first, second) => parseDateTime(second.lastMessageAt).getTime() - parseDateTime(first.lastMessageAt).getTime());
};

export const getConversation = async (roomId: string): Promise<Conversation> => {
    const response = await request('GET_ROOM_CHAT_MES', { name: roomId, page: 1 });
    const room = (response.data ?? {}) as RawRoomData;
    const prefs = readPrefs();
    return {
        id: roomId,
        type: 'group',
        name: room.name ?? roomId,
        description: DEFAULT_ROOM_PREVIEW,
        muted: prefs.mutedIds.includes(roomId),
        currentUserId: getUsername(),
        members: toMembers(room.user),
        messages: toMessages(room.chatMess),
        hasMoreMessages: (room.chatMess ?? []).length >= MESSAGE_PAGE_SIZE,
        sharedPhotos: [],
        sharedFiles: [],
    };
};

export const getOlderMessages = async (
    roomId: string,
    page: number,
): Promise<{ messages: UserMessage[]; hasMore: boolean }> => {
    const response = await request('GET_ROOM_CHAT_MES', { name: roomId, page });
    const room = (response.data ?? {}) as RawRoomData;
    return {
        messages: toMessages(room.chatMess),
        hasMore: (room.chatMess ?? []).length >= MESSAGE_PAGE_SIZE,
    };
};

export const getMembersOnline = async (names: string[]): Promise<Record<string, boolean>> => {
    const result: Record<string, boolean> = {};
    const targets = names.slice(0, MAX_PRESENCE_CHECKS);
    for (const name of targets) {
        try {
            const response = await request('CHECK_USER_ONLINE', { user: name });
            result[name] = Boolean((response.data as { status?: boolean } | undefined)?.status);
        } catch {
            break;
        }
    }
    names.forEach((name) => {
        result[name] ??= false;
    });
    return result;
};

const listeners = new Set<(event: ChatEvent) => void>();

const emit = (event: ChatEvent): void => {
    listeners.forEach((listener) => listener(event));
};

export const subscribeChatEvents = (listener: (event: ChatEvent) => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

let activeRoomId: string | null = null;

export const setActiveRoom = (roomId: string | null): void => {
    activeRoomId = roomId;
};

export const getUnreadTotal = (): number => sumUnread(readPrefs());

export const isRoomMuted = (roomId: string): boolean => readPrefs().mutedIds.includes(roomId);

const pendingSends: PendingSend[] = [];

const prunePendingSends = (): void => {
    const now = Date.now();
    for (let index = pendingSends.length - 1; index >= 0; index -= 1) {
        if (pendingSends[index].expiresAt < now) pendingSends.splice(index, 1);
    }
};

const handleIncomingRoomMessage = (raw: RawRoomMessage & { to: string }): void => {
    const roomId = raw.to;
    const fromMe = raw.name === getUsername();
    prunePendingSends();
    if (fromMe) {
        const confirmedIndex = pendingSends.findIndex((item) => item.roomId === roomId && item.text === raw.mes);
        if (confirmedIndex !== -1) {
            pendingSends.splice(confirmedIndex, 1);
            return;
        }
    }
    const message = toUserMessage({ ...raw, createAt: undefined });
    const prefs = readPrefs();
    const isViewing = roomId === activeRoomId && !document.hidden;
    if (!fromMe && !isViewing) prefs.unread[roomId] = (prefs.unread[roomId] ?? 0) + 1;
    if (!fromMe) prefs.archivedIds = prefs.archivedIds.filter((id) => id !== roomId);
    writePrefs(prefs);
    emit({
        type: 'message',
        roomId,
        message,
        fromMe,
        viewing: isViewing,
        unreadCount: prefs.unread[roomId] ?? 0,
        archived: prefs.archivedIds.includes(roomId),
    });
    emit({ type: 'unread', total: sumUnread(prefs) });
};

const handleServerEvent = (response: ServerResponse): void => {
    if (response.event !== 'SEND_CHAT') return;
    if (response.status === 'error') {
        prunePendingSends();
        const failed = pendingSends.pop();
        if (failed) {
            emit({ type: 'sendError', roomId: failed.roomId, messageId: failed.messageId, reason: toErrorMessage(response.mes) });
        }
        return;
    }
    const raw = response.data as RawRoomMessage | undefined;
    if (raw && raw.type === ROOM_TYPE && raw.to) handleIncomingRoomMessage({ ...raw, to: raw.to });
};

export const startRealtime = (): (() => void) => wsService.addListener(handleServerEvent);

export const sendMessage = async (roomId: string, text: string): Promise<UserMessage> => {
    if (!wsService.isConnected()) throw new Error(DISCONNECTED_ERROR);
    const message = toUserMessage({ name: getUsername(), mes: text });
    prunePendingSends();
    pendingSends.push({ roomId, messageId: message.id, text, expiresAt: Date.now() + SEND_CONFIRM_WINDOW_MS });
    wsService.sendMessage('SEND_CHAT', { type: 'room', to: roomId, mes: text });
    return message;
};

export const markConversationUnread = async (roomId: string): Promise<void> => {
    const prefs = readPrefs();
    prefs.unread[roomId] = Math.max(prefs.unread[roomId] ?? 0, 1);
    writePrefs(prefs);
    emit({ type: 'unread', total: sumUnread(prefs) });
};

export const markConversationRead = async (roomId: string): Promise<void> => {
    const prefs = readPrefs();
    delete prefs.unread[roomId];
    writePrefs(prefs);
    emit({ type: 'unread', total: sumUnread(prefs) });
};

export const archiveConversation = async (roomId: string, archived: boolean): Promise<void> => {
    const prefs = readPrefs();
    prefs.archivedIds = archived
        ? [...new Set([...prefs.archivedIds, roomId])]
        : prefs.archivedIds.filter((id) => id !== roomId);
    writePrefs(prefs);
};

export const setConversationMuted = async (roomId: string, muted: boolean): Promise<void> => {
    const prefs = readPrefs();
    prefs.mutedIds = muted
        ? [...new Set([...prefs.mutedIds, roomId])]
        : prefs.mutedIds.filter((id) => id !== roomId);
    writePrefs(prefs);
};

const toJoinedRoom = (response: ServerResponse, fallbackName: string): ConversationSummary =>
    toSummary(
        { name: ((response.data ?? {}) as RawRoomData).name ?? fallbackName, type: ROOM_TYPE, actionTime: new Date().toISOString() },
        readPrefs(),
    );

export const createRoom = async (name: string): Promise<ConversationSummary> =>
    toJoinedRoom(await request('CREATE_ROOM', { name }), name);

export const joinRoom = async (name: string): Promise<ConversationSummary> =>
    toJoinedRoom(await request('JOIN_ROOM', { name }), name);

export const leaveConversation = async (roomId: string): Promise<void> => {
    await request('OUT_ROOM', { name: roomId });
    const prefs = readPrefs();
    delete prefs.unread[roomId];
    prefs.mutedIds = prefs.mutedIds.filter((id) => id !== roomId);
    prefs.archivedIds = prefs.archivedIds.filter((id) => id !== roomId);
    writePrefs(prefs);
    emit({ type: 'unread', total: sumUnread(prefs) });
};