import type {
    Attachment,
    Conversation,
    ConversationMember,
    ConversationSummary,
    SharedFile,
    SharedPhoto,
    UserMessage,
    AccountSettings,
    StatusOption,
    UserProfile,
} from '../types';

export const CURRENT_USER_ID = 'hoaian';

const at = (hours: number, minutes: number, daysAgo = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
};

const memberHoaiAn: ConversationMember = {
    id: CURRENT_USER_ID,
    name: 'Nguyễn Hoài An',
    role: 'admin',
    online: true,
};
const memberLinh: ConversationMember = {
    id: 'linh',
    name: 'Linh Nguyễn',
    role: 'member',
    online: true,
};
const memberMai: ConversationMember = { id: 'mai', name: 'Mai Trần', role: 'member', online: true };
const memberHuy: ConversationMember = { id: 'huy', name: 'Huy Phạm', role: 'member', online: false };
const memberMinh: ConversationMember = { id: 'minh', name: 'Minh Anh', role: 'member', online: false };
const memberTuan: ConversationMember = { id: 'tuan', name: 'Tuấn Lê', role: 'member', online: false };

const tripPlan: Attachment = {
    id: 'file-dalat-plan',
    fileName: 'Lịch-trình-Đà-Lạt.pdf',
    sizeBytes: 2516582,
    mimeType: 'application/pdf',
    url: '#',
};

const sharedPhotos: SharedPhoto[] = [
    { id: 'photo-hills', url: '/images/shared-hills.svg', alt: 'Đồi xanh buổi sáng' },
    { id: 'photo-cafe', url: '/images/shared-cafe.svg', alt: 'Quán cà phê quen' },
    { id: 'photo-valley', url: '/images/shared-valley.svg', alt: 'Thung lũng sương mỏng' },
];

const sharedFiles: SharedFile[] = [{ ...tripPlan, sharedAt: at(14, 18) }];

const userMessage = (
    id: string,
    senderId: string,
    text: string,
    sentAt: string,
    extra: Partial<UserMessage> = {},
): UserMessage => ({ kind: 'user', id, senderId, text, sentAt, reactions: [], seenByIds: [], ...extra });

const weekendGroup: Conversation = {
    id: 'conv-weekend',
    type: 'group',
    name: 'Chuyện cuối tuần',
    description: 'Một chiếc hẹn, nhiều niềm vui.',
    muted: false,
    currentUserId: CURRENT_USER_ID,
    members: [memberHoaiAn, memberLinh, memberMai, memberHuy, memberMinh, memberTuan],
    typingUserId: memberMai.id,
    sharedPhotos,
    sharedFiles,
    messages: [
        userMessage('m-1', memberMai.id, 'Cả nhà ơi, sáng thứ Bảy mình đi sớm nhé.\n7 giờ ở quán quen được không? ☀️', at(14, 12), {
            reactions: [
                { emoji: '👍', count: 3 },
                { emoji: '☀️', count: 2 },
            ],
        }),
        userMessage('m-2', memberHuy.id, 'Mình mang máy ảnh, mọi người cứ yên tâm 📷', at(14, 15)),
        userMessage('m-3', CURRENT_USER_ID, 'Mình đặt bàn rồi nha. Hẹn cả nhà!', at(14, 16), {
            seenByIds: [memberLinh.id, memberMai.id, memberHuy.id, memberMinh.id],
        }),
        userMessage('m-4', memberLinh.id, 'Gửi mọi người lịch trình cuối cùng nè.', at(14, 18), { attachment: tripPlan }),
        { kind: 'system', id: 'm-5', text: 'Mai đã ghim một tin nhắn', sentAt: at(14, 20) },
    ],
};

const directConversation = (
    id: string,
    partner: ConversationMember,
    description: string,
    messages: UserMessage[],
    typingUserId?: string,
): Conversation => ({
    id,
    type: 'direct',
    name: partner.name,
    description,
    avatarUrl: partner.avatarUrl,
    muted: false,
    currentUserId: CURRENT_USER_ID,
    members: [memberHoaiAn, partner],
    typingUserId,
    sharedPhotos: [],
    sharedFiles: [],
    messages,
});

