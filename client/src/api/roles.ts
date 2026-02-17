import api from './client';

export interface Role {
    id: string;
    company_id: string;
    name: string;
    created_at: string;
}

export const getRoles = async (companyId: string): Promise<Role[]> => {
    const response = await api.get(`/roles?companyId=${companyId}`);
    return response.data;
};

export const createRole = async (companyId: string, name: string): Promise<Role> => {
    const response = await api.post('/roles', { companyId, name });
    return response.data;
};
