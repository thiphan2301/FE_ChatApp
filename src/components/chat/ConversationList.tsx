import { useRef, useState } from 'react';
import { IconButton } from '../common/Controls';
import { UserAvatar } from '../common/UserAvatar';
import { RoomDialog } from './RoomDialog';
import { useClickOutside } from '../../hooks/useAsyncData';
import type { ConversationSummary } from '../../types';
import { formatConversationTime, normalizeText } from '../../utils/helpers';

interface MenuEntry {
    icon: string;
    label: string;
    onSelect: () => void;
    danger?: boolean;
}

const ConversationMenu = ({ entries, onClose }: { entries: MenuEntry[]; onClose: () => void }) => (
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

interface ConversationItemProps {
    conversation: ConversationSummary;
    active: boolean;
    onSelect: () => void;
    onMarkUnread: () => void;
    onToggleArchive: () => void;
    onLeave: () => void;
}

const ConversationItem = ({
                              conversation,
                              active,
                              onSelect,
                              onMarkUnread,
                              onToggleArchive,
                              onLeave,
                          }: ConversationItemProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const itemRef = useRef<HTMLLIElement>(null);
    const closeMenu = () => setMenuOpen(false);
    useClickOutside(itemRef, closeMenu, menuOpen);

    const hasUnread = conversation.unreadCount > 0;
    const entries: MenuEntry[] = [
        { icon: 'fa-regular fa-envelope', label: 'Đánh dấu chưa đọc', onSelect: onMarkUnread },
        {
            icon: 'fa-solid fa-box-archive',
            label: conversation.archived ? 'Bỏ lưu trữ' : 'Lưu trữ trò chuyện',
            onSelect: onToggleArchive,
        },
        { icon: 'fa-solid fa-arrow-right-from-bracket', label: 'Rời phòng', onSelect: onLeave, danger: true },
    ];

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
                <UserAvatar name={conversation.name} imageUrl={conversation.avatarUrl} online={conversation.online} />
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
            {menuOpen && <ConversationMenu entries={entries} onClose={closeMenu} />}
        </li>
    );
};

type ListTab = 'all' | 'unread' | 'archived';

interface ConversationListProps {
    conversations: ConversationSummary[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onMarkUnread: (id: string) => void;
    onToggleArchive: (id: string) => void;
    onLeave: (id: string) => void;
    onCreateRoom: (name: string) => Promise<void>;
    onJoinRoom: (name: string) => Promise<void>;
}

export const ConversationList = ({
                                     conversations,
                                     activeId,
                                     onSelect,
                                     onMarkUnread,
                                     onToggleArchive,
                                     onLeave,
                                     onCreateRoom,
                                     onJoinRoom,
                                 }: ConversationListProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState<ListTab>('all');

    const activeItems = conversations.filter((item) => !item.archived);
    const archivedItems = conversations.filter((item) => item.archived);
    const tab = selectedTab === 'archived' && archivedItems.length === 0 ? 'all' : selectedTab;
    const unreadTotal = activeItems.reduce((sum, item) => sum + item.unreadCount, 0);

    const source =
        tab === 'archived' ? archivedItems : tab === 'unread' ? activeItems.filter((item) => item.unreadCount > 0) : activeItems;
    const normalizedQuery = normalizeText(query);
    const visible = source.filter((item) => normalizeText(item.name).includes(normalizedQuery));

    const tabs: { id: ListTab; label: string }[] = [
        { id: 'all', label: 'Tất cả' },
        { id: 'unread', label: `Chưa đọc ${unreadTotal}` },
        ...(archivedItems.length > 0 ? [{ id: 'archived' as const, label: `Đã lưu trữ ${archivedItems.length}` }] : []),
    ];

    return (
        <section aria-label="Tin nhắn" className="flex h-full w-80 shrink-0 flex-col">
            <div className="flex items-center justify-between px-6 pb-4 pt-6">
                <h2 className="text-xl font-semibold text-ink">Tin nhắn</h2>
                <IconButton
                    icon="fa-regular fa-pen-to-square"
                    label="Tạo hoặc tham gia phòng"
                    onClick={() => setDialogOpen(true)}
                />
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
                        onClick={() => setSelectedTab(item.id)}
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
                        onToggleArchive={() => onToggleArchive(conversation.id)}
                        onLeave={() => onLeave(conversation.id)}
                    />
                ))}
                {visible.length === 0 && (
                    <li className="px-3 py-6 text-center text-[13px] text-mist">
                        {conversations.length === 0 ? 'Bạn chưa tham gia phòng chat nào.' : 'Không tìm thấy cuộc trò chuyện nào.'}
                    </li>
                )}
            </ul>

            <p className="flex items-center gap-2 px-6 py-4 text-[11px] text-mist">
                <i className="fa-solid fa-check-double" aria-hidden="true"></i>
                Mọi tin nhắn đã được đồng bộ
            </p>

            {dialogOpen && (
                <RoomDialog onClose={() => setDialogOpen(false)} onCreate={onCreateRoom} onJoin={onJoinRoom} />
            )}
        </section>
    );
};