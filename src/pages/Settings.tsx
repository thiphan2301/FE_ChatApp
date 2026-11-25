import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SegmentedControl, StatusPanel, Toggle } from '../components/common/Controls';
import { UserAvatar } from '../components/common/UserAvatar';
import { useAsyncData } from '../hooks/useAsyncData';
import { getCurrentUser, getSettings, signOut, updateSettings } from '../services/accountService';
import { requestNotificationAccess } from '../services/notificationService';
import type {
    AccountSettings,
    MessagePermission,
    ThemeMode,
    UpdateSettingsPayload,
    UserProfile,
} from '../types';
import type { ReactNode } from 'react';

type SettingsSectionId = 'notifications' | 'privacy' | 'security' | 'appearance';

const SETTINGS_SECTIONS: { id: SettingsSectionId; label: string; icon: string }[] = [
    { id: 'notifications', label: 'Thông báo', icon: 'fa-regular fa-bell' },
    { id: 'privacy', label: 'Quyền riêng tư', icon: 'fa-solid fa-shield-halved' },
    { id: 'security', label: 'Bảo mật', icon: 'fa-solid fa-lock' },
    { id: 'appearance', label: 'Giao diện', icon: 'fa-regular fa-sun' },
];

const MESSAGE_PERMISSION_OPTIONS: { value: MessagePermission; label: string }[] = [
    { value: 'everyone', label: 'Mọi người' },
    { value: 'friends', label: 'Bạn bè' },
    { value: 'nobody', label: 'Không ai' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Sáng' },
    { value: 'dark', label: 'Tối' },
    { value: 'system', label: 'Hệ thống' },
];

const APP_VERSION_LABEL = 'Phiên bản 1.0';

const loadSettingsPage = async () => {
    const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
    return { settings, user };
};

const useSettingsPage = () => {
    const { status, data, retry, updateData } = useAsyncData(loadSettingsPage, 'settings');

    const changeSettings = async (payload: UpdateSettingsPayload) => {
        const previous = data?.settings;
        updateData((current) => ({ ...current, settings: { ...current.settings, ...payload } }));
        try {
            await updateSettings(payload);
        } catch {
            if (previous) updateData((current) => ({ ...current, settings: previous }));
        }
    };

    return { status, data, retry, changeSettings };
};

interface SettingRowProps {
    label: string;
    description?: string;
    children: ReactNode;
}

const SettingRow = ({ label, description, children }: SettingRowProps) => (
    <div className="flex items-center justify-between gap-6 py-2.5">
        <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink">{label}</p>
            {description && <p className="mt-0.5 text-[11px] text-mist">{description}</p>}
        </div>
        {children}
    </div>
);

interface SettingsSectionProps {
    id: string;
    title: string;
    description?: string;
    action?: ReactNode;
    children?: ReactNode;
}

const SettingsSection = ({ id, title, description, action, children }: SettingsSectionProps) => (
    <section
        id={id}
        aria-labelledby={`${id}-title`}
        className="scroll-mt-4 border-t border-line py-5 first:border-t-0 first:pt-0"
    >
        <div className="flex items-center justify-between gap-6">
            <div>
                <h2 id={`${id}-title`} className="text-base font-semibold text-ink">
                    {title}
                </h2>
                {description && <p className="mt-1 text-xs text-mist">{description}</p>}
            </div>
            {action}
        </div>
        {children && <div className="mt-3 flex flex-col">{children}</div>}
    </section>
);

interface NotificationSettingsProps {
    settings: AccountSettings;
    onChange: (payload: UpdateSettingsPayload) => void;
}

const NOTIFICATION_DENIED_NOTE = 'Trình duyệt đang chặn thông báo. Hãy cho phép thông báo trong cài đặt trang web.';
const NOTIFICATION_UNSUPPORTED_NOTE = 'Trình duyệt này không hỗ trợ thông báo trên máy tính.';

const NotificationSettings = ({ settings, onChange }: NotificationSettingsProps) => {
    const [accessNote, setAccessNote] = useState<string | null>(null);

    const handleDesktopChange = async (checked: boolean) => {
        if (checked) {
            const access = await requestNotificationAccess();
            if (access !== 'granted') {
                setAccessNote(access === 'unsupported' ? NOTIFICATION_UNSUPPORTED_NOTE : NOTIFICATION_DENIED_NOTE);
                return;
            }
        }
        setAccessNote(null);
        onChange({ desktopNotifications: checked });
    };

    return (
        <SettingsSection id="notifications" title="Thông báo">
            <SettingRow
                label="Thông báo trên máy tính"
                description="Nhận tin nhắn mới ngay cả khi bạn đang ở tab khác."
            >
                <Toggle
                    label="Thông báo trên máy tính"
                    checked={settings.desktopNotifications}
                    onChange={(checked) => void handleDesktopChange(checked)}
                />
            </SettingRow>
            {accessNote && (
                <p role="alert" className="pb-1 text-[11px] text-danger">
                    {accessNote}
                </p>
            )}
            <SettingRow label="Âm thanh tin nhắn" description="Một âm báo nhẹ khi có người nhắn cho bạn.">
                <Toggle
                    label="Âm thanh tin nhắn"
                    checked={settings.messageSound}
                    onChange={(checked) => onChange({ messageSound: checked })}
                />
            </SettingRow>
        </SettingsSection>
    );
};

interface PrivacySettingsProps {
    settings: AccountSettings;
    onChange: (payload: UpdateSettingsPayload) => void;
}

const PrivacySettings = ({ settings, onChange }: PrivacySettingsProps) => (
    <SettingsSection
        id="privacy"
        title="Quyền riêng tư"
        description="Các tùy chọn này được lưu trên thiết bị của bạn vì máy chủ chưa hỗ trợ."
    >
        <SettingRow label="Hiển thị trạng thái hoạt động" description="Cho bạn bè biết khi bạn đang online.">
            <Toggle
                label="Hiển thị trạng thái hoạt động"
                checked={settings.showActivityStatus}
                onChange={(checked) => onChange({ showActivityStatus: checked })}
            />
        </SettingRow>
        <SettingRow label="Ai có thể nhắn tin cho bạn?">
            <div className="relative">
                <select
                    aria-label="Ai có thể nhắn tin cho bạn?"
                    value={settings.messagePermission}
                    onChange={(event) => onChange({ messagePermission: event.target.value as MessagePermission })}
                    className="cursor-pointer appearance-none bg-transparent py-1 pl-2 pr-5 text-right text-xs text-slate outline-none"
                >
                    {MESSAGE_PERMISSION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <i
                    className="fa-solid fa-chevron-down pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-slate"
                    aria-hidden="true"
                ></i>
            </div>
        </SettingRow>
        <SettingRow label="Tài khoản đã chặn">
            <span className="text-xs text-slate">{settings.blockedAccountCount} tài khoản</span>
        </SettingRow>
    </SettingsSection>
);

interface SecuritySettingsProps {
    settings: AccountSettings;
}

const SecuritySettings = ({ settings }: SecuritySettingsProps) => (
    <SettingsSection id="security" title="Bảo mật">
        <div className="flex items-center justify-between gap-6 py-2.5">
            <div>
                <p className="text-[13px] font-medium text-ink">Mật khẩu</p>
                <p className="mt-0.5 text-[11px] text-mist">Mật khẩu của bạn được mã hóa an toàn trên máy chủ.</p>
            </div>
            <button
                type="button"
                disabled
                title="Máy chủ chưa hỗ trợ đổi mật khẩu"
                className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-ink opacity-50"
            >
                <i className="fa-solid fa-key text-xs" aria-hidden="true"></i>
                Đổi mật khẩu
            </button>
        </div>
        <ul className="mt-1 flex flex-col gap-2">
            {settings.activeDevices.map((device) => (
                <li key={device.id} className="flex items-center gap-2 rounded-lg bg-paper px-3 py-2.5 text-[11px] text-slate">
                    <i className="fa-solid fa-desktop" aria-hidden="true"></i>
                    <span>
                        {device.name}
                        {device.isCurrent && ' · Thiết bị này'}
                    </span>
                    <span className="font-medium text-forest-soft">Đang hoạt động</span>
                </li>
            ))}
        </ul>
    </SettingsSection>
);

interface AppearanceSettingsProps {
    settings: AccountSettings;
    onChange: (payload: UpdateSettingsPayload) => void;
}

const AppearanceSettings = ({ settings, onChange }: AppearanceSettingsProps) => (
    <SettingsSection
        id="appearance"
        title="Giao diện"
        description="Chọn không gian bạn thấy dễ chịu nhất."
        action={
            <SegmentedControl
                label="Chế độ giao diện"
                options={THEME_OPTIONS}
                value={settings.theme}
                onChange={(theme) => onChange({ theme })}
            />
        }
    />
);

interface SettingsNavProps {
    user: UserProfile;
    activeSection: SettingsSectionId;
    onSelect: (section: SettingsSectionId) => void;
    onSignOut: () => void;
}

const SettingsNav = ({ user, activeSection, onSelect, onSignOut }: SettingsNavProps) => (
    <aside className="flex h-full w-[264px] shrink-0 flex-col px-6 py-8 max-[1100px]:w-56">
        <h2 className="text-xl font-semibold text-ink">Cài đặt</h2>

        <div className="mt-6 flex items-center gap-3">
            <UserAvatar name={user.displayName} imageUrl={user.avatarUrl} size="sm" />
            <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">{user.displayName}</p>
                <p className="truncate text-[11px] text-mist">@{user.username}</p>
            </div>
        </div>

        <nav aria-label="Mục cài đặt" className="mt-6 flex flex-col gap-1">
            {SETTINGS_SECTIONS.map((section) => {
                const active = section.id === activeSection;
                return (
                    <button
                        key={section.id}
                        type="button"
                        aria-current={active ? 'true' : undefined}
                        onClick={() => onSelect(section.id)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                            active ? 'bg-sage font-medium text-forest-soft' : 'text-slate hover:bg-white'
                        }`}
                    >
                        <i className={`${section.icon} w-4 text-center text-xs`} aria-hidden="true"></i>
                        {section.label}
                    </button>
                );
            })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
            <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-2 self-start text-[13px] font-medium text-danger hover:underline"
            >
                <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
                Đăng xuất
            </button>
            <p className="text-[11px] text-mist">{APP_VERSION_LABEL}</p>
        </div>
    </aside>
);

export default function Settings() {
    const navigate = useNavigate();
    const { status, data, retry, changeSettings } = useSettingsPage();
    const [activeSection, setActiveSection] = useState<SettingsSectionId>('notifications');

    if (status !== 'ready' || !data) {
        return <StatusPanel variant={status === 'error' ? 'error' : 'loading'} onRetry={retry} />;
    }

    const handleSelectSection = (section: SettingsSectionId) => {
        setActiveSection(section);
        document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="ui-isolated flex h-full min-w-0 flex-1">
            <SettingsNav
                user={data.user}
                activeSection={activeSection}
                onSelect={handleSelectSection}
                onSignOut={async () => {
                    await signOut();
                    navigate('/login');
                }}
            />
            <div className="min-w-0 flex-1 overflow-y-auto bg-white px-12 py-8">
                <header className="pb-5">
                    <h1 className="text-[28px] font-semibold text-ink">Theo cách của bạn</h1>
                    <p className="mt-2 text-sm text-slate">Một vài điều chỉnh để thấy thoải mái hơn khi trò chuyện.</p>
                </header>
                <div className="border-t border-line pt-5">
                    <NotificationSettings settings={data.settings} onChange={changeSettings} />
                    <PrivacySettings settings={data.settings} onChange={changeSettings} />
                    <SecuritySettings settings={data.settings} />
                    <AppearanceSettings settings={data.settings} onChange={changeSettings} />
                    <p role="status" className="flex items-center gap-2 pt-2 text-[11px] text-mist">
                        <i className="fa-regular fa-circle-check text-forest-soft" aria-hidden="true"></i>
                        Thay đổi của bạn được lưu tự động.
                    </p>
                </div>
            </div>
        </div>
    );
}