export interface ChatItem {
    id: number;
    name: string;
    message: string;
    time: string;
    unread: number;
    online: boolean;
}

export interface MessageItem {
    id: number;
    sender: 'other' | 'me';
    text: string;
    time: string;
    image?: string;
}

// Fake API trả về danh sách hội thoại
export const getMockChatList = (): ChatItem[] => {
    return [
        { id: 1, name: 'Linh Nguyễn', message: 'Mình gửi bạn mấy tấm hôm qua nhé', time: '14:32', unread: 2, online: true },
        { id: 2, name: 'Chuyện cuối tuần', message: 'Mai: Hẹn cả nhà sáng thứ Bảy', time: '14:20', unread: 0, online: false },
        { id: 3, name: 'Minh Anh', message: 'Bạn: Ừ, để mình xem rồi nhân nhé.', time: '11:45', unread: 0, online: true },
        { id: 4, name: 'Mai Trần', message: 'Đã gửi một ảnh', time: '10:08', unread: 1, online: true },
        { id: 5, name: 'Huy Phạm', message: 'Cảm ơn An nhiều nha!', time: 'Hôm qua', unread: 0, online: false },
        { id: 6, name: 'Nhà mình', message: 'Mẹ: Tối về ăn cơm nhé con', time: 'Hôm qua', unread: 0, online: false },
    ];
};

// Fake API trả về chi tiết tin nhắn của một cuộc trò chuyện
export const getMockMessages = (chatId: number): MessageItem[] => {
    // Giả lập dữ liệu trả về khác nhau tùy theo chatId được bấm vào
    if (chatId === 1) {
        return [
            { id: 1, sender: 'other', text: 'Cuối tuần này mình đi Đà Lạt nhé?', time: '14:28', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400' },
            { id: 2, sender: 'me', text: 'Chốt luôn! Để mình xem vé xe nha.', time: '14:30' },
        ];
    }
    return [
        { id: 1, sender: 'other', text: 'Chào bạn, nhóm mình tiến độ tới đâu rồi nhỉ?', time: '10:00' },
    ];
};