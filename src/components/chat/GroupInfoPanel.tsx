import { useState } from 'react';
import { IconButton, Toggle } from '../common/Controls';
import { UserAvatar } from '../common/UserAvatar';
import type { Conversation, ConversationMember, SharedFile, SharedPhoto } from '../../types';
import { formatFileSize, formatSharedDay } from '../../utils/helpers';
import { FileAttachment } from './ChatWindow';

const MEMBER_PREVIEW_COUNT = 3;

interface MemberListProps {
    members: ConversationMember[];
    canAddMembers: boolean;
}

const describeMember = (member: ConversationMember): string => {
    if (member.role === 'admin') return 'Quản trị viên';
    return member.online ? 'Đang hoạt động' : 'Không hoạt động';
};

const MemberList = ({ members, canAddMembers }: MemberListProps) => {
    const [expanded, setExpanded] = useState(false);
    const visibleMembers = expanded ? members : members.slice(0, MEMBER_PREVIEW_COUNT);

    return (
        <section aria-label="Thành viên" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-ink">Thành viên · {members.length}</h3>
                {canAddMembers && (
                    <IconButton icon="fa-solid fa-user-plus" label="Thêm thành viên" className="h-7 w-7 text-forest-soft" />
                )}
            </div>
            <ul className="flex flex-col gap-3">
                {visibleMembers.map((member) => (
                    <li key={member.id} className="flex items-center gap-3">
                        <UserAvatar name={member.name} imageUrl={member.avatarUrl} size="sm" tone="soft" />
                        <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-ink">{member.name}</p>
                            <p className="text-[11px] text-mist">{describeMember(member)}</p>
                        </div>
                    </li>
                ))}
            </ul>
            {members.length > MEMBER_PREVIEW_COUNT && (
                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="self-start text-[13px] font-medium text-forest-soft hover:underline"
                >
                    {expanded ? 'Thu gọn danh sách' : 'Xem tất cả thành viên'}
                </button>
            )}
        </section>
    );
};

interface SharedMediaProps {
    photos: SharedPhoto[];
    files: SharedFile[];
}

const SharedMedia = ({ photos, files }: SharedMediaProps) => (
    <section aria-label="Ảnh và tệp đã chia sẻ" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-ink">Ảnh &amp; tệp đã chia sẻ</h3>
            <i className="fa-solid fa-chevron-right text-[10px] text-slate" aria-hidden="true"></i>
        </div>
        {photos.length === 0 && files.length === 0 && (
            <p className="text-[13px] text-mist">Chưa có ảnh hoặc tệp nào được chia sẻ.</p>
        )}
        {photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                    <li key={photo.id} className="aspect-square overflow-hidden rounded-lg bg-sand">
                        <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" />
                    </li>
                ))}
            </ul>
        )}
        {files.map((file) => (
            <FileAttachment
                key={file.id}
                fileName={file.fileName}
                subtitle={`${formatSharedDay(file.sharedAt)} · ${formatFileSize(file.sizeBytes)}`}
                downloadUrl={file.url}
                bordered
            />
        ))}
    </section>
);

interface GroupInfoPanelProps {
    conversation: Conversation;
    onClose: () => void;
    onToggleMuted: (muted: boolean) => void;
    onLeave: () => void;
}

export const GroupInfoPanel = ({ conversation, onClose, onToggleMuted, onLeave }: GroupInfoPanelProps) => {
    const isGroup = conversation.type === 'group';

    return (
        <aside
            aria-label={isGroup ? 'Thông tin nhóm' : 'Thông tin hội thoại'}
            className="flex h-full w-[300px] shrink-0 flex-col overflow-y-auto max-[1100px]:hidden"
        >
            <div className="flex items-center justify-between px-5 pb-2 pt-5">
                <h2 className="text-[13px] font-semibold text-ink">
                    {isGroup ? 'Thông tin nhóm' : 'Thông tin hội thoại'}
                </h2>
                <IconButton icon="fa-solid fa-xmark" label="Đóng thông tin" onClick={onClose} className="h-7 w-7" />
            </div>

            <div className="flex flex-col items-center gap-1 px-5 pb-5 pt-3 text-center">
                <UserAvatar name={conversation.name} imageUrl={conversation.avatarUrl} size="lg" tone="soft" />
                <h3 className="mt-2 text-lg font-semibold text-ink">{conversation.name}</h3>
                <p className="text-xs text-slate">{conversation.description}</p>
            </div>

            <div className="flex items-center justify-between border-b border-line px-5 pb-4 text-[13px] text-ink">
                <span>Tắt thông báo</span>
                <Toggle checked={conversation.muted} onChange={onToggleMuted} label="Tắt thông báo" />
            </div>

            <div className="border-b border-line px-5 py-4">
                <MemberList members={conversation.members} canAddMembers={isGroup} />
            </div>

            <div className="border-b border-line px-5 py-4">
                <SharedMedia photos={conversation.sharedPhotos} files={conversation.sharedFiles} />
            </div>

            {isGroup && (
                <button
                    type="button"
                    onClick={onLeave}
                    className="mx-5 my-4 flex items-center gap-2 self-start text-[13px] font-medium text-danger hover:underline"
                >
                    <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
                    Rời nhóm
                </button>
            )}
        </aside>
    );
};