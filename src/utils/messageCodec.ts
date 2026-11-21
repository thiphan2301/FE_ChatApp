import type { ReplyReference, SendMessageOptions } from '../types';

const WIRE_PREFIX = '::CHATAPP::';
const REPLY_PREVIEW_MAX_LENGTH = 100;

interface WireReply {
    id?: string;
    a: string;
    t: string;
}

interface WirePayload {
    r?: WireReply;
    f?: string;
}

export interface DecodedMessagePayload {
    text: string;
    replyTo?: ReplyReference;
    forwardedFrom?: string;
}

const truncateReplyText = (text: string): string => {
    const normalized = text.replace(/\s+/g, ' ').trim();
    const chars = Array.from(normalized);
    if (chars.length <= REPLY_PREVIEW_MAX_LENGTH) return normalized;
    return `${chars.slice(0, REPLY_PREVIEW_MAX_LENGTH - 1).join('')}…`;
};

export const createReplyReference = (
    senderId: string,
    text: string,
    messageId?: string,
): ReplyReference => ({
    messageId,
    senderId,
    text: truncateReplyText(text),
});

export const encodeMessagePayload = (text: string, options?: SendMessageOptions): string => {
    const reply = options?.replyTo;
    const forwardedFrom = options?.forwardedFrom?.trim();
    if (!reply && !forwardedFrom) return text;

    const wire: WirePayload = {};
    if (reply) {
        wire.r = {
            ...(reply.messageId ? { id: reply.messageId } : {}),
            a: reply.senderId,
            t: truncateReplyText(reply.text),
        };
    }
    if (forwardedFrom) {
        wire.f = forwardedFrom;
    }

    const header = `${WIRE_PREFIX}${JSON.stringify(wire)}`;
    return text ? `${header}\n${text}` : header;
};

export const decodeMessagePayload = (raw: string): DecodedMessagePayload => {
    if (!raw.startsWith(WIRE_PREFIX)) return { text: raw };

    // JSON.stringify escapes raw newlines, so the first newline cleanly separates metadata from body.
    const lineEnd = raw.indexOf('\n');
    const jsonPart = lineEnd === -1 ? raw.slice(WIRE_PREFIX.length) : raw.slice(WIRE_PREFIX.length, lineEnd);
    const body = lineEnd === -1 ? '' : raw.slice(lineEnd + 1);

    try {
        const parsed = JSON.parse(jsonPart) as unknown;
        if (typeof parsed !== 'object' || parsed === null) return { text: raw };

        const wire = parsed as WirePayload;
        const replyTo =
            wire.r && typeof wire.r.a === 'string'
                ? {
                      messageId: typeof wire.r.id === 'string' ? wire.r.id : undefined,
                      senderId: wire.r.a,
                      text: typeof wire.r.t === 'string' ? wire.r.t : '',
                  }
                : undefined;
        const forwardedFrom =
            typeof wire.f === 'string' && wire.f.trim() ? wire.f.trim() : undefined;

        if (!replyTo && !forwardedFrom) return { text: raw };

        return {
            text: body,
            replyTo,
            forwardedFrom,
        };
    } catch {
        return { text: raw };
    }
};
