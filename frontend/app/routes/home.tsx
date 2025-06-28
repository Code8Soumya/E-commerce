import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../lib/api";
import type { Product } from "../lib/types";
import ProductCard from "../components/ProductCard";

export function meta() {
    return [
        { title: "E-commerce Home" },
        { name: "description", content: "Discover top products in our store." },
    ];
}

const Home: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getProducts();
                setProducts(data);
            } catch {
                setError("Failed to load products.");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
                <svg
                    className="animate-spin h-10 w-10 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                    />
                </svg>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="alert alert-error text-center">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">
                <div className="container mx-auto px-4 py-20 text-center">
                    <h1 className="text-5xl font-extrabold mb-4">
                        Welcome to Our Website
                    </h1>
                    <p className="text-xl mb-8 max-w-2xl mx-auto">
                        Browse our curated selection of premium products
                    </p>
                </div>
            </header>

            {/* Featured Products */}
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-semibold text-gray-800 text-center mb-12">
                    Featured Products
                </h2>
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
