import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export default function Header() {
    const { theme, toggleTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ${isScrolled ? "pt-4" : "pt-0"}`}>
            <motion.div
                layout
                initial={{ width: "100%", borderRadius: "0px", y: 0 }}
                animate={{
                    width: isScrolled ? "90%" : "100%",
                    borderRadius: isScrolled ? "100px" : "0px",
                    maxWidth: isScrolled ? "1000px" : "100%",
                }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className={`flex items-center justify-between backdrop-blur-md border transition-colors duration-500 ${
                    isScrolled
                        ? "bg-white/70 dark:bg-black/70 border-white/20 dark:border-white/10 shadow-lg shadow-black/5 px-6 py-3"
                        : "bg-transparent border-transparent px-8 py-6"
                }`}
            >
                <div className="flex items-center gap-8">
                    <Link to="/" className="text-xl font-bold font-display tracking-tight text-fg dark:text-white">
                        Memorix
                    </Link>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex gap-6">
                        {/* Navigation links removed */}
                    </nav>
                </div>

                <div className="flex gap-3 items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="rounded-full h-9 w-9 text-fg dark:text-gray-300 hover:bg-fg/5 dark:hover:bg-white/10"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                    </Button>
                    <Link to="/login">
                        <Button variant="ghost" className="rounded-full text-sm font-medium h-9 px-4 text-fg dark:text-gray-300 hover:bg-fg/5 dark:hover:bg-white/10">
                            Log in
                        </Button>
                    </Link>
                    <Link to="/signup">
                        <Button className="rounded-full text-sm font-medium h-9 px-5 bg-fg text-bg hover:bg-fg/90 dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-lg shadow-fg/20 dark:shadow-white/20 transition-all hover:scale-105">
                            Sign up
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </header>
    );
}
