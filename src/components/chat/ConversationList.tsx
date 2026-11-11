import { useRef, useState } from 'react';
import { IconButton } from '../common/Controls';
import { UserAvatar } from '../common/UserAvatar';
import { useClickOutside } from '../../hooks/useAsyncData';
import type { ConversationSummary } from '../../types';
import { formatConversationTime, normalizeText } from '../../utils/helpers';

interface ConversationMenuProps {
    name: string;
    onMarkUnread: () => void;
    onArchive: () => void;
    onBlock: () => void;
    onReport: () => void;
    onClose: () => void;
}

interface MenuEntry {
    icon: string;
    label: string;
    onSelect: () => void;
    danger?: boolean;
}

const ConversationMenu = ({
                              name,
                              onMarkUnread,
                              onArchive,
                              onBlock,
                              onReport,
                              onClose,
                          }: ConversationMenuProps) => {
    const entries: MenuEntry[] = [
        { icon: 'fa-regular fa-envelope', label: 'Đánh dấu chưa đọc', onSelect: onMarkUnread },
        { icon: 'fa-solid fa-box-archive', label: 'Lưu trữ trò chuyện', onSelect: onArchive },
        { icon: 'fa-solid fa-ban', label: `Chặn ${name}`, onSelect: onBlock, danger: true },
        { icon: 'fa-regular fa-flag', label: 'Báo cáo', onSelect: onReport, danger: true },
    ];

    return (
        <ul
            role="menu"
            className="absolute right-3 top-12 z-20 w-52 rounded-xl border border-line bg-white py-1.5 shadow-lg"
        >
            {entries.map((entry, index) => (
                <li
                    key={entry.label}
                    role="none"
                    className={entry.danger && !entries[index - 1]?.danger ? 'mt-1 border-t border-line pt-1' : ''}
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            entry.onSelect();
                            onClose();
                        }}
                        className={`flex w-full items-center gap-3 px-3.5 py-2 text-left text-[13px] transition hover:bg-paper ${
                            entry.danger ? 'text-danger' : 'text-ink'
                        }`}
                    >
                        <i className={`${entry.icon} w-4 text-center text-xs`} aria-hidden="true"></i>
                        <span className="truncate">{entry.label}</span>
                    </button>
                </li>
            ))}
        </ul>
    );
};

interface ConversationItemProps {
    conversation: ConversationSummary;
    active: boolean;
    onSelect: () => void;
    onMarkUnread: () => void;
    onArchive: () => void;
    onBlock: () => void;
    onReport: () => void;
}

