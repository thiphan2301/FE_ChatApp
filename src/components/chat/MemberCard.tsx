import { useRef } from 'react';
import { PrimaryButton } from '../common/PrimaryButton';
import { UserAvatar } from '../common/UserAvatar';
import { useClickOutside } from '../../hooks/useAsyncData';
import type { ConversationMember } from '../../types';
import { describeMember } from '../../utils/helpers';

interface MemberCardProps {
    member: ConversationMember;
    roomName: string;
    isSelf: boolean;
    onClose: () => void;
    onMessage: () => void;
}

export const MemberCard = ({ member, roomName, isSelf, onClose, onMessage }: MemberCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    useClickOutside(cardRef, onClose, true);

    return (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
            <div
                ref={cardRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="member-card-name"
                className="relative w-full max-w-[340px] rounded-3xl bg-white p-6 text-center shadow-xl"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Đóng"
                    className="absolute right-5 top-5 text-slate hover:text-ink"
                >
                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>

                <div className="flex flex-col items-center gap-1">
                    <UserAvatar name={member.name} imageUrl={member.avatarUrl} online={member.online} size="xl" />
                    <h2 id="member-card-name" className="mt-3 break-all text-lg font-semibold text-ink">
                        {member.name}
                    </h2>
                    <p className="text-[13px] text-forest-soft">{describeMember(member)}</p>
                    <p className="text-xs text-mist">Thành viên của phòng "{roomName}"</p>
                </div>

                <div className="mt-6">
                    {isSelf ? (
                        <p className="rounded-xl bg-paper px-4 py-2.5 text-[13px] text-slate">Đây là bạn.</p>
                    ) : (
                        <PrimaryButton type="button" onClick={onMessage}>
                            <i className="fa-regular fa-comment-dots mr-2" aria-hidden="true"></i>
                            Nhắn tin riêng
                        </PrimaryButton>
                    )}
                </div>
            </div>
        </div>
    );
};