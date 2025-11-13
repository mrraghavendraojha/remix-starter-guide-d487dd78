import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface UseMessageNotificationsProps {
  currentConversationId?: string | null;
}

export const useMessageNotifications = ({ currentConversationId }: UseMessageNotificationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Don't show notification if:
          // 1. Message is from current user
          // 2. User is viewing this conversation
          if (newMessage.sender_id === user.id || newMessage.conversation_id === currentConversationId) {
            return;
          }

          // Fetch conversation and sender details
          const { data: conversationData } = await supabase
            .from('conversations')
            .select(`
              buyer_id,
              seller_id,
              listings (title)
            `)
            .eq('id', newMessage.conversation_id)
            .single();

          // Only show notification if user is part of this conversation
          if (!conversationData || 
              (conversationData.buyer_id !== user.id && conversationData.seller_id !== user.id)) {
            return;
          }

          // Fetch sender name
          const { data: senderData } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', newMessage.sender_id)
            .single();

          toast({
            title: `New message from ${senderData?.name || 'Unknown'}`,
            description: newMessage.content.length > 50 
              ? newMessage.content.substring(0, 50) + '...' 
              : newMessage.content,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentConversationId, toast]);
};
