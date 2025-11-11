import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Plus, MessageCircle, User, Heart, Settings as SettingsIcon } from "lucide-react";
import { haptics } from "@/lib/haptics";

interface NavigationProps {
  currentPage?: string;
  onPageChange?: (page: string) => void;
  onOpenSettings?: () => void;
}

export const Navigation = ({ currentPage = "home", onPageChange, onOpenSettings }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "create", label: "List Item", icon: Plus },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "profile", label: "Profile", icon: User },
  ];

  const handlePageChange = (page: string) => {
    haptics.light();
    onPageChange?.(page);
  };

  const handleSettingsClick = () => {
    haptics.medium();
    onOpenSettings?.();
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between px-4 py-2.5 bg-card/80 backdrop-blur-md shadow-card border-b sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-community-gradient rounded-lg flex items-center justify-center shadow-soft">
            <Home className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-community-gradient bg-clip-text text-transparent leading-tight">
              CommunityShare
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">Share within your community</p>
          </div>
        </div>
        
        <nav className="flex items-center space-x-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              onClick={() => handlePageChange(item.id)}
              className={`flex items-center space-x-2 transition-smooth relative ${
                currentPage === item.id ? "shadow-card" : ""
              }`}
              size="default"
            >
              {currentPage === item.id && (
                <span className="absolute inset-0 bg-primary/10 rounded-lg animate-pulse-glow"></span>
              )}
              <item.icon className="h-4 w-4 relative z-10" />
              <span className="font-medium relative z-10">{item.label}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettingsClick}
            className="rounded-full"
            aria-label="Settings"
          >
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </nav>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-2 py-1.5 bg-card/80 backdrop-blur-md shadow-card border-b sticky top-0 z-40">
        <div className="flex items-center space-x-1.5">
          <div className="w-6 h-6 bg-community-gradient rounded-lg flex items-center justify-center shadow-soft">
            <Home className="h-3 w-3 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-bold bg-community-gradient bg-clip-text text-transparent leading-tight">
              Market
            </h1>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSettingsClick}
          className="rounded-full"
          aria-label="Settings"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t shadow-glow z-50">
        <div className="flex items-center justify-around px-0.5 py-0.5">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(item.id)}
              className={`flex flex-col items-center space-y-0 h-10 px-1 transition-spring rounded-lg relative ${
                currentPage === item.id 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={item.label}
            >
              {currentPage === item.id && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-b-full"></span>
              )}
              <item.icon className={`h-4 w-4 ${currentPage === item.id ? "scale-110" : ""} transition-spring`} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>
    </>
  );
};