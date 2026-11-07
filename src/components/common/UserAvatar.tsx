import React from 'react';
import { getInitials } from '../../utils/helpers';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarTone = 'dark' | 'soft';

interface UserAvatarProps {
    name: string;
    online?: boolean;
    size?: AvatarSize;
    imageUrl?: string;
    tone?: AvatarTone;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-2xl',
};

const DOT_SIZES: Record<AvatarSize, string> = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-4 h-4',
};

const TONE_CLASSES: Record<AvatarTone, string> = {
    dark: 'bg-[#1C3A32] text-white font-bold shadow-sm',
    soft: 'bg-sand text-forest-soft font-semibold',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
                                                          name,
                                                          online = false,
                                                          size = 'md',
                                                          imageUrl,
                                                          tone = 'dark',
                                                      }) => {
    return (
        <div className="relative shrink-0">
            <div className={`${SIZE_CLASSES[size]} ${TONE_CLASSES[tone]} rounded-full flex items-center justify-center overflow-hidden shrink-0`}>
                {imageUrl ? (
                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <span>{getInitials(name)}</span>
                )}
            </div>
            {online && (
                <span className={`absolute bottom-0 right-0 ${DOT_SIZES[size]} bg-emerald-500 border-2 border-white rounded-full`}></span>
            )}
        </div>
    );
};