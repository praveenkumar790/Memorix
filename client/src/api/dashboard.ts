import api from "./client";

export type Stats = {
    documents: number;
    decisions: number;
    uploaded_documents?: number;
    integration_documents?: number;
};

export type ActivityItem = {
    id: string;
    type: 'document' | 'decision' | 'integration';
    label: string;
    meta: string;
    created_at: string;
};

export const fetchStats = async (): Promise<Stats> => {
    const response = await api.get("/dashboard/stats");
    return response.data;
};

export const fetchActivity = async (): Promise<ActivityItem[]> => {
    const response = await api.get("/dashboard/activity");
    return response.data;
};
