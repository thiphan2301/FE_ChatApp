import { Fragment, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { IconButton, StatusPanel } from '../common/Controls';
import { UserAvatar } from '../common/UserAvatar';
import type { Conversation, ConversationMember, UserMessage } from '../../types';
import {
    formatDayLabel,
    formatFileSize,
    formatTime,
    getFileExtension,
    isSameDay,
} from '../../utils/helpers';

const SEEN_AVATAR_LIMIT = 2;
const MESSAGE_INPUT_MAX_HEIGHT_PX = 120;

interface TypingIndicatorProps {
    name: string;
}

const DOT_DELAYS = ['0ms', '200ms', '400ms'];

const TypingIndicator = ({ name }: TypingIndicatorProps) => (
    <div className="flex items-center gap-2 text-xs text-mist" role="status">
    <span className="flex gap-0.5" aria-hidden="true">
      {DOT_DELAYS.map((delay) => (
          <span
              key={delay}
              style={{ animationDelay: delay }}
              className="h-1 w-1 animate-pulse rounded-full bg-forest-soft"
          />
      ))}
    </span>
        <span>{name} đang nhập...</span>
    </div>
);

interface FileAttachmentProps {
    fileName: string;
    subtitle: string;
    downloadUrl: string;
    bordered?: boolean;
}

export const FileAttachment = ({ fileName, subtitle, downloadUrl, bordered = false }: FileAttachmentProps) => (
    <div
        className={`flex items-center gap-3 rounded-xl bg-white p-2.5 ${bordered ? 'border border-line' : ''}`}
    >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage text-forest-soft">
      <i className="fa-regular fa-file-lines" aria-hidden="true"></i>
    </span>
        <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">{fileName}</p>
            <p className="text-[11px] text-mist">{subtitle}</p>
        </div>
        <a
            href={downloadUrl}
            download={fileName}
            aria-label={`Tải ${fileName}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate transition hover:bg-sage hover:text-forest-soft"
        >
            <i className="fa-solid fa-download text-sm" aria-hidden="true"></i>
        </a>
    </div>
);

interface MessageBubbleProps {
    message: UserMessage;
    sender?: ConversationMember;
    isOwn: boolean;
    seenBy: ConversationMember[];
}

const SeenBy = ({ members }: { members: ConversationMember[] }) => {
    const remaining = members.length - SEEN_AVATAR_LIMIT;
    return (
        <div className="flex items-center gap-1.5 text-[11px] text-mist">
      <span className="flex -space-x-1">
        {members.slice(0, SEEN_AVATAR_LIMIT).map((member) => (
            <span key={member.id} className="rounded-full ring-2 ring-white">
            <UserAvatar name={member.name} imageUrl={member.avatarUrl} size="xs" />
          </span>
        ))}
      </span>
            <span>{remaining > 0 ? `+${remaining} đã xem` : 'đã xem'}</span>
        </div>
    );
};

const MessageBubble = ({ message, sender, isOwn, seenBy }: MessageBubbleProps) => (
    <div className={`flex flex-col gap-1.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
            <p className="text-xs text-mist">
                {sender?.name ?? 'Người dùng'} · {formatTime(message.sentAt)}
            </p>
        )}
        <div
            className={`flex max-w-[75%] flex-col gap-3 rounded-2xl px-4 py-3 text-sm leading-relaxed text-ink ${
                isOwn ? 'bg-sage' : 'bg-bubble'
            }`}
        >
            <p className="whitespace-pre-line break-words">{message.text}</p>
            {message.attachment && (
                <FileAttachment
                    fileName={message.attachment.fileName}
                    subtitle={`${getFileExtension(message.attachment.fileName)} · ${formatFileSize(message.attachment.sizeBytes)}`}
                    downloadUrl={message.attachment.url}
                />
            )}
        </div>
        {message.reactions.length > 0 && (
            <ul className="flex gap-1.5">
                {message.reactions.map((reaction) => (
                    <li key={reaction.emoji} className="rounded-full bg-paper px-2.5 py-1 text-xs text-slate">
                        {reaction.emoji} {reaction.count}
                    </li>
                ))}
            </ul>
        )}
        {isOwn && seenBy.length > 0 && <SeenBy members={seenBy} />}
    </div>
);

