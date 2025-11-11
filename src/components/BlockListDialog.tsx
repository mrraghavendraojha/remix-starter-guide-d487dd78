import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, UserX } from "lucide-react";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";

interface BlockListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BlockListDialog = ({ open, onOpenChange }: BlockListDialogProps) => {
  const { blockedUsers, loading, unblockUser } = useBlockedUsers();
  const { toast } = useToast();

  const handleUnblock = async (userId: string, userName: string) => {
    const { error } = await unblockUser(userId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    } else {
      toast({
        title: "User unblocked",
        description: `${userName} has been unblocked`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh]">
        <DialogHeader>
          <DialogTitle>Blocked Users</DialogTitle>
          <DialogDescription>
            Manage users you have blocked
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <EmptyState
              icon={UserX}
              title="No blocked users"
              description="You haven't blocked anyone yet"
            />
          ) : (
            blockedUsers.map((blocked) => (
              <Card key={blocked.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={blocked.blocked_user_avatar || undefined} />
                        <AvatarFallback>
                          {blocked.blocked_user_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{blocked.blocked_user_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Blocked on {new Date(blocked.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(blocked.blocked_user_id, blocked.blocked_user_name || 'User')}
                    >
                      Unblock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
