import { mockProfile, mockSettings, mockStatusOptions } from '../data/mockData';
import type { AccountSettings, StatusOption, UpdateProfilePayload, UpdateSettingsPayload, UserProfile } from '../types';
import { detectCurrentDevice, simulateLatency } from '../utils/helpers';
import { resetChatSession } from './chatService';
import { wsService } from './websocketService';

const LOGGED_IN_USERNAME_KEY = 'username';
const REMEMBER_ME_KEY = 'remember_me';
const SETTINGS_STORAGE_KEY = 'chat-app.settings';
const PROFILE_STORAGE_PREFIX = 'chat-app.profile.';
export const PROFILE_UPDATED_EVENT = 'chat-app:profile-updated';

const buildBaseProfile = (): UserProfile => {
    const username = window.localStorage.getItem(LOGGED_IN_USERNAME_KEY);
    if (!username) return { ...mockProfile, avatarUrl: undefined };
    return { ...mockProfile, id: username, displayName: username, username, avatarUrl: undefined };
};

const getProfileStorageKey = (): string =>
    `${PROFILE_STORAGE_PREFIX}${window.localStorage.getItem(LOGGED_IN_USERNAME_KEY) ?? mockProfile.id}`;

const readProfile = (): UserProfile => {
    const baseProfile = buildBaseProfile();
    const storedProfile = window.localStorage.getItem(getProfileStorageKey());
    return storedProfile ? { ...baseProfile, ...(JSON.parse(storedProfile) as Partial<UserProfile>) } : baseProfile;
};

export const getCurrentUser = async (): Promise<UserProfile> => {
    await simulateLatency();
    return readProfile();
};

export const getStatusOptions = async (): Promise<StatusOption[]> => {
    await simulateLatency(80);
    return mockStatusOptions.map((option) => ({ ...option }));
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    await simulateLatency(400);
    const updatedProfile = { ...readProfile(), ...payload };
    window.localStorage.setItem(getProfileStorageKey(), JSON.stringify(updatedProfile));
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    return updatedProfile;
};

const USER_SETTING_KEYS = [
    'desktopNotifications',
    'messageSound',
    'showActivityStatus',
    'messagePermission',
    'theme',
] as const;

const pickUserSettings = (settings: AccountSettings): UpdateSettingsPayload =>
    Object.fromEntries(USER_SETTING_KEYS.map((key) => [key, settings[key]]));

const readStoredSettings = (): UpdateSettingsPayload => {
    try {
        return JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}') as UpdateSettingsPayload;
    } catch {
        return {};
    }
};

export const getStoredSettings = (): AccountSettings => ({
    ...mockSettings,
    ...readStoredSettings(),
    activeDevices: [detectCurrentDevice()],
});

export const getSettings = async (): Promise<AccountSettings> => {
    await simulateLatency();
    return getStoredSettings();
};

export const updateSettings = async (payload: UpdateSettingsPayload): Promise<AccountSettings> => {
    await simulateLatency(60);
    const next = { ...getStoredSettings(), ...payload };
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(pickUserSettings(next)));
    return next;
};

export const signOut = async (): Promise<void> => {
    wsService.sendMessage('LOGOUT', {});
    wsService.logout();
    window.localStorage.removeItem(REMEMBER_ME_KEY);
    resetChatSession();
};