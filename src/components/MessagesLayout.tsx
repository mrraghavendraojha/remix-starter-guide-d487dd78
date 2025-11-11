import { useState } from "react";
import { MessagesPage } from "./MessagesPage";
import { ChatPage } from "./ChatPage";
import { useIsMobile } from "@/hooks/use-mobile";

interface MessagesLayoutProps {
  onBack: () => void;
}

export const MessagesLayout = ({ onBack }: MessagesLayoutProps) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleOpenChat = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleBackFromChat = () => {
    if (isMobile) {
      // On mobile, go back to conversation list
      setSelectedConversationId(null);
    } else {
      // On desktop/tablet, close chat and stay in messages
      setSelectedConversationId(null);
    }
  };

  const handleBackFromMessages = () => {
    // Go back to previous page (home)
    onBack();
  };

  // Mobile: Show one at a time (current behavior)
  if (isMobile) {
    if (selectedConversationId) {
      return (
        <ChatPage 
          conversationId={selectedConversationId}
          onBack={handleBackFromChat}
        />
      );
    }
    return (
      <MessagesPage 
        onBack={handleBackFromMessages}
        onOpenChat={handleOpenChat}
      />
    );
  }

  // Desktop/Tablet: Split screen layout like WhatsApp
  return (
    <div className="flex h-screen bg-background">
      {/* Left side: Conversation list */}
      <div className={`${selectedConversationId ? 'w-[380px]' : 'w-full'} border-r border-border flex-shrink-0 transition-all duration-300`}>
        <MessagesPage 
          onBack={handleBackFromMessages}
          onOpenChat={handleOpenChat}
        />
      </div>

      {/* Right side: Chat area */}
      {selectedConversationId ? (
        <div className="flex-1 min-w-0">
          <ChatPage 
            conversationId={selectedConversationId}
            onBack={handleBackFromChat}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/20">
          <div className="text-center space-y-4 p-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-primary" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Select a conversation
              </h3>
              <p className="text-muted-foreground">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};