const ConversationItem = ({
                              conversation,
                              active,
                              onSelect,
                              onMarkUnread,
                              onArchive,
                              onBlock,
                              onReport,
                          }: ConversationItemProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const itemRef = useRef<HTMLLIElement>(null);
    const closeMenu = () => setMenuOpen(false);
    useClickOutside(itemRef, closeMenu, menuOpen);

    const hasUnread = conversation.unreadCount > 0;

    return (
        <li ref={itemRef} className="group relative">
            <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => {
                    closeMenu();
                    onSelect();
                }}
                className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition ${
                    active ? 'bg-sage' : 'hover:bg-white'
                }`}
            >
                <UserAvatar
                    name={conversation.name}
                    imageUrl={conversation.avatarUrl}
                    online={conversation.online}
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-ink">{conversation.name}</span>
                        <span
                            className={`shrink-0 text-[11px] text-mist group-hover:invisible group-focus-within:invisible ${
                                menuOpen ? 'invisible' : ''
                            }`}
                        >
              {formatConversationTime(conversation.lastMessageAt)}
            </span>
                    </div>
                    <div className="mt-0.5 flex items-end justify-between gap-2">
                        <p className={`line-clamp-2 text-[13px] leading-snug ${hasUnread ? 'text-ink' : 'text-slate'}`}>
                            {conversation.lastMessagePreview}
                        </p>
                        {hasUnread && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-forest-soft px-1 text-[11px] font-semibold text-white">
                {conversation.unreadCount}
              </span>
                        )}
                    </div>
                </div>
            </button>
            <button
                type="button"
                aria-label={`Tùy chọn cho ${conversation.name}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className={`absolute right-4 top-3 flex h-6 w-7 items-center justify-center rounded-md bg-sage-line text-slate transition hover:text-forest-soft focus:opacity-100 group-hover:opacity-100 ${
                    menuOpen ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <i className="fa-solid fa-ellipsis text-xs" aria-hidden="true"></i>
            </button>
            {menuOpen && (
                <ConversationMenu
                    name={conversation.name}
                    onMarkUnread={onMarkUnread}
                    onArchive={onArchive}
                    onBlock={onBlock}
                    onReport={onReport}
                    onClose={closeMenu}
                />
            )}
        </li>
    );
};

type ListTab = 'all' | 'unread';

interface ConversationListProps {
    conversations: ConversationSummary[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onMarkUnread: (id: string) => void;
    onArchive: (id: string) => void;
    onBlock: (id: string) => void;
    onReport: (id: string) => void;
}

export const ConversationList = ({
                                     conversations,
                                     activeId,
                                     onSelect,
                                     onMarkUnread,
                                     onArchive,
                                     onBlock,
                                     onReport,
                                 }: ConversationListProps) => {
    const [query, setQuery] = useState('');
    const [tab, setTab] = useState<ListTab>('all');

    const unreadTotal = conversations.reduce((sum, item) => sum + item.unreadCount, 0);
    const normalizedQuery = normalizeText(query);
    const visible = conversations.filter(
        (item) =>
            (tab === 'all' || item.unreadCount > 0) && normalizeText(item.name).includes(normalizedQuery),
    );

    const tabs: { id: ListTab; label: string }[] = [
        { id: 'all', label: 'Tất cả' },
        { id: 'unread', label: `Chưa đọc ${unreadTotal}` },
    ];

    return (
        <section aria-label="Tin nhắn" className="flex h-full w-80 shrink-0 flex-col">
            <div className="flex items-center justify-between px-6 pb-4 pt-6">
                <h2 className="text-xl font-semibold text-ink">Tin nhắn</h2>
                <IconButton icon="fa-regular fa-pen-to-square" label="Soạn tin nhắn mới" />
            </div>

            <div className="px-4">
                <label className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-mist focus-within:border-forest-soft">
                    <i className="fa-solid fa-magnifying-glass text-xs" aria-hidden="true"></i>
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Tìm cuộc trò chuyện"
                        aria-label="Tìm cuộc trò chuyện"
                        className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-mist"
                    />
                </label>
            </div>

            <div className="flex gap-4 px-6 pb-2 pt-4 text-[13px]">
                {tabs.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        aria-pressed={tab === item.id}
                        onClick={() => setTab(item.id)}
                        className={tab === item.id ? 'font-semibold text-forest-soft' : 'text-slate hover:text-ink'}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-2">
                {visible.map((conversation) => (
                    <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        active={conversation.id === activeId}
                        onSelect={() => onSelect(conversation.id)}
                        onMarkUnread={() => onMarkUnread(conversation.id)}
                        onArchive={() => onArchive(conversation.id)}
                        onBlock={() => onBlock(conversation.id)}
                        onReport={() => onReport(conversation.id)}
                    />
                ))}
                {visible.length === 0 && (
                    <li className="px-3 py-6 text-center text-[13px] text-mist">Không tìm thấy cuộc trò chuyện nào.</li>
                )}
            </ul>

            <p className="flex items-center gap-2 px-6 py-4 text-[11px] text-mist">
                <i className="fa-solid fa-check-double" aria-hidden="true"></i>
                Mọi tin nhắn đã được đồng bộ
            </p>
        </section>
    );
};