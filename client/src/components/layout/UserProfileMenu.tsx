import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Building2, Briefcase, Moon, Sun, LogOut, ChevronUp } from "lucide-react";

interface UserProfileMenuProps {
    isCollapsed?: boolean;
}

const UserProfileMenu = ({ isCollapsed = false }: UserProfileMenuProps) => {
    const { profile, company, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {isCollapsed ? (
                    <button 
                        className="group/profile relative flex h-8 w-8 mx-auto items-center justify-center rounded-full bg-fg text-bg dark:bg-white dark:text-black hover:opacity-90 transition-opacity focus:outline-none cursor-pointer animate-in fade-in duration-300"
                    >
                        <span className="text-[11px] font-bold">
                            {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                        </span>
                        
                        <div className="absolute left-11 z-50 scale-95 opacity-0 pointer-events-none group-hover/profile:scale-100 group-hover/profile:opacity-100 transition-all duration-150 ease-out origin-left bg-black dark:bg-white text-white dark:text-black text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10 dark:border-black/5">
                            {profile?.full_name || 'User Profile'}
                            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 rotate-45 w-1.5 h-1.5 bg-black dark:bg-white border-l border-b border-white/10 dark:border-black/5" />
                        </div>
                    </button>
                ) : (
                    <button className="flex w-full items-center justify-between gap-2 rounded-xl p-1.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all duration-200 focus:outline-none border border-transparent hover:border-black/[0.03] dark:hover:border-white/5 bg-transparent select-none cursor-pointer">
                        <div className="flex items-center gap-2.5">
                            {/* Circle with initials */}
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fg text-bg dark:bg-white dark:text-black">
                                <span className="text-[11px] font-bold">
                                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                                </span>
                            </div>
                            {/* User Name */}
                            <div className="text-left">
                                <p className="text-xs font-semibold truncate max-w-[120px] dark:text-white leading-tight">
                                    {profile?.full_name || 'User'}
                                </p>
                            </div>
                        </div>
                        <ChevronUp className="h-3.5 w-3.5 text-fg-secondary/50 shrink-0" />
                    </button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCollapsed ? "center" : "start"} side="top" sideOffset={12} className="w-60 ml-2">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none dark:text-white">{profile?.full_name || 'User'}</p>
                        <p className="text-xs leading-none text-fg-secondary dark:text-gray-400 mt-1">
                            {profile?.id ? `ID: ${profile.id.slice(0, 8)}...` : 'Loading...'}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="px-2 py-1.5 text-xs space-y-2">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-fg-secondary dark:text-gray-400" />
                        <span className="text-fg-secondary dark:text-gray-400">Company:</span>
                        <span className="font-medium dark:text-white truncate max-w-[100px]">{company?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-fg-secondary dark:text-gray-400" />
                        <span className="text-fg-secondary dark:text-gray-400">Account:</span>
                        <span className="font-medium capitalize dark:text-white">{profile?.role || 'N/A'}</span>
                    </div>
                </div>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer text-xs">
                    {theme === 'dark' ? (
                        <>
                            <Sun className="mr-2 h-3.5 w-3.5" />
                            <span>Light Mode</span>
                        </>
                    ) : (
                        <>
                            <Moon className="mr-2 h-3.5 w-3.5" />
                            <span>Dark Mode</span>
                        </>
                    )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs text-red-600 dark:text-red-400">
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserProfileMenu;
