import React from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import type { Product } from "../lib/types";

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const arrayBufferToBase64 = (buffer: number[]) => {
        if (!buffer || !Array.isArray(buffer)) return "";
        try {
            const binary = buffer.reduce(
                (acc, byte) => acc + String.fromCharCode(byte),
                ""
            );
            return btoa(binary);
        } catch {
            return "";
        }
    };

    const imageUrl =
        product.images.length > 0
            ? `data:image/jpeg;base64,${arrayBufferToBase64(
                  product.images[0].imageData.data
              )}`
            : "https://via.placeholder.com/300";

    return (
        <div className="group flex flex-col bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <Link to={`/products/${product.id}`} className="block">
                <div className="relative overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={product.title}
                        className="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4">
                        <h3 className="text-white text-xl font-bold line-clamp-1">
                            {product.title}
                        </h3>
                    </div>
                </div>
            </Link>
            <div className="p-5 flex flex-col flex-grow">
                <div className="prose prose-sm text-gray-600 mb-4 h-12 overflow-hidden">
                    <ReactMarkdown>{product.description}</ReactMarkdown>
                </div>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-bold text-primary">
                        ${product.price.toFixed(2)}
                    </span>
                </div>
            </div>
            <div className="p-5 border-t border-gray-200">
                <Link
                    to={`/products/${product.id}`}
                    className="block w-full text-center bg-primary text-white font-semibold py-2 rounded-md hover:bg-primary-dark transition-colors duration-300"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
};

export default ProductCard;
