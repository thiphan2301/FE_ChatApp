import { mockProfile, mockSettings, mockStatusOptions } from '../data/mockData';
import type { AccountSettings, StatusOption, UpdateProfilePayload, UpdateSettingsPayload, UserProfile } from '../types';
import { simulateLatency } from '../utils/helpers';
import { wsService } from './websocketService';

const LOGGED_IN_USERNAME_KEY = 'username';
const RE_LOGIN_CODE_KEY = 're_login_code';
const REMEMBER_ME_KEY = 'remember_me';
const SETTINGS_STORAGE_KEY = 'chat-app.settings';

let savedEdits: Partial<UserProfile> = {};

const buildBaseProfile = (): UserProfile => {
    const username = window.localStorage.getItem(LOGGED_IN_USERNAME_KEY);
    if (!username) return { ...mockProfile };
    return { ...mockProfile, id: username, displayName: username, username, avatarUrl: undefined };
};

const readProfile = (): UserProfile => ({ ...buildBaseProfile(), ...savedEdits });

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
    savedEdits = { ...savedEdits, ...payload };
    return readProfile();
};

const readStoredSettings = (): AccountSettings => {
    try {
        const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        return stored === null ? { ...mockSettings } : { ...mockSettings, ...(JSON.parse(stored) as Partial<AccountSettings>) };
    } catch {
        return { ...mockSettings };
    }
};

export const getSettings = async (): Promise<AccountSettings> => {
    await simulateLatency();
    return readStoredSettings();
};

export const updateSettings = async (payload: UpdateSettingsPayload): Promise<AccountSettings> => {
    await simulateLatency(60);
    const next = { ...readStoredSettings(), ...payload };
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    return next;
};

export const signOut = async (): Promise<void> => {
    wsService.sendMessage('LOGOUT', {});
    [LOGGED_IN_USERNAME_KEY, RE_LOGIN_CODE_KEY, REMEMBER_ME_KEY].forEach((key) =>
        window.localStorage.removeItem(key),
    );
};