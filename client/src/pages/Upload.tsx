import { UploadCloud, File, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { uploadDocument, getDocuments, Document } from "@/api/documents";

const Upload = () => {
    const queryClient = useQueryClient();
    const { profile, isLoading: authLoading } = useAuth();
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
        queryKey: ["documents", profile?.workspace_id],
        queryFn: getDocuments,
        enabled: !authLoading && !!profile,
    });

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploadStatus('uploading');
        setErrorMessage("");
        
        try {
            await uploadDocument(file);
            setUploadStatus('success');
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            setTimeout(() => {
                setFile(null);
                setUploadStatus('idle');
            }, 2500);
        } catch (error: any) {
            console.error(error);
            setUploadStatus('error');
            if (error.response?.status === 429) {
                const errData = error.response.data;
                const time = new Date(errData.resetAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                setErrorMessage(`⚠️ Rate Limit Reached: ${errData.message} Try again at ${time}.`);
                setTimeout(() => setUploadStatus('idle'), 8000);
            } else {
                setErrorMessage(error.response?.data?.error || error.message || "Failed to upload file");
                setTimeout(() => setUploadStatus('idle'), 5000);
            }
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case 'indexed':
            case 'completed':
            case 'processed':
                return (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span>indexed</span>
                    </div>
                );
            case 'processing':
                return (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span>processing</span>
                    </div>
                );
            case 'failed':
                return (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        <span>failed</span>
                    </div>
                );
            case 'pending':
            default:
                return (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>pending</span>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-16">
            {/* Header Greeting */}
            <div className="space-y-1">
                <h1 className="text-3xl font-light tracking-tight text-fg dark:text-white">
                    Upload <span className="font-semibold">Documents</span>
                </h1>
                <p className="text-sm text-fg-secondary dark:text-gray-400 font-light">
                    Ingest corporate policies, diagrams, or memos into secure organizational memory.
                </p>
            </div>

            {/* Dropper Container */}
            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative border border-dashed rounded-2xl p-10 text-center transition-all duration-300 backdrop-blur-md select-none",
                    isDragging 
                        ? 'border-purple-500 bg-purple-500/[0.03] dark:bg-purple-500/[0.01] scale-[1.005]' 
                        : 'border-black/[0.08] dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-white/40 dark:bg-white/[0.02]',
                    uploadStatus === 'success' ? 'border-green-500/50 bg-green-500/[0.02]' : '',
                    uploadStatus === 'error' ? 'border-red-500/50 bg-red-500/[0.02]' : ''
                )}
            >
                <AnimatePresence mode="wait">
                    {uploadStatus === 'idle' && !file && (
                        <motion.div 
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center gap-5 py-4"
                        >
                            <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5 text-fg-secondary dark:text-gray-400">
                                <UploadCloud className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-fg dark:text-white">
                                    Drag and drop your file here
                                </p>
                                <p className="text-xs text-fg-secondary dark:text-gray-400 font-light">
                                    Supports PDF, DOCX, or TXT up to 10MB
                                </p>
                            </div>
                            <div className="relative mt-2">
                                <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-95 transition-opacity focus:outline-none cursor-pointer border-none">
                                    Browse Files
                                </button>
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={handleFileChange}
                                    accept=".pdf,.docx,.txt"
                                />
                            </div>
                        </motion.div>
                    )}

                    {file && uploadStatus !== 'success' && uploadStatus !== 'error' && (
                        <motion.div 
                            key="selected"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center gap-5 py-4"
                        >
                            <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5 text-fg dark:text-white">
                                <File className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold dark:text-white block max-w-sm truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-fg-secondary dark:text-gray-400 font-light">
                                    {formatBytes(file.size)}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setFile(null)}
                                    disabled={uploadStatus === 'uploading'}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-black/[0.08] dark:border-white/10 text-fg-secondary hover:bg-black/5 dark:hover:bg-white/5 bg-transparent transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleUpload} 
                                    disabled={uploadStatus === 'uploading'} 
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer border-none"
                                >
                                    {uploadStatus === 'uploading' ? (
                                        <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Ingesting...
                                        </>
                                    ) : (
                                        "Ingest Memory"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {uploadStatus === 'success' && (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center gap-4 py-4 text-green-600 dark:text-green-400"
                        >
                            <div className="p-3.5 rounded-full bg-green-500/10 border border-green-500/20">
                                <CheckCircle className="h-7 w-7" />
                            </div>
                            <p className="text-sm font-semibold">Memory successfully indexed</p>
                        </motion.div>
                    )}

                    {uploadStatus === 'error' && (
                        <motion.div 
                            key="error"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center gap-4 py-4 text-red-600 dark:text-red-400"
                        >
                            <div className="p-3.5 rounded-full bg-red-500/10 border border-red-500/20">
                                <AlertCircle className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">Ingestion Failed</p>
                                <p className="text-xs opacity-90 max-w-sm mx-auto">{errorMessage}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Uploaded Documents Feed Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold tracking-tight dark:text-white">Ingested Libraries</h3>
                
                {documentsLoading ? (
                    <div className="space-y-3">
                         {[1, 2, 3].map(i => (
                             <div key={i} className="flex items-center justify-between p-4 border border-black/[0.04] dark:border-white/5 rounded-xl bg-white/40 dark:bg-white/[0.01]">
                                 <div className="flex items-center gap-4">
                                     <div className="h-9 w-9 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] animate-pulse" />
                                     <div className="space-y-1.5">
                                         <div className="h-4 w-40 bg-black/[0.04] dark:bg-white/[0.04] rounded animate-pulse" />
                                         <div className="h-3 w-20 bg-black/[0.02] dark:bg-white/[0.02] rounded animate-pulse" />
                                     </div>
                                 </div>
                                 <div className="h-6 w-16 bg-black/[0.04] dark:bg-white/[0.04] rounded-full animate-pulse" />
                             </div>
                         ))}
                    </div>
                ) : !documents || documents.length === 0 ? (
                    <div className="text-center py-12 text-sm text-fg-secondary dark:text-gray-400 bg-white/30 dark:bg-white/[0.01] rounded-2xl border border-dashed border-black/[0.06] dark:border-white/5 font-light">
                        No libraries ingested into organizational memory yet.
                    </div>
                ) : (
                    <div className="divide-y divide-black/[0.06] dark:divide-white/5 border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.01] rounded-2xl overflow-hidden backdrop-blur-md px-6">
                        {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between py-4 group/doc transition-all duration-200">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5 text-fg-secondary dark:text-gray-400 shrink-0">
                                        <File className="h-4 w-4" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <span className="text-sm font-semibold dark:text-white block truncate max-w-md">
                                            {doc.filename}
                                        </span>
                                        <p className="text-[11px] text-fg-secondary dark:text-gray-400 font-light mt-0.5">
                                            Ingested on {new Date(doc.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6 shrink-0">
                                    {getStatusIndicator(doc.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Upload;