export const mockConversations: Conversation[] = [
    directConversation(
        'conv-linh',
        memberLinh,
        'Thích chụp ảnh và những chuyến đi xa.',
        [
            userMessage('l-1', memberLinh.id, 'Cuối tuần này mình đi Đà Lạt nhé?', at(14, 28)),
            userMessage('l-2', CURRENT_USER_ID, 'Chốt luôn! Để mình xem vé xe nha.', at(14, 30), { seenByIds: [memberLinh.id] }),
            userMessage('l-3', memberLinh.id, 'Mình gửi bạn mấy tấm hôm qua nhé 🌿', at(14, 32)),
        ],
    ),
    weekendGroup,
    directConversation('conv-minh', memberMinh, 'Đang tận hưởng một ngày chậm.', [
        userMessage('mi-1', memberMinh.id, 'Bản thiết kế mới xong chưa bạn?', at(11, 40)),
        userMessage('mi-2', CURRENT_USER_ID, 'Ừ, để mình xem rồi nhắn nhé.', at(11, 45), { seenByIds: [memberMinh.id] }),
    ]),
    directConversation('conv-mai', memberMai, 'Cà phê sáng là chân ái.', [
        userMessage('ma-1', memberMai.id, 'Đây là ảnh hôm qua nhé, bạn xem thử.', at(10, 5)),
        userMessage('ma-2', memberMai.id, 'Đã gửi một ảnh', at(10, 8)),
    ]),
    directConversation('conv-huy', memberHuy, 'Máy ảnh và những chuyến đi.', [
        userMessage('h-1', CURRENT_USER_ID, 'Ảnh hôm đó đẹp lắm, cảm ơn Huy nhé.', at(20, 10, 1), { seenByIds: [memberHuy.id] }),
        userMessage('h-2', memberHuy.id, 'Cảm ơn An nhiều nha!', at(20, 30, 1)),
    ]),
    directConversation('conv-home', { id: 'giadinh', name: 'Nhà mình', role: 'member', online: false }, 'Nhóm của cả nhà.', [
        userMessage('n-1', 'giadinh', 'Mẹ: Tối về ăn cơm nhé con', at(17, 45, 1)),
    ]),
    directConversation('conv-tuan', memberTuan, 'Hẹn gặp ở quán quen.', [
        userMessage('t-1', CURRENT_USER_ID, 'Hẹn gặp lại 👋', at(9, 30, 3), { seenByIds: [memberTuan.id] }),
    ]),
];

const summaryOverrides: Record<string, { preview: string; unread: number; at: string; online?: boolean }> = {
    'conv-linh': { preview: 'Mình gửi bạn mấy tấm hôm qua nhé 🌿', unread: 2, at: at(14, 32), online: true },
    'conv-weekend': { preview: 'Mai: Hẹn cả nhà sáng thứ Bảy ☀️', unread: 0, at: at(14, 20) },
    'conv-minh': { preview: 'Bạn: Ừ, để mình xem rồi nhắn nhé.', unread: 0, at: at(11, 45) },
    'conv-mai': { preview: 'Đã gửi một ảnh', unread: 1, at: at(10, 8) },
    'conv-huy': { preview: 'Cảm ơn An nhiều nha!', unread: 0, at: at(20, 30, 1) },
    'conv-home': { preview: 'Mẹ: Tối về ăn cơm nhé con', unread: 0, at: at(17, 45, 1) },
    'conv-tuan': { preview: 'Bạn: Hẹn gặp lại 👋', unread: 0, at: at(9, 30, 3) },
};

export const mockConversationSummaries: ConversationSummary[] = mockConversations.map((conversation) => {
    const override = summaryOverrides[conversation.id];
    return {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        avatarUrl: conversation.avatarUrl,
        online: override.online ?? false,
        lastMessagePreview: override.preview,
        lastMessageAt: override.at,
        unreadCount: override.unread,
    };
});

export const mockProfile: UserProfile = {
    id: 'hoaian',
    displayName: 'Nguyễn Hoài An',
    username: 'hoaian',
    bio: 'Thích những chuyến đi và những câu chuyện nhỏ. 🌿',
    statusId: 'slow-day',
};

export const mockStatusOptions: StatusOption[] = [
    { id: 'slow-day', emoji: '🌿', label: 'Đang tận hưởng một ngày chậm' },
    { id: 'working', emoji: '💻', label: 'Đang tập trung làm việc' },
    { id: 'coffee', emoji: '☕', label: 'Đang uống cà phê' },
    { id: 'traveling', emoji: '✈️', label: 'Đang trên đường đi' },
    { id: 'resting', emoji: '🌙', label: 'Đang nghỉ ngơi' },
];

export const mockSettings: AccountSettings = {
    desktopNotifications: true,
    messageSound: false,
    showActivityStatus: true,
    messagePermission: 'friends',
    blockedAccountCount: 2,
    passwordChangedAt: '2026-09-12T08:00:00.000Z',
    activeDevices: [{ id: 'device-chrome-macos', name: 'Chrome trên macOS', isCurrent: true }],
    theme: 'light',
};