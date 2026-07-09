import { FileText, Activity, Loader2, ArrowRight, UploadCloud, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchActivity } from "@/api/dashboard";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
    const { profile, isLoading: authLoading } = useAuth();
    
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["dashboard-stats", profile?.workspace_id],
        queryFn: fetchStats,
        enabled: !authLoading && !!profile,
    });

    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ["dashboard-activity", profile?.workspace_id],
        queryFn: fetchActivity,
        enabled: !authLoading && !!profile,
    });

    const isEmptyState = !statsLoading && statsData?.documents === 0;

    if (isEmptyState) {
        return (
            <div className="space-y-10 animate-in fade-in duration-500 pb-16">
                <div className="space-y-2 mt-8">
                    <h1 className="text-4xl font-light tracking-tight text-fg dark:text-white">
                        Welcome to Memorix, {profile?.full_name?.split(' ')[0] || "User"}.
                    </h1>
                    {profile?.role === 'personal' ? (
                        <p className="text-lg text-fg-secondary">Upload your first document or connect GitHub to get started.</p>
                    ) : (
                        <p className="text-lg text-fg-secondary">Upload your first document and invite your team to {profile?.workspace_name || "your workspace"}.</p>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Upload Action */}
                    <Link to="/upload" className="group block">
                        <div className="relative rounded-2xl border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/80 dark:hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/[0.02] hover:-translate-y-0.5 h-full">
                            <div className="space-y-3">
                                <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <UploadCloud className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-medium tracking-tight text-fg">Upload a File</h3>
                                <p className="text-sm text-fg-secondary">PDFs, Markdown, or code files.</p>
                            </div>
                        </div>
                    </Link>

                    {/* Connect GitHub */}
                    <Link to="/integrations" className="group block">
                        <div className="relative rounded-2xl border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/80 dark:hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/[0.02] hover:-translate-y-0.5 h-full">
                            <div className="space-y-3">
                                <div className="p-3 w-fit rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-fg-secondary group-hover:text-fg transition-colors duration-300">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-medium tracking-tight text-fg">Connect GitHub</h3>
                                <p className="text-sm text-fg-secondary">Sync your ADRs and Architecture docs.</p>
                            </div>
                        </div>
                    </Link>

                    {/* Invite Teammates (Only for teams) */}
                    {profile?.role === 'team' && (
                        <div className="group block cursor-pointer">
                            <div className="relative rounded-2xl border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/80 dark:hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/[0.02] hover:-translate-y-0.5 h-full flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="p-3 w-fit rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-fg-secondary group-hover:text-fg transition-colors duration-300">
                                        <Activity className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-medium tracking-tight text-fg">Invite Teammates <ArrowRight className="inline h-4 w-4 ml-1" /></h3>
                                    <p className="text-sm text-fg-secondary">Knowledge is better shared.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-16">
            {/* Header / Greeting */}
            <div className="space-y-1">
                <h1 className="text-4xl font-light tracking-tight text-fg dark:text-white">
                    Welcome back, {profile?.full_name?.split(' ')[0] || "User"}.
                </h1>
                <p className="text-sm text-fg-secondary">
                    Here is the current state of your organizational memory.
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Documents Stats Card */}
                <div className="group relative rounded-2xl border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/[0.04]">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-fg-secondary">Documents Indexed</span>
                        <FileText className="h-4 w-4 text-fg-secondary/60" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-5xl font-light tracking-tight text-fg">
                            {statsLoading ? "..." : statsData?.documents || 0}
                        </span>
                        <span className="text-xs text-fg-secondary font-medium">
                            {statsData && (statsData.integration_documents ?? 0) > 0
                                ? `${statsData.uploaded_documents ?? 0} uploaded · ${statsData.integration_documents} from integrations`
                                : 'total files'
                            }
                        </span>
                    </div>
                </div>

                {/* Decisions Stats Card */}
                <div className="group relative rounded-2xl border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/[0.04]">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-fg-secondary">Decisions Saved</span>
                        <Activity className="h-4 w-4 text-fg-secondary/60" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-5xl font-light tracking-tight text-fg">
                            {statsLoading ? "..." : statsData?.decisions || 0}
                        </span>
                        <span className="text-xs text-fg-secondary font-medium">active overrides</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Upload Action */}
                <Link to="/upload" className="group block">
                    <div className="relative rounded-2xl border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/80 dark:hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/[0.02] hover:-translate-y-0.5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-3">
                                <div className="p-3 w-fit rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-fg-secondary group-hover:text-fg transition-colors duration-300">
                                    <UploadCloud className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-medium tracking-tight text-fg">Upload Document</h3>
                                <p className="text-sm text-fg-secondary max-w-[280px] leading-relaxed">
                                    Ingest policies, guidelines, or Slack history to synchronize your knowledge base.
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-fg-secondary/40 group-hover:text-fg group-hover:translate-x-1 transition-all duration-300 mt-1" />
                        </div>
                    </div>
                </Link>

                {/* Chat Action */}
                <Link to="/chat" className="group block">
                    <div className="relative rounded-2xl border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/80 dark:hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/[0.02] hover:-translate-y-0.5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-3">
                                <div className="p-3 w-fit rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-fg-secondary group-hover:text-fg transition-colors duration-300">
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-medium tracking-tight text-fg">Ask a Question</h3>
                                <p className="text-sm text-fg-secondary max-w-[280px] leading-relaxed">
                                    Query your vectorized organizational memory and retrieve direct answers instantly.
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-fg-secondary/40 group-hover:text-fg group-hover:translate-x-1 transition-all duration-300 mt-1" />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Activity Stream Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-medium tracking-tight text-fg">Recent Activity</h2>
                <div className="rounded-2xl border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.02] overflow-hidden">
                    {activityLoading ? (
                        <div className="py-16 text-center text-fg-secondary">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3 text-fg-secondary/60" />
                            <p className="text-xs">Loading activity feed...</p>
                        </div>
                    ) : activityData?.length === 0 ? (
                        <div className="py-16 text-center text-sm text-fg-secondary">
                            No recent updates or uploads.
                        </div>
                    ) : (
                        <div className="divide-y divide-black/[0.06] dark:divide-white/5">
                            {activityData?.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-5 px-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.01] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <span className={`h-2 w-2 rounded-full ${
                                            item.type === 'decision' ? 'bg-blue-500' :
                                            item.type === 'integration' ? 'bg-purple-500' :
                                            'bg-green-500'
                                        }`} />
                                        <div>
                                            <p className="text-sm font-medium text-fg">{item.label}</p>
                                            <p className="text-xs text-fg-secondary mt-0.5">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.05] px-2.5 py-0.5 font-mono text-[9px] text-fg-secondary">
                                        {item.meta}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
