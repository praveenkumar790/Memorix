import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Upload, MessageSquare, Search, Shield, Zap, Users, CheckCircle2, Heart } from "lucide-react";

const Landing = () => {
    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900 overflow-x-hidden">
            <Header />

            {/* Hero Section */}
            <main className="flex-1 bg-bg dark:bg-bg relative">
                <section className="relative flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 overflow-hidden min-h-[90vh]">
                    {/* Aurora Background */}
                    <div className="absolute inset-0 aurora-gradient opacity-60 dark:opacity-40 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-8 max-w-5xl animate-in slide-in-from-bottom-8 duration-1000 fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-full text-sm font-medium text-fg-secondary dark:text-gray-300 shadow-sm hover:scale-105 transition-transform duration-300 cursor-default">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            AI-Powered Knowledge Management
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-fg dark:text-white leading-[1.1] drop-shadow-sm">
                            Your company's memory,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">preserved forever.</span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-fg-secondary dark:text-gray-400 max-w-2xl mx-auto leading-relaxed text-balance">
                            Stop losing critical decisions and knowledge. Memorix captures everything your team knows and makes it instantly accessible with AI.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                            <Link to="/signup">
                                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 bg-fg text-bg dark:bg-white dark:text-black">
                                    Get Started
                                </Button>
                            </Link>
                            <Link to="/docs">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm border-gray-200 dark:border-gray-800 text-fg dark:text-white hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300">
                                    View Documentation
                                </Button>
                            </Link>
                        </div>

                    </div>
                </section>



                {/* Features Section - Bento Grid */}
                <section id="features" className="py-24 relative bg-bg-secondary/30 dark:bg-black/20">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-fg dark:text-white">Everything you need</h2>
                            <p className="text-xl text-fg-secondary dark:text-gray-400 max-w-2xl mx-auto text-balance">
                                Powerful features to manage your organizational knowledge, reimagined for the AI era.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Feature 1 - Span 2 */}
                            <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md p-8 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                                    <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-500">
                                        <Upload className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-fg dark:text-white mb-3">Smart Upload</h3>
                                        <p className="text-fg-secondary dark:text-gray-400 text-lg leading-relaxed max-w-lg">
                                            Automatically process PDFs, Docs, and Slack threads with intelligent extraction and categorization.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Feature 2 - Span 1 */}
                            <div className="md:col-span-1 group relative overflow-hidden rounded-3xl border border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md p-8 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                                    <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-500">
                                        <MessageSquare className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-fg dark:text-white mb-3">AI Chat</h3>
                                        <p className="text-fg-secondary dark:text-gray-400">
                                            Ask questions naturally and get instant answers from your knowledge base.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 3 - Span 1 */}
                            <div className="md:col-span-1 group relative overflow-hidden rounded-3xl border border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md p-8 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-500 hover:shadow-2xl hover:shadow-pink-500/10">
                                <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                                    <div className="h-14 w-14 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform duration-500">
                                        <Search className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-fg dark:text-white mb-3">Semantic Search</h3>
                                        <p className="text-fg-secondary dark:text-gray-400">
                                            Find context, not just keywords.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 4 - Span 2 */}
                            <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md p-8 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-500">
                                        <Shield className="h-7 w-7" />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-fg dark:text-white mb-3">Role-Based Access</h3>
                                            <p className="text-fg-secondary dark:text-gray-400 max-w-md">
                                                Granular permissions ensure the right people see the right information.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 5 - Span 1 */}
                            <div className="md:col-span-1 group relative overflow-hidden rounded-3xl border border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md p-8 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10">
                                <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-500">
                                        <Zap className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-fg dark:text-white mb-3">Decisions</h3>
                                        <p className="text-fg-secondary dark:text-gray-400">
                                            Track why and how decisions were made.
                                        </p>
                                    </div>
                                </div>
                            </div>

                             {/* Feature 6 - Span 2 */}
                             <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md p-8 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                                    <div className="h-14 w-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform duration-500">
                                        <Users className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-fg dark:text-white mb-3">Team Collaboration</h3>
                                        <p className="text-fg-secondary dark:text-gray-400 max-w-lg">
                                            Seamlessly share insights and collaborate on knowledge artifacts in real-time.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section - Zig Zag */}
                <section className="py-32 bg-bg dark:bg-bg relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 relative z-10">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-fg dark:text-white mb-6">Built for modern teams</h2>
                            <p className="text-xl text-fg-secondary dark:text-gray-400 max-w-2xl mx-auto">
                                Stop letting knowledge slip through the cracks.
                            </p>
                        </div>

                        <div className="space-y-32">
                            {/* Feature 1 */}
                            <div className="flex flex-col md:flex-row items-center gap-16">
                                <div className="flex-1 space-y-8">
                                    <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <CheckCircle2 className="h-7 w-7" />
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-display font-bold text-fg dark:text-white">
                                        Single Source of Truth
                                    </h3>
                                    <p className="text-lg text-fg-secondary dark:text-gray-400 leading-relaxed">
                                        No more chasing down Google Docs or Slack threads. Memorix centralizes everything 
                                        so your team always has the latest information at their fingertips.
                                    </p>
                                    <ul className="space-y-4 pt-4">
                                        {['Auto-indexing of all documents', 'Real-time updates', 'Version history tracking'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-fg dark:text-gray-300">
                                                <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                </div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex-1 relative">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl rounded-full opacity-50" />
                                    <div className="relative glass rounded-3xl p-8 border border-white/20 shadow-2xl">
                                        {/* Mock UI */}
                                        <div className="flex items-center gap-4 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                                            <div className="space-y-2">
                                                <div className="h-2.5 w-32 bg-gray-100 dark:bg-gray-800 rounded-full" />
                                                <div className="h-2 w-20 bg-gray-50 dark:bg-gray-900 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-2.5 w-3/4 bg-gray-100 dark:bg-gray-800 rounded-full" />
                                            <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full" />
                                            <div className="h-2.5 w-5/6 bg-gray-100 dark:bg-gray-800 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                                <div className="flex-1 space-y-8">
                                    <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <Zap className="h-7 w-7" />
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-display font-bold text-fg dark:text-white">
                                        Onboard 10x Faster
                                    </h3>
                                    <p className="text-lg text-fg-secondary dark:text-gray-400 leading-relaxed">
                                        New hires can ask questions and get instant, context-aware answers from your 
                                        entire knowledge base. No need to tap a senior engineer on the shoulder.
                                    </p>
                                    <ul className="space-y-4 pt-4">
                                        {['Instant Q&A', 'Contextual learning', 'Reduce mentorship overhead'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-fg dark:text-gray-300">
                                                <div className="h-6 w-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                                                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                                                </div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex-1 relative">
                                    <div className="absolute inset-0 bg-gradient-to-bl from-pink-500/20 to-orange-500/20 blur-3xl rounded-full opacity-50" />
                                    <div className="relative glass rounded-3xl p-8 border border-white/20 shadow-2xl">
                                        {/* Mock UI */}
                                        <div className="flex flex-col gap-4">
                                            <div className="self-end bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-3 text-sm max-w-[80%]">
                                                How do I deploy to production?
                                            </div>
                                            <div className="self-start glass text-fg dark:text-gray-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm max-w-[90%] shadow-sm">
                                                To deploy to production, run the `npm run deploy` command after ensuring all tests pass...
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-bg dark:bg-bg" />
                    <div className="max-w-5xl mx-auto px-4 relative z-10">
                        <div className="glass rounded-[3rem] p-12 md:p-24 text-center border border-white/20 relative overflow-hidden">
                            <div className="absolute inset-0 aurora-gradient opacity-30" />
                            <div className="relative z-10 space-y-8">
                                <h2 className="text-4xl md:text-6xl font-display font-bold text-fg dark:text-white tracking-tight">
                                    Ready to preserve your<br />team's genius?
                                </h2>
                                <p className="text-xl text-fg-secondary dark:text-gray-400 max-w-xl mx-auto">
                                    Join forward-thinking companies building their organizational brain with Memorix.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                                    <Link to="/signup">
                                        <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white border-0">
                                            Start for free
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-border/50 dark:border-white/5 bg-bg dark:bg-bg relative">
                <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-display font-bold text-fg dark:text-white">Memorix</span>
                    </div>
                    <p className="text-sm text-fg-secondary dark:text-gray-400 text-center max-w-sm">
                        The AI-powered knowledge base for your company. Preserve context, make better decisions.
                    </p>
                    
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full pt-8 border-t border-border/50 dark:border-white/5">
                        <p className="text-xs text-fg-secondary dark:text-gray-500">
                            © 2026 Memorix Inc. All rights reserved.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-fg-secondary dark:text-gray-500">
                            Made with <Heart className="h-3 w-3 fill-red-500 text-red-500 animate-pulse" /> by Praveen
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
