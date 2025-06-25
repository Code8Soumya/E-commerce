import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getProductById } from "../lib/api";
import type { Product } from "../lib/types";

const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
        <div className="bg-white">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                    <div>
                        <div className="bg-gray-100 rounded-lg shadow-md flex items-center justify-center h-96 mb-4">
                            <img
                                src={selectedImage || "https://via.placeholder.com/600"}
                                alt={product.title}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                        <div className="flex space-x-4">
                            {product.images.map((image) => (
                                <div
                                    key={image.id}
                                    className={`w-24 h-24 flex items-center justify-center rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                                        selectedImage ===
                                        `data:image/jpeg;base64,${arrayBufferToBase64(
                                            image.imageData.data
                                        )}`
                                            ? "border-primary shadow-lg"
                                            : "border-gray-200 hover:border-primary hover:shadow-md"
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
                                        alt={product.title}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-8">
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">
                            {product.title}
                        </h1>
                        <p className="text-gray-500 text-lg mb-6">
                            {product.description}
                        </p>
                        <div className="flex items-center mb-6">
                            <p className="text-4xl font-bold text-primary mr-4">
                                ${product.price}
                            </p>
                            <p className="text-gray-500">
                                <span className="font-semibold">Stock:</span>{" "}
                                {product.stock}
                            </p>
                        </div>
                        <hr className="my-8" />
                        <button className="btn btn-primary btn-lg w-full">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