interface MessageListProps {
    conversation: Conversation;
}

const DayDivider = ({ label }: { label: string }) => (
    <div className="flex items-center gap-4 text-xs text-mist">
        <span className="h-px flex-1 bg-line" />
        <span>{label}</span>
        <span className="h-px flex-1 bg-line" />
    </div>
);

const MessageList = ({ conversation }: MessageListProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { messages, members, currentUserId } = conversation;

    useEffect(() => {
        const container = containerRef.current;
        if (container) container.scrollTop = container.scrollHeight;
    }, [messages.length, conversation.id]);

    return (
        <div ref={containerRef} className="flex flex-1 flex-col gap-5 overflow-y-auto px-8 py-5">
            {messages.map((message, index) => {
                const startsNewDay = index === 0 || !isSameDay(messages[index - 1].sentAt, message.sentAt);
                return (
                    <Fragment key={message.id}>
                        {startsNewDay && <DayDivider label={formatDayLabel(message.sentAt)} />}
                        {message.kind === 'system' ? (
                            <p className="text-center text-xs text-mist">
                                {message.text} · {formatTime(message.sentAt)}
                            </p>
                        ) : (
                            <MessageBubble
                                message={message}
                                sender={members.find((member) => member.id === message.senderId)}
                                isOwn={message.senderId === currentUserId}
                                seenBy={members.filter((member) => message.seenByIds.includes(member.id))}
                            />
                        )}
                    </Fragment>
                );
            })}
        </div>
    );
};

interface ChatHeaderProps {
    conversation: Conversation;
    infoPanelOpen: boolean;
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

const ChatHeader = ({ conversation, infoPanelOpen, onToggleInfoPanel }: ChatHeaderProps) => (
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
            <IconButton icon="fa-solid fa-magnifying-glass" label="Tìm trong hội thoại" />
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
    onSend: (text: string) => Promise<void>;
}

const MessageInput = ({ onSend }: MessageInputProps) => {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, MESSAGE_INPUT_MAX_HEIGHT_PX)}px`;
    }, [text]);

    const canSend = text.trim().length > 0 && !sending;

    const submit = async () => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;
        setSending(true);
        setText('');
        try {
            await onSend(trimmed);
        } finally {
            setSending(false);
            textareaRef.current?.focus();
        }
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
                    placeholder="Nhắn gì đó nhé..."
                    aria-label="Nhập tin nhắn"
                    className="max-h-30 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-mist"
                />
                <IconButton icon="fa-regular fa-face-smile" label="Chọn emoji" />
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

interface ChatWindowProps {
    status: 'loading' | 'error' | 'ready';
    conversation: Conversation | null;
    infoPanelOpen: boolean;
    onToggleInfoPanel: () => void;
    onSend: (text: string) => Promise<void>;
    onRetry: () => void;
}

export const ChatWindow = ({
                               status,
                               conversation,
                               infoPanelOpen,
                               onToggleInfoPanel,
                               onSend,
                               onRetry,
                           }: ChatWindowProps) => {
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

    const typingMember = conversation.members.find((member) => member.id === conversation.typingUserId);

    return (
        <section className="flex min-w-0 flex-1 flex-col bg-white">
            <ChatHeader
                conversation={conversation}
                infoPanelOpen={infoPanelOpen}
                onToggleInfoPanel={onToggleInfoPanel}
            />
            <MessageList conversation={conversation} />
            <div className="h-8 shrink-0 px-8">
                {typingMember && <TypingIndicator name={typingMember.name.split(' ')[0]} />}
            </div>
            <MessageInput key={conversation.id} onSend={onSend} />
        </section>
    );
};