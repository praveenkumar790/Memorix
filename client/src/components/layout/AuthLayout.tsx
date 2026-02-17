import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthLayout = () => {
    const { user, isLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">Loading...</div>;
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg dark:bg-bg p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 aurora-gradient opacity-60 dark:opacity-40 pointer-events-none" />
            {/* Back Button - Top Left */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="absolute top-4 left-4 gap-2 text-gray-700 dark:text-gray-300"
            >
                <ArrowLeft className="h-4 w-4" />
                Home
            </Button>

            {/* Theme Toggle Button - Top Right */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="absolute top-4 right-4 z-10"
                aria-label="Toggle theme"
            >
                {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-gray-300" />
                ) : (
                    <Moon className="h-5 w-5 text-gray-700" />
                )}
            </Button>

            <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700 fade-in">
                <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    Memorix
                </h1>
                <p className="mt-2 text-sm text-fg-secondary dark:text-gray-400">Organizational Memory & Decision Engine</p>
            </div>
            
            {/* Main content wrapper - removed rigid max-width to let children decide */}
            <div className="w-full flex justify-center animate-in zoom-in-95 duration-500 fade-in px-4">
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;
