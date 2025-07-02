import axios from "axios";
import type { Product } from "./types";

// Create an axios instance
const api = axios.create({
    baseURL: "https://el6a2e8kbg.execute-api.ap-south-1.amazonaws.com/api",
});

// Add a request interceptor to include JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            if (isTokenExpired(token)) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return Promise.reject(new Error("Token expired"));
            }
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
    if (data.description !== undefined) formData.append("description", data.description);
    if (data.price !== undefined) formData.append("price", data.price.toString());
    if (data.stock !== undefined) formData.append("stock", data.stock.toString());
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

export const generateTitle = async (
    images: File[],
    userInput: string
): Promise<{ text: string }> => {
    const formData = new FormData();
    images.forEach((file) => formData.append("images", file));
    formData.append("userInput", userInput);
    const response = await api.post("/products/generate-title", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const generateDescription = async (
    images: File[],
    userInput: string
): Promise<{ text: string }> => {
    const formData = new FormData();
    images.forEach((file) => formData.append("images", file));
    formData.append("userInput", userInput);
    const response = await api.post("/products/generate-description", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const searchProducts = async (
    query: string,
    limit?: number
): Promise<Product[]> => {
    const response = await api.post("/products/search", { query, limit });
    // The backend returns { products: [], total: 0 } when no products are found,
    // and an array of products directly when products are found.
    // We need to handle both cases to ensure searchResults is always an array.
    if (
        response.data &&
        typeof response.data === "object" &&
        "products" in response.data &&
        Array.isArray(response.data.products)
    ) {
        return response.data.products;
    }
    return response.data; // This will be an array if products were found directly
};

import type { CartWithItems } from "./types";

export const getCart = async (): Promise<CartWithItems> => {
    const response = await api.get("/cart");
    return response.data;
};

export const addItemToCart = async (
    productId: number,
    quantity: number
): Promise<CartWithItems> => {
    const response = await api.post("/cart/items", { productId, quantity });
    return response.data;
};

export const updateCartItem = async (
    itemId: number,
    quantity: number
): Promise<CartWithItems> => {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
};

export const removeCartItem = async (itemId: number): Promise<CartWithItems> => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
};

export const clearCart = async (): Promise<CartWithItems> => {
    const response = await api.delete("/cart");
    return response.data;
};
export function isTokenExpired(token: string): boolean {
    if (typeof window === "undefined") {
        // Skip expiry check during SSR
        return false;
    }
    try {
        const payloadBase64 = token.split(".")[1];
        const decodedStr = atob(payloadBase64);
        const { exp } = JSON.parse(decodedStr) as { exp: number };
        return Date.now() / 1000 >= exp;
    } catch {
        return true;
    }
}

export default api;
