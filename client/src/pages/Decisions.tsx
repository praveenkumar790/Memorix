import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, BookOpen, X, Save, Loader2, List, GitBranch, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDecisions, createDecision, Decision } from "@/api/decisions";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const Decisions = () => {
    const queryClient = useQueryClient();
    const { profile, isLoading: authLoading } = useAuth();
    const location = useLocation();
    
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newTags, setNewTags] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
    const [view, setView] = useState<'list' | 'timeline'>('list');

    // Reset view state when user clicks Decisions in the sidebar (triggers location change)
    useEffect(() => {
        setIsCreating(false);
        setSelectedDecision(null);
    }, [location.key]);

    const { data: decisions, isLoading, error } = useQuery<Decision[]>({
        queryKey: ["decisions", profile?.workspace_id],
        queryFn: () => fetchDecisions(),
        enabled: !authLoading && !!profile,
    });

    const createMutation = useMutation({
        mutationFn: createDecision,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["decisions"] });
            setIsCreating(false);
            setNewTitle("");
            setNewContent("");
            setNewTags("");
        },
    });

    const handleCreate = () => {
        if (!newTitle || !newContent) return;
        createMutation.mutate({
            title: newTitle,
            content: newContent,
            tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
        });
    };

    // Filter decisions based on search query
    const filteredDecisions = decisions?.filter(decision => {
        const query = searchQuery.toLowerCase();
        const matchesTitle = decision.title.toLowerCase().includes(query);
        const matchesTags = decision.tags?.some(tag => tag.toLowerCase().includes(query));
        return matchesTitle || matchesTags;
    });

    // Group decisions by first tag for timeline view (pure client computation)
    const timelineGroups = useMemo(() => {
        if (!decisions) return [];
        const groups: Record<string, typeof decisions> = {};
        [...decisions]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .forEach(d => {
                const key = d.tags?.[0] || 'General';
                if (!groups[key]) groups[key] = [];
                groups[key].push(d);
            });
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [decisions]);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-16">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-light tracking-tight text-fg dark:text-white">
                        Organizational <span className="font-semibold">Decisions</span>
                    </h1>
                    <p className="text-sm text-fg-secondary dark:text-gray-400 font-light">
                        Living record of architectural patterns, database overrides, and contexts.
                    </p>
                </div>
            {/* View Toggle + Log button row */}
            <div className="flex items-center gap-2">
                {/* List / Timeline toggle */}
                <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/5 rounded-lg p-1 border border-black/[0.05] dark:border-white/5">
                    <button
                        onClick={() => setView('list')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-none",
                            view === 'list'
                                ? "bg-white dark:bg-white/10 text-fg dark:text-white shadow-sm"
                                : "text-fg-secondary dark:text-gray-400 hover:text-fg dark:hover:text-white bg-transparent"
                        )}
                    >
                        <List className="h-3 w-3" />
                        List
                    </button>
                    <button
                        onClick={() => setView('timeline')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-none",
                            view === 'timeline'
                                ? "bg-white dark:bg-white/10 text-fg dark:text-white shadow-sm"
                                : "text-fg-secondary dark:text-gray-400 hover:text-fg dark:hover:text-white bg-transparent"
                        )}
                    >
                        <GitBranch className="h-3 w-3" />
                        Timeline
                    </button>
                </div>

                {!isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)} 
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer border-none shadow-sm active:scale-95 transition-transform shrink-0"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Log Decision
                    </button>
                )}
            </div>
            </div>

            {/* Ingest/Log Decision Form */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div 
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white/40 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/5 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-md"
                    >
                        <div className="space-y-1 border-b border-black/[0.06] dark:border-white/5 pb-4">
                            <h3 className="text-lg font-semibold dark:text-white">Log Choice Context</h3>
                            <p className="text-xs text-fg-secondary dark:text-gray-400 font-light">Document context constraints, alternatives considered, and conclusions.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-fg-secondary dark:text-gray-400 uppercase tracking-wider">Decision Title</label>
                                <input 
                                    placeholder="e.g., 'Switching search framework to Vector Embeddings'" 
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-transparent px-4 py-2.5 text-sm text-fg dark:text-white placeholder:text-fg-secondary/50 focus:border-purple-500 focus:outline-none transition-all duration-200"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-fg-secondary dark:text-gray-400 uppercase tracking-wider">Context, Alternatives & Rationale</label>
                                <textarea
                                    className="flex min-h-[160px] w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-transparent text-fg dark:text-gray-100 px-4 py-3 text-sm placeholder:text-fg-secondary/50 focus:border-purple-500 focus:outline-none transition-all duration-200"
                                    placeholder="Describe why this decision was taken, constraints faced, and implications..."
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-fg-secondary dark:text-gray-400 uppercase tracking-wider">Metadata Tags</label>
                                <input 
                                    placeholder="Comma separated, e.g., 'database, backend, scaling'" 
                                    value={newTags}
                                    onChange={(e) => setNewTags(e.target.value)}
                                    className="w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-transparent px-4 py-2.5 text-sm text-fg dark:text-white placeholder:text-fg-secondary/50 focus:border-purple-500 focus:outline-none transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-black/[0.06] dark:border-white/5 pt-4">
                            <button 
                                onClick={() => setIsCreating(false)} 
                                className="px-4 py-2 text-xs font-semibold rounded-lg border border-black/[0.08] dark:border-white/10 text-fg-secondary hover:bg-black/5 dark:hover:bg-white/5 bg-transparent transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreate} 
                                disabled={createMutation.isPending || !newTitle || !newContent} 
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer border-none"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-3.5 w-3.5" />
                                        Save Choice
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Input bar */}
            {!isCreating && (
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-secondary dark:text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search decisions by title or tags..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 w-full h-11 rounded-xl bg-white/40 dark:bg-white/[0.01] border border-black/[0.06] dark:border-white/5 text-sm text-fg dark:text-white placeholder:text-fg-secondary/50 focus:border-purple-500 focus:outline-none transition-all" 
                    />
                </div>
            )}

            {/* Decisions list / grid — List View */}
            {view === 'list' && (<div className="space-y-4">
                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.01] rounded-2xl p-5 space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-3.5 w-1/2" />
                                </div>
                                <Skeleton className="h-12 w-full" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-4 w-12 rounded-full" />
                                    <Skeleton className="h-4 w-12 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-500/15 bg-red-500/[0.02] p-8 text-center text-red-600 dark:text-red-400">
                        Error retrieving choice logs.
                    </div>
                ) : filteredDecisions?.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/[0.06] dark:border-white/5 bg-white/30 dark:bg-white/[0.01] p-12 text-center text-fg-secondary dark:text-gray-400 font-light">
                        <BookOpen className="mx-auto h-8 w-8 opacity-45 mb-3" />
                        <h3 className="text-sm font-semibold text-fg dark:text-white mb-1">No decisions match search queries</h3>
                        <p className="text-xs">Try searching by keyword tags or context details.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredDecisions?.map((decision) => (
                            <div 
                                key={decision.id} 
                                className="group relative flex flex-col justify-between border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.02] hover:bg-white/80 dark:hover:bg-white/[0.04] backdrop-blur-sm rounded-2xl p-5 transition-all duration-300 cursor-pointer overflow-hidden"
                                onClick={() => setSelectedDecision(decision)}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <h4 className="text-sm font-semibold leading-snug dark:text-white line-clamp-2">
                                            {decision.title}
                                        </h4>
                                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-fg-secondary/50 dark:text-gray-500 mt-0.5" />
                                    </div>
                                    <p className="text-[11px] text-fg-secondary dark:text-gray-400 font-light leading-none">
                                        Logged {new Date(decision.created_at).toLocaleDateString()} by <span className="font-medium text-fg dark:text-white">{decision.profiles?.full_name || 'Anonymous'}</span>
                                    </p>
                                    <p className="text-xs text-fg-secondary/80 dark:text-gray-400/80 font-light line-clamp-3 leading-relaxed py-1">
                                        {decision.content.replace(/[#*`]/g, '')}
                                    </p>
                                </div>
                                
                                {decision.tags && decision.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-4 border-t border-black/[0.03] dark:border-white/5 mt-4">
                                        {decision.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] text-fg-secondary dark:text-gray-400 font-light bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5 px-2 py-0.5 rounded-md">
                                                #{tag}
                                            </span>
                                        ))}
                                        {decision.tags.length > 3 && (
                                            <span className="text-[10px] text-fg-secondary/50 dark:text-gray-500 font-light px-1 py-0.5">
                                                +{decision.tags.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>)}

            {/* Timeline View */}
            {view === 'timeline' && (
                <div className="space-y-10">
                    {isLoading ? (
                        <div className="space-y-6">
                            {[1, 2].map(i => (
                                <div key={i} className="space-y-3">
                                    <Skeleton className="h-4 w-24" />
                                    <div className="pl-5 border-l-2 border-black/[0.06] dark:border-white/5 space-y-4">
                                        {[1,2].map(j => <Skeleton key={j} className="h-16 w-full rounded-xl" />)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : timelineGroups.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-black/[0.06] dark:border-white/5 bg-white/30 dark:bg-white/[0.01] p-12 text-center text-fg-secondary dark:text-gray-400 font-light">
                            <GitBranch className="mx-auto h-8 w-8 opacity-45 mb-3" />
                            <h3 className="text-sm font-semibold text-fg dark:text-white mb-1">No timeline yet</h3>
                            <p className="text-xs">Log your first decision to see the evolution timeline.</p>
                        </div>
                    ) : (
                        timelineGroups.map(([tag, tagDecisions]) => (
                            <div key={tag} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-secondary dark:text-gray-500">#{tag}</span>
                                    <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/5" />
                                    <span className="text-[10px] text-fg-secondary/60 dark:text-gray-500">{tagDecisions.length} decision{tagDecisions.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="pl-4 border-l-2 border-black/[0.06] dark:border-white/[0.08] space-y-1">
                                    {tagDecisions.map((decision) => (
                                        <div key={decision.id} className="relative cursor-pointer group" onClick={() => setSelectedDecision(decision)}>
                                            <div className="absolute -left-[21px] top-4 w-2.5 h-2.5 rounded-full border-2 border-black/20 dark:border-white/20 bg-white dark:bg-bg group-hover:border-purple-500 group-hover:bg-purple-500/20 transition-all" />
                                            <div className="ml-3 py-3 px-4 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors border border-transparent hover:border-black/[0.05] dark:hover:border-white/5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <h4 className="text-sm font-semibold leading-snug dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{decision.title}</h4>
                                                    {decision.context_doc_id && (
                                                        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5">Linked Doc</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="flex items-center gap-1 text-[10px] text-fg-secondary dark:text-gray-500 font-light">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        {new Date(decision.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] text-fg-secondary/60 dark:text-gray-500">by {decision.profiles?.full_name || 'Unknown'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Selected Decision Detail Modal View */}
            {selectedDecision && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedDecision(null)}>
                    <div className="w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200 border border-black/[0.06] dark:border-white/10 bg-white dark:bg-black/95 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.01] flex items-start justify-between p-6 shrink-0">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold dark:text-white leading-tight">
                                    {selectedDecision.title}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-fg-secondary dark:text-gray-400 font-light">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Logged on {new Date(selectedDecision.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    </span>
                                    <span>•</span>
                                    <span>by <span className="font-semibold text-fg dark:text-white">{selectedDecision.profiles?.full_name || 'Anonymous'}</span></span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDecision(null)} className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center border-none bg-transparent cursor-pointer text-fg-secondary/80 focus:outline-none">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 md:p-8 scroll-smooth scrollbar-thin">
                            {selectedDecision.tags && selectedDecision.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {selectedDecision.tags.map(tag => (
                                        <span key={tag} className="text-xs text-fg-secondary dark:text-gray-400 font-light bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5 px-2.5 py-0.5 rounded-md">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:font-light prose-headings:font-normal prose-strong:font-semibold">
                                <ReactMarkdown>{selectedDecision.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Decisions;
