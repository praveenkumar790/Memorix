import api from "./client";

export type Decision = {
    id: string;
    title: string;
    content: string;
    tags?: string[];
    context_doc_id?: string;
    created_at: string;
    profiles?: { full_name: string };
};

export const createDecision = async (data: { title: string; content: string; tags?: string[]; contextDocId?: string }) => {
    const response = await api.post("/decisions", data);
    return response.data;
};

export const fetchDecisions = async (limit = 20, offset = 0) => {
    const response = await api.get("/decisions", { params: { limit, offset } });
    return response.data;
};
