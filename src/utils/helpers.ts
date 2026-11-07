export const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'US';
    if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
};

const UNITS = ['B', 'KB', 'MB', 'GB'];

export const formatFileSize = (bytes: number): string => {
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < UNITS.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }
    const rounded = unitIndex === 0 ? String(value) : value.toFixed(1).replace('.', ',');
    return `${rounded} ${UNITS[unitIndex]}`;
};

export const normalizeText = (text: string): string =>
    text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WEEK_IN_DAYS = 7;

const startOfDay = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const dayDifference = (date: Date, now: Date): number =>
    Math.round((startOfDay(now) - startOfDay(date)) / DAY_IN_MS);

export const parseDateTime = (value: string): Date =>
    new Date(value.includes('T') ? value : value.replace(' ', 'T'));

const pad = (value: number): string => String(value).padStart(2, '0');

export const formatTime = (iso: string): string => {
    const date = parseDateTime(iso);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatConversationTime = (iso: string, now: Date = new Date()): string => {
    const date = parseDateTime(iso);
    const difference = dayDifference(date, now);
    if (difference <= 0) return formatTime(iso);
    if (difference === 1) return 'Hôm qua';
    if (difference < WEEK_IN_DAYS) return WEEKDAYS[date.getDay()];
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
};

export const formatDayLabel = (iso: string, now: Date = new Date()): string => {
    const date = parseDateTime(iso);
    const dayAndMonth = `${date.getDate()} tháng ${date.getMonth() + 1}`;
    const difference = dayDifference(date, now);
    if (difference === 0) return `Hôm nay, ${dayAndMonth}`;
    if (difference === 1) return `Hôm qua, ${dayAndMonth}`;
    return `${WEEKDAYS[date.getDay()]}, ${dayAndMonth}`;
};

export const formatSharedDay = (iso: string, now: Date = new Date()): string => {
    const date = parseDateTime(iso);
    const difference = dayDifference(date, now);
    if (difference === 0) return 'Hôm nay';
    if (difference === 1) return 'Hôm qua';
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
};

export const formatLongDate = (iso: string): string => {
    const date = parseDateTime(iso);
    return `${date.getDate()} tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
};

export const isSameDay = (firstIso: string, secondIso: string): boolean =>
    startOfDay(parseDateTime(firstIso)) === startOfDay(parseDateTime(secondIso));

export const getFileExtension = (fileName: string): string => {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex === -1 ? 'FILE' : fileName.slice(dotIndex + 1).toUpperCase();
};

export const countCharacters = (text: string): number => Array.from(text).length;

export const limitCharacters = (text: string, maxLength: number): string =>
    Array.from(text).slice(0, maxLength).join('');

export const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });

const DEFAULT_LATENCY_MS = 250;

export const simulateLatency = (milliseconds: number = DEFAULT_LATENCY_MS): Promise<void> =>
    new Promise((resolve) => {
        window.setTimeout(resolve, milliseconds);
    });

export const BIO_MAX_LENGTH = 160;
export const DISPLAY_NAME_MAX_LENGTH = 50;
export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const AVATAR_MAX_SIZE_LABEL = '5 MB';
export const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,20}$/;

export interface ProfileErrors {
    displayName?: string;
    username?: string;
}

export const validateDisplayName = (value: string): string | undefined => {
    if (value.trim().length === 0) return 'Vui lòng nhập tên hiển thị.';
    if (value.length > DISPLAY_NAME_MAX_LENGTH) return `Tên hiển thị tối đa ${DISPLAY_NAME_MAX_LENGTH} ký tự.`;
    return undefined;
};

export const validateUsername = (value: string): string | undefined => {
    if (!USERNAME_PATTERN.test(value)) {
        return 'Tên người dùng gồm 3–20 ký tự: chữ không dấu, số, dấu chấm hoặc gạch dưới.';
    }
    return undefined;
};

export const validateAvatarFile = (file: File): string | undefined => {
    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) return 'Chỉ hỗ trợ ảnh JPG hoặc PNG.';
    if (file.size > AVATAR_MAX_SIZE_BYTES) return `Ảnh vượt quá ${AVATAR_MAX_SIZE_LABEL}.`;
    return undefined;
};

export const fieldInputClass = (invalid: boolean): string =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-mist focus:border-forest-soft ${
        invalid ? 'border-danger' : 'border-line'
    }`;