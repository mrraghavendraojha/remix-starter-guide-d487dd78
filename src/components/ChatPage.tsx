import { useState, useRef, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Phone, MoreVertical, Calendar, MapPin } from "lucide-react";
import { format, isToday, isYesterday, isSameDay, parseISO } from "date-fns";
import { Keyboard } from '@capacitor/keyboard';

interface ChatPageProps {
  conversationId: string;
  onBack: () => void;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name: string;
}

interface ConversationDetails {
  id: string;
  listing_title: string;
  other_user_name: string;
  other_user_id: string;
  other_user_block: string;
  other_user_rating: number;
  other_user_phone: string | null;
}

export const ChatPage = ({ conversationId, onBack }: ChatPageProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversationDetails = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          buyer_id,
          seller_id,
          listings (title),
          buyer_profile:profiles!conversations_buyer_id_fkey (name, block, rating, phone),
          seller_profile:profiles!conversations_seller_id_fkey (name, block, rating, phone)
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      const otherUser = data.buyer_id === user.id 
        ? (data as any).seller_profile 
        : (data as any).buyer_profile;

      setConversationDetails({
        id: data.id,
        listing_title: (data as any).listings?.title || 'Unknown Listing',
        other_user_name: otherUser?.name || 'Unknown',
        other_user_id: data.buyer_id === user.id ? data.seller_id : data.buyer_id,
        other_user_block: otherUser?.block || 'Unknown',
        other_user_rating: otherUser?.rating || 0,
        other_user_phone: otherUser?.phone || null
      });
    } catch (error: any) {
      toast({
        title: "Error loading conversation",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          profiles (name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = data?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        sender_name: (msg as any).profiles?.name || 'Unknown'
      })) || [];

      setMessages(formattedMessages);
    } catch (error: any) {
      toast({
        title: "Error fetching messages",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePhoneCall = () => {
    if (!conversationDetails?.other_user_phone) {
      toast({
        title: "Phone number not available",
        description: "This user hasn't provided a phone number.",
        variant: "destructive"
      });
      return;
    }
    
    // Open phone dialer
    window.location.href = `tel:${conversationDetails.other_user_phone}`;
  };

  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDateSeparator = (dateString: string) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return "Today";
    }
    
    if (isYesterday(date)) {
      return "Yesterday";
    }
    
    return format(date, "MMMM d, yyyy");
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage: Message | null) => {
    if (!previousMessage) return true;
    
    const currentDate = parseISO(currentMessage.created_at);
    const previousDate = parseISO(previousMessage.created_at);
    
    return !isSameDay(currentDate, previousDate);
  };

  // Mark messages as read when viewing conversation
  const markMessagesAsRead = async () => {
    if (!conversationId || !user) return;
    
    const unreadMessages = messages.filter(
      msg => msg.sender_id !== user.id
    );
    
    if (unreadMessages.length > 0) {
      // Note: This will work once read_at column is added via migration
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() } as any)
        .in('id', unreadMessages.map(m => m.id));
    }
  };

  // Fetch conversation details and messages on mount
  useEffect(() => {
    if (conversationId && user) {
      fetchConversationDetails();
      fetchMessages();
      markMessagesAsRead();
    }
  }, [conversationId, user]);

  // Handle keyboard show/hide on mobile
  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardWillShow', info => {
      setKeyboardHeight(info.keyboardHeight);
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showListener.then(l => l.remove());
      hideListener.then(l => l.remove());
    };
  }, []);

  // Real-time message subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Fetch sender name
          const { data: senderData } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', newMessage.sender_id)
            .single();

          const messageWithSender: Message = {
            id: newMessage.id,
            content: newMessage.content,
            sender_id: newMessage.sender_id,
            created_at: newMessage.created_at,
            sender_name: senderData?.name || 'Unknown'
          };

          setMessages(prev => [...prev, messageWithSender]);
          // Notification is handled by global useMessageNotifications hook
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  if (loading || !conversationDetails) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-background border-b border-border p-2 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            
            <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-border">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {conversationDetails.other_user_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="font-semibold text-foreground text-sm md:text-base">{conversationDetails.other_user_name}</h2>
              <div className="flex items-center space-x-0.5 md:space-x-1 text-[10px] md:text-xs text-muted-foreground">
                <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3" />
                <span>{conversationDetails.other_user_block}</span>
                {conversationDetails.other_user_rating > 0 && (
                  <>
                    <span>•</span>
                    <span>⭐ {conversationDetails.other_user_rating}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-2">
            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-10 md:w-10" onClick={handlePhoneCall}>
              <Phone className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-10 md:w-10">
              <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>

        {/* Listing Context */}
        <Card className="mt-2 md:mt-3 p-2 md:p-3 bg-card-gradient">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="flex-1">
              <h3 className="font-medium text-card-foreground text-xs md:text-sm">
                {conversationDetails.listing_title}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="space-y-2 md:space-y-4">
          {messages.map((message, index) => {
            const isCurrentUser = message.sender_id === user?.id;
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
            
            return (
              <div key={message.id}>
                {/* Date Separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-3 md:my-6">
                    <div className="bg-muted px-2 md:px-4 py-1 md:py-1.5 rounded-full">
                      <span className="text-[10px] md:text-xs font-medium text-muted-foreground">
                        {formatDateSeparator(message.created_at)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] md:max-w-[75%] ${isCurrentUser ? "order-2" : "order-1"}`}>
                    <div
                      className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-2xl ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-accent text-accent-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap select-text">
                        {message.content}
                      </p>
                    </div>
                    <div className={`mt-0.5 md:mt-1 flex items-center space-x-1 ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}>
                      <span className="text-[10px] md:text-xs text-muted-foreground">
                        {formatTimestamp(message.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div 
        className="flex-shrink-0 bg-background border-t border-border p-2 md:p-4 transition-all duration-200" 
        style={{ 
          paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 8}px` : 'max(0.5rem, env(safe-area-inset-bottom))',
          marginBottom: keyboardHeight > 0 ? '0' : 'env(safe-area-inset-bottom)'
        }}
      >
        <div className="flex items-end space-x-1.5 md:space-x-2">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[32px] md:min-h-[40px] w-full text-sm"
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="shrink-0 h-[32px] w-[32px] md:h-[40px] md:w-[40px]"
          >
            <Send className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};