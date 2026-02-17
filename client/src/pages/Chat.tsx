import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, User, Bot, Loader2, BookmarkCheck, Save } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { flushSync } from "react-dom";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDecision } from "@/api/decisions";
import { getAccessToken } from "@/lib/auth";

type Message = {
    role: 'user' | 'assistant';
    content: string;
    isStreaming?: boolean;
};

const Chat = () => {
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Decision dialog state
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [savingMessageIndex, setSavingMessageIndex] = useState<number | null>(null);
    const [decisionTitle, setDecisionTitle] = useState("");
    const [decisionTags, setDecisionTags] = useState("");

    const saveDecisionMutation = useMutation({
        mutationFn: createDecision,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["decisions"] });
            setSaveDialogOpen(false);
            setDecisionTitle("");
            setDecisionTags("");
            setSavingMessageIndex(null);
        },
    });

    const handleSaveAsDecision = (messageIndex: number) => {
        setSavingMessageIndex(messageIndex);
        setSaveDialogOpen(true);
    };

    const handleConfirmSave = () => {
        if (!decisionTitle || savingMessageIndex === null) return;
        const messageContent = messages[savingMessageIndex].content;
        saveDecisionMutation.mutate({
            title: decisionTitle,
            content: messageContent,
            tags: decisionTags.split(",").map(t => t.trim()).filter(Boolean),
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Chat persistence state
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);

    // Fetch latest chat on mount
    useEffect(() => {
        const fetchLatestChat = async () => {
            setIsHistoryLoading(true);
            try {
                const token = await getAccessToken();
                if (!token) throw new Error("No valid session");

                // 1. Get all chats
                const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Failed to fetch chats");
                const chats = await response.json();

                // 2. If chats exist, load the most recent one
                if (chats && chats.length > 0) {
                    const latestChat = chats[0];
                    
                    // 3. Try to get messages for this chat
                    try {
                        const msgResponse = await fetch(`${import.meta.env.VITE_API_URL}/chat/${latestChat.id}/messages`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (!msgResponse.ok) {
                            // Chat was deleted - reset and show welcome message
                            console.log('Chat not found (likely deleted), starting fresh');
                            setCurrentChatId(null);
                            setMessages([{ 
                                role: 'assistant', 
                                content: "Hello. I'm Memorix. Ask me anything about your organization's knowledge base." 
                            }]);
                            return;
                        }
                        
                        const history = await msgResponse.json();
                        
                        // Only set chatId if we successfully loaded messages
                        setCurrentChatId(latestChat.id);
                        
                        if (history && history.length > 0) {
                            setMessages(history.map((msg: any) => ({
                                role: msg.role,
                                content: msg.content
                            })));
                        } else {
                            // If no history, show welcome message
                            setMessages([{ 
                                role: 'assistant', 
                                content: "Hello. I'm Memorix. Ask me anything about your organization's knowledge base." 
                            }]);
                        }
                    } catch (msgError) {
                        console.error('Failed to load messages for chat:', msgError);
                        // If message loading fails, reset chat and start fresh
                        setCurrentChatId(null);
                        setMessages([{ 
                            role: 'assistant', 
                            content: "Hello. I'm Memorix. Ask me anything about your organization's knowledge base." 
                        }]);
                    }
                } else {
                    // No previous chats, show welcome message
                    setMessages([{ 
                        role: 'assistant', 
                        content: "Hello. I'm Memorix. Ask me anything about your organization's knowledge base." 
                    }]);
                }
            } catch (error) {
                console.error("Failed to load chat history:", error);
                // Fallback welcome message on error
                setMessages([{ 
                    role: 'assistant', 
                    content: "Hello. I'm Memorix. Ask me anything about your organization's knowledge base." 
                }]);
            } finally {
                setIsHistoryLoading(false);
            }
        };

        fetchLatestChat();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const token = await getAccessToken();
            if (!token) {
                setMessages(prev => [...prev, { role: 'assistant', content: "Your session has expired. Please log in again." }]);
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    message: userMessage,
                    chatId: currentChatId // Send existing chat ID if we have one
                }),
            });

            if (!response.ok) throw new Error("Failed to connect to chat API");

            setMessages(prev => [...prev, { role: 'assistant', content: "", isStreaming: true }]);
            
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.replace("data: ", "").trim();
                        if (dataStr === "[DONE]") break;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.chatId) {
                                setCurrentChatId(data.chatId);
                                continue;
                            }

                            if (data.content) {
                                console.log('Chunk received:', data.content); // Debug log
                                // Use flushSync to force immediate re-render for typing effect
                                flushSync(() => {
                                    setMessages(prev => {
                                        const newMsgs = [...prev];
                                        const lastIndex = newMsgs.length - 1;
                                        if (newMsgs[lastIndex]?.role === 'assistant') {
                                            // Create NEW object instead of mutating to trigger React re-render
                                            newMsgs[lastIndex] = {
                                                ...newMsgs[lastIndex],
                                                content: newMsgs[lastIndex].content + data.content
                                            };
                                        }
                                        return newMsgs;
                                    });
                                });
                            }
                        } catch (e) {
                            console.error("Parse error", e);
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the decision engine." }]);
        } finally {
            setMessages(prev => {
                const newMsgs = [...prev];
                const lastIndex = newMsgs.length - 1;
                if (newMsgs[lastIndex]?.role === 'assistant') {
                    // Create NEW object to trigger re-render
                    newMsgs[lastIndex] = {
                        ...newMsgs[lastIndex],
                        isStreaming: false
                    };
                    console.log('Final message content:', newMsgs[lastIndex].content); // Debug log
                }
                return newMsgs;
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] flex-col space-y-4 animate-in fade-in duration-500">
            <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4">
                {isHistoryLoading ? (
                    <div className="space-y-6 pt-4">
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                        <div className="flex gap-4 flex-row-reverse">
                            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex gap-4 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-inset",
                            msg.role === 'user' 
                                ? "bg-blue-600 text-white ring-blue-600" 
                                : "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 ring-gray-200 dark:ring-gray-700"
                        )}>
                            {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className="space-y-2 group">
                            <div className={cn(
                                "p-4 shadow-sm text-sm leading-relaxed",
                                msg.role === 'user' 
                                    ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm" 
                                    : "bg-white dark:bg-gray-800 border border-border/50 dark:border-gray-700 rounded-2xl rounded-tl-sm text-fg dark:text-gray-100"
                            )}>
                                <div className={cn("prose prose-sm max-w-none", msg.role === 'user' ? "prose-invert" : "dark:prose-invert")}>
                                    {msg.role === 'assistant' ? (
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                    {msg.isStreaming && <span className="animate-pulse inline-block ml-1">▋</span>}
                                </div>
                            </div>
                            
                            {msg.role === 'assistant' && !msg.isStreaming && i > 0 && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 px-2">
                                    <button 
                                        onClick={() => handleSaveAsDecision(i)}
                                        className="flex items-center gap-1.5 text-xs font-medium text-fg-secondary dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-full backdrop-blur-sm"
                                    >
                                        <BookmarkCheck className="h-3 w-3" />
                                        Save as Decision
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                     <div className="flex gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-border dark:border-gray-700 shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex items-center text-sm font-medium text-fg-secondary dark:text-gray-400 bubble-loading">
                            Memorix is thinking...
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <Card className="border-border/60 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg rounded-xl overflow-hidden">
                <form onSubmit={handleSubmit} className="flex gap-2 p-2 items-center relative">
                    <Input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything about your documents..." 
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-6 bg-transparent text-base"
                        disabled={isLoading}
                    />
                    <div className="flex shrink-0 pr-2">
                        <Button 
                            type="submit" 
                            size="icon" 
                            disabled={isLoading || !input.trim()}
                            className={cn(
                                "h-10 w-10 rounded-full transition-all duration-300",
                                input.trim() ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                            )}
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </form>
            </Card>

            {saveDialogOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md animate-in zoom-in-50 duration-200">
                        <CardHeader>
                            <CardTitle>Save as Decision</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-gray-200">Title</label>
                                <Input 
                                    placeholder="Decision Title (e.g., 'Tech Stack Overview')" 
                                    value={decisionTitle}
                                    onChange={(e) => setDecisionTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-gray-200">Tags (comma separated)</label>
                                <Input 
                                    placeholder="backend, frontend, infrastructure" 
                                    value={decisionTags}
                                    onChange={(e) => setDecisionTags(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleConfirmSave} disabled={saveDecisionMutation.isPending || !decisionTitle}>
                                    {saveDecisionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Decision
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Chat;
