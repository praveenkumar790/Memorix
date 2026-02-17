import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, BookOpen, X, Save, Loader2 } from "lucide-react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDecisions, createDecision, Decision } from "@/api/decisions";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";

const Decisions = () => {
    const queryClient = useQueryClient();
    const { profile, isLoading: authLoading } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newTags, setNewTags] = useState("");
    const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

    const { data: decisions, isLoading, error } = useQuery<Decision[]>({
        queryKey: ["decisions", profile?.role_id], // Include role_id to prevent cache sharing
        queryFn: () => fetchDecisions(),
        enabled: !authLoading && !!profile, // Only run when auth is ready
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-fg dark:text-white">Decisions</h1>
                    <p className="text-fg-secondary dark:text-gray-400">Living record of organizational choices.</p>
                </div>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95">
                        <Plus className="mr-2 h-4 w-4" />
                        Log Decision
                    </Button>
                )}
            </div>

            {isCreating && (
                <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/10 animate-in slide-in-from-top-4 backdrop-blur-sm shadow-md">
                    <CardHeader>
                        <CardTitle className="text-blue-700 dark:text-blue-400">New Decision</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input 
                            placeholder="Decision Title (e.g., 'Switching to PostgreSQL')" 
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="bg-white dark:bg-gray-800 border-border/60 dark:border-gray-700"
                        />
                        <textarea
                            className="flex min-h-[160px] w-full rounded-md border border-border/60 dark:border-gray-700 bg-white dark:bg-gray-800 text-fg dark:text-gray-100 px-4 py-3 text-sm ring-offset-white dark:ring-offset-gray-900 placeholder:text-fg-secondary dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:border-blue-400 transition-colors"
                            placeholder="Describe the context, decision, and consequences..."
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                        />
                        <Input 
                            placeholder="Tags (comma separated, e.g., 'database, backend')" 
                            value={newTags}
                            onChange={(e) => setNewTags(e.target.value)}
                            className="bg-white dark:bg-gray-800 border-border/60 dark:border-gray-700"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setIsCreating(false)} className="hover:bg-red-50 hover:text-red-600 border-border/60 dark:border-gray-700">
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={createMutation.isPending || !newTitle || !newContent} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Decision
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-secondary dark:text-gray-400" />
                    <Input 
                        placeholder="Search decisions by title or tags..." 
                        className="pl-10 h-11 bg-white/50 dark:bg-gray-900/50 border-border/60 dark:border-gray-800 backdrop-blur-sm focus-visible:ring-blue-500 transition-all hover:bg-white/80 dark:hover:bg-gray-900/80" 
                    />
                </div>
            </div>


            <div className="space-y-4">
                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="border-border/60 bg-white/50 dark:bg-gray-800/50">
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2 mt-2" />
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                        Error loading decisions.
                    </div>
                ) : decisions?.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border dark:border-gray-700 bg-bg-secondary/30 dark:bg-gray-800/30 p-12 text-center text-fg-secondary dark:text-gray-400">
                        <BookOpen className="mx-auto h-10 w-10 opacity-50 mb-3" />
                        <h3 className="text-lg font-medium text-fg dark:text-white">No decisions logged yet</h3>
                        <p>Track architecture choices and context here.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {decisions?.map((decision) => (
                            <Card 
                                key={decision.id} 
                                className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/60 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden"
                                onClick={() => setSelectedDecision(decision)}
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-lg font-semibold leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                            {decision.title}
                                        </CardTitle>
                                        <BookOpen className="h-4 w-4 shrink-0 text-fg-secondary dark:text-gray-500" />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-fg-secondary dark:text-gray-400 mt-1">
                                        <span>{new Date(decision.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="font-medium text-fg dark:text-gray-300">
                                            {decision.profiles?.full_name || 'Anonymous'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-fg-secondary dark:text-gray-400 line-clamp-3 mb-4 h-[60px]">
                                        {decision.content.replace(/[#*`]/g, '')}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {decision.tags?.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] font-medium px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
                                                {tag}
                                            </span>
                                        ))}
                                        {decision.tags && decision.tags.length > 3 && (
                                            <span className="text-[10px] font-medium px-2 py-1 bg-bg-secondary dark:bg-gray-800 rounded-full text-fg-secondary dark:text-gray-400">
                                                +{decision.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {selectedDecision && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedDecision(null)}>
                    <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 border-none shadow-2xl bg-white dark:bg-gray-900" onClick={e => e.stopPropagation()}>
                        <CardHeader className="border-b border-border/50 dark:border-gray-800 bg-bg-secondary/30 dark:bg-gray-800/50 flex flex-row items-start justify-between py-4">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                    {selectedDecision.title}
                                </CardTitle>
                                <div className="flex items-center gap-3 text-sm text-fg-secondary dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Logged on {new Date(selectedDecision.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    </span>
                                    <span>by <span className="font-semibold text-fg dark:text-white">{selectedDecision.profiles?.full_name || 'Anonymous'}</span></span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedDecision(null)} className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="overflow-y-auto flex-1 p-6 md:p-8">
                            <div className="flex flex-wrap gap-2 mb-6">
                                {selectedDecision.tags?.map(tag => (
                                    <span key={tag} className="text-xs font-medium px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                                <ReactMarkdown>{selectedDecision.content}</ReactMarkdown>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Decisions;
