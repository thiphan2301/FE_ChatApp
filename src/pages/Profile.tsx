import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FormField, StatusPanel } from '../components/common/Controls';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { UserAvatar } from '../components/common/UserAvatar';
import { useAsyncData } from '../hooks/useAsyncData';
import { getCurrentUser, getStatusOptions, updateProfile } from '../services/accountService';
import type { StatusOption, UserProfile } from '../types';
import {
    AVATAR_ACCEPTED_TYPES,
    AVATAR_MAX_SIZE_LABEL,
    BIO_MAX_LENGTH,
    countCharacters,
    fieldInputClass,
    limitCharacters,
    readAvatarAsDataUrl,
    validateAvatarFile,
    validateDisplayName,
} from '../utils/helpers';
import type { ProfileErrors } from '../utils/helpers';

const loadProfileData = async () => {
    const [profile, statuses] = await Promise.all([getCurrentUser(), getStatusOptions()]);
    return { profile, statuses };
};

const useProfileData = () => useAsyncData(loadProfileData, 'profile');

type EditableField = 'displayName' | 'bio' | 'statusId' | 'avatarUrl';

const EDITABLE_FIELDS: EditableField[] = ['displayName', 'bio', 'statusId', 'avatarUrl'];

const useProfileForm = (initialProfile: UserProfile) => {
    const [savedProfile, setSavedProfile] = useState(initialProfile);
    const [draft, setDraft] = useState(initialProfile);
    const [saving, setSaving] = useState(false);
    const [saveFailed, setSaveFailed] = useState(false);

    const errors: ProfileErrors = {
        displayName: validateDisplayName(draft.displayName),
    };
    const isValid = !errors.displayName;
    const isDirty = EDITABLE_FIELDS.some((field) => draft[field] !== savedProfile[field]);

    const setField = (field: EditableField, value: string) => {
        setDraft((current) => ({ ...current, [field]: value }));
        setSaveFailed(false);
    };

    const reset = () => {
        setDraft(savedProfile);
        setSaveFailed(false);
    };

    const save = async () => {
        if (!isDirty || !isValid || saving) return;
        setSaving(true);
        setSaveFailed(false);
        try {
            const updated = await updateProfile({
                displayName: draft.displayName.trim(),
                username: draft.username,
                bio: draft.bio,
                statusId: draft.statusId,
                avatarUrl: draft.avatarUrl,
            });
            setSavedProfile(updated);
            setDraft(updated);
        } catch {
            setSaveFailed(true);
        } finally {
            setSaving(false);
        }
    };

    return { draft, errors, isDirty, isValid, saving, saveFailed, setField, reset, save };
};

interface AvatarUploaderProps {
    name: string;
    avatarUrl?: string;
    onChange: (avatarUrl: string) => void;
}

const AvatarUploader = ({ name, avatarUrl, onChange }: AvatarUploaderProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | undefined>();

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        const validationError = validateAvatarFile(file);
        setError(validationError);
        if (validationError) return;
        try {
            onChange(await readAvatarAsDataUrl(file));
        } catch {
            setError('Không thể đọc ảnh. Vui lòng chọn ảnh khác.');
        }
    };

    return (
        <div className="flex items-center gap-5">
            <UserAvatar name={name} imageUrl={avatarUrl} size="xl" />
            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex items-center gap-2 self-start rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-ink transition hover:border-forest-soft"
                >
                    <i className="fa-solid fa-camera" aria-hidden="true"></i>
                    Đổi ảnh đại diện
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept={AVATAR_ACCEPTED_TYPES.join(',')}
                    onChange={(event) => void handleFileChange(event)}
                    className="hidden"
                    aria-label="Chọn ảnh đại diện"
                />
                {error ? (
                    <p role="alert" className="text-xs text-danger">
                        {error}
                    </p>
                ) : (
                    <p className="text-xs text-mist">JPG hoặc PNG · Tối đa {AVATAR_MAX_SIZE_LABEL}</p>
                )}
            </div>
        </div>
    );
};

interface ProfileFormProps {
    draft: UserProfile;
    errors: ProfileErrors;
    statuses: StatusOption[];
    isDirty: boolean;
    isValid: boolean;
    saving: boolean;
    saveFailed: boolean;
    onChange: (field: EditableField, value: string) => void;
    onReset: () => void;
    onSubmit: () => void;
}

