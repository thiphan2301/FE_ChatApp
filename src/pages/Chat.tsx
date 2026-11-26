/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { UserAvatar } from '../components/common/UserAvatar';
import { CopyMessageButton } from '../components/chat/MessageList';
import { ForwardDialog } from '../components/chat/ForwardDialog';
import { ImageDraftBanner, ImagePreviewModal } from '../components/chat/ImagePreviewModal';
import { ReplyBanner, ReplyQuote } from '../components/chat/ReplyParts';
import type { ForwardTarget, ReplyReference } from '../types';
import { wsService, type ServerResponse } from '../services/websocketService';
import { getHiddenChats, hideChat, showChat } from '../utils/hiddenChats';
import { normalizeText } from '../utils/helpers';
import { extractClipboardImage, IMAGE_ACCEPT_TYPES, uploadImageFile } from '../utils/imageCompress';
import { createReplyReference, decodeMessagePayload, encodeMessagePayload } from '../utils/messageCodec';
import { forwardMessage } from '../services/chatService';

export default function Chat() {
    const location = useLocation();
    const routeState = location.state;
    const initialChatTarget =
        typeof routeState === 'object' &&
        routeState !== null &&
        'chatWith' in routeState &&
        typeof routeState.chatWith === 'string'
            ? routeState.chatWith
            : null;
    const chatTargetRef = useRef(initialChatTarget);
    const [chatList, setChatList] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any | null>(null);
    const selectedChatRef = useRef<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [messageSearchOpen, setMessageSearchOpen] = useState(false);
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const currentPageRef = useRef(currentPage);
    const [hasMore, setHasMore] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
    const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
    const [replyTo, setReplyTo] = useState<ReplyReference | null>(null);
    const [forwardMsg, setForwardMsg] = useState<{ text: string; sender: string; imageUrl?: string } | null>(null);
    const [draftImage, setDraftImage] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [previewImage, setPreviewImage] = useState<{ url: string; caption?: string } | null>(null);
    const [jumpHighlightId, setJumpHighlightId] = useState<string | null>(null);
    const [sendError, setSendError] = useState<string | null>(null);
    const [, setIsLoading] = useState(true);

    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const jumpTimerRef = useRef<number | null>(null);
    const localCounterRef = useRef(0);
    const pendingSendsRef = useRef<{ to: string; mes: string; localId: string; expiresAt: number }[]>([]);
    const lastMessageKeyRef = useRef<string | null>(null);

    const getChatMessageId = (msg: any, index: number): string =>
        msg.id !== undefined && msg.id !== null ? String(msg.id) : (msg._localId || `msg-${index}`);

    // hàm nhảy xuống dưới cùng cuôc trò truyện
    const scrollToBottomInstant = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    // theo dõi khi đổi đoạn chat hoặc khi có tín nhắn mới
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        const nextKey = lastMsg ? `${selectedChat?.name ?? ''}:${getChatMessageId(lastMsg, messages.length - 1)}` : null;
        if (nextKey && nextKey !== lastMessageKeyRef.current) {
            lastMessageKeyRef.current = nextKey;
            requestAnimationFrame(() => {
                scrollToBottomInstant();
            });
        } else if (!nextKey) {
            lastMessageKeyRef.current = null;
        }
    }, [messages, selectedChat]);

    useEffect(() => () => {
        if (jumpTimerRef.current !== null) window.clearTimeout(jumpTimerRef.current);
    }, []);

    // hàm lấy lịch sử tin nhắn
    const fetchMessagesForChat = (chat: any, page: number = 1) => {
        if (chat.type === 1) {
            wsService.sendMessage('GET_ROOM_CHAT_MES', { name: chat.name, page });
        } else {
            wsService.sendMessage('GET_PEOPLE_CHAT_MES', { name: chat.name, page });
        }

        // Kiểm tra online nếu là chat 1-1
        if (chat.type === 0) {
            wsService.sendMessage('CHECK_USER_ONLINE', { user: chat.name });
        }
    };

    // Hàm load thêm tin nhắn cũ
    const handleLoadMore = () => {
        if (selectedChat && hasMore) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            currentPageRef.current = nextPage;
            fetchMessagesForChat(selectedChat, nextPage);
        }
    };


    // Lắng nghe dữ liệu trả về từ WebSocket Server
    useEffect(() => {
        // connect ws thành công rồi mới lấy danh sách (để tránh bị trống danh sách)
        wsService.onOpen(() => {
            wsService.sendMessage('GET_USER_LIST', {});
        });

        const removeListener = wsService.addListener((response: ServerResponse) => {
            if (response.status === 'success') {
                if (response.event === 'GET_USER_LIST') {
                    // ktra dl an toàn tránh lỗi
                    const list = Array.isArray(response.data) ? response.data : [];
                    const targetUsername = chatTargetRef.current;
                    const hiddenNames = getHiddenChats();

                    if (targetUsername) {
                        showChat(targetUsername);
                        hiddenNames.delete(targetUsername.toLowerCase());
                    }

                    const visibleList = list.filter(
                        (chat: any) =>
                            chat.type === 0 &&
                            typeof chat.name === 'string' &&
                            !hiddenNames.has(chat.name.toLowerCase()),
                    );
                    const targetIsListed = visibleList.some(
                        (chat: any) =>
                            chat.type === 0 &&
                            typeof chat.name === 'string' &&
                            chat.name.toLowerCase() === targetUsername?.toLowerCase(),
                    );
                    const displayList =
                        targetUsername && !targetIsListed
                            ? [{ name: targetUsername, type: 0 }, ...visibleList]
                            : visibleList;

                    setChatList(displayList);
                    //tắt trạng thái loading
                    setIsLoading(false);

                    // Ưu tiên người dùng được chuyển đến từ trang tìm kiếm.
                    if (!selectedChatRef.current) {
                        const targetChat = targetUsername
                            ? displayList.find(
                                (chat: any) =>
                                    chat.type === 0 &&
                                    typeof chat.name === 'string' &&
                                    chat.name.toLocaleLowerCase() === targetUsername.toLocaleLowerCase(),
                            ) ?? { name: targetUsername, type: 0 }
                            : displayList[0];

                        if (targetChat) {
                            setSelectedChat(targetChat);
                            selectedChatRef.current = targetChat;
                            fetchMessagesForChat(targetChat);
                            chatTargetRef.current = null;
                        }
                    }
                } else if (response.event === 'GET_PEOPLE_CHAT_MES' || response.event === 'GET_ROOM_CHAT_MES') {
                    // Đảm bảo dữ liệu nhận về là mảng
                    let msgData = response.data;
                    if (msgData && typeof msgData === 'object' && 'chatMess' in msgData) {
                        msgData = (msgData as any).chatMess;
                    }

                    const newMessages = Array.isArray(msgData) ? msgData : [];

                    if (currentPageRef.current === 1) {
                        setMessages(newMessages);
                    } else {
                        // Nối tin nhắn cũ vào đầu danh sách
                        setMessages((prev) => [...newMessages, ...prev]);
                    }

                    // Nếu nhận về ít hơn 50 tin thì nghĩa là hết tin nhắn cũ
                    if (newMessages.length < 50) {
                        setHasMore(false);
                    } else {
                        setHasMore(true);
                    }
                } else if (response.event === 'SEND_CHAT') {
                    if (response.data) {
                        const raw = response.data;
                        const senderName = raw.name || raw.from || '';
                        const currentUser = localStorage.getItem('username') || '';
                        const now = Date.now();
                        pendingSendsRef.current = pendingSendsRef.current.filter((item) => item.expiresAt > now);
                        if (senderName === currentUser) {
                            const matchedIndex = pendingSendsRef.current.findIndex(
                                (item) => item.to === (raw.to || '') && item.mes === raw.mes,
                            );
                            if (matchedIndex !== -1) {
                                pendingSendsRef.current.splice(matchedIndex, 1);
                                return;
                            }
                        }
                        const active = selectedChatRef.current;
                        const belongsToActive =
                            active &&
                            ((raw.type === 1 && active.type === 1 && raw.to === active.name) ||
                                (raw.type !== 1 &&
                                    active.type === 0 &&
                                    (senderName === active.name || raw.to === active.name)));
                        if (belongsToActive) {
                            setMessages((prev) => [...prev, raw]);
                        }
                        if (senderName) {
                            setOnlineUsers(prev => ({ ...prev, [senderName]: true }));
                        }
                    }
                } else if (response.event === 'CHECK_USER_ONLINE') {
                    if (response.data) {
                        setOnlineUsers(prev => ({
                            ...prev,
                            [selectedChatRef.current?.name]: response.data.status
                        }));
                    }
                }
            } else if (response.event === 'SEND_CHAT') {
                const failed = pendingSendsRef.current.pop();
                if (failed) {
                    setMessages((prev) => prev.filter((item) => item._localId !== failed.localId));
                }
                setSendError(response.mes || 'Không gửi được tin nhắn. Vui lòng thử lại.');
            }
        });

        return () => {
            removeListener();
        };
    }, []);

    // Khi bấm chọn một cuộc trò chuyện trong danh sách
    const handleSelectChat = (chat: any) => {
        setOpenMenuFor(null);
        setMessageSearchOpen(false);
        setMessageSearchQuery('');
        setReplyTo(null);
        setDraftImage(null);
        setSendError(null);
        setSelectedChat(chat);
        selectedChatRef.current = chat;
        // Reset phân trang
        setCurrentPage(1);
        currentPageRef.current = 1;
        setHasMore(true);
        //xóa tạm tin nhắn cũ khi đổi chat
        setMessages([]);
        fetchMessagesForChat(chat, 1);
    };

    const handleHideChat = (chat: any) => {
        if (chat.type !== 0) return;

        hideChat(chat.name);
        setChatList((current) =>
            current.filter(
                (item) =>
                    item.type !== 0 ||
                    typeof item.name !== 'string' ||
                    item.name.toLowerCase() !== chat.name.toLowerCase(),
            ),
        );
        setOpenMenuFor(null);

        if (selectedChatRef.current?.name.toLowerCase() === chat.name.toLowerCase()) {
            selectedChatRef.current = null;
            setSelectedChat(null);
            setMessages([]);
            setMessageSearchOpen(false);
            setMessageSearchQuery('');
            setCurrentPage(1);
            currentPageRef.current = 1;
            setHasMore(true);
        }
    };


    const jumpToMessage = (messageId: string) => {
        const element = chatContainerRef.current?.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setJumpHighlightId(messageId);
        if (jumpTimerRef.current !== null) window.clearTimeout(jumpTimerRef.current);
        jumpTimerRef.current = window.setTimeout(() => setJumpHighlightId(null), 1500);
    };

    const attachImageFile = async (file: File) => {
        setSendError(null);
        setUploadingImage(true);
        try {
            const uploadedUrl = await uploadImageFile(file);
            setDraftImage(uploadedUrl);
            inputRef.current?.focus();
        } catch (error) {
            setSendError(error instanceof Error ? error.message : 'Không thể tải hình ảnh.');
        } finally {
            setUploadingImage(false);
        }
    };

    const appendOptimisticMessage = (targetName: string, wireText: string) => {
        localCounterRef.current += 1;
        const localId = `local-${Date.now()}-${localCounterRef.current}`;
        pendingSendsRef.current.push({
            to: targetName,
            mes: wireText,
            localId,
            expiresAt: Date.now() + 10000,
        });
        const myUsername = localStorage.getItem('username') || 'Unknown';
        setMessages((prev) => [
            ...prev,
            {
                _localId: localId,
                name: myUsername,
                mes: wireText,
                createAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
            },
        ]);
    };

    // Gửi tin nhắn thật lên server
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputText.trim();
        if ((!trimmed && !draftImage) || !selectedChat || uploadingImage) return;

        const wireText = encodeMessagePayload(trimmed, {
            ...(replyTo ? { replyTo } : {}),
            ...(draftImage ? { imageUrl: draftImage } : {}),
        });
        wsService.sendMessage('SEND_CHAT', {
            type: selectedChat.type === 1 ? 'room' : 'people',
            to: selectedChat.name,
            mes: wireText,
        });
        appendOptimisticMessage(selectedChat.name, wireText);

        setInputText('');
        setReplyTo(null);
        setDraftImage(null);
        setSendError(null);
    };

    const normalizedSearchQuery = normalizeText(searchQuery);
    const filteredChatList = chatList.filter(
        (chat) =>
            typeof chat.name === 'string' &&
            normalizeText(chat.name).includes(normalizedSearchQuery),
    );
    const normalizedMessageSearchQuery = normalizeText(messageSearchQuery);
    const filteredMessages = messages
        .map((message, index) => ({
            message,
            index,
            text: decodeMessagePayload(String(message.mes ?? message.text ?? '')).text,
        }))
        .filter(({ text }) => normalizeText(text).includes(normalizedMessageSearchQuery));

    return (
        <div className="flex flex-1 h-full bg-[#F4F4F0]">
            {/* Col 1: Danh sách tin nhắn */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Tin nhắn</h2>
                </div>

                <div className="p-3">
                    <div className="flex items-center bg-[#F4F4F0] px-3 py-2 rounded-xl text-sm text-gray-500">
                        <i className="fa-solid fa-magnifying-glass mr-2 text-gray-400"></i>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Tìm theo tên người dùng"
                            aria-label="Tìm cuộc trò chuyện theo tên người dùng"
                            className="bg-transparent border-none outline-none w-full text-xs"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {filteredChatList.map((chat, idx) => {
                        const isActive = selectedChat?.name === chat.name;
                        return (
                            <div
                                key={`${chat.type}-${chat.name}-${idx}`}
                                onClick={() => handleSelectChat(chat)}
                                className={`relative p-3 ${chat.type === 0 ? 'pr-12' : ''} flex items-center gap-3 cursor-pointer transition ${isActive ? 'bg-[#EBF2EE]' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <UserAvatar name={chat.name} online={onlineUsers[chat.name] ?? false} size="md" />

                                <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-x-2 items-center text-left">
                                    <h4 className="text-sm font-semibold text-gray-800 truncate">{chat.name}</h4>
                                    <span className="text-[10px] text-gray-400 shrink-0">{chat.actionTime || ''}</span>
                                    <p className="text-xs text-gray-500 truncate col-span-2 mt-0.5">
                                        {chat.type === 1 ? 'Phòng chat nhóm' : 'Trò chuyện cá nhân'}
                                    </p>
                                </div>
                                {chat.type === 0 && (
                                    <>
                                        <button
                                            type="button"
                                            aria-label={`Tùy chọn ${chat.name}`}
                                            aria-expanded={openMenuFor === chat.name}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setOpenMenuFor((current) =>
                                                    current === chat.name ? null : chat.name,
                                                );
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                                        >
                                            <i className="fa-solid fa-ellipsis" aria-hidden="true"></i>
                                        </button>
                                        {openMenuFor === chat.name && (
                                            <div
                                                role="menu"
                                                className="absolute right-2 top-12 z-10 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                                            >
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleHideChat(chat);
                                                    }}
                                                    className="whitespace-nowrap px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Xóa khỏi danh sách
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                    {filteredChatList.length === 0 && (
                        <p className="p-4 text-center text-xs text-gray-500">
                            {chatList.length === 0
                                ? 'Chưa có cuộc trò chuyện nào.'
                                : 'Không tìm thấy tên người dùng phù hợp.'}
                        </p>
                    )}
                </div>
            </div>

            {/* Col 2: Khung chat chi tiết */}
            <div className="flex-1 flex flex-col h-full bg-[#FCFBFA]">
                {selectedChat ? (
                    <>
                        <div className="px-6 py-3.5 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <UserAvatar name={selectedChat.name} online={onlineUsers[selectedChat.name] ?? false} size="sm" />
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800">{selectedChat.name}</h3>
                                    <p className={`text-[11px] font-medium ${onlineUsers[selectedChat.name] ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {onlineUsers[selectedChat.name] ? 'Đang hoạt động' : 'Ngoại tuyến'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-gray-400 text-sm">
                                <button
                                    type="button"
                                    aria-label={messageSearchOpen ? 'Đóng tìm kiếm hội thoại' : 'Tìm trong hội thoại'}
                                    aria-expanded={messageSearchOpen}
                                    onClick={() => {
                                        if (messageSearchOpen) {
                                            setMessageSearchOpen(false);
                                            setMessageSearchQuery('');
                                        } else {
                                            setMessageSearchOpen(true);
                                        }
                                    }}
                                    className="hover:text-gray-700 cursor-pointer"
                                >
                                    <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>

                        {messageSearchOpen && (
                            <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-6 py-3">
                                <i className="fa-solid fa-magnifying-glass text-xs text-gray-400" aria-hidden="true"></i>
                                <input
                                    type="search"
                                    value={messageSearchQuery}
                                    onChange={(event) => setMessageSearchQuery(event.target.value)}
                                    placeholder="Tìm trong hội thoại"
                                    aria-label="Tìm nội dung tin nhắn"
                                    autoFocus
                                    className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                                />
                                <button
                                    type="button"
                                    aria-label="Đóng tìm kiếm"
                                    onClick={() => {
                                        setMessageSearchOpen(false);
                                        setMessageSearchQuery('');
                                    }}
                                    className="text-gray-400 hover:text-gray-700"
                                >
                                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                                </button>
                            </div>
                        )}

                        <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4">
                            {hasMore && messages.length >= 50 && (
                                <div className="flex justify-center mb-4">
                                    <button
                                        onClick={handleLoadMore}
                                        className="text-xs text-emerald-600 hover:underline cursor-pointer"
                                    >
                                        Xem tin nhắn cũ hơn
                                    </button>
                                </div>
                            )}
                            {filteredMessages.map(({ message: msg, index }) => {
                                const msgId = getChatMessageId(msg, index);
                                const senderName = msg.name || msg.from || '';
                                const currentLoggedInUser = localStorage.getItem('username') || 'Unknown';
                                const isMe = senderName === currentLoggedInUser;
                                const decoded = decodeMessagePayload(String(msg.mes || msg.text || ''));
                                const isHighlighted = msgId === jumpHighlightId;

                                return (
                                    <div key={msgId} data-message-id={msgId} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`group/bubble flex max-w-md items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <div className={`min-w-0 p-3 rounded-2xl text-sm shadow-sm border transition ${isMe
                                                ? 'bg-[#EBF2EE] border-emerald-100 text-left'
                                                : 'bg-white border-gray-100 text-left'
                                                } ${isHighlighted ? 'ring-2 ring-forest-soft' : ''}`}>
                                                <span className="text-[10px] font-bold text-gray-600 block mb-0.5">{senderName}</span>
                                                {decoded.forwardedFrom && (
                                                    <p className="flex items-center gap-1.5 text-[11px] italic text-gray-400">
                                                        <i className="fa-solid fa-share text-[10px]" aria-hidden="true"></i>
                                                        <span>Đã chuyển tiếp từ {decoded.forwardedFrom}</span>
                                                    </p>
                                                )}
                                                {decoded.replyTo && (
                                                    <div className="mb-1.5">
                                                        <ReplyQuote replyTo={decoded.replyTo} onJump={jumpToMessage} />
                                                    </div>
                                                )}
                                                {decoded.imageUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewImage({ url: decoded.imageUrl!, caption: decoded.text || undefined })}
                                                        className="mb-1.5 block overflow-hidden rounded-xl"
                                                    >
                                                        <img
                                                            src={decoded.imageUrl}
                                                            alt={decoded.text || 'Hình ảnh đã gửi'}
                                                            className="max-h-60 max-w-60 rounded-xl object-cover transition hover:opacity-95"
                                                            loading="lazy"
                                                        />
                                                    </button>
                                                )}
                                                {decoded.text && <p className="whitespace-pre-line break-words">{decoded.text}</p>}
                                            </div>
                                            <div className={`flex shrink-0 items-center gap-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <button
                                                    type="button"
                                                    aria-label="Trả lời tin nhắn"
                                                    title="Trả lời tin nhắn"
                                                    onClick={() => {
                                                        setReplyTo(createReplyReference(senderName || 'Người dùng', decoded.text, msgId, Boolean(decoded.imageUrl)));
                                                        inputRef.current?.focus();
                                                    }}
                                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs text-gray-400 opacity-0 transition hover:bg-gray-100 hover:text-forest-soft focus:opacity-100 group-hover/bubble:opacity-100"
                                                >
                                                    <i className="fa-solid fa-reply" aria-hidden="true"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label="Chuyển tiếp tin nhắn"
                                                    title="Chuyển tiếp tin nhắn"
                                                    onClick={() =>
                                                        setForwardMsg({
                                                            text: decoded.text,
                                                            sender: decoded.forwardedFrom || senderName,
                                                            imageUrl: decoded.imageUrl,
                                                        })
                                                    }
                                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs text-gray-400 opacity-0 transition hover:bg-gray-100 hover:text-forest-soft focus:opacity-100 group-hover/bubble:opacity-100"
                                                >
                                                    <i className="fa-solid fa-share" aria-hidden="true"></i>
                                                </button>
                                                {decoded.text && <CopyMessageButton text={decoded.text} />}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1">{msg.createAt || ''}</span>
                                    </div>
                                );
                            })}
                            {normalizedMessageSearchQuery && filteredMessages.length === 0 && (
                                <p className="text-center text-sm text-gray-500">
                                    Không tìm thấy tin nhắn phù hợp trong các tin nhắn đã tải.
                                </p>
                            )}
                        </div>

                        {sendError && (
                            <div role="alert" className="mx-4 mt-2 flex items-center justify-between gap-2 rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger">
                                <span>{sendError}</span>
                                <button type="button" onClick={() => setSendError(null)} aria-label="Đóng thông báo">
                                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={IMAGE_ACCEPT_TYPES}
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    event.target.value = '';
                                    if (file) void attachImageFile(file);
                                }}
                                className="hidden"
                            />
                            {uploadingImage && (
                                <p role="status" className="mb-2 flex items-center gap-2 rounded-xl bg-[#F4F4F0] px-3 py-2 text-xs text-gray-500">
                                    <i className="fa-solid fa-circle-notch fa-spin text-[#1C3A32]" aria-hidden="true"></i>
                                    <span>Đang tải ảnh lên...</span>
                                </p>
                            )}
                            {draftImage && <ImageDraftBanner imageUrl={draftImage} onRemove={() => setDraftImage(null)} />}
                            {replyTo && <ReplyBanner replyTo={replyTo} onCancel={() => setReplyTo(null)} />}
                            <div className="flex items-center bg-[#F4F4F0] px-4 py-2.5 rounded-2xl gap-3">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape' && replyTo) {
                                            e.preventDefault();
                                            setReplyTo(null);
                                        }
                                    }}
                                    onPaste={(event) => {
                                        const file = extractClipboardImage(event.clipboardData?.items);
                                        if (!file) return;
                                        event.preventDefault();
                                        void attachImageFile(file);
                                    }}
                                    placeholder="Nhắn gì đó nhé..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    aria-label="Gửi hình ảnh"
                                    title="Gửi hình ảnh"
                                    disabled={uploadingImage}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50 cursor-pointer"
                                >
                                    <i className="fa-regular fa-image"></i>
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadingImage}
                                    className="w-8 h-8 rounded-full bg-[#1C3A32] text-white flex items-center justify-center hover:bg-[#152c25] disabled:opacity-50 transition cursor-pointer shrink-0"
                                >
                                    <i className="fa-solid fa-arrow-up text-xs"></i>
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="cursor-pointer transition hover:opacity-90">
                        <UserAvatar name={localStorage.getItem('username') || 'User'} size="sm" />
                    </div>
                )}
            </div>
            {forwardMsg && (
                <ForwardDialog
                    previewText={forwardMsg.text}
                    previewImageUrl={forwardMsg.imageUrl}
                    onForward={async (target: ForwardTarget) => {
                        const options = {
                            forwardedFrom: forwardMsg.sender,
                            imageUrl: forwardMsg.imageUrl,
                        };
                        const isActiveChat =
                            selectedChat &&
                            selectedChat.name === target.id &&
                            (selectedChat.type === 1) === (target.type === 'group');
                        await forwardMessage(target, forwardMsg.text, options);
                        if (isActiveChat) {
                            appendOptimisticMessage(target.id, encodeMessagePayload(forwardMsg.text, options));
                        }
                    }}
                    onClose={() => setForwardMsg(null)}
                />
            )}
            {previewImage && (
                <ImagePreviewModal
                    imageUrl={previewImage.url}
                    caption={previewImage.caption}
                    onClose={() => setPreviewImage(null)}
                />
            )}
        </div>
    );
}