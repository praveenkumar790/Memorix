import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

const AppLayout = () => {
    const location = useLocation();
    const isChat = location.pathname === "/chat";

    return (
        <div className="flex h-screen w-full bg-bg-secondary/30 dark:bg-bg text-fg dark:text-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Main content - Aligned scroll area */}
                <main className={cn("flex-1 overflow-y-auto overflow-x-hidden scroll-smooth", isChat && "h-screen overflow-hidden flex flex-col")}>
                    {isChat ? (
                        <div className="w-full flex-1 overflow-hidden flex flex-col">
                            <Outlet />
                        </div>
                    ) : (
                        <div className="container mx-auto max-w-5xl py-8 px-6">
                            <Outlet />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
