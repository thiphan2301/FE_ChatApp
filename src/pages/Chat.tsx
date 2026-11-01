import React, { useState, useEffect } from 'react';
import { UserAvatar } from '../components/common/UserAvatar';
import { getMockChatList, getMockMessages } from '../data/mockChats';
import type { ChatItem, MessageItem } from '../data/mockChats';

export default function Chat() {
    const [chatList, setChatList] = useState<ChatItem[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [inputText, setInputText] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const data: ChatItem[] = getMockChatList();
            setChatList(data);

            if (data.length > 0) {
                setSelectedChat(data[0]);
                setMessages(getMockMessages(data[0].id));
            }
        };
        fetchData();
    }, []);

    const handleSelectChat = (chat: ChatItem) => {
        setSelectedChat(chat);
        setMessages(getMockMessages(chat.id));
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newMessage: MessageItem = {
            id: Date.now(),
            sender: 'me',
            text: inputText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages([...messages, newMessage]);
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
                    {chatList.map((chat) => {
                        const isActive = selectedChat?.id === chat.id;
                        return (
                            <div
                                key={chat.id}
                                onClick={() => handleSelectChat(chat)}
                                className={`p-3 flex items-center gap-3 cursor-pointer transition ${
                                    isActive ? 'bg-[#EBF2EE]' : 'hover:bg-gray-50'
                                }`}
                            >
                                <UserAvatar name={chat.name} online={chat.online} size="md" />

                                <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-x-2 items-center text-left">
                                    <h4 className="text-sm font-semibold text-gray-800 truncate">{chat.name}</h4>
                                    <span className="text-[10px] text-gray-400 shrink-0">{chat.time}</span>
                                    <p className="text-xs text-gray-500 truncate col-span-2 mt-0.5">{chat.message}</p>
                                </div>

                                {chat.unread > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-[#1C3A32] text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                                        {chat.unread}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Col 2: Khung chat chi tiết */}
            <div className="flex-1 flex flex-col h-full bg-[#FCFBFA]">
                {selectedChat && (
                    <>
                        <div className="px-6 py-3.5 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <UserAvatar name={selectedChat.name} online={selectedChat.online} size="sm" />
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800">{selectedChat.name}</h3>
                                    <p className="text-[11px] text-emerald-600 font-medium">
                                        {selectedChat.online ? 'Đang hoạt động' : 'Không hoạt động'}
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

                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-3 rounded-2xl max-w-md text-sm shadow-sm ${
                                        msg.sender === 'me' ? 'bg-[#E4EFEA] text-gray-800 rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                                    }`}>
                                        <p>{msg.text}</p>
                                        {msg.image && (
                                            <img src={msg.image} alt="attachment" className="mt-2 rounded-xl w-64 h-36 object-cover" />
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1">{msg.time}</span>
                                </div>
                            ))}
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
                )}
            </div>
        </div>
    );
}