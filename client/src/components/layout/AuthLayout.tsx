import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { Shield, Zap, Sparkles, Database } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { motion, AnimatePresence } from "framer-motion";

const AuthLayout = () => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-bg text-fg">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-bg text-fg relative overflow-hidden transition-colors duration-500">
            {/* Unified Navbar */}
            <Header />

            {/* Ambient background glows */}
            <div className="pointer-events-none absolute left-1/4 top-1/3 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 dark:opacity-40 blur-[130px] transition-opacity duration-500" 
                 style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(56,189,248,0.1) 50%, transparent 70%)" }} />
            <div className="pointer-events-none absolute right-1/4 bottom-1/4 -z-10 h-[400px] w-[400px] rounded-full opacity-15 dark:opacity-30 blur-[120px] transition-opacity duration-500" 
                 style={{ background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)" }} />

            {/* Main split-screen container */}
            <div className="flex-1 flex justify-center px-6 py-12 lg:py-16 mt-16 lg:mt-6">
                <div className="my-auto grid lg:grid-cols-12 gap-8 lg:gap-24 w-full max-w-6xl items-center">
                    
                    {/* Left Column: Product Info & Features (Hidden on mobile) */}
                    <div className="hidden lg:flex lg:col-span-7 flex-col text-left space-y-6 select-none">
                        <ScrollReveal direction="left" delay={0.1} className="space-y-3">
                            <h1 className="font-display text-3xl lg:text-4xl font-light leading-tight tracking-tight text-fg">
                                Build your secure <br />
                                <span className="amber-grad font-normal inline-block pr-[0.18em]">organizational brain.</span>
                            </h1>
                            <p className="text-sm text-fg-secondary leading-relaxed max-w-md">
                                Sign in to upload documents, record decisions, sync with Notion, Slack & Confluence, and chat with your collective intelligence.
                            </p>
                        </ScrollReveal>

                        {/* Feature Grid */}
                        <ScrollReveal direction="left" delay={0.2} className="grid grid-cols-2 gap-3">
                            {/* Feature 1 */}
                            <div className="border border-black/[0.06] dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] rounded-xl p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-300">
                                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
                                    <Zap className="h-4 w-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-fg">Decision Supremacy</h4>
                                <p className="text-[11px] text-fg-secondary mt-1.5 leading-relaxed">Logged decisions automatically override older documentation.</p>
                            </div>
                            {/* Feature 2 */}
                            <div className="border border-black/[0.06] dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] rounded-xl p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-300">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-fg">Workspace Isolation</h4>
                                <p className="text-[11px] text-fg-secondary mt-1.5 leading-relaxed">Secure namespacing ensures workspace-level permission control.</p>
                            </div>
                            {/* Feature 3 */}
                            <div className="border border-black/[0.06] dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] rounded-xl p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-300">
                                <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-3">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-fg">Multi-Source Sync</h4>
                                <p className="text-[11px] text-fg-secondary mt-1.5 leading-relaxed">Connect Notion, Slack channels, Confluence wikis, and GitHub repos.</p>
                            </div>
                            {/* Feature 4 */}
                            <div className="border border-black/[0.06] dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] rounded-xl p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-300">
                                <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3">
                                    <Database className="h-4 w-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-fg">Vector Search</h4>
                                <p className="text-[11px] text-fg-secondary mt-1.5 leading-relaxed">Semantic retrieval matching queries by context, not keywords.</p>
                            </div>
                        </ScrollReveal>

                        {/* Bottom Tags */}
                        <ScrollReveal direction="left" delay={0.3} className="flex flex-wrap gap-2">
                            {["Notion Synced", "Slack Integrated", "GitHub Connected", "Pinecone Vector RAG", "Workspace-Isolated"].map((tag, i) => (
                                <span key={i} className="px-3 py-1 bg-black/[0.03] dark:bg-white/[0.03] text-[0.65rem] font-mono text-fg-secondary border border-border/30 dark:border-white/5 rounded-full uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </ScrollReveal>
                    </div>

                    {/* Right Column: Auth Card (Outlet with AnimatePresence) */}
                    <div className="col-span-12 lg:col-span-5 flex justify-center items-center min-h-[460px] relative">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18, ease: "easeInOut" }}
                                className="w-full flex justify-center"
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>

            {/* Clean bottom footer */}
            <footer className="absolute bottom-6 left-6 text-[0.65rem] font-mono tracking-wider text-fg-secondary/50 select-none hidden lg:block">
                © 2026 Memorix Inc.
            </footer>
        </div>
    );
};

export default AuthLayout;
