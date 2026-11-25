import type { AccountSettings, StatusOption, UserProfile } from '../types';

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
    desktopNotifications: false,
    messageSound: false,
    showActivityStatus: true,
    messagePermission: 'friends',
    blockedAccountCount: 0,
    activeDevices: [],
    theme: 'light',
};