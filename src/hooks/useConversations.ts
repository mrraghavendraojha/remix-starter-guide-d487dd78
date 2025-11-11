import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export const useConversations = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const createOrGetConversation = async (listingId: string, sellerId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to start a conversation.",
        variant: "destructive"
      });
      return null;
    }

    if (user.id === sellerId) {
      toast({
        title: "Cannot message yourself",
        description: "You cannot start a conversation with your own listing.",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Check if conversation already exists
      const { data: existingConversation, error: findError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listingId)
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existingConversation) {
        return existingConversation.id;
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: sellerId
        })
        .select('id')
        .single();

      if (createError) throw createError;

      return newConversation.id;
    } catch (error: any) {
      toast({
        title: "Error creating conversation",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    createOrGetConversation
  };
};