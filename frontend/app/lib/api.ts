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
            config.headers = config.headers ?? {};
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Public product endpoints
export const getProducts = async (): Promise<Product[]> => {
    const response = await api.get("/products");
    return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

// User-specific product endpoints
export const getMyProducts = async (): Promise<Product[]> => {
    const response = await api.get("/products/myproducts");
    return response.data;
};

export const addProduct = async (product: {
    title: string;
    description: string;
    price: number;
    stock: number;
    images: File[];
}): Promise<Product> => {
    const formData = new FormData();
    formData.append("title", product.title);
    formData.append("description", product.description);
    formData.append("price", product.price.toString());
    formData.append("stock", product.stock.toString());
    product.images.forEach((file) => formData.append("images", file));
    const response = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const updateProduct = async (
    id: number,
    data: {
        title?: string;
        description?: string;
        price?: number;
        stock?: number;
        images?: File[];
    }
): Promise<Product> => {
    const formData = new FormData();
    if (data.title !== undefined) formData.append("title", data.title);
    if (data.description !== undefined)
        formData.append("description", data.description);
    if (data.price !== undefined)
        formData.append("price", data.price.toString());
    if (data.stock !== undefined)
        formData.append("stock", data.stock.toString());
    if (data.images && data.images.length > 0) {
        data.images.forEach((file) => formData.append("images", file));
    }
    const response = await api.put(`/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
};
 
export const generateTitle = async (images: File[], userInput: string): Promise<{ text: string }> => {
    const formData = new FormData();
    images.forEach((file) => formData.append("images", file));
    formData.append("userInput", userInput);
    const response = await api.post("/products/generate-title", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};
 
export const generateDescription = async (images: File[], userInput: string): Promise<{ text: string }> => {
    const formData = new FormData();
    images.forEach((file) => formData.append("images", file));
    formData.append("userInput", userInput);
    const response = await api.post("/products/generate-description", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};
 
export default api;
