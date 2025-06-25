import axios from "axios";
import type { Product } from "./types";

// Create an axios instance
const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

// Add a request interceptor to include JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const getProducts = async (): Promise<Product[]> => {
    const response = await api.get("/products");
    return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export default api;
