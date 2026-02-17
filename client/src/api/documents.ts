import api from "./client";

export type Document = {
    id: string;
    filename: string;
    file_type: string;
    status: 'uploading' | 'processing' | 'indexed' | 'failed';
    created_at: string;
};

export const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/ingest", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const getDocuments = async (): Promise<Document[]> => {
    const response = await api.get("/documents");
    return response.data;
};
