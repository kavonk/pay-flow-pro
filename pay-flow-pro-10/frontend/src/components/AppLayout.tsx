import React from "react";
import { UserButton, useUser } from "@stackframe/react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSubscription } from "utils/useSubscription";
import { useUserRole, hasPermission } from "utils/queryHooks";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  Crown,
  Lock,
  UserCheck,
  Palette,
} from "lucide-react";

interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  requiresAdmin?: boolean;
  requiresPremium?: boolean;
  premiumBadge?: boolean;
}

const navigationItems: NavigationItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: FileText, label: "Invoices", href: "/invoices" },
  { icon: FileText, label: "Dunning Rules", href: "/dunning-rules", premiumBadge: true },
  { icon: Palette, label: "Branding", href: "/branding-settings" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const user = useUser();
  
  // Hooks should only run if the user is authenticated.
  // The `user` object is not null when the user is logged in.
  const { subscription, isTrialUser, trialDaysRemaining, canUseCustomBranding } = useSubscription(!!user);
  const { data: userRole } = useUserRole(!!user);
  
  const userName = user?.displayName || user?.primaryEmail || "User";
  const isAdmin = userRole?.role === 'admin';
  const canManageUsers = userRole?.can_manage_users ?? false;
  const canManageBilling = userRole?.can_manage_billing ?? false;

  // Render a loading state or null if the user is not yet loaded
  // This prevents rendering the layout for a split second before the redirect happens.
  if (!user) {
    // This part is important. Returning null or a loading spinner
    // prevents the layout from rendering for unauthenticated users,
    // which is what we want for protected routes.
    return null;
  }
  
  // Filter navigation items based on user role and subscription
  const visibleNavigationItems = navigationItems.filter(item => {
    // Check admin requirements
    if (item.requiresAdmin && !isAdmin) {
      return false;
    }
    
    // Check premium requirements  
    if (item.requiresPremium && isTrialUser && !subscription?.plan?.slug?.includes('premium')) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 min-h-screen border-r border-border/40 bg-card/50 backdrop-blur-sm p-6 flex flex-col">
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-wider">PayFlow Pro</h1>
        </div>
        <nav className="flex-grow">
          <div className="space-y-2">
            {visibleNavigationItems.map((item) => {
              const needsUpgrade = item.premiumBadge && isTrialUser;
              const hasAccess = !item.requiresAdmin || isAdmin;
              
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group hover:bg-accent/50 ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground"
                    } ${
                      !hasAccess ? "opacity-60 cursor-not-allowed" : ""
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  
                  {/* Premium feature badge */}
                  {needsUpgrade && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                  
                  {/* Admin-only badge */}
                  {item.requiresAdmin && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  
                  {/* Trial expiry warning for settings */}
                  {item.href === "/settings" && isTrialUser && trialDaysRemaining <= 7 && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {trialDaysRemaining}d
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
        <div className="mt-auto space-y-3">
            {/* Trial Status */}
            {isTrialUser && (
              <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-700">Free Trial</span>
                  <Badge variant={trialDaysRemaining <= 3 ? "destructive" : "secondary"} className="text-xs">
                    {trialDaysRemaining} days left
                  </Badge>
                </div>
                <p className="text-xs text-amber-600 mb-2">
                  {trialDaysRemaining <= 3 ? 'Trial ending soon!' : 'Enjoying PayFlow Pro?'}
                </p>
                <NavLink to="/subscription" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
                  View Plans →
                </NavLink>
              </div>
            )}
            
            {/* Role indicator */}
            {userRole && (
              <div className="p-2 bg-background/50 rounded-lg border border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Role</span>
                  <Badge variant={isAdmin ? "default" : "outline"} className="text-xs">
                    {isAdmin ? (
                      <>
                        <UserCheck className="w-3 h-3 mr-1" />
                        Admin
                      </>
                    ) : (
                      <>
                        <Users className="w-3 h-3 mr-1" />
                        Member
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            )}
            
            {/* User Profile */}
            <div className="flex items-center p-2 rounded-lg bg-background/50">
                <UserButton />
                <span className="ml-3 font-medium truncate">{userName}</span>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8 overflow-y-auto">
            {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
