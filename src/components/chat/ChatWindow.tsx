import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { IconButton, StatusPanel } from '../common/Controls';
import { UserAvatar } from '../common/UserAvatar';
import type { Conversation, ConversationMember } from '../../types';
import { findMatchRanges } from '../../utils/helpers';
import { EmojiPicker } from './EmojiPicker';
import { MessageList } from './MessageList';

const MESSAGE_INPUT_MAX_HEIGHT_PX = 120;

interface ChatHeaderProps {
    conversation: Conversation;
    infoPanelOpen: boolean;
    searchOpen: boolean;
    onToggleSearch: () => void;
    onToggleInfoPanel: () => void;
}

const getSubtitle = (conversation: Conversation): string => {
    if (conversation.type === 'group') {
        const activeCount = conversation.members.filter((member) => member.online).length;
        return `${conversation.members.length} thành viên · ${activeCount} đang hoạt động`;
    }
    const partner = conversation.members.find((member) => member.id !== conversation.currentUserId);
    return partner?.online ? 'Đang hoạt động' : 'Không hoạt động';
};

const ChatHeader = ({ conversation, infoPanelOpen, searchOpen, onToggleSearch, onToggleInfoPanel }: ChatHeaderProps) => (
    <header className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={conversation.name} imageUrl={conversation.avatarUrl} size="sm" />
            <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold text-ink">{conversation.name}</h2>
                <p className="text-xs text-slate">{getSubtitle(conversation)}</p>
            </div>
        </div>
        <div className="flex items-center gap-1">
            <IconButton icon="fa-solid fa-phone" label="Gọi thoại" />
            <IconButton icon="fa-solid fa-video" label="Gọi video" />
            <IconButton
                icon="fa-solid fa-magnifying-glass"
                label="Tìm trong hội thoại"
                aria-pressed={searchOpen}
                active={searchOpen}
                onClick={onToggleSearch}
            />
            <IconButton
                icon="fa-solid fa-table-columns"
                label={infoPanelOpen ? 'Ẩn thông tin nhóm' : 'Hiện thông tin nhóm'}
                aria-pressed={infoPanelOpen}
                active={infoPanelOpen}
                onClick={onToggleInfoPanel}
                className="max-[1100px]:hidden"
            />
        </div>
    </header>
);

interface MessageInputProps {
    offline: boolean;
    onSend: (text: string) => Promise<boolean>;
}

