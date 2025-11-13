import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Search, MessageCircle, Clock } from "lucide-react";

interface MessagesPageProps {
  onBack: () => void;
  onOpenChat?: (conversationId: string) => void;
}

interface ConversationPreview {
  id: string;
  listing_title: string;
  other_user_name: string;
  other_user_id: string;
  other_user_block: string;
  last_message?: string;
  updated_at: string;
  unread_count: number;
}

export const MessagesPage = ({ onBack, onOpenChat }: MessagesPageProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.listing_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          buyer_id,
          seller_id,
          updated_at,
          listing_id,
          listings!conversations_listing_id_fkey (title),
          buyer_profile:profiles!conversations_buyer_id_fkey (name, block),
          seller_profile:profiles!conversations_seller_id_fkey (name, block)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

          const conversationsWithMessages = await Promise.all(
            (data || []).map(async (conv) => {
              const { data: lastMessage } = await supabase
                .from('messages')
                .select('content, created_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

          // Count unread messages (messages from other user that haven't been read)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

              const otherUser = conv.buyer_id === user.id 
                ? (conv as any).seller_profile 
                : (conv as any).buyer_profile;

              return {
                id: conv.id,
                listing_title: (conv as any).listings?.title || 'Unknown Listing',
                other_user_name: otherUser?.name || 'Unknown',
                other_user_id: conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id,
                other_user_block: otherUser?.block || 'Unknown',
                last_message: lastMessage?.content || 'No messages yet',
                updated_at: conv.updated_at,
                unread_count: unreadCount || 0
              };
            })
          );

      setConversations(conversationsWithMessages);
    } catch (error: any) {
      toast({
        title: "Error fetching conversations",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-2 md:p-4">
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <h1 className="text-lg md:text-2xl font-bold text-foreground">Messages</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 md:pl-10 h-8 md:h-10 text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-3">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">No conversations yet</h3>
            <p className="text-muted-foreground text-sm">
              Start browsing listings to connect with other members
            </p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">No conversations found</h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search query
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <Card 
              key={conversation.id}
              className="cursor-pointer hover:shadow-card transition-smooth bg-card-gradient"
              onClick={() => onOpenChat?.(conversation.id)}
            >
              <CardContent className="p-2 md:p-4">
                <div className="flex items-start space-x-2 md:space-x-3">
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-border">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {conversation.other_user_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5 md:mb-1">
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <h3 className="font-semibold text-card-foreground truncate text-sm md:text-base">
                          {conversation.other_user_name}
                        </h3>
                        <Badge variant="outline" className="text-[10px] md:text-xs">
                          {conversation.other_user_block}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <span className="text-[10px] md:text-xs text-muted-foreground flex items-center space-x-0.5 md:space-x-1">
                          <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          <span>{formatTimestamp(conversation.updated_at)}</span>
                        </span>
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-primary text-primary-foreground min-w-[16px] md:min-w-[20px] h-4 md:h-5 text-[10px] md:text-xs flex items-center justify-center rounded-full">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Last Message */}
                    <p className="text-xs md:text-sm truncate text-muted-foreground">
                      {conversation.last_message}
                    </p>

                    {/* Listing Context */}
                    <div className="flex items-center space-x-1 md:space-x-2 mt-1 md:mt-2 p-1.5 md:p-2 bg-accent/20 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] md:text-xs font-medium text-card-foreground truncate">
                          {conversation.listing_title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};