import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Plus, 
  ClipboardList, 
  BarChart3, 
  MessageSquare, 
  CheckCircle, 
  Settings,
  LogOut,
  User,
  ChevronDown
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      window.location.href = "/login";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const userMenuItems = [
    { path: "/user", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/user/book", icon: Plus, label: "Book Venue" },
    { path: "/user/bookings", icon: ClipboardList, label: "My Bookings" },
    { path: "/user/track", icon: BarChart3, label: "Track Status" },
    { path: "/user/feedback", icon: MessageSquare, label: "Feedback" },
  ];

  const adminMenuItems = [
    ...(user?.role === 'group_director' ? [{ path: "/director", icon: CheckCircle, label: "Director Approvals" }] : []),
    ...(user?.role === 'secretary' ? [{ path: "/secretary", icon: CheckCircle, label: "Secretary Approvals" }] : []),
    ...(user?.role === 'it_team' ? [{ path: "/it", icon: Settings, label: "IT Setup" }] : []),
  ];

  const isActive = (path: string) => {
    if (path === "/user" && location === "/") return true;
    return location === path;
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'user': 'User',
      'group_director': 'Group Director',
      'secretary': 'Secretary',
      'it_team': 'IT Team'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="w-72 drdo-sidebar text-white flex-shrink-0 flex flex-col">
      {/* Header with User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 drdo-active rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">DRDO Booking</h1>
          </div>
        </div>
        
        {/* User Account Section */}
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-300 truncate">
                {getRoleDisplayName(user?.role || '')}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.department}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </div>
          
          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs text-gray-400">
                  <span className="font-medium">Email:</span> {user?.email}
                </div>
                <div className="px-3 py-2 text-xs text-gray-400">
                  <span className="font-medium">Username:</span> {user?.username}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-900/20 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4">
        <div className="px-4 pb-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Navigation
          </div>
        </div>

        <div className="space-y-1">
          {userMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={`mx-2 flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "drdo-active text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {adminMenuItems.length > 0 && (
          <div className="mt-6">
            <div className="px-4 pb-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Administration
              </div>
            </div>
            <div className="space-y-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.path} 
                    href={item.path} 
                    className={`mx-2 flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "drdo-active text-white shadow-lg"
                        : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
