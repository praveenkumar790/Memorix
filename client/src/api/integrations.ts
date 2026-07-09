import api from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Integration = {
  id: string;
  provider: "notion" | "slack" | "confluence" | "github";
  workspace_name: string;
  status: "active" | "paused" | "error";
  created_at: string;
  updated_at: string;
};

export type IntegrationItem = {
  external_id: string;
  title: string;
  item_type: string;
  url?: string;
  external_updated_at?: string;
};

export type SyncJob = {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  progress: number;
  error?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
};

// ─── API Functions ────────────────────────────────────────────────────────────

/** List all connected integrations for the current user */
export const getIntegrations = (): Promise<Integration[]> =>
  api.get("/integrations").then((r) => r.data);

/** Browse available pages / channels from a connected provider */
export const getIntegrationItems = (id: string): Promise<IntegrationItem[]> =>
  api.get(`/integrations/${id}/items`).then((r) => r.data);

/** Start sync jobs for selected items. Returns job IDs for polling. */
export const syncItems = (
  id: string,
  items: IntegrationItem[]
): Promise<{ jobIds: string[]; message: string }> =>
  api.post(`/integrations/${id}/sync`, { items }).then((r) => r.data);

/** Poll a single sync job's current status */
export const getJobStatus = (jobId: string): Promise<SyncJob> =>
  api.get(`/integrations/jobs/${jobId}`).then((r) => r.data);

/** Disconnect an integration (cascades to secrets, items, jobs) */
export const disconnectIntegration = (id: string): Promise<{ message: string }> =>
  api.delete(`/integrations/${id}`).then((r) => r.data);
