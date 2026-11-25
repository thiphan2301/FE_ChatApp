import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatWindow } from '../components/chat/ChatWindow';
import { ConversationList } from '../components/chat/ConversationList';
import { GroupInfoPanel } from '../components/chat/GroupInfoPanel';
import { MemberCard } from '../components/chat/MemberCard';
import { StatusPanel } from '../components/common/Controls';
import { useChat } from '../hooks/useChat';
import type { ConversationMember } from '../types';

export default function GroupChat() {
    const { summaries, conversation, activeId, loadingOlder, notice, offline, actions } = useChat();
    const navigate = useNavigate();
    const [infoPanelOpen, setInfoPanelOpen] = useState(true);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const selectedMember = conversation.data?.members.find((member) => member.id === selectedMemberId);
    const selectMember = (member: ConversationMember) => setSelectedMemberId(member.id);

    const messageMember = (member: ConversationMember) => {
        setSelectedMemberId(null);
        navigate('/chat', { state: { chatWith: member.id } });
    };

    const confirmLeave = (roomId: string) => {
        if (window.confirm(`Bạn muốn rời phòng "${roomId}"?`)) void actions.leaveRoom(roomId);
    };

    if (summaries.status !== 'ready') {
        return <StatusPanel variant={summaries.status === 'error' ? 'error' : 'loading'} onRetry={summaries.retry} />;
    }

    return (
        <div className="ui-isolated flex h-full min-w-0 flex-1 flex-col">
            {offline && (
                <p
                    role="status"
                    className="shrink-0 bg-danger-soft px-6 py-2 text-center text-xs font-medium text-danger"
                >
                    <i className="fa-solid fa-circle-notch fa-spin mr-2" aria-hidden="true"></i>
                    Mất kết nối tới máy chủ. Đang thử kết nối lại...
                </p>
            )}
            <div className="flex min-h-0 flex-1">
                <ConversationList
                    conversations={summaries.items}
                    activeId={activeId}
                    onSelect={actions.selectConversation}
                    onMarkUnread={actions.markUnread}
                    onToggleArchive={actions.toggleArchive}
                    onLeave={confirmLeave}
                    onCreateRoom={actions.createNewRoom}
                    onJoinRoom={actions.joinExistingRoom}
                />
                <ChatWindow
                    status={conversation.status}
                    conversation={conversation.data}
                    infoPanelOpen={infoPanelOpen}
                    loadingOlder={loadingOlder}
                    notice={notice}
                    onToggleInfoPanel={() => setInfoPanelOpen((open) => !open)}
                    onSend={actions.send}
                    onLoadOlder={actions.loadOlder}
                    onDismissNotice={actions.dismissNotice}
                    onSelectMember={selectMember}
                    offline={offline}
                    onRetry={conversation.retry}
                />
                {infoPanelOpen && conversation.data && (
                    <GroupInfoPanel
                        conversation={conversation.data}
                        onClose={() => setInfoPanelOpen(false)}
                        onToggleMuted={actions.toggleMuted}
                        onLeave={() => activeId && confirmLeave(activeId)}
                        onSelectMember={selectMember}
                    />
                )}
            </div>
            {selectedMember && conversation.data && (
                <MemberCard
                    member={selectedMember}
                    roomName={conversation.data.name}
                    isSelf={selectedMember.id === conversation.data.currentUserId}
                    onClose={() => setSelectedMemberId(null)}
                    onMessage={() => messageMember(selectedMember)}
                />
            )}
        </div>
    );
};