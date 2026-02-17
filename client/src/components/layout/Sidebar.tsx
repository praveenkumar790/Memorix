import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, UploadCloud, MessageSquare, BookOpen, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    
    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Upload", href: "/upload", icon: UploadCloud },
        { name: "Chat", href: "/chat", icon: MessageSquare },
        { name: "Decisions", href: "/decisions", icon: BookOpen },
    ];

    const handleLogout = async () => {
        try {
            await signOut();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex h-screen w-72 flex-col justify-between border-r border-border/50 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl px-6 py-8 z-30"
        >
            <div>
                <div className="mb-10 px-2 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                        M
                    </div>
                    <span className="text-xl font-display font-bold tracking-tight text-fg dark:text-white">
                        Memorix
                    </span>
                </div>
                
                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "group relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                                    isActive 
                                        ? "text-blue-600 dark:text-blue-400" 
                                        : "text-fg-secondary dark:text-gray-400 hover:text-fg dark:hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 shadow-sm"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <Icon className={cn("relative z-10 h-5 w-5 transition-colors", isActive ? "text-blue-600 dark:text-blue-400" : "group-hover:text-fg dark:group-hover:text-white")} />
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div>
                <div className="mb-6 mx-2 p-4 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-100 dark:border-white/5">
                    <h4 className="text-xs font-semibold text-fg-secondary dark:text-gray-400 uppercase tracking-wider mb-2">My Workspace</h4>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-fg dark:text-white">Online</span>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-fg-secondary hover:bg-red-50 hover:text-red-600 transition-all dark:text-gray-400 dark:hover:bg-red-900/10 dark:hover:text-red-400"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </motion.div>
    );
};

export default Sidebar;
