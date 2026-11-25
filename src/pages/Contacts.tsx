import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/Contacts.css';

interface Friend {
    id: number;
    name: string;
    username?: string;
    status: string;
    avatar?: string;
    avatarImg?: string;
    online?: boolean;
}

interface FriendRequest {
    id: number;
    name: string;
    username: string;
    mutualFriends: number;
    avatar: string;
}

export default function Contacts() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [friends, setFriends] = useState<Friend[]>([
        { id: 1, name: 'Huy Phạm', username: 'huypham', status: 'Hoạt động 1 giờ trước', avatar: 'HP' },
        { id: 2, name: 'Linh Nguyễn', username: 'linhnguyen', status: 'Đang hoạt động', avatarImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', online: true },
        { id: 3, name: 'Mai Trần', username: 'maitran', status: 'Đang hoạt động', avatar: 'MT', online: true },
        { id: 4, name: 'Minh Anh', username: 'minhanh', status: 'Hoạt động 20 phút trước', avatar: 'MA' },
    ]);

    const [requests, setRequests] = useState<FriendRequest[]>([
        { id: 101, name: 'Thu Hà', username: 'thuha', mutualFriends: 3, avatar: 'TH' },
        { id: 102, name: 'Đức Hoàng', username: 'duchoang', mutualFriends: 1, avatar: 'ĐH' },
    ]);

    const handleAccept = (id: number): void => {
        const acceptedReq = requests.find(r => r.id === id);
        if (acceptedReq) {
            setFriends(prev => [...prev, { ...acceptedReq, status: 'Đang hoạt động', online: true }]);
            setRequests(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleReject = (id: number): void => {
        setRequests(prev => prev.filter(r => r.id !== id));
    };

    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    const filteredFriends = friends.filter((friend) =>
        friend.name.toLocaleLowerCase().includes(normalizedQuery) ||
        friend.username?.toLocaleLowerCase().includes(normalizedQuery)
    );
    const filteredRequests = requests.filter((request) =>
        request.name.toLocaleLowerCase().includes(normalizedQuery) ||
        request.username.toLocaleLowerCase().includes(normalizedQuery)
    );

    return (
        <div className="contacts-layout">
            <div className="contacts-main-content">

                <h1 className="contacts-title">Danh bạ</h1>

                <div className="contacts-search-box">
                    <div className="contacts-search-label">Tìm bạn bè</div>
                    <div className="contacts-search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Nhập tên hoặc tên người dùng"
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            className="contacts-search-input"
                        />
                        <i className="fa-solid fa-magnifying-glass contacts-search-icon"></i>
                    </div>
                </div>

                <div className="contacts-tabs">
                    <button
                        type="button"
                        aria-pressed={activeTab === 'friends'}
                        className={`contacts-tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                        onClick={() => setActiveTab('friends')}
                    >
                        Bạn bè <span>{filteredFriends.length}</span>
                    </button>
                    <button
                        type="button"
                        aria-pressed={activeTab === 'requests'}
                        className={`contacts-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Lời mời <span>{requests.length}</span>
                    </button>
                </div>

                {activeTab === 'requests' && (
                    <div className="contacts-section">
                        <div className="contacts-section-header">LỜI MỜI KẾT BẠN · {filteredRequests.length}</div>
                        <div className="contacts-list">
                            {filteredRequests.map(req => (
                                <div key={req.id} className="contacts-item">
                                    <div className="contacts-user-info">
                                        <div className="contacts-avatar bg-amber">{req.avatar}</div>
                                        <div>
                                            <div className="contacts-name">{req.name}</div>
                                            <div className="contacts-subtext">@{req.username} · {req.mutualFriends} bạn chung</div>
                                        </div>
                                    </div>
                                    <div className="contacts-actions">
                                        <button className="btn-secondary" onClick={() => handleReject(req.id)}>Từ chối</button>
                                        <button className="btn-primary" onClick={() => handleAccept(req.id)}>Chấp nhận</button>
                                    </div>
                                </div>
                            ))}
                            {filteredRequests.length === 0 && (
                                <p className="contacts-empty">
                                    {requests.length === 0
                                        ? 'Bạn chưa có lời mời kết bạn nào.'
                                        : 'Không tìm thấy lời mời phù hợp.'}
                                </p>
                            )}
                        </div>
                    </div>
                )}
                
                {activeTab === 'friends' && <div className="contacts-section">
                    <div className="contacts-section-header-row">
                        <div className="contacts-section-header">BẠN BÈ · {filteredFriends.length}</div>
                        <div className="contacts-sort">
                            Tên A-Z <i className="fa-solid fa-chevron-down"></i>
                        </div>
                    </div>

                    <div className="contacts-list">
                        {filteredFriends.map(friend => (
                            <div key={friend.id} className="contacts-item">
                                <div className="contacts-user-info">
                                    <div className="contacts-avatar-wrapper">
                                        {friend.avatarImg ? (
                                            <img src={friend.avatarImg} alt={friend.name} className="contacts-avatar-img" />
                                        ) : (
                                            <div className="contacts-avatar bg-emerald">{friend.avatar}</div>
                                        )}
                                        {friend.online && <span className="contacts-online-dot"></span>}
                                    </div>
                                    <div>
                                        <div className="contacts-name">{friend.name}</div>
                                        <div className={`contacts-status ${friend.online ? 'online' : ''}`}>{friend.status}</div>
                                    </div>
                                </div>
                                <div className="contacts-item-actions">
                                    <button
                                        type="button"
                                        className="icon-btn"
                                        title="Nhắn tin"
                                        aria-label={`Nhắn tin với ${friend.name}`}
                                        onClick={() => navigate('/chat', { state: { chatWith: friend.username ?? friend.name } })}
                                    >
                                        <i className="fa-regular fa-comment"></i>
                                    </button>
                                    <button type="button" className="icon-btn" title="Tùy chọn" aria-label={`Tùy chọn ${friend.name}`}>
                                        <i className="fa-solid fa-ellipsis"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredFriends.length === 0 && (
                            <p className="contacts-empty">
                                {friends.length === 0
                                    ? 'Danh bạ của bạn chưa có bạn bè.'
                                    : 'Không tìm thấy bạn bè phù hợp.'}
                            </p>
                        )}
                    </div>
                </div>}

            </div>
        </div>
    );
}