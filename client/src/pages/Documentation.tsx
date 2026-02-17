import { useState, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Book, Code, Shield, Terminal, ArrowLeft, Menu, X, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const Documentation = () => {
    const { theme, toggleTheme } = useTheme();
    const [activeSection, setActiveSection] = useState("introduction");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to top on mount immediately
    useLayoutEffect(() => {
        // Disable browser scroll restoration to prevent jump to bottom
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        
        // Force scroll to top immediately before paint with instant behavior
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }

        return () => {
            // Optional: Restore default behavior if needed, but for SPA 'manual' is often better
            // history.scrollRestoration = 'auto'; 
        };
    }, []);

    const sections = [
        { id: "introduction", title: "Introduction", icon: Book },
        { id: "getting-started", title: "Getting Started", icon: Terminal },
        { id: "authentication", title: "Authentication", icon: Shield },
        { id: "api-reference", title: "API Reference", icon: Code },
    ];

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="flex min-h-screen bg-white dark:bg-gray-950 text-fg dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Sidebar Navigation */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary dark:bg-gray-900 border-r border-border dark:border-gray-800 transition-transform transition-colors duration-300 lg:translate-x-0 lg:static",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-6 border-b border-border dark:border-gray-800">
                        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                Memorix Docs
                            </span>
                        </Link>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <ScrollArea className="flex-1 py-6 px-4">
                        <nav className="space-y-2">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={cn(
                                            "flex items-center gap-3 w-full px-4 py-2 text-sm font-medium rounded-md transition-colors",
                                            activeSection === section.id
                                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                                : "text-fg-secondary dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-fg dark:hover:text-white"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {section.title}
                                    </button>
                                );
                            })}
                        </nav>
                        <Separator className="my-6 bg-border dark:bg-gray-800" />
                        <div className="px-4">
                            <Link to="/">
                                <Button variant="outline" className="w-full justify-start gap-2 border-border dark:border-gray-700 text-fg dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Home
                                </Button>
                            </Link>
                        </div>
                    </ScrollArea>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-border dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-30">
                    <div className="flex items-center">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-md">
                            <Menu className="h-6 w-6" />
                        </button>
                        <span className="ml-4 font-bold text-lg">Documentation</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="text-gray-700 dark:text-gray-300"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                </header>

                {/* Desktop Theme Toggle (Floating Top Right) */}
                <div className="hidden lg:flex fixed top-6 right-8 z-40">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-border dark:border-gray-800 shadow-sm"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth p-6 lg:p-12 max-w-4xl mx-auto w-full">
                    
                    {/* Introduction */}
                    <section id="introduction" className="mb-16 scroll-mt-24">
                        <h1 className="text-4xl font-extrabold tracking-tight mb-6 text-fg dark:text-white">Introduction</h1>
                        <p className="text-xl text-fg-secondary dark:text-gray-400 leading-relaxed mb-6">
                            Memorix is an AI-powered knowledge management system designed to preserve and activate your organization's collective intelligence.
                        </p>
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Why Memorix?</h3>
                            <p className="text-blue-700 dark:text-blue-400 text-sm">
                                Stop losing critical decisions in Slack threads and PDF archives. Memorix ingests your documents, indexes them with vector search, and lets you chat with your entire knowledge base.
                            </p>
                        </div>
                    </section>
                    
                    <Separator className="my-8 bg-border dark:bg-gray-800" />

                    {/* Getting Started */}
                    <section id="getting-started" className="mb-16 scroll-mt-24">
                        <h2 className="text-3xl font-bold mb-6 text-fg dark:text-white flex items-center gap-3">
                            <Terminal className="h-8 w-8 text-purple-500" />
                            Getting Started
                        </h2>
                        <p className="text-fg-secondary dark:text-gray-400 mb-4">
                            To get started with Memorix, you'll need to sign up for an account and create your organization profile.
                        </p>
                        <div className="space-y-4">
                            <div className="bg-bg-secondary dark:bg-gray-900 p-4 rounded-lg border border-border dark:border-gray-800">
                                <h3 className="font-medium mb-2 text-fg dark:text-white">1. Create an Account</h3>
                                <p className="text-sm text-fg-secondary dark:text-gray-400">
                                    Navigate to the Signup page, enter your email and password. You will be asked to define your Company Name and Role.
                                </p>
                            </div>
                            <div className="bg-bg-secondary dark:bg-gray-900 p-4 rounded-lg border border-border dark:border-gray-800">
                                <h3 className="font-medium mb-2 text-fg dark:text-white">2. Upload Documents</h3>
                                <p className="text-sm text-fg-secondary dark:text-gray-400">
                                    Go to the <strong>Upload</strong> tab. Drag and drop PDF files. Our AI will automatically process, chunk, and index them.
                                </p>
                            </div>
                            <div className="bg-bg-secondary dark:bg-gray-900 p-4 rounded-lg border border-border dark:border-gray-800">
                                <h3 className="font-medium mb-2 text-fg dark:text-white">3. Ask Questions</h3>
                                <p className="text-sm text-fg-secondary dark:text-gray-400">
                                    Navigate to the <strong>Chat</strong> page. Start asking questions about your data, and get instant, cited answers.
                                </p>
                            </div>
                        </div>
                    </section>

                    <Separator className="my-8 bg-border dark:bg-gray-800" />

                    {/* Authentication */}
                    <section id="authentication" className="mb-16 scroll-mt-24">
                        <h2 className="text-3xl font-bold mb-6 text-fg dark:text-white flex items-center gap-3">
                            <Shield className="h-8 w-8 text-green-500" />
                            Authentication & Security
                        </h2>
                        <p className="text-fg-secondary dark:text-gray-400 mb-6">
                            Memorix takes security seriously. We use industry-standard encryption and role-based access control.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 border border-border dark:border-gray-800 rounded-lg">
                                <h3 className="font-bold mb-2">Secure Transport</h3>
                                <p className="text-sm text-fg-secondary dark:text-gray-400">
                                    All data is encrypted in transit using TLS 1.2+ (HTTPS). Your credentials never travel in plaintext.
                                </p>
                            </div>
                            <div className="p-6 border border-border dark:border-gray-800 rounded-lg">
                                <h3 className="font-bold mb-2">RBAC</h3>
                                <p className="text-sm text-fg-secondary dark:text-gray-400">
                                    Role-Based Access Control ensures that only authorized users can view or edit sensitive company documents.
                                </p>
                            </div>
                        </div>
                    </section>

                    <Separator className="my-8 bg-border dark:bg-gray-800" />

                    {/* API Reference */}
                    <section id="api-reference" className="mb-16 scroll-mt-24">
                        <h2 className="text-3xl font-bold mb-6 text-fg dark:text-white flex items-center gap-3">
                            <Code className="h-8 w-8 text-orange-500" />
                            API Reference
                        </h2>
                        <p className="text-fg-secondary dark:text-gray-400 mb-6">
                            Developers can interact with Memorix programmatically via our REST API.
                        </p>
                        
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                    <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded">POST</span>
                                    /api/chat
                                </h3>
                                <p className="text-sm text-fg-secondary dark:text-gray-400 mb-3">Send a message to the AI agent.</p>
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "message": "What is our leave policy?",
  "chatId": "optional-uuid"
}`}
                                </pre>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded">POST</span>
                                    /api/ingest
                                </h3>
                                <p className="text-sm text-fg-secondary dark:text-gray-400 mb-3">Upload a file for indexing (multipart/form-data).</p>
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`FormData: {
  file: (binary)
}`}
                                </pre>
                            </div>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
};

export default Documentation;
