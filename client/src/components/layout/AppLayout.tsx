import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import UserProfileMenu from "./UserProfileMenu";

const AppLayout = () => {
    return (
        <div className="flex h-screen w-full bg-bg-secondary/30 dark:bg-gray-950 text-fg dark:text-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header with profile menu - Smoother divider with shadow instead of harsh border */}
                <header className="h-16 shadow-sm dark:shadow-gray-900/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-end px-6 transition-all duration-200">
                    <UserProfileMenu />
                </header>
                
                {/* Main content - Aligned scroll area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                    <div className="container mx-auto max-w-5xl py-8 px-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
