/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import '../assets/Search.css';

export default function Search() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    return (
        <div className="search-container">
            <div className="search-main">
                <h1 className="search-title">Tìm kiếm</h1>

                <div className="search-input-box">
                    <span className="search-input-icon">
                        <i className="fa-solid fa-magnifying-glass"></i>
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="search-input-field"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="search-clear-btn">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    )}
                </div>

                <div className="search-tabs">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`search-tab-item ${activeTab === 'all' ? 'search-tab-active' : ''}`}
                    >
                        Tất cả <span className="search-badge">8</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('people')}
                        className={`search-tab-item ${activeTab === 'people' ? 'search-tab-active' : ''}`}
                    >
                        Mọi người <span className="search-badge">1</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`search-tab-item ${activeTab === 'messages' ? 'search-tab-active' : ''}`}
                    >
                        Tin nhắn <span className="search-badge">5</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`search-tab-item ${activeTab === 'files' ? 'search-tab-active' : ''}`}
                    >
                        Tệp <span className="search-badge">2</span>
                    </button>
                </div>

                {(activeTab === 'all' || activeTab === 'people') && (
                    <div style={{ marginBottom: '24px' }}>
                        <h3 className="search-section-title">Mọi người</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' }}>DL</div>
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>Đà Lạt một chút</h4>
                                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Nhóm • 8 thành viên • Bạn đã tham gia</p>
                                </div>
                            </div>
                            <i className="fa-solid fa-arrow-right" style={{ color: '#9ca3af', fontSize: '12px' }}></i>
                        </div>
                    </div>
                )}
            </div>

            <div className="search-sidebar">
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>Tìm trong hội thoại</h3>
                <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', marginTop: '24px' }}>
                    Chỉ tìm trong tin nhắn và tệp của cuộc trò chuyện này.
                </p>
            </div>
        </div>
    );
}