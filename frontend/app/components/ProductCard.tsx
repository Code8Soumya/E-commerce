import React from "react";
import { Link } from "react-router-dom";
import type { Product } from "../lib/types";

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
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

    const imageUrl =
        product.images.length > 0
            ? `data:image/jpeg;base64,${arrayBufferToBase64(
                  product.images[0].imageData.data
              )}`
            : "https://via.placeholder.com/300";

    return (
        <Link
            to={`/products/${product.id}`}
            className="group block rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
        >
            <div className="relative product-card-image">
                <img
                    src={imageUrl}
                    alt={product.title}
                    className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-0 left-0 p-4 z-10">
                    <h3 className="text-white text-lg font-bold">{product.title}</h3>
                </div>
            </div>
            <div className="p-4 bg-white">
                <p className="text-gray-700 text-sm mb-2">
                    {product.description.substring(0, 100)}...
                </p>
                <div className="flex justify-between items-center">
                    <p className="text-primary font-bold text-xl">${product.price}</p>
                    <button className="btn btn-primary">View Details</button>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
