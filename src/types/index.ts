

export type ConversationType = 'direct' | 'group';
export type MemberRole = 'admin' | 'member';

export interface ConversationSummary {
    id: string;
    type: ConversationType;
    name: string;
    avatarUrl?: string;
    online: boolean;
    lastMessagePreview: string;
    lastMessageAt: string;
    unreadCount: number;
    archived: boolean;
}

export interface ConversationMember {
    id: string;
    name: string;
    avatarUrl?: string;
    role: MemberRole;
    online: boolean;
}

export interface Attachment {
    id: string;
    fileName: string;
    sizeBytes: number;
    mimeType: string;
    url: string;
}

export interface SharedFile extends Attachment {
    sharedAt: string;
}

export interface SharedPhoto {
    id: string;
    url: string;
    alt: string;
}

export interface Reaction {
    emoji: string;
    count: number;
}

export interface UserMessage {
    kind: 'user';
    id: string;
    senderId: string;
    text: string;
    sentAt: string;
    reactions: Reaction[];
    attachment?: Attachment;
    seenByIds: string[];
}

export interface SystemMessage {
    kind: 'system';
    id: string;
    text: string;
    sentAt: string;
}

export type Message = UserMessage | SystemMessage;

export interface Conversation {
    id: string;
    type: ConversationType;
    name: string;
    description: string;
    avatarUrl?: string;
    muted: boolean;
    currentUserId: string;
    members: ConversationMember[];
    messages: Message[];
    hasMoreMessages: boolean;
    sharedPhotos: SharedPhoto[];
    sharedFiles: SharedFile[];
}

export type ChatEvent =
    | {
    type: 'message';
    roomId: string;
    message: UserMessage;
    fromMe: boolean;
    viewing: boolean;
    unreadCount: number;
    archived: boolean;
}
    | { type: 'sendError'; roomId: string; messageId: string; reason: string }
    | { type: 'unread'; total: number };

export interface UserProfile {
    id: string;
    displayName: string;
    username: string;
    bio: string;
    statusId: string;
    avatarUrl?: string;
}

export interface UpdateProfilePayload {
    displayName: string;
    username: string;
    bio: string;
    statusId: string;
    avatarUrl?: string;
}

export interface StatusOption {
    id: string;
    emoji: string;
    label: string;
}

export type MessagePermission = 'everyone' | 'friends' | 'nobody';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ActiveDevice {
    id: string;
    name: string;
    isCurrent: boolean;
}

export interface AccountSettings {
    desktopNotifications: boolean;
    messageSound: boolean;
    showActivityStatus: boolean;
    messagePermission: MessagePermission;
    blockedAccountCount: number;
    activeDevices: ActiveDevice[];
    theme: ThemeMode;
}

export type UpdateSettingsPayload = Partial<
    Pick<
        AccountSettings,
        'desktopNotifications' | 'messageSound' | 'showActivityStatus' | 'messagePermission' | 'theme'
    >
>;