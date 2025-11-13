import { useState, useCallback, useEffect } from "react";

// Define types for the app data
export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  type: "sell" | "rent" | "donate";
  category: string;
  condition: "new" | "good" | "used";
  images: string[];
  owner: {
    name: string;
    block: string;
    rating: number;
  };
  location: string;
  postedAt: Date;
}

export interface Conversation {
  id: string;
  otherUser: {
    name: string;
    avatar?: string;
    block: string;
  };
  lastMessage: {
    text: string;
    timestamp: Date;
    isRead: boolean;
  };
  listing?: {
    title: string;
    price: number;
    image?: string;
  };
  unreadCount: number;
}

export interface ChatData {
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
    block: string;
    rating: number;
  };
  listing?: {
    id: string;
    title: string;
    price: number;
    type: "sell" | "rent" | "donate";
    image?: string;
    condition: string;
  };
  messages: Array<{
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    isRead: boolean;
  }>;
}

export interface ListingData {
  id: string;
  title: string;
  description: string;
  price: number | null;
  type: "sell" | "rent" | "donate";
  category: string;
  condition: "new" | "good" | "used";
  images: string[];
  owner: {
    id: string;
    name: string;
    block: string;
    room: string;
    rating: number;
    totalRatings: number;
    memberSince: string;
    verified: boolean;
    avatar?: string;
  };
  location: string;
  postedAt: Date;
  views: number;
  specifications?: Array<{ label: string; value: string }>;
}

// Custom hook to manage app data
export const useAppData = () => {
  // Initialize state with data from localStorage
  const [listings, setListings] = useState<Listing[]>(() => {
    const saved = localStorage.getItem('listings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        return parsed.map((listing: any) => ({
          ...listing,
          postedAt: new Date(listing.postedAt)
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((conv: any) => ({
          ...conv,
          lastMessage: {
            ...conv.lastMessage,
            timestamp: new Date(conv.lastMessage.timestamp)
          }
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [chatDataMap, setChatDataMap] = useState<Map<string, ChatData>>(() => {
    const saved = localStorage.getItem('chatDataMap');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const map = new Map();
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          map.set(key, {
            ...value,
            messages: value.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          });
        });
        return map;
      } catch (e) {
        return new Map();
      }
    }
    return new Map();
  });

  const [listingDataMap, setListingDataMap] = useState<Map<string, ListingData>>(() => {
    const saved = localStorage.getItem('listingDataMap');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const map = new Map();
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          map.set(key, {
            ...value,
            postedAt: new Date(value.postedAt)
          });
        });
        return map;
      } catch (e) {
        return new Map();
      }
    }
    return new Map();
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('listings', JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    const chatDataObj = Object.fromEntries(chatDataMap);
    localStorage.setItem('chatDataMap', JSON.stringify(chatDataObj));
  }, [chatDataMap]);

  useEffect(() => {
    const listingDataObj = Object.fromEntries(listingDataMap);
    localStorage.setItem('listingDataMap', JSON.stringify(listingDataObj));
  }, [listingDataMap]);

  const addListing = useCallback((listing: Listing) => {
    setListings(prev => [listing, ...prev]);
  }, []);

  const addConversation = useCallback((conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev]);
  }, []);

  const sendMessage = useCallback((conversationId: string, message: string) => {
    const chatData = chatDataMap.get(conversationId);
    if (chatData) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        senderId: "current-user",
        text: message,
        timestamp: new Date(),
        isRead: false
      };
      
      const updatedChatData = {
        ...chatData,
        messages: [...chatData.messages, newMessage]
      };
      
      setChatDataMap(prev => new Map(prev).set(conversationId, updatedChatData));
      
      // Update conversation with new last message
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? {
              ...conv,
              lastMessage: {
                text: message,
                timestamp: new Date(),
                isRead: false
              }
            }
          : conv
      ));
    }
  }, [chatDataMap]);

  const getChatData = useCallback((conversationId: string): ChatData | undefined => {
    return chatDataMap.get(conversationId);
  }, [chatDataMap]);

  const getListingData = useCallback((listingId: string): ListingData | undefined => {
    return listingDataMap.get(listingId);
  }, [listingDataMap]);

  const addChatData = useCallback((conversationId: string, chatData: ChatData) => {
    setChatDataMap(prev => new Map(prev).set(conversationId, chatData));
  }, []);

  const addListingData = useCallback((listingId: string, listingData: ListingData) => {
    setListingDataMap(prev => new Map(prev).set(listingId, listingData));
  }, []);

  return {
    listings,
    conversations,
    addListing,
    addConversation,
    sendMessage,
    getChatData,
    getListingData,
    addChatData,
    addListingData
  };
};