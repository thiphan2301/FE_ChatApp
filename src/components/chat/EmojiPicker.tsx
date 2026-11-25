import { useRef, useState } from 'react';
import { IconButton } from '../common/Controls';
import { useClickOutside } from '../../hooks/useAsyncData';

interface EmojiCategory {
    id: string;
    label: string;
    icon: string;
    emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
    {
        id: 'smileys',
        label: 'Biểu cảm',
        icon: '😀',
        emojis: Array.from('😀😃😄😁😆😅😂🤣😊😇🙂😉😍🥰😘😋😎🤩🥳😏😢😭😡🤔😴🤗😱🙄😬🤯😌😜'),
    },
    {
        id: 'gestures',
        label: 'Cử chỉ & trái tim',
        icon: '👍',
        emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '🙏', '💪', '👋', '🤙', '👀', '❤️', '💔', '💯', '🔥', '✨', '🎉', '🎁'],
    },
    {
        id: 'nature',
        label: 'Thiên nhiên',
        icon: '🌿',
        emojis: ['🌿', '🌸', '🌻', '🌼', '🌳', '🍀', '🌈', '☀️', '🌙', '⭐', '☁️', '⛅', '🌧️', '❄️', '🌊', '🐶', '🐱', '🐼', '🦋', '🐢'],
    },
    {
        id: 'food',
        label: 'Đồ ăn & uống',
        icon: '☕',
        emojis: ['☕', '🍵', '🍜', '🍕', '🍔', '🍟', '🍣', '🍰', '🍩', '🍫', '🍎', '🍓', '🍉', '🥑', '🍺', '🍷', '🥤', '🍳'],
    },
    {
        id: 'activities',
        label: 'Hoạt động & đồ vật',
        icon: '⚽',
        emojis: ['⚽', '🏀', '🎮', '🎧', '🎵', '📷', '💻', '📱', '✈️', '🚗', '🏖️', '🏠', '📚', '✏️', '💡', '🔔', '📌', '🎂'],
    },
];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ onSelect }: EmojiPickerProps) => {
    const [open, setOpen] = useState(false);
    const [categoryId, setCategoryId] = useState(EMOJI_CATEGORIES[0].id);
    const containerRef = useRef<HTMLDivElement>(null);
    useClickOutside(containerRef, () => setOpen(false), open);

    const category = EMOJI_CATEGORIES.find((item) => item.id === categoryId) ?? EMOJI_CATEGORIES[0];

    return (
        <div ref={containerRef} className="relative">
            <IconButton
                icon="fa-regular fa-face-smile"
                label="Chọn emoji"
                aria-expanded={open}
                active={open}
                onClick={() => setOpen((value) => !value)}
            />
            {open && (
                <div
                    role="dialog"
                    aria-label="Bảng emoji"
                    className="absolute bottom-full right-0 z-20 mb-3 w-[300px] rounded-2xl border border-line bg-white p-3 shadow-lg"
                >
                    <div className="flex gap-1 border-b border-line pb-2">
                        {EMOJI_CATEGORIES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                aria-label={item.label}
                                aria-pressed={item.id === category.id}
                                onClick={() => setCategoryId(item.id)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition ${
                                    item.id === category.id ? 'bg-sage' : 'hover:bg-paper'
                                }`}
                            >
                                {item.icon}
                            </button>
                        ))}
                    </div>
                    <ul className="mt-2 grid max-h-[180px] grid-cols-8 gap-1 overflow-y-auto">
                        {category.emojis.map((emoji) => (
                            <li key={emoji}>
                                <button
                                    type="button"
                                    aria-label={emoji}
                                    onClick={() => onSelect(emoji)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-paper"
                                >
                                    {emoji}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};