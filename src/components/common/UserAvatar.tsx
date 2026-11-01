import React from 'react';

interface UserAvatarProps {
    name: string;
    online?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, online = false, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-16 h-16 text-lg',
    };

    const dotSizes = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    // Hàm lấy chữ cái đầu, vd Linh Nguyễn -> LN
    const getInitials = (str: string) => {
        if (!str) return 'US';
        const words = str.trim().split(' ');
        if (words.length >= 2) {
            // Lấy chữ cái đầu của từ đầu tiên và từ cuối cùng
            return (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }
        return str.slice(0, 2).toUpperCase();
    };

    return (
        <div className="relative shrink-0">
            <div className={`${sizeClasses[size]} rounded-full bg-[#1C3A32] text-white flex items-center justify-center font-bold overflow-hidden shadow-sm shrink-0`}>
                <span>{getInitials(name)}</span>
            </div>
            {online && (
                <span className={`absolute bottom-0 right-0 ${dotSizes[size]} bg-emerald-500 border-2 border-white rounded-full`}></span>
            )}
        </div>
    );
};