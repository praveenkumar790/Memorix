import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function Header() {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#080809]/70 backdrop-blur-md border-b border-black/[0.06] dark:border-white/5 transition-colors duration-500 py-3.5 px-6 md:px-8">
            <div className="max-w-6xl mx-auto flex items-center justify-between w-full">
                <Link to="/" className="flex items-center text-xl font-bold font-display tracking-tight text-fg group select-none">
                    {/* Premium 3D Isometric Memory Cube Logo Icon */}
                    <svg className="w-6 h-6 mr-2 filter drop-shadow-[0_2px_8px_rgba(168,85,247,0.45)] group-hover:scale-105 transition-transform duration-300" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="cubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#c084fc" /> {/* Light purple */}
                                <stop offset="50%" stopColor="#a855f7" /> {/* Medium purple */}
                                <stop offset="100%" stopColor="#7e22ce" /> {/* Dark purple */}
                            </linearGradient>
                            <linearGradient id="cubeFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#f472b6" /> {/* Pink tint */}
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                        {/* Left Side Face */}
                        <path d="M6 10L16 16V28L6 22V10Z" fill="url(#cubeGrad)" opacity="0.9" />
                        {/* Right Side Face */}
                        <path d="M26 10L16 16V28L26 22V10Z" fill="#6b21a8" opacity="0.85" />
                        {/* Top Face */}
                        <path d="M16 4L26 10L16 16L6 10L16 4Z" fill="url(#cubeFaceGrad)" />
                        {/* Glowing floating core overlay */}
                        <path d="M16 10L21 13L16 16L11 13L16 10Z" fill="#ffffff" opacity="0.45" />
                    </svg>
                    Memorix
                </Link>

                <div className="flex gap-3 items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="rounded-full h-9 w-9 text-fg hover:bg-fg/5 dark:hover:bg-white/10"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                    </Button>
                    <Link to="/login">
                        <Button variant="ghost" className="rounded-full text-sm font-medium h-9 px-4 text-fg hover:bg-fg/5 dark:hover:bg-white/10">
                            Log in
                        </Button>
                    </Link>
                    <Link to="/signup">
                        <Button className="rounded-full text-sm font-medium h-9 px-5 bg-fg text-bg hover:bg-fg/90 dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-lg shadow-fg/20 dark:shadow-white/20 transition-all hover:scale-105 border-0">
                            Sign up
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
