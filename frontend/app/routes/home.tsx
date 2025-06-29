import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts, searchProducts } from "../lib/api";
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
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState<boolean>(false);

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

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim() === "") {
            setSearchResults([]);
            setHasSearched(false); // Reset hasSearched if query is empty
            return;
        }
        setSearchLoading(true);
        setSearchError(null);
        setHasSearched(true); // Set to true when a search is initiated
        try {
            const data = await searchProducts(searchQuery);
            setSearchResults(data);
        } catch (err) {
            setSearchError("Failed to search products.");
            console.error("Search error:", err);
        } finally {
            setSearchLoading(false);
        }
    };

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
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto">
                        <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden">
                            <input
                                type="text"
                                placeholder="Search for products..."
                                className="w-full px-6 py-3 text-gray-800 focus:outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors duration-300"
                                disabled={searchLoading}
                            >
                                {searchLoading ? "Searching..." : "Search"}
                            </button>
                        </div>
                    </form>
                </div>
            </header>

            {/* Search Results Section */}
            {hasSearched && ( // Only show if a search has been performed
                <section className="container mx-auto px-4 py-16">
                    <h2 className="text-3xl font-semibold text-gray-800 text-center mb-12">
                        Search Results for "{searchQuery}"
                    </h2>
                    {searchError && (
                        <div className="alert alert-error text-center mb-8">
                            {searchError}
                        </div>
                    )}
                    {searchResults.length === 0 && !searchLoading && !searchError && (
                        <p className="text-center text-gray-600">
                            No products found for your search.
                        </p>
                    )}
                    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {searchResults.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

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
