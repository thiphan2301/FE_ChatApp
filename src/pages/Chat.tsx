/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { UserAvatar } from '../components/common/UserAvatar';
import { wsService, type ServerResponse } from '../services/websocketService';

export default function Chat() {
    const [chatList, setChatList] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
    const [, setIsLoading] = useState(true);

    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    // hàm nhảy xuống dưới cùng cuôc trò truyện
    const scrollToBottomInstant = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    // theo dõi khi đổi đoạn chat hoặc khi có tín nhắn mới
    useEffect(() => {
        if (messages.length > 0) {
            // Dùng requestAnimationFrame để chắc chắn DOM đã render xong rồi hảy xuống dưới cùng luôn
            requestAnimationFrame(() => {
                scrollToBottomInstant();
            });
        }
    }, [messages, selectedChat]);

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
                    setChatList(list);
                    //tắt trạng thái loading
                    setIsLoading(false);

                    // Nếu có danh sách và chưa chọn chat nào, tự động chọn người đầu tiên và tải tin nhắn luôn
                    if (list.length > 0 && !selectedChat) {
                        const firstChat = list[0];
                        setSelectedChat(firstChat);
                        fetchMessagesForChat(firstChat);
                    }
                } else if (response.event === 'GET_PEOPLE_CHAT_MES' || response.event === 'GET_ROOM_CHAT_MES') {
                    // Đảm bảo dữ liệu nhận về là mảng
                    let msgData = response.data;
                    if (msgData && typeof msgData === 'object' && 'chatMess' in msgData) {
                        msgData = (msgData as any).chatMess;
                    }

                    const newMessages = Array.isArray(msgData) ? msgData : [];

                    if (currentPage === 1) {
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
                        setMessages((prev) => [...prev, response.data]);
                        const senderName = response.data.name || response.data.from;
                        if (senderName) {
                            setOnlineUsers(prev => ({ ...prev, [senderName]: true }));
                        }
                    }
                } else if (response.event === 'CHECK_USER_ONLINE') {
                    if (response.data) {
                        setOnlineUsers(prev => ({
                            ...prev,
                            [selectedChat?.name]: response.data.status
                        }));
                    }
                }
            }
        });

        return () => {
            removeListener();
        };
    }, []);

    // Khi bấm chọn một cuộc trò chuyện trong danh sách
    const handleSelectChat = (chat: any) => {
        setSelectedChat(chat);
        // Reset phân trang
        setCurrentPage(1);
        setHasMore(true);
        //xóa tạm tin nhắn cũ khi đổi chat
        setMessages([]);
        fetchMessagesForChat(chat, 1);
    };


    // Gửi tin nhắn thật lên server
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedChat) return;

        const messagePayload = {
            type: selectedChat.type === 1 ? 'room' : 'people',
            to: selectedChat.name,
            mes: inputText,
        };

        wsService.sendMessage('SEND_CHAT', messagePayload);

        const myUsername = localStorage.getItem('username') || 'Unknown';
        const localMsg = {
            name: myUsername,
            mes: inputText,
            createAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, localMsg]);

        setInputText('');
    };

    return (
        <div className="flex flex-1 h-full bg-[#F4F4F0]">
            {/* Col 1: Danh sách tin nhắn */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Tin nhắn</h2>
                    <button className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer">
                        <i className="fa-regular fa-pen-to-square"></i>
                    </button>
                </div>

                <div className="p-3">
                    <div className="flex items-center bg-[#F4F4F0] px-3 py-2 rounded-xl text-sm text-gray-500">
                        <i className="fa-solid fa-magnifying-glass mr-2 text-gray-400"></i>
                        <input type="text" placeholder="Tìm cuộc trò chuyện" className="bg-transparent border-none outline-none w-full text-xs" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {chatList.map((chat, idx) => {
                        const isActive = selectedChat?.name === chat.name;
                        return (
                            <div
                                key={idx}
                                onClick={() => handleSelectChat(chat)}
                                className={`p-3 flex items-center gap-3 cursor-pointer transition ${isActive ? 'bg-[#EBF2EE]' : 'hover:bg-gray-50'
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
                            </div>
                        );
                    })}
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
                                <button className="hover:text-gray-700 cursor-pointer"><i className="fa-solid fa-phone"></i></button>
                                <button className="hover:text-gray-700 cursor-pointer"><i className="fa-solid fa-video"></i></button>
                                <button className="hover:text-gray-700 cursor-pointer"><i className="fa-solid fa-magnifying-glass"></i></button>
                                <button className="hover:text-gray-700 cursor-pointer"><i className="fa-solid fa-ellipsis"></i></button>
                            </div>
                        </div>

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
                            {Array.isArray(messages) && messages.map((msg, index) => {

                                const senderName = msg.name || msg.from || '';
                                const currentLoggedInUser = localStorage.getItem('username') || 'Unknown';
                                const isMe = senderName === currentLoggedInUser;

                                return (
                                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-3 rounded-2xl max-w-md text-sm shadow-sm border ${isMe
                                            ? 'bg-[#EBF2EE] border-emerald-100 text-right'
                                            : 'bg-white border-gray-100 text-left'
                                            }`}>
                                            <span className="text-[10px] font-bold text-gray-600 block mb-0.5">{senderName}</span>
                                            <p className="break-words">{msg.mes || msg.text}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1">{msg.createAt || ''}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                            <div className="flex items-center bg-[#F4F4F0] px-4 py-2.5 rounded-2xl gap-3">
                                <button type="button" className="text-gray-400 hover:text-gray-600 text-base cursor-pointer">
                                    <i className="fa-solid fa-plus"></i>
                                </button>
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Nhắn gì đó nhé..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
                                />
                                <button type="button" className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <i className="fa-regular fa-face-smile"></i>
                                </button>
                                <button type="button" className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <i className="fa-solid fa-paperclip"></i>
                                </button>
                                <button type="submit" className="w-8 h-8 rounded-full bg-[#1C3A32] text-white flex items-center justify-center hover:bg-[#152c25] transition cursor-pointer shrink-0">
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
        </div>
    );
}