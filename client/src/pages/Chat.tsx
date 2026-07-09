import { useState, useRef, useEffect } from "react";
import { Send, Loader2, BookmarkCheck, Save, X, Plus, MessageSquare, Pin, Trash2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { flushSync } from "react-dom";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDecision } from "@/api/decisions";
import { getAccessToken } from "@/lib/auth";

type Source = {
    provider: string;
    title: string;
    url: string | null;
    author: string | null;
};

type Message = {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    isStreaming?: boolean;
    sources?: Source[];
    conflictWarning?: string;
    overridingDecision?: {
        title: string;
        date: string;
        author: string;
    };
};

const BotLogo = () => (
  <svg className="h-5 w-5 drop-shadow-[0_1.5px_5px_rgba(168,85,247,0.35)]" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2L4 9l12 7 12-7-12-7z" fill="url(#bot-cube-top)" />
    <path d="M4 9v14l12 7V16L4 9z" fill="url(#bot-cube-left)" />
    <path d="M16 16v14l12-7V9L16 16z" fill="url(#bot-cube-right)" />
    <defs>
      <linearGradient id="bot-cube-top" x1="4" y1="2" x2="28" y2="16" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f472b6" />
        <stop offset="1" stopColor="#c084fc" />
      </linearGradient>
      <linearGradient id="bot-cube-left" x1="4" y1="9" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a855f7" />
        <stop offset="1" stopColor="#7e22ce" />
      </linearGradient>
      <linearGradient id="bot-cube-right" x1="16" y1="16" x2="28" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7e22ce" />
        <stop offset="1" stopColor="#581c87" />
      </linearGradient>
    </defs>
  </svg>
);

const Chat = () => {
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editInputValue, setEditInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const pendingSourcesRef = useRef<Source[]>([]);
    const pendingConflictRef = useRef<string | null>(null);
    const pendingOverrideRef = useRef<{ title: string; date: string; author: string } | null>(null);
    
    // Chat lists
    const [chatList, setChatList] = useState<any[]>([]);
    const [pinnedChatIds, setPinnedChatIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem("pinned-chats") || "[]");
        } catch {
            return [];
        }
    });

    // Decision dialog state
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [savingMessageIndex, setSavingMessageIndex] = useState<number | null>(null);
    const [decisionTitle, setDecisionTitle] = useState("");
    const [decisionTags, setDecisionTags] = useState("");

    // Delete chat confirm state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [chatIdToDelete, setChatIdToDelete] = useState<string | null>(null);

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
        // Only auto-scroll to bottom if we are not prepending old messages
        if (!isFetchingMore) {
            scrollToBottom();
        }
    }, [messages, isLoading, isFetchingMore]);

    const [currentChatId, setCurrentChatId] = useState<string | null>(null);

    const loadOlderMessages = async () => {
        if (!currentChatId || messages.length === 0 || isFetchingMore || !hasMoreMessages) return;
        
        const oldestMessageId = messages[0].id;
        if (!oldestMessageId) return; // Can't paginate without ID

        setIsFetchingMore(true);
        try {
            const token = await getAccessToken();
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/${currentChatId}/messages?before=${oldestMessageId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const olderMessages = await response.json();
                if (olderMessages.length === 0) {
                    setHasMoreMessages(false);
                } else {
                    const scrollContainer = scrollContainerRef.current;
                    const previousScrollHeight = scrollContainer ? scrollContainer.scrollHeight : 0;
                    const previousScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

                    const formattedOlder = olderMessages.map((msg: any) => ({
                        id: msg.id,
                        role: msg.role,
                        content: msg.content
                    }));

                    flushSync(() => {
                        setMessages(prev => [...formattedOlder, ...prev]);
                    });

                    if (scrollContainer) {
                        scrollContainer.scrollTop = scrollContainer.scrollHeight - previousScrollHeight + previousScrollTop;
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load older messages:", err);
        } finally {
            setIsFetchingMore(false);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollTop < 20 && !isFetchingMore && hasMoreMessages) {
            loadOlderMessages();
        }
    };

    // Fetch all chats
    const fetchChatList = async () => {
        try {
            const token = await getAccessToken();
            if (!token) return;
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setChatList(data || []);
            }
        } catch (err) {
            console.error("Failed to fetch chat list:", err);
        }
    };

    // Fetch latest chat and all chats on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsHistoryLoading(true);
            try {
                const token = await getAccessToken();
                if (!token) throw new Error("No valid session");

                // 1. Get all chats
                const listResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (listResponse.ok) {
                    const listData = await listResponse.json();
                    setChatList(listData || []);
                    
                    // 2. Load messages for the most recent chat if it exists
                    if (listData && listData.length > 0) {
                        const latestChat = listData[0];
                        setCurrentChatId(latestChat.id);
                        
                        const msgResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/${latestChat.id}/messages`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (msgResponse.ok) {
                            const history = await msgResponse.json();
                            if (history && history.length > 0) {
                                setMessages(history.map((msg: any) => ({
                                    id: msg.id,
                                    role: msg.role,
                                    content: msg.content
                                })));
                                setHasMoreMessages(history.length === 20); // If < 20, we reached the top
                            } else {
                                setMessages([{ 
                                    role: 'assistant', 
                                    content: "Hello. I'm Memorix. Ask me anything about your organization's knowledge base." 
                                }]);
                            }
                        }
                    } else {
                        // Start fresh
                        setMessages([{ 
                            role: 'assistant', 
                            content: "Hello. I'm Memorix. Ask me anything about your organization's knowledge base." 
                        }]);
                    }
                }
            } catch (error) {
                console.error("Failed to load initial chat details:", error);
                setMessages([{ 
                    role: 'assistant', 
                    content: "Hello. I'm Memorix. Ask me anything about your organization's knowledge base." 
                }]);
            } finally {
                setIsHistoryLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleLoadChat = async (chatId: string) => {
        if (isLoading) return;
        setIsHistoryLoading(true);
        try {
            const token = await getAccessToken();
            if (!token) throw new Error("No valid session");

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/${chatId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to load messages");
            const history = await response.json();
            
            setCurrentChatId(chatId);
            if (history && history.length > 0) {
                setMessages(history.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content
                })));
                setHasMoreMessages(history.length === 20);
            } else {
                setMessages([{ 
                    role: 'assistant', 
                    content: "Hello. I'm Memorix. Ask me anything about your organization's knowledge base." 
                }]);
            }
        } catch (err) {
            console.error("Error loading chat:", err);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const handleNewChat = () => {
        if (isLoading) return;
        setCurrentChatId(null);
        setHasMoreMessages(false);
        setMessages([{ 
            role: 'assistant', 
            content: "Hello. I'm Memorix. Ask me anything about your organization's knowledge base." 
        }]);
    };

    const handleDeleteChatClick = (chatId: string) => {
        setChatIdToDelete(chatId);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDeleteChat = async () => {
        if (!chatIdToDelete) return;
        try {
            const token = await getAccessToken();
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/${chatIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                if (currentChatId === chatIdToDelete) {
                    const remaining = chatList.filter(c => c.id !== chatIdToDelete);
                    if (remaining.length > 0) {
                        handleLoadChat(remaining[0].id);
                    } else {
                        handleNewChat();
                    }
                }
                fetchChatList();
            }
        } catch (err) {
            console.error("Error deleting chat:", err);
        } finally {
            setDeleteConfirmOpen(false);
            setChatIdToDelete(null);
        }
    };

    const togglePinChat = (chatId: string) => {
        setPinnedChatIds(prev => {
            const next = prev.includes(chatId) 
                ? prev.filter(id => id !== chatId) 
                : [...prev, chatId];
            localStorage.setItem("pinned-chats", JSON.stringify(next));
            return next;
        });
    };

    const handleEditSubmit = async (messageId: string, index: number) => {
        if (!editInputValue.trim() || !currentChatId || isLoading) {
            setEditingMessageId(null);
            return;
        }

        const newText = editInputValue.trim();
        const updatedMessages = messages.slice(0, index);
        updatedMessages.push({ id: messageId, role: 'user', content: newText });
        setMessages(updatedMessages);
        setEditingMessageId(null);
        setIsLoading(true);

        pendingSourcesRef.current = [];
        pendingConflictRef.current = null;

        const startStream = async (retriesLeft: number): Promise<void> => {
            try {
                const token = await getAccessToken();
                if (!token) {
                    setMessages(prev => [...prev, { role: 'assistant', content: "Your session has expired. Please log in again." }]);
                    return;
                }

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/edit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ chatId: currentChatId, messageId, newText }),
                });

                if (!response.ok) {
                    if (response.status === 429) {
                        const errData = await response.json();
                        setMessages(prev => [...prev, { 
                            role: 'assistant', 
                            content: `### ⚠️ Rate Limit Reached\n\n${errData.message}\n\nYou can chat again at **${new Date(errData.resetAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}**.`
                        }]);
                        return;
                    }
                    throw new Error(`Chat API error: ${response.status}`);
                }

                setMessages(prev => [...prev, { role: 'assistant', content: "", isStreaming: true }]);

                const reader = response.body?.getReader();
                if (!reader) throw new Error("No reader available");

                const decoder = new TextDecoder();
                let isDone = false;

                while (!isDone) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (!line.startsWith("data: ")) continue;

                        const dataStr = line.replace("data: ", "").trim();
                        if (dataStr === "[DONE]") { isDone = true; break; }

                        try {
                            const data = JSON.parse(dataStr);

                            if (data.sources) {
                                pendingSourcesRef.current = data.sources;
                                continue;
                            }
                            if (data.conflict) {
                                pendingConflictRef.current = data.conflictReason || 'Conflicting information detected.';
                                if (data.overridingDecision) {
                                    pendingOverrideRef.current = data.overridingDecision;
                                }
                                continue;
                            }

                            if (data.content) {
                                flushSync(() => {
                                    setMessages(prev => {
                                        const newMsgs = [...prev];
                                        const lastIndex = newMsgs.length - 1;
                                        if (newMsgs[lastIndex]?.role === 'assistant') {
                                            newMsgs[lastIndex] = {
                                                ...newMsgs[lastIndex],
                                                content: newMsgs[lastIndex].content + data.content
                                            };
                                        }
                                        return newMsgs;
                                    });
                                });
                            }

                            if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (parseErr) {
                            console.error("SSE parse error:", parseErr);
                        }
                    }
                }
            } catch (error: any) {
                console.error("Stream error:", error);
                if (retriesLeft > 0) {
                    const delay = (3 - retriesLeft + 1) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return startStream(retriesLeft - 1);
                }
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIndex = newMsgs.length - 1;
                    if (newMsgs[lastIndex]?.role === 'assistant' && !newMsgs[lastIndex].content) {
                        newMsgs[lastIndex] = { role: 'assistant', content: "Sorry, I encountered an error connecting to the decision engine. Please try again." };
                    } else {
                        newMsgs.push({ role: 'assistant', content: "Sorry, I encountered an error connecting to the decision engine. Please try again." });
                    }
                    return newMsgs;
                });
            }
        };

        try {
            await startStream(3);
        } finally {
            setMessages(prev => {
                const newMsgs = [...prev];
                const lastIndex = newMsgs.length - 1;
                if (newMsgs[lastIndex]?.role === 'assistant') {
                    newMsgs[lastIndex] = {
                        ...newMsgs[lastIndex],
                        isStreaming: false,
                        sources: pendingSourcesRef.current,
                        conflictWarning: pendingConflictRef.current || undefined,
                        overridingDecision: pendingOverrideRef.current || undefined
                    };
                }
                return newMsgs;
            });
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        pendingSourcesRef.current = [];
        pendingConflictRef.current = null;

        const startStream = async (retriesLeft: number): Promise<void> => {
            try {
                const token = await getAccessToken();
                if (!token) {
                    setMessages(prev => [...prev, { role: 'assistant', content: "Your session has expired. Please log in again." }]);
                    return;
                }

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        message: userMessage,
                        chatId: currentChatId
                    }),
                });

                if (!response.ok) {
                    if (response.status === 429) {
                        const errData = await response.json();
                        setMessages(prev => [...prev, { 
                            role: 'assistant', 
                            content: `### ⚠️ Rate Limit Reached\n\n${errData.message}\n\nYou can chat again at **${new Date(errData.resetAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}**.`
                        }]);
                        return;
                    }
                    throw new Error(`Chat API error: ${response.status}`);
                }

                setMessages(prev => [...prev, { role: 'assistant', content: "", isStreaming: true }]);

                const reader = response.body?.getReader();
                if (!reader) throw new Error("No reader available");

                const decoder = new TextDecoder();
                let isDone = false;

                while (!isDone) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (!line.startsWith("data: ")) continue;

                        const dataStr = line.replace("data: ", "").trim();
                        if (dataStr === "[DONE]") { isDone = true; break; }

                        try {
                            const data = JSON.parse(dataStr);

                            if (data.chatId) {
                                setCurrentChatId(data.chatId);
                                fetchChatList(); // Refresh sidebar list immediately to show the new chat item
                                continue;
                            }
                            if (data.sources) {
                                pendingSourcesRef.current = data.sources;
                                continue;
                            }
                            if (data.conflict) {
                                pendingConflictRef.current = data.conflictReason || 'Conflicting information detected.';
                                if (data.overridingDecision) {
                                    pendingOverrideRef.current = data.overridingDecision;
                                }
                                continue;
                            }

                            if (data.content) {
                                flushSync(() => {
                                    setMessages(prev => {
                                        const newMsgs = [...prev];
                                        const lastIndex = newMsgs.length - 1;
                                        if (newMsgs[lastIndex]?.role === 'assistant') {
                                            newMsgs[lastIndex] = {
                                                ...newMsgs[lastIndex],
                                                content: newMsgs[lastIndex].content + data.content
                                            };
                                        }
                                        return newMsgs;
                                    });
                                });
                            }

                            if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (parseErr) {
                            console.error("SSE parse error:", parseErr);
                        }
                    }
                }

            } catch (error: any) {
                console.error("Stream error:", error);
                if (retriesLeft > 0) {
                    const delay = (3 - retriesLeft + 1) * 1000;
                    console.log(`Retrying in ${delay}ms... (${retriesLeft} retries left)`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return startStream(retriesLeft - 1);
                }
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIndex = newMsgs.length - 1;
                    if (newMsgs[lastIndex]?.role === 'assistant' && !newMsgs[lastIndex].content) {
                        newMsgs[lastIndex] = { role: 'assistant', content: "Sorry, I encountered an error connecting to the decision engine. Please try again." };
                    } else {
                        newMsgs.push({ role: 'assistant', content: "Sorry, I encountered an error connecting to the decision engine. Please try again." });
                    }
                    return newMsgs;
                });
            }
        };

        try {
            await startStream(3);
        } finally {
            setMessages(prev => {
                const newMsgs = [...prev];
                const lastIndex = newMsgs.length - 1;
                if (newMsgs[lastIndex]?.role === 'assistant') {
                    newMsgs[lastIndex] = {
                        ...newMsgs[lastIndex],
                        isStreaming: false,
                        sources: pendingSourcesRef.current.length > 0 ? pendingSourcesRef.current : undefined,
                        conflictWarning: pendingConflictRef.current ?? undefined,
                        overridingDecision: pendingOverrideRef.current ?? undefined,
                    };
                }
                // Reset refs for next message
                pendingOverrideRef.current = null;
                return newMsgs;
            });
            setIsLoading(false);
            fetchChatList(); // Sync final chat title just in case
        }
    };

    const pinnedChats = chatList.filter(c => pinnedChatIds.includes(c.id));
    const recentChats = chatList.filter(c => !pinnedChatIds.includes(c.id));

    const renderChatListItem = (chat: any, isPinned: boolean) => {
        const isActive = currentChatId === chat.id;
        return (
            <div 
                key={chat.id}
                className={cn(
                    "group/item relative flex items-center justify-between rounded-xl transition-all duration-150 px-3 py-2.5 cursor-pointer text-left",
                    isActive 
                        ? "bg-black/[0.04] dark:bg-white/5 text-fg dark:text-white" 
                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.01] text-fg-secondary dark:text-gray-400"
                )}
                onClick={() => handleLoadChat(chat.id)}
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="truncate text-xs font-light max-w-[130px]" title={chat.title}>
                        {chat.title || "New Conversation"}
                    </span>
                </div>

                {/* Hover actions */}
                <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1 shrink-0 bg-transparent pl-1.5 transition-opacity">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePinChat(chat.id);
                        }}
                        className={cn(
                            "h-5 w-5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors text-fg-secondary/60 hover:text-fg dark:hover:text-white",
                            isPinned ? "text-purple-500 hover:text-purple-600 dark:text-purple-400" : ""
                        )}
                        title={isPinned ? "Unpin conversation" : "Pin conversation"}
                    >
                        <Pin className={cn("h-2.5 w-2.5", isPinned ? "fill-current" : "")} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChatClick(chat.id);
                        }}
                        className="h-5 w-5 rounded-md hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/20 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors text-fg-secondary/60"
                        title="Delete conversation"
                    >
                        <Trash2 className="h-2.5 w-2.5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full bg-transparent overflow-hidden animate-in fade-in duration-500 select-none">
            {/* Left Chat History Pane */}
            <div className="w-60 shrink-0 flex flex-col border-r border-black/[0.06] dark:border-white/5 p-4 space-y-4 overflow-hidden bg-black/[0.01]/40 dark:bg-white/[0.002]/10">
                <button 
                    onClick={handleNewChat}
                    className="w-full py-2.5 px-4 rounded-xl border border-black/[0.08] dark:border-white/10 text-xs font-semibold text-fg dark:text-white hover:bg-black/5 dark:hover:bg-white/5 bg-transparent transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <Plus className="h-3.5 w-3.5" />
                    New Chat
                </button>

                {/* Chat History List */}
                <div className="flex-1 overflow-y-auto space-y-5 pr-1 scroll-smooth scrollbar-thin">
                    {/* Pinned Section */}
                    {pinnedChats.length > 0 && (
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-semibold text-fg-secondary/50 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">Pinned</h4>
                            <div className="space-y-0.5">
                                {pinnedChats.map(c => renderChatListItem(c, true))}
                            </div>
                        </div>
                    )}

                    {/* Recents Section */}
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-semibold text-fg-secondary/50 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">Recents</h4>
                        <div className="space-y-0.5">
                            {recentChats.length === 0 && pinnedChats.length === 0 ? (
                                <p className="text-[11px] text-fg-secondary/40 dark:text-gray-500 font-light px-3 py-2">No active sessions.</p>
                            ) : (
                                recentChats.map(c => renderChatListItem(c, false))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Chat Workspace - Takes remaining full width */}
            <div className="flex-1 flex flex-col min-w-0 p-6 overflow-hidden justify-between relative bg-transparent select-text">
                {/* Message stream area */}
                <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto pr-2 scroll-smooth scrollbar-thin"
                >
                    {isHistoryLoading ? (
                        <div className="space-y-8 py-6 w-full">
                            <div className="flex gap-4">
                                <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                            <div className="flex gap-4 flex-row-reverse">
                                <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full space-y-6">
                            {isFetchingMore && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-fg-secondary/50" />
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex w-full group/msg animate-in fade-in duration-300",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {msg.role === 'user' ? (
                                        // User Question: Rounded pill aligned right
                                        <div className="flex flex-col items-end gap-1.5 max-w-[80%]">
                                            {editingMessageId === msg.id ? (
                                                <div className="flex flex-col gap-2 w-full min-w-[300px]">
                                                    <textarea
                                                        value={editInputValue}
                                                        onChange={(e) => setEditInputValue(e.target.value)}
                                                        className="w-full rounded-2xl bg-black/[0.04] dark:bg-white/10 text-fg dark:text-white px-4 py-3 text-sm font-medium leading-relaxed outline-none resize-none min-h-[80px]"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setEditingMessageId(null)} className="text-xs px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Cancel</button>
                                                        <button onClick={() => handleEditSubmit(msg.id!, i)} className="text-xs px-3 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-medium transition-colors">Save & Submit</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="group/edit relative flex items-center gap-2">
                                                    {msg.id && !isLoading && (
                                                        <button 
                                                            onClick={() => { setEditingMessageId(msg.id || null); setEditInputValue(msg.content); }}
                                                            className="opacity-0 group-hover/edit:opacity-100 transition-opacity p-1.5 text-fg-secondary/50 hover:text-fg hover:bg-black/5 dark:hover:bg-white/10 rounded-md"
                                                            title="Edit message"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                    )}
                                                    <div className="rounded-2xl bg-black/[0.04] dark:bg-white/10 text-fg dark:text-white px-4 py-2 text-sm font-medium leading-relaxed">
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Assistant Answer: Full width, left-aligned, no bubble background
                                        <div className="flex gap-4 w-full pr-4">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5 select-none mt-0.5">
                                                <BotLogo />
                                            </div>

                                            <div className="space-y-3 flex-1 min-w-0">
                                                {/* Conflict resolution banner */}
                                                {msg.conflictWarning && (
                                                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] p-3 text-xs text-amber-600 dark:text-amber-400 animate-in fade-in slide-in-from-top-1">
                                                        <span className="text-sm mt-0.5 select-none">⚠️</span>
                                                        <div>
                                                            <p className="font-semibold">Conflict Resolved</p>
                                                            <p className="font-light opacity-90 mt-0.5 leading-relaxed">{msg.conflictWarning}</p>
                                                            <p className="font-light opacity-60 mt-1 italic">Using team-approved database choice override.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Markdown Text Body */}
                                                <div className="text-sm text-fg dark:text-gray-100 font-light leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-0 first:prose-p:mt-0 last:prose-p:mb-0 prose-headings:font-normal prose-strong:font-semibold prose-code:text-xs">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    {msg.isStreaming && <span className="animate-pulse inline-block ml-0.5 text-purple-500 font-bold">▋</span>}
                                                </div>

                                                {/* Decision Supremacy Badge */}
                                                {!msg.isStreaming && msg.overridingDecision && (
                                                    <div className="flex items-center gap-2 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2 animate-in fade-in slide-in-from-top-1">
                                                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                                                        <span>Based on a more recent decision: <span className="font-semibold">"{msg.overridingDecision.title}"</span></span>
                                                        <span className="opacity-60">·</span>
                                                        <span className="opacity-70">{new Date(msg.overridingDecision.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                                        <span className="opacity-60">·</span>
                                                        <span className="opacity-70">by {msg.overridingDecision.author}</span>
                                                    </div>
                                                )}

                                                {/* Sources/Citations */}
                                                {!msg.isStreaming && msg.sources && msg.sources.length > 0 && (
                                                    <div className="pt-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            {msg.sources.map((s, si) => {
                                                                const chipClass = "inline-flex items-center gap-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5 px-2.5 py-1 text-[11px] text-fg-secondary dark:text-gray-400 select-none";
                                                                const inner = (
                                                                    <>
                                                                        <span className="font-mono text-[9px] opacity-50">[{si + 1}]</span>
                                                                        <span className="font-semibold capitalize text-[10px]">{s.provider}</span>
                                                                        <span className="opacity-40">·</span>
                                                                        <span className="truncate max-w-[120px] font-light" title={s.title}>{s.title}</span>
                                                                    </>
                                                                );
                                                                return s.url ? (
                                                                    <a
                                                                        key={si}
                                                                        href={s.url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className={chipClass + " hover:text-fg dark:hover:text-white transition-colors cursor-pointer"}
                                                                    >
                                                                        {inner}
                                                                    </a>
                                                                ) : (
                                                                    <span key={si} className={chipClass + " cursor-default"}>
                                                                        {inner}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Bookmark */}
                                                {!msg.isStreaming && i > 0 && (
                                                    <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 flex items-center pt-1.5">
                                                        <button 
                                                            onClick={() => handleSaveAsDecision(i)}
                                                            className="flex items-center gap-1.5 text-[11px] font-semibold text-fg-secondary hover:text-fg dark:text-gray-400 dark:hover:text-white transition-colors border-none bg-transparent cursor-pointer"
                                                        >
                                                            <BookmarkCheck className="h-3.5 w-3.5" />
                                                            Save as Decision
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* ChatGPT-style "Thinking" panel */}
                            {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                 <div className="flex gap-4 py-6 animate-in fade-in duration-300">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5">
                                        <BotLogo />
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center gap-2 text-xs text-fg-secondary dark:text-gray-400 font-semibold uppercase tracking-wider">
                                            <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
                                            <span>Thinking...</span>
                                        </div>
                                        <p className="text-[11px] text-fg-secondary/60 dark:text-gray-600 font-light">Querying vector index and checking team-defined database overrides.</p>
                                    </div>
                                 </div>
                            )}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Floating Full-Width Input bar */}
                <div className="pt-4 shrink-0 bg-transparent w-full">
                    <form 
                        onSubmit={handleSubmit} 
                        className="relative rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/40 dark:bg-white/[0.01] focus-within:border-black/20 dark:focus-within:border-white/20 transition-all backdrop-blur-md px-4 py-3 flex items-center gap-3 shadow-lg dark:shadow-2xl w-full"
                    >
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything..." 
                            className="flex-1 bg-transparent border-none text-sm text-fg dark:text-white placeholder:text-fg-secondary/50 focus:outline-none focus:ring-0 py-1.5 w-full"
                            disabled={isLoading}
                        />

                        {/* Send button */}
                        <button 
                            type="submit" 
                            disabled={isLoading || !input.trim()}
                            className={cn(
                                "h-8 w-8 rounded-xl flex items-center justify-center transition-all border-none cursor-pointer",
                                input.trim() 
                                    ? "bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95" 
                                    : "bg-black/[0.02] dark:bg-white/5 text-fg-secondary/35 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                    </form>
                    <p className="text-[10px] text-fg-secondary/40 dark:text-gray-600 text-center mt-3 font-light">
                        Memorix can make mistakes. Verify important details.
                    </p>
                </div>
            </div>

            {/* Save as Decision Dialog Modal */}
            {saveDialogOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSaveDialogOpen(false)}>
                    <div className="w-full max-w-md animate-in zoom-in-95 duration-200 border border-black/[0.06] dark:border-white/10 bg-white dark:bg-black/95 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/5 pb-3">
                            <h3 className="text-lg font-semibold dark:text-white">Save as Decision</h3>
                            <button onClick={() => setSaveDialogOpen(false)} className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center border-none bg-transparent cursor-pointer text-fg-secondary/80 focus:outline-none">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-fg-secondary dark:text-gray-400 uppercase tracking-wider">Decision Title</label>
                                <input 
                                    placeholder="e.g., 'Switching search framework to Vector Embeddings'" 
                                    value={decisionTitle}
                                    onChange={(e) => setDecisionTitle(e.target.value)}
                                    className="w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-transparent px-4 py-2.5 text-sm text-fg dark:text-white placeholder:text-fg-secondary/50 focus:border-purple-500 focus:outline-none transition-all duration-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-fg-secondary dark:text-gray-400 uppercase tracking-wider">Metadata Tags</label>
                                <input 
                                    placeholder="Comma separated, e.g., 'backend, scaling'" 
                                    value={decisionTags}
                                    onChange={(e) => setDecisionTags(e.target.value)}
                                    className="w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-transparent px-4 py-2.5 text-sm text-fg dark:text-white placeholder:text-fg-secondary/50 focus:border-purple-500 focus:outline-none transition-all duration-200"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 border-t border-black/[0.06] dark:border-white/5 pt-4">
                            <button 
                                onClick={() => setSaveDialogOpen(false)} 
                                className="px-4 py-2 text-xs font-semibold rounded-lg border border-black/[0.08] dark:border-white/10 text-fg-secondary hover:bg-black/5 dark:hover:bg-white/5 bg-transparent transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmSave} 
                                disabled={saveDecisionMutation.isPending || !decisionTitle} 
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer border-none"
                            >
                                {saveDecisionMutation.isPending ? (
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
                    </div>
                </div>
            )}

            {/* Custom Delete Chat Confirmation Modal */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)}>
                    <div className="w-full max-w-sm animate-in zoom-in-95 duration-200 border border-black/[0.06] dark:border-white/10 bg-white dark:bg-black/95 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/5 pb-2">
                            <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider">Delete Conversation</h3>
                            <button onClick={() => setDeleteConfirmOpen(false)} className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center border-none bg-transparent cursor-pointer text-fg-secondary/80 focus:outline-none">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <p className="text-xs text-fg-secondary dark:text-gray-400 font-light leading-relaxed">
                            Are you sure you want to delete this conversation? This action cannot be undone and will clear all message logs from your history.
                        </p>
                        
                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setDeleteConfirmOpen(false)} 
                                className="px-4 py-2 text-xs font-semibold rounded-lg border border-black/[0.08] dark:border-white/10 text-fg-secondary hover:bg-black/5 dark:hover:bg-white/5 bg-transparent transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmDeleteChat} 
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer border-none"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
