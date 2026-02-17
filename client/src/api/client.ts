import axios from "axios";
import { supabase } from "@/lib/supabase";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api` || "http://localhost:3002/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor to add Supabase JWT
api.interceptors.request.use(async (config) => {
    // Get the current session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
