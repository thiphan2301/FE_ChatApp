import { Fragment, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { UserAvatar } from '../common/UserAvatar';
import type { Conversation, ConversationMember, UserMessage } from '../../types';
import {
    findMatchRanges,
    formatDayLabel,
    formatFileSize,
    formatTime,
    getFileExtension,
    isSameDay,
} from '../../utils/helpers';

const SEEN_AVATAR_LIMIT = 2;
const COPIED_FEEDBACK_MS = 1500;
const NEAR_BOTTOM_PX = 80;

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
    highlightQuery: string;
    isActiveMatch: boolean;
    onSelectSender?: () => void;
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

const HighlightedText = ({ text, query }: { text: string; query: string }) => {
    const ranges = findMatchRanges(text, query);
    if (ranges.length === 0) return <>{text}</>;
    const parts: ReactNode[] = [];
    let cursor = 0;
    ranges.forEach(([start, end]) => {
        if (start > cursor) parts.push(text.slice(cursor, start));
        parts.push(
            <mark key={start} className="rounded bg-yellow-200 px-0.5 text-ink">
                {text.slice(start, end)}
            </mark>,
        );
        cursor = end;
    });
    if (cursor < text.length) parts.push(text.slice(cursor));
    return <>{parts}</>;
};

const CopyMessageButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            return;
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    };

    return (
        <button
            type="button"
            aria-label="Sao chép tin nhắn"
            title={copied ? 'Đã sao chép' : 'Sao chép tin nhắn'}
            onClick={() => void copy()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs text-mist opacity-0 transition hover:bg-paper hover:text-forest-soft focus:opacity-100 group-hover/bubble:opacity-100"
        >
            <i className={copied ? 'fa-solid fa-check text-forest-soft' : 'fa-regular fa-copy'} aria-hidden="true"></i>
        </button>
    );
};

