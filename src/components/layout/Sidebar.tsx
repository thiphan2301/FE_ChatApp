import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserAvatar } from '../common/UserAvatar';
import { useCurrentUser } from '../../hooks/useAsyncData';

const menuItems = [
    { id: 'chat', path: '/chat', label: 'Tin nhắn', iconClass: 'fa-regular fa-comment-dots' },
    { id: 'search', path: '/search', label: 'Tìm kiếm', iconClass: 'fa-solid fa-magnifying-glass' },
    { id: 'contacts', path: '/contacts', label: 'Danh bạ', iconClass: 'fa-solid fa-user-group' },
];

const settingsItem = { id: 'settings', path: '/settings', label: 'Cài đặt', iconClass: 'fa-solid fa-sliders' };

export const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = useCurrentUser(location.pathname);

    const renderItem = (item: typeof settingsItem) => {
        const isActive = location.pathname === item.path;
        return (
            <button
                key={item.id}
                onClick={() => navigate(item.path)}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-base transition-all duration-200 cursor-pointer ${
                    isActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/55 hover:bg-white/10 hover:text-white'
                }`}
            >
                <i className={item.iconClass} aria-hidden="true"></i>
            </button>
        );
    };

    return (
        <aside className="ui-isolated flex h-full w-[84px] shrink-0 flex-col items-center justify-between rounded-[28px] bg-forest py-7 text-white">
            <div className="flex flex-col items-center gap-8">
                <div onClick={() => navigate('/chat')} className="font-serif italic text-2xl tracking-wide cursor-pointer text-white/90 hover:text-white">
                    Logo
                </div>

                <nav aria-label="Điều hướng chính" className="flex flex-col gap-3">
                    {menuItems.map(renderItem)}
                </nav>
            </div>

            <div className="flex flex-col items-center gap-4">
                {renderItem(settingsItem)}
                <button
                    onClick={() => navigate('/profile')}
                    aria-label="Hồ sơ của bạn"
                    title="Hồ sơ"
                    className="rounded-full transition hover:opacity-90 cursor-pointer"
                >
                    <UserAvatar
                        name={currentUser?.displayName ?? ''}
                        imageUrl={currentUser?.avatarUrl}
                        size="sm"
                    />
                </button>
            </div>
        </aside>
    );
};