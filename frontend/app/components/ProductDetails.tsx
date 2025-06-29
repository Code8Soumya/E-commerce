import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "../lib/api";
import { getProductById } from "../lib/api";
import type { Product } from "../lib/types";
import ReactMarkdown from "react-markdown";

const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleAddToCart = async () => {
        if (!product) return;
        try {
            await api.addItemToCart(product.id, 1);
            navigate("/cart");
        } catch (error) {
            console.error("Failed to add item to cart", error);
            setError("Failed to add item to cart. Please try again.");
        }
    };

    const arrayBufferToBase64 = (buffer: number[]) => {
        if (!buffer || !Array.isArray(buffer)) {
            return "";
        }
        try {
            const binary = buffer.reduce(
                (acc, byte) => acc + String.fromCharCode(byte),
                ""
            );
            return btoa(binary);
        } catch (error) {
            return "";
        }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                const data = await getProductById(id);
                setProduct(data);
                if (data.images.length > 0) {
                    setSelectedImage(
                        `data:image/jpeg;base64,${arrayBufferToBase64(
                            data.images[0].imageData.data
                        )}`
                    );
                }
            } catch (err) {
                setError("Failed to fetch product details");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) {
        return <div className="text-center p-8">Loading product details...</div>;
    }

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }

    if (!product) {
        return <div className="text-center p-8">Product not found.</div>;
    }

    return (
        <div className="bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
                            <img
                                src={selectedImage || "https://via.placeholder.com/600"}
                                alt={product.title}
                                className="w-full h-[450px] object-contain"
                            />
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {product.images.map((image) => (
                                <button
                                    key={image.id}
                                    className={`block rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                        selectedImage ===
                                        `data:image/jpeg;base64,${arrayBufferToBase64(
                                            image.imageData.data
                                        )}`
                                            ? "border-primary ring-2 ring-primary"
                                            : "border-gray-200 hover:border-primary"
                                    }`}
                                    onClick={() =>
                                        setSelectedImage(
                                            `data:image/jpeg;base64,${arrayBufferToBase64(
                                                image.imageData.data
                                            )}`
                                        )
                                    }
                                >
                                    <img
                                        src={`data:image/jpeg;base64,${arrayBufferToBase64(
                                            image.imageData.data
                                        )}`}
                                        alt={`${product.title} thumbnail`}
                                        className="w-full h-24 object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Information */}
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
                            <ReactMarkdown>{product.title}</ReactMarkdown>
                        </h1>
                        <div className="prose prose-lg text-gray-600 mb-6 max-w-none">
                            <ReactMarkdown>{product.description}</ReactMarkdown>
                        </div>
                        
                        <div className="flex items-baseline mb-6">
                            <span className="text-5xl font-bold text-primary mr-3">
                                ${product.price.toFixed(2)}
                            </span>
                            <span className="text-lg text-gray-500">
                                ({product.stock} in stock)
                            </span>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={handleAddToCart}
                                className="btn btn-primary btn-lg w-full text-lg"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