const MessageBubble = ({
                           message,
                           sender,
                           isOwn,
                           seenBy,
                           highlightQuery,
                           isActiveMatch,
                           onSelectSender,
                       }: MessageBubbleProps) => (
    <div data-message-id={message.id} className={`flex flex-col gap-1.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
            <p className="text-xs text-mist">
                {onSelectSender ? (
                    <button
                        type="button"
                        onClick={onSelectSender}
                        className="transition hover:text-forest-soft hover:underline"
                    >
                        {sender?.name}
                    </button>
                ) : (
                    (sender?.name ?? 'Người dùng')
                )}{' '}
                · {formatTime(message.sentAt)}
            </p>
        )}
        <div className={`group/bubble flex max-w-[75%] items-center gap-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <div
                className={`flex min-w-0 flex-col gap-3 rounded-2xl px-4 py-3 text-sm leading-relaxed text-ink ${
                    isOwn ? 'bg-sage' : 'bg-bubble'
                } ${isActiveMatch ? 'ring-2 ring-yellow-400' : ''}`}
            >
                <p className="whitespace-pre-line break-words">
                    <HighlightedText text={message.text} query={highlightQuery} />
                </p>
                {message.attachment && (
                    <FileAttachment
                        fileName={message.attachment.fileName}
                        subtitle={`${getFileExtension(message.attachment.fileName)} · ${formatFileSize(message.attachment.sizeBytes)}`}
                        downloadUrl={message.attachment.url}
                    />
                )}
            </div>
            <CopyMessageButton text={message.text} />
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
    loadingOlder: boolean;
    highlightQuery: string;
    activeMatchId: string | null;
    onLoadOlder: () => void;
    onSelectMember: (member: ConversationMember) => void;
}

const DayDivider = ({ label }: { label: string }) => (
    <div className="flex items-center gap-4 text-xs text-mist">
        <span className="h-px flex-1 bg-line" />
        <span>{label}</span>
        <span className="h-px flex-1 bg-line" />
    </div>
);

const UnreadDivider = () => (
    <div data-unread-divider className="flex scroll-mt-4 items-center gap-4 text-xs font-medium text-forest-soft">
        <span className="h-px flex-1 bg-forest-soft/40" />
        <span>Tin nhắn mới</span>
        <span className="h-px flex-1 bg-forest-soft/40" />
    </div>
);

export const MessageList = ({
                                conversation,
                                loadingOlder,
                                highlightQuery,
                                activeMatchId,
                                onLoadOlder,
                                onSelectMember,
                            }: MessageListProps) => {
    const { messages, members, currentUserId, firstUnreadMessageId } = conversation;
    const containerRef = useRef<HTMLDivElement>(null);
    const anchorRef = useRef<{ height: number; top: number } | null>(null);
    const firstMessageId = messages[0]?.id;
    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.id;
    const lastIsMine = lastMessage?.kind === 'user' && lastMessage.senderId === currentUserId;

    const [atBottom, setAtBottom] = useState(true);
    const [seenLastId, setSeenLastId] = useState<string | null | undefined>(() => {
        const firstUnreadIndex = messages.findIndex((message) => message.id === firstUnreadMessageId);
        if (firstUnreadIndex === -1) return lastMessageId;
        return firstUnreadIndex === 0 ? null : messages[firstUnreadIndex - 1].id;
    });
    const latest = useRef({ atBottom: true, lastIsMine: false });
    const previousLastId = useRef(lastMessageId);

    const seenIndex = seenLastId === null ? -1 : messages.findIndex((message) => message.id === seenLastId);
    const unseenCount = seenLastId !== null && seenIndex === -1 ? 0 : messages.length - 1 - seenIndex;

    useEffect(() => {
        latest.current = { atBottom, lastIsMine };
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const divider = container.querySelector('[data-unread-divider]');
        if (divider) divider.scrollIntoView({ block: 'start' });
        else container.scrollTop = container.scrollHeight;
    }, []);

    useEffect(() => {
        if (previousLastId.current === lastMessageId) return;
        previousLastId.current = lastMessageId;
        const container = containerRef.current;
        if (container && (latest.current.atBottom || latest.current.lastIsMine)) {
            container.scrollTop = container.scrollHeight;
        }
    }, [lastMessageId]);

    useEffect(() => {
        const container = containerRef.current;
        const anchor = anchorRef.current;
        if (container && anchor) {
            container.scrollTop = container.scrollHeight - anchor.height + anchor.top;
            anchorRef.current = null;
        }
    }, [firstMessageId]);

    useEffect(() => {
        if (!activeMatchId) return;
        containerRef.current
            ?.querySelector(`[data-message-id="${CSS.escape(activeMatchId)}"]`)
            ?.scrollIntoView({ block: 'center' });
    }, [activeMatchId]);

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;
        const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < NEAR_BOTTOM_PX;
        setAtBottom(nearBottom);
        if (nearBottom) setSeenLastId(lastMessageId);
    };

    const scrollToBottom = () => containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });

    const handleLoadOlder = () => {
        const container = containerRef.current;
        if (container) anchorRef.current = { height: container.scrollHeight, top: container.scrollTop };
        onLoadOlder();
    };

    return (
        <div className="relative flex min-h-0 flex-1 flex-col">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex flex-1 flex-col gap-5 overflow-y-auto px-8 py-5"
            >
                {conversation.hasMoreMessages && (
                    <button
                        type="button"
                        onClick={handleLoadOlder}
                        disabled={loadingOlder}
                        className="self-center rounded-full border border-line px-4 py-1.5 text-xs font-medium text-forest-soft transition hover:bg-paper disabled:opacity-60"
                    >
                        {loadingOlder ? 'Đang tải...' : 'Xem tin nhắn cũ hơn'}
                    </button>
                )}
                {messages.length === 0 && (
                    <p className="m-auto text-center text-sm text-mist">Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!</p>
                )}
                {messages.map((message, index) => {
                    const startsNewDay = index === 0 || !isSameDay(messages[index - 1].sentAt, message.sentAt);
                    const sender =
                        message.kind === 'user' ? members.find((member) => member.id === message.senderId) : undefined;
                    return (
                        <Fragment key={message.id}>
                            {startsNewDay && <DayDivider label={formatDayLabel(message.sentAt)} />}
                            {message.id === firstUnreadMessageId && <UnreadDivider />}
                            {message.kind === 'system' ? (
                                <p className="text-center text-xs text-mist">
                                    {message.text} · {formatTime(message.sentAt)}
                                </p>
                            ) : (
                                <MessageBubble
                                    message={message}
                                    sender={sender}
                                    onSelectSender={sender ? () => onSelectMember(sender) : undefined}
                                    isOwn={message.senderId === currentUserId}
                                    seenBy={members.filter((member) => message.seenByIds.includes(member.id))}
                                    highlightQuery={highlightQuery}
                                    isActiveMatch={message.id === activeMatchId}
                                />
                            )}
                        </Fragment>
                    );
                })}
            </div>
            {!atBottom && messages.length > 0 && (
                <button
                    type="button"
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-8 flex items-center gap-2 rounded-full bg-forest-soft px-4 py-2 text-xs font-medium text-white shadow-lg transition hover:bg-forest-deep"
                >
                    <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
                    {unseenCount > 0 ? `${unseenCount} tin nhắn mới` : 'Xuống tin mới nhất'}
                </button>
            )}
        </div>
    );
};