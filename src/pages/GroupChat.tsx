import { useState } from 'react';
import { ChatWindow } from '../components/chat/ChatWindow';
import { ConversationList } from '../components/chat/ConversationList';
import { GroupInfoPanel } from '../components/chat/GroupInfoPanel.tsx';
import { StatusPanel } from '../components/common/Controls';
import { useChat } from '../hooks/useChat';

export default function GroupChat() {
    const { summaries, conversation, activeId, actions } = useChat();
    const [infoPanelOpen, setInfoPanelOpen] = useState(true);

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
                onArchive={actions.archive}
                onBlock={actions.block}
                onReport={actions.report}
            />
            <ChatWindow
                status={conversation.status}
                conversation={conversation.data}
                infoPanelOpen={infoPanelOpen}
                onToggleInfoPanel={() => setInfoPanelOpen((open) => !open)}
                onSend={actions.send}
                onRetry={conversation.retry}
            />
            {infoPanelOpen && conversation.data && (
                <GroupInfoPanel
                    conversation={conversation.data}
                    onClose={() => setInfoPanelOpen(false)}
                    onToggleMuted={actions.toggleMuted}
                    onLeave={actions.leave}
                />
            )}
        </div>
    );
}