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
import { Building2, Briefcase, Moon, Sun, LogOut } from "lucide-react";

const UserProfileMenu = () => {
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
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-fg text-bg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-fg focus:ring-offset-2">
                    <span className="text-sm font-bold">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none dark:text-white">{profile?.full_name || 'User'}</p>
                        <p className="text-xs leading-none text-fg-secondary dark:text-gray-400">
                            {profile?.id ? `ID: ${profile.id.slice(0, 8)}...` : 'Loading...'}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="px-2 py-1.5 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-fg-secondary dark:text-gray-400" />
                        <span className="text-fg-secondary dark:text-gray-400">Company:</span>
                        <span className="font-medium dark:text-white">{company?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-fg-secondary dark:text-gray-400" />
                        <span className="text-fg-secondary dark:text-gray-400">Role:</span>
                        <span className="font-medium capitalize dark:text-white">{profile?.role_name || 'N/A'}</span>
                    </div>
                </div>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                    {theme === 'dark' ? (
                        <>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Light Mode</span>
                        </>
                    ) : (
                        <>
                            <Moon className="mr-2 h-4 w-4" />
                            <span>Dark Mode</span>
                        </>
                    )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserProfileMenu;
