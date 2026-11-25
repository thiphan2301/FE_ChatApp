import type { ReplyReference } from '../../types';

interface ReplyQuoteProps {
    replyTo: ReplyReference;
    onJump?: (messageId: string) => void;
}

export const ReplyQuote = ({ replyTo, onJump }: ReplyQuoteProps) => {
    const canJump = Boolean(replyTo.messageId && onJump);
    const content = (
        <>
            <span className="block truncate text-[11px] font-semibold text-forest-soft">
                {replyTo.senderId}
            </span>
            <span className="block truncate text-[12px] text-slate">
                {replyTo.text || 'Tin nhắn'}
            </span>
        </>
    );

    if (canJump && replyTo.messageId && onJump) {
        return (
            <button
                type="button"
                onClick={() => onJump(replyTo.messageId!)}
                className="w-full rounded-r-lg border-l-2 border-forest-soft bg-black/[0.04] px-2.5 py-1.5 text-left transition hover:bg-black/[0.07]"
            >
                {content}
            </button>
        );
    }

    return (
        <div className="w-full rounded-r-lg border-l-2 border-forest-soft bg-black/[0.04] px-2.5 py-1.5 text-left">
            {content}
        </div>
    );
};

interface ReplyBannerProps {
    replyTo: ReplyReference;
    onCancel: () => void;
}

export const ReplyBanner = ({ replyTo, onCancel }: ReplyBannerProps) => (
    <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border-l-2 border-forest-soft bg-sage/60 px-3 py-2 text-left">
        <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-forest-soft">
                Đang trả lời {replyTo.senderId}
            </p>
            <p className="truncate text-[12px] text-slate">
                {replyTo.text || 'Tin nhắn'}
            </p>
        </div>
        <button
            type="button"
            onClick={onCancel}
            aria-label="Hủy trả lời"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate transition hover:bg-white hover:text-ink"
        >
            <i className="fa-solid fa-xmark text-xs" aria-hidden="true"></i>
        </button>
    </div>
);
