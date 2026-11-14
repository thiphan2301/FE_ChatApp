import { useState } from 'react';
import { ChatWindow } from '../components/chat/ChatWindow';
import { ConversationList } from '../components/chat/ConversationList';
import { GroupInfoPanel } from '../components/chat/GroupInfoPanel';
import { StatusPanel } from '../components/common/Controls';
import { useChat } from '../hooks/useChat';

export default function GroupChat() {
    const { summaries, conversation, activeId, loadingOlder, notice, actions } = useChat();
    const [infoPanelOpen, setInfoPanelOpen] = useState(true);

    const confirmLeave = (roomId: string) => {
        if (window.confirm(`Bạn muốn rời phòng "${roomId}"?`)) void actions.leaveRoom(roomId);
    };

    if (summaries.status !== 'ready') {
        return <StatusPanel variant={summaries.status === 'error' ? 'error' : 'loading'} onRetry={summaries.retry} />;
    }

    return (
        <div className="ui-isolated flex h-full min-w-0 flex-1">
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
                onRetry={conversation.retry}
            />
            {infoPanelOpen && conversation.data && (
                <GroupInfoPanel
                    conversation={conversation.data}
                    onClose={() => setInfoPanelOpen(false)}
                    onToggleMuted={actions.toggleMuted}
                    onLeave={() => activeId && confirmLeave(activeId)}
                />
            )}
        </div>
    );
};