const ProfileForm = ({
                         draft,
                         errors,
                         statuses,
                         isDirty,
                         isValid,
                         saving,
                         saveFailed,
                         onChange,
                         onReset,
                         onSubmit,
                     }: ProfileFormProps) => {
    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <AvatarUploader
                name={draft.displayName}
                avatarUrl={draft.avatarUrl}
                onChange={(avatarUrl) => onChange('avatarUrl', avatarUrl)}
            />

            <FormField id="displayName" label="Tên hiển thị" error={errors.displayName}>
                <input
                    id="displayName"
                    value={draft.displayName}
                    onChange={(event) => onChange('displayName', event.target.value)}
                    aria-invalid={Boolean(errors.displayName)}
                    aria-describedby="displayName-message"
                    className={fieldInputClass(Boolean(errors.displayName))}
                />
            </FormField>

            <FormField
                id="username"
                label="Tên đăng nhập"
                hint="Tên đăng nhập gắn với tài khoản trên máy chủ nên không thể thay đổi."
            >
                <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-mist">@</span>
                    <input
                        id="username"
                        value={draft.username}
                        readOnly
                        aria-describedby="username-message"
                        className={`${fieldInputClass(false)} cursor-not-allowed bg-paper pl-7 text-slate`}
                    />
                </div>
            </FormField>

            <FormField
                id="bio"
                label="Giới thiệu"
                aside={
                    <span className="text-[11px] text-mist">
            {countCharacters(draft.bio)} / {BIO_MAX_LENGTH}
          </span>
                }
            >
        <textarea
            id="bio"
            value={draft.bio}
            rows={3}
            onChange={(event) => onChange('bio', limitCharacters(event.target.value, BIO_MAX_LENGTH))}
            className={`${fieldInputClass(false)} resize-none`}
        />
            </FormField>

            <FormField id="statusId" label="Trạng thái" hint="Trạng thái sẽ hiển thị bên cạnh tên của bạn.">
                <div className="relative">
                    <select
                        id="statusId"
                        value={draft.statusId}
                        onChange={(event) => onChange('statusId', event.target.value)}
                        aria-describedby="statusId-message"
                        className={`${fieldInputClass(false)} appearance-none pr-10`}
                    >
                        {statuses.map((status) => (
                            <option key={status.id} value={status.id}>
                                {status.emoji} {status.label}
                            </option>
                        ))}
                    </select>
                    <i
                        className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate"
                        aria-hidden="true"
                    ></i>
                </div>
            </FormField>

            <div className="mt-1 flex items-center justify-between border-t border-line pt-5">
                <p role="status" className={`text-xs ${saveFailed ? 'text-danger' : 'text-mist'}`}>
                    {saveFailed ? 'Không lưu được thay đổi. Vui lòng thử lại.' : isDirty && 'Bạn có thay đổi chưa lưu'}
                </p>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={!isDirty || saving}
                        className="rounded-xl border border-line bg-white px-5 py-2.5 text-[13px] font-medium text-ink transition hover:border-forest-soft disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <PrimaryButton
                        type="submit"
                        fullWidth={false}
                        disabled={!isDirty || !isValid || saving}
                        className="px-5 py-2.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </PrimaryButton>
                </div>
            </div>
        </form>
    );
};

interface ProfilePreviewCardProps {
    profile: UserProfile;
    status?: StatusOption;
}

const ProfilePreviewCard = ({ profile, status }: ProfilePreviewCardProps) => (
    <aside aria-label="Xem trước hồ sơ" className="flex flex-col gap-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-mist">Mọi người sẽ thấy</p>

        <div className="flex flex-col gap-4 rounded-3xl bg-paper p-7">
            <div className="self-start">
                <UserAvatar name={profile.displayName} imageUrl={profile.avatarUrl} size="xl" online />
            </div>
            <div className="flex flex-col gap-1">
                <p className="break-words text-xl font-semibold text-ink">{profile.displayName || 'Tên hiển thị'}</p>
                <p className="text-[13px] text-mist">@{profile.username}</p>
            </div>
            <p className="whitespace-pre-line break-words border-t border-line pt-4 text-[13px] leading-relaxed text-ink">
                {profile.bio}
            </p>
            {status && (
                <p className="text-xs font-medium text-forest-soft">
                    {status.emoji} {status.label}
                </p>
            )}
        </div>

        <p className="flex items-center gap-2 text-xs text-mist">
            <i className="fa-regular fa-eye" aria-hidden="true"></i>
            Ảnh, tên và giới thiệu của bạn được hiển thị với bạn bè.
        </p>
        <p className="font-serif text-xl italic leading-relaxed text-mist">
            Là bạn thôi, đã đủ để bắt đầu một câu chuyện.
        </p>
    </aside>
);

interface ProfileEditorProps {
    profile: UserProfile;
    statuses: StatusOption[];
}

const ProfileEditor = ({ profile, statuses }: ProfileEditorProps) => {
    const form = useProfileForm(profile);

    return (
        <div className="grid grid-cols-[minmax(0,600px)_minmax(0,1fr)] gap-14 px-12 pb-10 pt-8 max-[1100px]:grid-cols-1">
            <ProfileForm
                draft={form.draft}
                errors={form.errors}
                statuses={statuses}
                isDirty={form.isDirty}
                isValid={form.isValid}
                saving={form.saving}
                saveFailed={form.saveFailed}
                onChange={form.setField}
                onReset={form.reset}
                onSubmit={form.save}
            />
            <ProfilePreviewCard
                profile={form.draft}
                status={statuses.find((status) => status.id === form.draft.statusId)}
            />
        </div>
    );
};

export default function Profile() {
    const { status, data, retry } = useProfileData();

    return (
        <div className="ui-isolated min-w-0 flex-1 bg-white">
            <header className="mx-12 border-b border-line pb-6 pt-10">
                <h1 className="text-[28px] font-semibold text-ink">Hồ sơ của bạn</h1>
                <p className="mt-2 text-sm text-slate">Một chút về bạn, để những lời chào gần gũi hơn.</p>
            </header>
            {status === 'ready' && data ? (
                <ProfileEditor profile={data.profile} statuses={data.statuses} />
            ) : (
                <div className="h-96">
                    <StatusPanel variant={status === 'error' ? 'error' : 'loading'} onRetry={retry} />
                </div>
            )}
        </div>
    );
}