const MessageInput = ({ offline, onSend }: MessageInputProps) => {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, MESSAGE_INPUT_MAX_HEIGHT_PX)}px`;
    }, [text]);

    const canSend = text.trim().length > 0 && !sending && !offline;

    const insertEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? text.length;
        const end = textarea?.selectionEnd ?? text.length;
        const caret = start + emoji.length;
        setText(text.slice(0, start) + emoji + text.slice(end));
        requestAnimationFrame(() => {
            textarea?.focus();
            textarea?.setSelectionRange(caret, caret);
        });
    };

    const submit = async () => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;
        setSending(true);
        setText('');
        const sent = await onSend(trimmed);
        if (!sent) setText(trimmed);
        setSending(false);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void submit();
        }
    };

    return (
        <div className="shrink-0 px-6 pb-4">
            <div className="flex items-end gap-2 rounded-2xl border border-line bg-paper px-3 py-2.5 focus-within:border-forest-soft">
                <IconButton icon="fa-solid fa-plus" label="Thêm nội dung" />
                <textarea
                    ref={textareaRef}
                    value={text}
                    rows={1}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={offline ? 'Đang chờ kết nối...' : 'Nhắn gì đó nhé...'}
                    aria-label="Nhập tin nhắn"
                    className="max-h-30 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-mist"
                />
                <EmojiPicker onSelect={insertEmoji} />
                <IconButton icon="fa-solid fa-paperclip" label="Đính kèm tệp" />
                <button
                    type="button"
                    aria-label="Gửi tin nhắn"
                    disabled={!canSend}
                    onClick={() => void submit()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-soft text-white transition hover:bg-forest-deep disabled:opacity-50"
                >
                    <i className="fa-solid fa-arrow-up text-sm" aria-hidden="true"></i>
                </button>
            </div>
            <p className="mt-2 flex items-center justify-between text-[11px] text-mist">
                <span>Enter để gửi · Shift + Enter để xuống dòng</span>
                <i className="fa-solid fa-lock" aria-hidden="true"></i>
            </p>
        </div>
    );
};

interface MessageSearchBarProps {
    query: string;
    matchCount: number;
    position: number;
    hasMoreMessages: boolean;
    onQueryChange: (query: string) => void;
    onPrevious: () => void;
    onNext: () => void;
    onClose: () => void;
}

const MessageSearchBar = ({
                              query,
                              matchCount,
                              position,
                              hasMoreMessages,
                              onQueryChange,
                              onPrevious,
                              onNext,
                              onClose,
                          }: MessageSearchBarProps) => {
    const hasQuery = query.trim().length > 0;

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') onClose();
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (event.shiftKey) onPrevious();
            else onNext();
        }
    };

    return (
        <div className="shrink-0 border-b border-line px-6 py-2.5">
            <div className="flex items-center gap-2">
                <i className="fa-solid fa-magnifying-glass text-xs text-mist" aria-hidden="true"></i>
                <input
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tìm trong hội thoại"
                    aria-label="Tìm trong hội thoại"
                    autoFocus
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-mist"
                />
                {hasQuery && (
                    <span role="status" className="shrink-0 text-xs text-slate">
                        {matchCount > 0 ? `${position}/${matchCount}` : 'Không có kết quả'}
                    </span>
                )}
                <IconButton
                    icon="fa-solid fa-chevron-up"
                    label="Kết quả trước"
                    onClick={onPrevious}
                    disabled={matchCount === 0}
                    className="h-7 w-7"
                />
                <IconButton
                    icon="fa-solid fa-chevron-down"
                    label="Kết quả sau"
                    onClick={onNext}
                    disabled={matchCount === 0}
                    className="h-7 w-7"
                />
                <IconButton icon="fa-solid fa-xmark" label="Đóng tìm kiếm" onClick={onClose} className="h-7 w-7" />
            </div>
            {hasQuery && hasMoreMessages && (
                <p className="mt-1 text-[11px] text-mist">
                    Chỉ tìm trong các tin nhắn đã tải. Bấm "Xem tin nhắn cũ hơn" để tìm thêm.
                </p>
            )}
        </div>
    );
};

interface ConversationPaneProps {
    conversation: Conversation;
    infoPanelOpen: boolean;
    loadingOlder: boolean;
    notice: string | null;
    offline: boolean;
    onToggleInfoPanel: () => void;
    onSend: (text: string) => Promise<boolean>;
    onLoadOlder: () => void;
    onDismissNotice: () => void;
    onSelectMember: (member: ConversationMember) => void;
}

const ConversationPane = ({
                              conversation,
                              infoPanelOpen,
                              loadingOlder,
                              notice,
                              offline,
                              onToggleInfoPanel,
                              onSend,
                              onLoadOlder,
                              onDismissNotice,
                              onSelectMember,
                          }: ConversationPaneProps) => {
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const matchIds = useMemo(
        () =>
            conversation.messages
                .filter((message) => message.kind === 'user' && findMatchRanges(message.text, query).length > 0)
                .map((message) => message.id),
        [conversation.messages, query],
    );
    const position = matchIds.length === 0 ? 0 : Math.min(activeIndex, matchIds.length - 1);
    const activeMatchId = searchOpen ? (matchIds[position] ?? null) : null;

    const closeSearch = () => {
        setSearchOpen(false);
        setQuery('');
    };

    const changeQuery = (next: string) => {
        setQuery(next);
        setActiveIndex(Number.MAX_SAFE_INTEGER);
    };

    const moveMatch = (step: number) => {
        if (matchIds.length === 0) return;
        setActiveIndex((position + step + matchIds.length) % matchIds.length);
    };

    return (
        <section className="flex min-w-0 flex-1 flex-col bg-white">
            <ChatHeader
                conversation={conversation}
                infoPanelOpen={infoPanelOpen}
                searchOpen={searchOpen}
                onToggleSearch={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
                onToggleInfoPanel={onToggleInfoPanel}
            />
            {searchOpen && (
                <MessageSearchBar
                    query={query}
                    matchCount={matchIds.length}
                    position={position + 1}
                    hasMoreMessages={conversation.hasMoreMessages}
                    onQueryChange={changeQuery}
                    onPrevious={() => moveMatch(-1)}
                    onNext={() => moveMatch(1)}
                    onClose={closeSearch}
                />
            )}
            <MessageList
                conversation={conversation}
                loadingOlder={loadingOlder}
                highlightQuery={searchOpen ? query : ''}
                activeMatchId={activeMatchId}
                onLoadOlder={onLoadOlder}
                onSelectMember={onSelectMember}
            />
            {notice && (
                <div
                    role="alert"
                    className="mx-6 mb-2 flex items-center justify-between gap-3 rounded-xl bg-danger-soft px-4 py-2.5 text-xs text-danger"
                >
                    <span>{notice}</span>
                    <button type="button" onClick={onDismissNotice} aria-label="Đóng thông báo" className="shrink-0">
                        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </div>
            )}
            <MessageInput offline={offline} onSend={onSend} />
        </section>
    );
};

interface ChatWindowProps {
    status: 'loading' | 'error' | 'ready';
    conversation: Conversation | null;
    infoPanelOpen: boolean;
    loadingOlder: boolean;
    notice: string | null;
    offline: boolean;
    onToggleInfoPanel: () => void;
    onSend: (text: string) => Promise<boolean>;
    onLoadOlder: () => void;
    onDismissNotice: () => void;
    onSelectMember: (member: ConversationMember) => void;
    onRetry: () => void;
}

export const ChatWindow = ({ status, conversation, onRetry, ...paneProps }: ChatWindowProps) => {
    if (status !== 'ready') {
        return (
            <section className="flex min-w-0 flex-1 bg-white">
                <StatusPanel variant={status === 'error' ? 'error' : 'loading'} onRetry={onRetry} />
            </section>
        );
    }

    if (!conversation) {
        return (
            <section className="flex min-w-0 flex-1 items-center justify-center bg-white text-sm text-slate">
                Chọn một cuộc trò chuyện để bắt đầu.
            </section>
        );
    }

    return <ConversationPane key={conversation.id} conversation={conversation} {...paneProps} />;
};