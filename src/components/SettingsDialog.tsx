import { useState } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Sun, Bell, Lock, Info, LogOut, Smartphone, Mail, Globe, Download, UserX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { BlockListDialog } from "./BlockListDialog";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
}

export const SettingsDialog = ({ open, onOpenChange, onLogout }: SettingsDialogProps) => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { preferences, setLanguage: setUserLanguage, setAutoDownloadImages: setUserAutoDownload } = useUserPreferences();
  const [blockListOpen, setBlockListOpen] = useState(false);
  
  const isDarkMode = theme === "dark";

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? "light" : "dark");
    toast({
      title: `${isDarkMode ? "Light" : "Dark"} mode enabled`,
      description: `Switched to ${isDarkMode ? "light" : "dark"} theme`,
    });
  };

  const handleNotificationToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    toast({
      title: notificationsEnabled ? "Notifications disabled" : "Notifications enabled",
      description: notificationsEnabled 
        ? "You won't receive notifications" 
        : "You'll receive notifications for new messages",
    });
  };

  const handleLanguageChange = (value: string) => {
    setUserLanguage(value as 'en' | 'es' | 'fr' | 'de');
    const languageNames = { en: 'English', es: 'Spanish', fr: 'French', de: 'German' };
    toast({
      title: "Language updated",
      description: `Language changed to ${languageNames[value as keyof typeof languageNames]}`,
    });
  };

  const handleAutoDownloadToggle = () => {
    const newValue = !preferences.autoDownloadImages;
    setUserAutoDownload(newValue);
    toast({
      title: newValue ? "Auto-download enabled" : "Auto-download disabled",
      description: newValue 
        ? "Images will download automatically" 
        : "Images will not download automatically",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Appearance Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Appearance
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isDarkMode ? (
                      <Moon className="h-5 w-5 text-primary" />
                    ) : (
                      <Sun className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <Label htmlFor="dark-mode" className="text-base font-medium cursor-pointer">
                        Dark Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isDarkMode ? "Dark theme enabled" : "Light theme enabled"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={isDarkMode}
                    onCheckedChange={handleThemeToggle}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Account Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Account
            </h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium">{user?.email || "Not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Language Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Language
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="language" className="text-base font-medium cursor-pointer">
                        App Language
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred language
                      </p>
                    </div>
                  </div>
                  <Select value={preferences.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Data Usage Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Data Usage
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="auto-download" className="text-base font-medium cursor-pointer">
                        Auto-download Images
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically download images when viewing
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="auto-download"
                    checked={preferences.autoDownloadImages}
                    onCheckedChange={handleAutoDownloadToggle}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Notifications Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Notifications
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="notifications" className="text-base font-medium cursor-pointer">
                        Message Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about new messages
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationToggle}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Block List Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Block List
            </h3>
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setBlockListOpen(true)}
                >
                  <UserX className="h-4 w-4 mr-3" />
                  Manage Blocked Users
                </Button>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Privacy & Security Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Privacy & Security
            </h3>
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Lock className="h-4 w-4 mr-3" />
                  Privacy Policy
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Lock className="h-4 w-4 mr-3" />
                  Terms of Service
                </Button>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* About Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              About
            </h3>
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center space-x-3">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Version</Label>
                    <p className="text-sm font-medium">1.0.0</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Platform</Label>
                    <p className="text-sm font-medium">CommunityShare Market</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Logout Button */}
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={() => {
              onLogout();
              onOpenChange(false);
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </DialogContent>
      
      <BlockListDialog open={blockListOpen} onOpenChange={setBlockListOpen} />
    </Dialog>
  );
};
