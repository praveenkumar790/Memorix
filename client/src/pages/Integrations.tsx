import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plug,
  PlugZap,
  FileText,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getIntegrations,
  getIntegrationItems,
  syncItems,
  getJobStatus,
  disconnectIntegration,
  type Integration,
  type IntegrationItem,
  type SyncJob,
} from "@/api/integrations";

// ─── Provider Logos ───────────────────────────────────────────────────────────
const NotionLogo = () => (
  <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" alt="Notion" className="h-6 w-6 object-contain" />
);

const SlackLogo = () => (
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/slack/slack-original.svg" alt="Slack" className="h-6 w-6 object-contain" />
);

const ConfluenceLogo = () => (
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/confluence/confluence-original.svg" alt="Confluence" className="h-6 w-6 object-contain" />
);

const GitHubLogo = () => (
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg" alt="GitHub" className="h-7 w-7 object-contain dark:invert" />
);

const PROVIDERS = [
  {
    id: "notion",
    name: "Notion",
    logo: NotionLogo,
    description: "Sync pages and databases from your Notion workspace.",
    color: "bg-white border border-black/10 shadow-sm flex items-center justify-center",
    badge: "Available",
  },
  {
    id: "slack",
    name: "Slack",
    logo: SlackLogo,
    description: "Sync channel messages and threads from your Slack workspace.",
    color: "bg-white border border-black/10 shadow-sm flex items-center justify-center",
    badge: "Available",
  },
  {
    id: "confluence",
    name: "Confluence",
    logo: ConfluenceLogo,
    description: "Sync pages and spaces from your Atlassian Confluence.",
    color: "bg-white border border-black/10 shadow-sm flex items-center justify-center",
    badge: "Available",
  },
  {
    id: "github",
    name: "GitHub",
    logo: GitHubLogo,
    description: "Sync ADRs, READMEs, and architecture docs from your repositories.",
    color: "bg-white border border-black/10 shadow-sm flex items-center justify-center",
    badge: "Available",
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: Integration["status"] }) => {
  const config = {
    active: { color: "bg-green-500", text: "connected" },
    paused: { color: "bg-amber-500", text: "paused" },
    error: { color: "bg-red-500", text: "reconnect" },
  }[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-fg-secondary dark:text-gray-400 font-medium">
      <span className={cn("h-1.5 w-1.5 rounded-full", config.color)} />
      {config.text}
    </span>
  );
};

