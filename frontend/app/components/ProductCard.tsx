import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import * as api from "../lib/api";
import type { Product } from "../lib/types";

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const navigate = useNavigate();

    const handleAddToCart = async () => {
        try {
            await api.addItemToCart(product.id, 1);
            // Optionally, show a success message or update cart state
            navigate("/cart");
        } catch (error) {
            console.error("Failed to add item to cart", error);
            // Optionally, show an error message to the user
        }
    };
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
        <div className="group flex w-full max-w-xs flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-md">
            <Link
                className="relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl"
                to={`/products/${product.id}`}
            >
                <img
                    className="absolute top-0 right-0 h-full w-full object-cover"
                    src={imageUrl}
                    alt={product.title}
                />
            </Link>
            <div className="mt-4 px-5 pb-5 flex flex-col flex-grow">
                <Link to={`/products/${product.id}`}>
                    <h5 className="text-xl tracking-tight text-slate-900 h-14 overflow-hidden">
                        {product.title}
                    </h5>
                </Link>
                <div className="mt-2 mb-5 flex items-center justify-between">
                    <p>
                        <span className="text-3xl font-bold text-slate-900">
                            ${product.price.toFixed(2)}
                        </span>
                    </p>
                </div>
                <button
                    onClick={handleAddToCart}
                    className="mt-auto flex items-center justify-center rounded-md bg-slate-900 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                    Add to cart
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
