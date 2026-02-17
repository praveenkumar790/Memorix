import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, MessageSquare, FileText, Activity, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchActivity } from "@/api/dashboard";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
    const { profile, isLoading: authLoading } = useAuth();
    
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["dashboard-stats", profile?.role_id], // Include role_id to prevent cache sharing
        queryFn: fetchStats,
        enabled: !authLoading && !!profile, // Only run when auth is ready
    });

    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ["dashboard-activity", profile?.role_id], // Include role_id to prevent cache sharing
        queryFn: fetchActivity,
        enabled: !authLoading && !!profile, // Only run when auth is ready
    });

    const stats = [
        { 
            label: "Documents Indexed", 
            value: statsLoading ? "..." : statsData?.documents || 0, 
            icon: FileText, 
            desc: "Total uploaded" 
        },
        { 
            label: "Decisions Saved", 
            value: statsLoading ? "..." : statsData?.decisions || 0, 
            icon: Activity, 
            desc: "Total logged" 
        },
    ];

    const actions = [
        { 
            title: "Upload Document", 
            desc: "Ingest new PDF policies or technical docs.", 
            icon: UploadCloud, 
            href: "/upload",
            bg: "bg-fg",
            text: "text-bg"
        },
        { 
            title: "Ask a Question", 
            desc: "Query your knowledge base with AI.", 
            icon: MessageSquare, 
            href: "/chat",
            bg: "bg-white",
            text: "text-fg"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-fg dark:text-white">Dashboard</h1>
                <p className="text-fg-secondary dark:text-gray-400">Overview of your organizational memory.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="shadow-sm hover:shadow-md transition-shadow duration-200 border-border/60 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-fg-secondary dark:text-gray-400">
                                {stat.label}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-fg-secondary dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold dark:text-white">{stat.value}</div>
                            <p className="text-xs text-fg-secondary dark:text-gray-400 mt-1">
                                {stat.desc}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {actions.map((action) => (
                    <Link to={action.href} key={action.title} className="group block">
                        <div className={`rounded-xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                            action.bg === 'bg-white' 
                                ? 'bg-white dark:bg-gray-900 border-border/60 dark:border-gray-800' 
                                : 'bg-gradient-to-br from-blue-600 to-purple-600 border-transparent text-white'
                        }`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg transition-transform group-hover:scale-110 ${
                                    action.bg === 'bg-white' 
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                        : 'bg-white/20 text-white backdrop-blur-sm'
                                }`}>
                                    <action.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${action.bg === 'bg-white' ? 'text-fg dark:text-white' : 'text-white'}`}>
                                        {action.title}
                                    </h3>
                                    <p className={`text-sm ${action.bg === 'bg-white' ? 'text-fg-secondary dark:text-gray-400' : 'text-blue-100'}`}>
                                        {action.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4 text-fg dark:text-white">Recent Activity</h2>
                <Card className="shadow-sm border-border/60 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50 dark:divide-gray-800/50">
                            {activityLoading ? (
                                <div className="p-12 text-center text-fg-secondary dark:text-gray-400">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
                                    <p>Loading activity...</p>
                                </div>
                            ) : activityData?.length === 0 ? (
                                <div className="p-12 text-center text-fg-secondary dark:text-gray-400">
                                    No recent activity found.
                                </div>
                            ) : (
                                activityData?.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 px-6 hover:bg-bg-secondary/50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-2.5 w-2.5 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ${item.type === 'decision' ? 'bg-blue-500 ring-blue-100 dark:ring-blue-900/30' : 'bg-green-500 ring-green-100 dark:ring-green-900/30'}`} />
                                            <div>
                                                <p className="text-sm font-semibold text-fg dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.label}</p>
                                                <div className="flex items-center gap-2 text-xs text-fg-secondary dark:text-gray-400 mt-0.5">
                                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{item.meta}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
