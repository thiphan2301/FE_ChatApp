import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Dùng class name của FontAwesome icon
    const menuItems = [
        { id: 'chat', path: '/chat', label: 'Tin nhắn', iconClass: 'fa-regular fa-comment-dots' },
        { id: 'search', path: '/search', label: 'Tìm kiếm', iconClass: 'fa-solid fa-magnifying-glass' },
        { id: 'contacts', path: '/contacts', label: 'Danh bạ', iconClass: 'fa-solid fa-user-group' },
        { id: 'profile', path: '/profile', label: 'Hồ sơ', iconClass: 'fa-regular fa-user' },
        { id: 'settings', path: '/settings', label: 'Cài đặt', iconClass: 'fa-solid fa-gear' },
    ];

    return (
        <aside className="w-20 bg-[#1C3A32] h-screen flex flex-col items-center py-6 text-white justify-between shrink-0 shadow-md">
            <div className="flex flex-col items-center gap-8">

                <div onClick={() => navigate('/chat')} className="font-serif italic font-bold text-xl tracking-wider cursor-pointer text-white/90 hover:text-white">
                    Logo
                </div>

                {/* menu */}
                <nav className="flex flex-col gap-3">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                title={item.label}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-all duration-200 cursor-pointer ${
                                    isActive
                                        ? 'bg-white/20 text-white shadow-inner'
                                        : 'text-white/50 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <i className={item.iconClass}></i>
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs border-2 border-white/20 overflow-hidden cursor-pointer hover:opacity-90 transition">
                <span className="text-white text-xs">THI</span>
            </div>
        </aside>
    );
};