import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, UploadCloud, MessageSquare, BookOpen, Link2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import UserProfileMenu from "./UserProfileMenu";

const Sidebar = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        return saved === "true";
    });

    // Automatically collapse sidebar on Chat page mount
    useEffect(() => {
        if (location.pathname === "/chat") {
            setIsCollapsed(true);
            localStorage.setItem("sidebar-collapsed", "true");
        }
    }, [location.pathname]);

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            localStorage.setItem("sidebar-collapsed", String(next));
            return next;
        });
    };
    
    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Upload", href: "/upload", icon: UploadCloud },
        { name: "Chat", href: "/chat", icon: MessageSquare },
        { name: "Decisions", href: "/decisions", icon: BookOpen },
        { name: "Integrations", href: "/integrations", icon: Link2 },
    ];

    return (
        <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={cn(
                "group flex h-screen flex-col justify-between border-r border-border/50 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl py-8 z-30 transition-all duration-300 ease-in-out shrink-0",
                isCollapsed ? "w-16 px-2" : "w-64 px-4"
            )}
        >
            <div>
                {/* Logo and Collapse Toggle */}
                <div className={cn(
                    "mb-10 flex items-center select-none relative",
                    isCollapsed ? "justify-center" : "px-2 gap-3"
                )}>
                    <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                        {/* Premium 3D Isometric Memory Cube Logo Icon */}
                        <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 group-hover:pointer-events-none">
                            <svg className="w-8 h-8 filter drop-shadow-[0_2px_8px_rgba(168,85,247,0.45)]" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="sideCubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#c084fc" />
                                        <stop offset="50%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="#7e22ce" />
                                    </linearGradient>
                                    <linearGradient id="sideCubeFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#f472b6" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                                <path d="M6 10L16 16V28L6 22V10Z" fill="url(#sideCubeGrad)" opacity="0.9" />
                                <path d="M26 10L16 16V28L26 22V10Z" fill="#6b21a8" opacity="0.85" />
                                <path d="M16 4L26 10L16 16L6 10L16 4Z" fill="url(#sideCubeFaceGrad)" />
                                <path d="M16 10L21 13L16 16L11 13L16 10Z" fill="#ffffff" opacity="0.45" />
                            </svg>
                        </div>
                        
                        {/* Collapse Toggle Button - appears on sidebar hover in place of the logo */}
                        <button 
                            onClick={toggleCollapse} 
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-fg-secondary hover:text-fg border border-black/[0.05] dark:border-white/5 opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 cursor-pointer focus:outline-none"
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronLeft className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    
                    {!isCollapsed && (
                        <span className="text-lg font-display font-bold tracking-tight text-fg dark:text-white animate-in fade-in duration-300">
                            Memorix
                        </span>
                    )}
                </div>
                
                {/* Navigation Items */}
                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "group/item relative flex items-center transition-all duration-300 rounded-xl py-2.5 text-[13px] font-medium",
                                    isActive 
                                        ? "text-blue-600 dark:text-blue-400" 
                                        : "text-fg-secondary dark:text-gray-400 hover:text-fg dark:hover:text-white",
                                    isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "gap-3 px-3"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-200/40 dark:border-blue-500/30 shadow-sm"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <Icon className={cn("relative z-10 h-[18px] w-[18px] transition-colors shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "group-hover/item:text-fg dark:group-hover/item:text-white")} />
                                
                                {isCollapsed ? (
                                    <div className="absolute left-14 z-50 scale-95 opacity-0 pointer-events-none group-hover/item:scale-100 group-hover/item:opacity-100 transition-all duration-150 ease-out origin-left bg-black dark:bg-white text-white dark:text-black text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10 dark:border-black/5">
                                        {item.name}
                                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 rotate-45 w-1.5 h-1.5 bg-black dark:bg-white border-l border-b border-white/10 dark:border-black/5" />
                                    </div>
                                ) : (
                                    <span className="relative z-10 animate-in fade-in duration-300">{item.name}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Profile Menu Section */}
            <div className="border-t border-black/[0.06] dark:border-white/5 pt-4">
                <UserProfileMenu isCollapsed={isCollapsed} />
            </div>
        </motion.div>
    );
};

export default Sidebar;
