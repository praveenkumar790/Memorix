import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, File, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

import { uploadDocument, getDocuments, Document } from "@/api/documents";

const Upload = () => {
    const queryClient = useQueryClient();
    const { profile, isLoading: authLoading } = useAuth();
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
        queryKey: ["documents", profile?.role_id], // Include role_id to prevent cache sharing
        queryFn: getDocuments,
        enabled: !authLoading && !!profile, // Only run when auth is ready
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
            // Refresh documents list
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            setTimeout(() => {
                setFile(null);
                setUploadStatus('idle');
            }, 3000);
        } catch (error: any) {
            console.error(error);
            setUploadStatus('error');
            setErrorMessage(error.response?.data?.error || error.message || "Failed to upload file");
            setTimeout(() => setUploadStatus('idle'), 5000);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="text-xs text-green-600 dark:text-green-400 font-medium px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded-full">Processed</span>;
            case 'processing':
                return <span className="text-xs text-blue-600 dark:text-blue-400 font-medium px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">Processing</span>;
            case 'failed':
                return <span className="text-xs text-red-600 dark:text-red-400 font-medium px-2 py-1 bg-red-50 dark:bg-red-900/30 rounded-full">Failed</span>;
            case 'pending':
                return <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium px-2 py-1 bg-yellow-50 dark:bg-yellow-900/30 rounded-full">Pending</span>;
            default:
                return <span className="text-xs text-gray-600 dark:text-gray-400 font-medium px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-full">{status}</span>;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-fg dark:text-white">Upload Documents</h1>
                <p className="text-fg-secondary dark:text-gray-400">Add PDF policies, architectural diagrams, or meeting notes.</p>
            </div>

            <Card className="shadow-md border-border/60 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>File Upload</CardTitle>
                    <CardDescription>Drag and drop your files here or click to browse.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div 
                        className={`
                            border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
                            ${isDragging 
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]' 
                                : 'border-border dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-bg-secondary/50 dark:hover:bg-gray-800'
                            }
                            ${uploadStatus === 'success' ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20' : ''}
                            ${uploadStatus === 'error' ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20' : ''}
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {uploadStatus === 'idle' && !file && (
                            <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-2">
                                <div className="p-4 rounded-full bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 mb-2">
                                    <UploadCloud className="h-10 w-10" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-fg dark:text-white">Drag & drop files here</p>
                                    <p className="text-sm text-fg-secondary dark:text-gray-400 mt-1">PDF, DOCX, TXT up to 10MB</p>
                                </div>
                                <div className="relative mt-2">
                                    <Button variant="outline" className="relative z-10">
                                        Browse Files
                                    </Button>
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                                        onChange={handleFileChange}
                                        accept=".pdf,.docx,.txt"
                                    />
                                </div>
                            </div>
                        )}

                        {file && uploadStatus !== 'success' && uploadStatus !== 'error' && (
                            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
                                <div className="p-4 rounded-full bg-bg-secondary dark:bg-gray-800">
                                    <File className="h-10 w-10 text-fg dark:text-gray-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium dark:text-white text-lg">{file.name}</p>
                                    <p className="text-xs text-fg-secondary dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <Button onClick={handleUpload} disabled={uploadStatus === 'uploading'} className="min-w-[140px]">
                                    {uploadStatus === 'uploading' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Upload & Ingest"
                                    )}
                                </Button>
                            </div>
                        )}

                        {uploadStatus === 'success' && (
                            <div className="flex flex-col items-center gap-4 text-green-600 dark:text-green-400 animate-in zoom-in-95">
                                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                                    <CheckCircle className="h-10 w-10" />
                                </div>
                                <p className="text-lg font-medium">File successfully indexed!</p>
                            </div>
                        )}

                        {uploadStatus === 'error' && (
                            <div className="flex flex-col items-center gap-4 text-red-600 dark:text-red-400 animate-in zoom-in-95">
                                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                                    <AlertCircle className="h-10 w-10" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium">Upload failed</p>
                                    <p className="text-sm mt-1 opacity-90">{errorMessage}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-xl font-bold dark:text-white">Uploaded Documents</h3>
                {documentsLoading ? (
                    <div className="space-y-3">
                         {[1, 2, 3].map(i => (
                             <div key={i} className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-800/50">
                                 <div className="flex items-center gap-4">
                                     <Skeleton className="h-10 w-10 rounded-lg" />
                                     <div className="space-y-2">
                                         <Skeleton className="h-4 w-48" />
                                         <Skeleton className="h-3 w-24" />
                                     </div>
                                 </div>
                                 <Skeleton className="h-6 w-20 rounded-full" />
                             </div>
                         ))}
                    </div>
                ) : documents?.length === 0 ? (
                    <div className="text-center py-12 text-fg-secondary dark:text-gray-400 bg-bg-secondary/30 dark:bg-gray-800/30 rounded-xl border border-dashed border-border dark:border-gray-700">
                        No documents uploaded yet.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {documents?.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/80 border border-border/60 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-lg bg-bg-secondary dark:bg-gray-700">
                                        <File className="h-5 w-5 text-fg-secondary dark:text-gray-300" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold dark:text-white block">{doc.filename}</span>
                                        <p className="text-xs text-fg-secondary dark:text-gray-400 mt-0.5">
                                            {new Date(doc.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                {getStatusBadge(doc.status)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Upload;