// ─── Job Progress Bar ─────────────────────────────────────────────────────────
const JobProgress = ({ job }: { job: SyncJob }) => {
  const statusConfig = {
    queued: { text: "Waiting in queue...", color: "bg-black/20 dark:bg-white/20" },
    running: { text: `Indexing... ${job.progress}%`, color: "bg-black dark:bg-white" },
    done: { text: "Sync complete!", color: "bg-green-500" },
    failed: { text: `Failed: ${job.error || "Unknown error"}`, color: "bg-red-500" },
  }[job.status];

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px] text-fg-secondary dark:text-gray-400 font-light">
        <span>{statusConfig.text}</span>
        <span>{job.progress}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-black/[0.04] dark:bg-white/5 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", statusConfig.color)}
          initial={{ width: 0 }}
          animate={{ width: `${job.status === "done" ? 100 : job.progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// ─── Connected Integration Panel ──────────────────────────────────────────────
const ConnectedPanel = ({
  integration,
  onDisconnect,
}: {
  integration: Integration;
  onDisconnect: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<IntegrationItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [jobs, setJobs] = useState<Record<string, SyncJob>>({});
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const provider = PROVIDERS.find((p) => p.id === integration.provider);
  const Logo = provider?.logo || NotionLogo;

  useEffect(() => {
    if (!expanded || items.length > 0) return;
    setLoadingItems(true);
    getIntegrationItems(integration.id)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoadingItems(false));
  }, [expanded, integration.id, items.length]);

  useEffect(() => {
    const activeJobIds = Object.entries(jobs)
      .filter(([, j]) => j.status === "queued" || j.status === "running")
      .map(([id]) => id);

    if (activeJobIds.length === 0) return;

    const interval = setInterval(async () => {
      const updates = await Promise.all(activeJobIds.map((id) => getJobStatus(id)));
      setJobs((prev) => {
        const next = { ...prev };
        updates.forEach((j) => (next[j.id] = j));
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [jobs]);

  const toggleItem = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSync = async () => {
    const toSync = items.filter((item) => selected.has(item.external_id));
    if (!toSync.length) return;

    setSyncing(true);
    try {
      const { jobIds } = await syncItems(integration.id, toSync);
      const initial: Record<string, SyncJob> = {};
      jobIds.forEach((id) => {
        initial[id] = { id, status: "queued", progress: 0, created_at: new Date().toISOString() };
      });
      setJobs((prev) => ({ ...prev, ...initial }));
      setSelected(new Set());
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setConfirmOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    setConfirmOpen(false);
    setDisconnecting(true);
    try {
      await disconnectIntegration(integration.id);
      onDisconnect();
    } catch (err) {
      console.error("Disconnect error:", err);
      setDisconnecting(false);
    }
  };

  const activeJobs = Object.values(jobs);
  const allDone = activeJobs.length > 0 && activeJobs.every((j) => j.status === "done" || j.status === "failed");

  return (
    <motion.div
      layout
      className="rounded-2xl border border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.01] overflow-hidden backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", provider?.color)}>
            <Logo />
          </div>
          <div>
            <p className="text-sm font-semibold text-fg dark:text-white">{integration.workspace_name}</p>
            <p className="text-[10px] text-fg-secondary dark:text-gray-500 capitalize tracking-wide font-mono mt-0.5">{integration.provider}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge status={integration.status} />
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-fg-secondary hover:text-fg dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Hide" : "Manage"}
          </button>
        </div>
      </div>

      {/* Expandable Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-black/[0.06] dark:border-white/5 px-6 py-5 space-y-5">
              {/* Active Jobs */}
              {activeJobs.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-secondary dark:text-gray-500">Sync Progress</p>
                  <div className="space-y-3">
                    {activeJobs.map((job) => (
                      <JobProgress key={job.id} job={job} />
                    ))}
                  </div>
                  {allDone && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> All items synced. Ask about them in Chat!
                    </p>
                  )}
                </div>
              )}

              {/* Items List */}
              {loadingItems ? (
                <div className="flex items-center gap-2 py-4 text-xs text-fg-secondary dark:text-gray-400 font-light">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading files from {integration.workspace_name}...
                </div>
              ) : items.length === 0 ? (
                <p className="text-xs text-fg-secondary dark:text-gray-400 font-light py-2">
                  No pages found. Make sure you've shared pages with your Notion integration.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-secondary dark:text-gray-500">
                      Pages ({items.length})
                    </p>
                    <button
                      className="text-xs text-fg-secondary hover:text-fg dark:text-gray-400 dark:hover:text-white font-semibold cursor-pointer border-none bg-transparent"
                      onClick={() =>
                        setSelected(
                          selected.size === items.length
                            ? new Set()
                            : new Set(items.map((i) => i.external_id))
                        )
                      }
                    >
                      {selected.size === items.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/5 rounded-xl border border-black/[0.06] dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.005] px-4">
                    {items.map((item) => {
                      const isSelected = selected.has(item.external_id);
                      return (
                        <button
                          key={item.external_id}
                          onClick={() => toggleItem(item.external_id)}
                          className="w-full flex items-center gap-3 py-3 text-left transition-colors cursor-pointer border-none bg-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.01] -mx-4 px-4 first:rounded-t-xl last:rounded-b-xl"
                        >
                          <div className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                            isSelected
                              ? "bg-black dark:bg-white border-black dark:border-white"
                              : "border-black/20 dark:border-white/10"
                          )}>
                            {isSelected && <Check className="h-2.5 w-2.5 text-white dark:text-black stroke-[3px]" />}
                          </div>
                          <FileText className="h-3.5 w-3.5 shrink-0 text-fg-secondary/70 dark:text-gray-400" />
                          <span className="truncate text-xs text-fg dark:text-gray-200 font-light">{item.title}</span>
                          {item.external_updated_at && (
                            <span className="ml-auto shrink-0 text-[10px] text-fg-secondary/80 dark:text-gray-400 font-light">
                              {new Date(item.external_updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/5">
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
                >
                  {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
                  Disconnect
                </button>

                <button
                  onClick={handleSync}
                  disabled={selected.size === 0 || syncing}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold border-none cursor-pointer transition-all",
                    selected.size > 0 && !syncing
                      ? "bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95"
                      : "bg-black/[0.02] dark:bg-white/5 text-fg-secondary/50 dark:text-gray-500 cursor-not-allowed"
                  )}
                >
                  {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  {syncing ? "Starting..." : `Sync ${selected.size > 0 ? `${selected.size} item${selected.size !== 1 ? "s" : ""}` : "Selected"}`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Disconnect Confirmation Modal */}
      {confirmOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setConfirmOpen(false)}
        >
          <div 
            className="w-full max-w-sm animate-in zoom-in-95 duration-200 border border-black/[0.06] dark:border-white/10 bg-white dark:bg-black/95 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/5 pb-2">
              <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider">Disconnect Integration</h3>
              <button 
                onClick={() => setConfirmOpen(false)}
                className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center border-none bg-transparent cursor-pointer text-fg-secondary/80 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-fg-secondary dark:text-gray-400 font-light leading-relaxed">
              Disconnect {integration.workspace_name}? Synced content will remain in your knowledge base.
            </p>
            
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setConfirmOpen(false)} 
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-black/[0.08] dark:border-white/10 text-fg-secondary hover:bg-black/5 dark:hover:bg-white/5 bg-transparent transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDisconnect} 
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer border-none"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Integrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");

    if (connected) {
      console.log(`Successfully connected ${connected}`);
      window.history.replaceState({}, "", "/integrations");
    }
    if (error) {
      console.error(`Integration error: ${error}`);
      window.history.replaceState({}, "", "/integrations");
    }
  }, []);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const connectedProviderIds = integrations.map((i) => i.provider);

  const handleConnectProvider = async (providerId: string) => {
    try {
      const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
      if (!session) {
        alert("You must be logged in to connect integrations. Please refresh and try again.");
        return;
      }
      window.location.href = `${import.meta.env.VITE_API_URL}/api/integrations/${providerId}/connect?userId=${session.user.id}`;
    } catch (err) {
      console.error(`Error connecting to ${providerId}:`, err);
      alert(`Failed to start ${providerId} connection. Please try again.`);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-16">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-light tracking-tight text-fg dark:text-white">
          Active <span className="font-semibold">Integrations</span>
        </h1>
        <p className="text-sm text-fg-secondary dark:text-gray-400 font-light">
          Connect your organization's tools. Memorix will sync, embed, and answer queries from their libraries.
        </p>
      </div>

      {/* Connected Integrations */}
      {!loading && integrations.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-fg-secondary dark:text-gray-500">
            Connected ({integrations.length})
          </h2>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <ConnectedPanel
                key={integration.id}
                integration={integration}
                onDisconnect={fetchIntegrations}
              />
            ))}
          </div>
        </section>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-black/[0.04] dark:border-white/5 bg-white/40 dark:bg-white/[0.01] animate-pulse" />
          ))}
        </div>
      )}

      {/* Available Providers */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-fg-secondary dark:text-gray-500">
          Available Sources
        </h2>
        <div className="grid gap-4">
          {PROVIDERS.map((provider) => {
            const isConnected = connectedProviderIds.includes(provider.id as any);
            const isAvailable = provider.badge === "Available";
            const Logo = provider.logo;

            return (
              <motion.div
                key={provider.id}
                className={cn(
                  "relative flex items-center gap-4 rounded-2xl border p-5 transition-all duration-300",
                  isConnected
                    ? "border-green-500/20 bg-green-500/[0.01] dark:bg-green-500/[0.005]"
                    : isAvailable
                    ? "border-black/[0.06] dark:border-white/5 bg-white/40 dark:bg-white/[0.02] hover:border-black/20 dark:hover:border-white/10"
                    : "border-black/[0.04] dark:border-white/[0.02] bg-black/[0.01] dark:bg-white/[0.005] opacity-55"
                )}
              >
                {/* Provider Logo */}
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm text-lg", provider.color)}>
                  <Logo />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-fg dark:text-white">{provider.name}</p>
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1 rounded bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-2.5 w-2.5" /> connected
                      </span>
                    ) : (
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-semibold",
                        isAvailable
                          ? "bg-black/[0.04] dark:bg-white/5 text-fg-secondary dark:text-gray-400 border border-black/[0.06] dark:border-white/5"
                          : "bg-black/[0.02] dark:bg-white/5 text-fg-secondary/50 dark:text-gray-500"
                      )}>
                        {provider.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-fg-secondary dark:text-gray-400 font-light leading-relaxed">{provider.description}</p>
                </div>

                {/* Action Button */}
                <div className="shrink-0">
                  {isConnected ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/25">
                      <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
                    </div>
                  ) : isAvailable ? (
                    <button
                      onClick={() => handleConnectProvider(provider.id)}
                      className="flex items-center gap-2 rounded-lg bg-black dark:bg-white hover:opacity-90 active:scale-95 px-4 py-2 text-xs font-semibold text-white dark:text-black shadow-sm transition-all border-none cursor-pointer"
                    >
                      <Plug className="h-3.5 w-3.5" />
                      Connect
                    </button>
                  ) : (
                    <button
                      disabled
                      className="rounded-lg bg-black/[0.02] dark:bg-white/5 px-4 py-2 text-xs font-semibold text-fg-secondary/40 cursor-not-allowed border-none"
                    >
                      Soon
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Info Notice */}
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/5 bg-white/30 dark:bg-white/[0.01] px-6 py-5 backdrop-blur-sm">
        <div className="flex gap-4">
          <span className="text-lg">💡</span>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary dark:text-gray-400">Sync Mechanics</p>
            <p className="text-xs text-fg-secondary/80 dark:text-gray-400/80 font-light leading-relaxed">
              After connecting, select the workspaces or channels you want to sync and click <strong>Sync Selected</strong>.
              Memorix will parse and index the content into vector spaces. Synced sources are automatically referenced in the search results dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
