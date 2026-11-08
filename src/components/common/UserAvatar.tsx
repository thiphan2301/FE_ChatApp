import React from 'react';
import defaultAvatar from '../../assets/avatar.png';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface UserAvatarProps {
    name: string;
    online?: boolean;
    size?: AvatarSize;
    imageUrl?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
    xs: 'w-5 h-5',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
};

const DOT_SIZES: Record<AvatarSize, string> = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-4 h-4',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
    name,
    online = false,
    size = 'md',
    imageUrl,
}) => {
    return (
        <div className="relative shrink-0">
            <img
                src={imageUrl || defaultAvatar}
                alt={name}
                className={`${SIZE_CLASSES[size]} rounded-full object-cover shrink-0`}
            />
            {online && (
                <span className={`absolute bottom-0 right-0 ${DOT_SIZES[size]} bg-emerald-500 border-2 border-white rounded-full`}></span>
            )}
        </div>
    );
};