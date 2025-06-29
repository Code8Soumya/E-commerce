import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../lib/api";
import type { CartWithItems, CartItem } from "../lib/types";

// Helper: convert numeric array to Base64 string
const arrayBufferToBase64 = (buffer: { type: "Buffer"; data: number[] }) => {
    if (!buffer || !buffer.data) return "";
    const bytes = new Uint8Array(buffer.data);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
    return btoa(binary);
};

const QuantitySelector: React.FC<{
    quantity: number;
    onDecrease: () => void;
    onIncrease: () => void;
    max: number;
}> = ({ quantity, onDecrease, onIncrease, max }) => (
    <div className="flex items-center">
        <button
            onClick={onDecrease}
            disabled={quantity <= 1}
            className="px-3 py-1 border rounded-l-md hover:bg-gray-100 disabled:opacity-50"
        >
            -
        </button>
        <span className="px-4 py-1 border-t border-b">{quantity}</span>
        <button
            onClick={onIncrease}
            disabled={quantity >= max}
            className="px-3 py-1 border rounded-r-md hover:bg-gray-100 disabled:opacity-50"
        >
            +
        </button>
    </div>
);

const Cart: React.FC = () => {
    const [cart, setCart] = useState<CartWithItems | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
    }, [navigate]);

    const fetchCart = useCallback(async () => {
        try {
            setLoading(true);
            const cartData = await api.getCart();
            setCart(cartData);
        } catch (err) {
            setError("Failed to fetch cart. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) { // Only fetch cart if authenticated
            fetchCart();
        }
    }, [fetchCart]);

    const handleQuantityChange = async (itemId: number, quantity: number) => {
        if (quantity < 1) return;
        try {
            const updated = await api.updateCartItem(itemId, quantity);
            setCart(updated);
        } catch {
            setError("Failed to update quantity.");
        }
    };

    const handleRemoveItem = async (itemId: number) => {
        try {
            const updated = await api.removeCartItem(itemId);
            setCart(updated);
        } catch {
            setError("Failed to remove item.");
        }
    };

    const handleClearCart = async () => {
        try {
            const updated = await api.clearCart();
            setCart(updated);
        } catch {
            setError("Failed to clear cart.");
        }
    };

    const subtotal =
        cart?.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) ??
        0;

    if (loading) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p className="text-text-muted">Loading your cart...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <div className="alert alert-error">{error}</div>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="container mx-auto p-4 text-center card">
                <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
                <p className="text-text-muted mb-6">
                    Looks like you haven't added anything to your cart yet.
                </p>
                <button onClick={() => navigate("/")} className="btn btn-primary">
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Cart</h1>
                <button onClick={handleClearCart} className="btn btn-outline">
                    Clear Cart
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {cart.items.map((item: CartItem) => {
                        const imageData = item.product.images?.[0]?.imageData;
                        const imgSrc = imageData
                            ? `data:image/jpeg;base64,${arrayBufferToBase64(imageData)}`
                            : "https://via.placeholder.com/150";
                        return (
                            <div
                                key={item.id}
                                className="card flex flex-col md:flex-row items-center"
                            >
                                <Link
                                    to={`/products/${item.product.id}`}
                                    className="block flex-shrink-0 product-details-link"
                                >
                                    <img
                                        src={imgSrc}
                                        alt={item.product.title}
                                        className="w-32 h-32 object-cover rounded-lg mb-4 md:mb-0 md:mr-6"
                                    />
                                </Link>
                                <div className="flex-grow text-center md:text-left">
                                    <Link
                                        to={`/products/${item.product.id}`}
                                        className="product-details-link"
                                    >
                                        <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                                            {item.product.title}
                                        </h3>
                                    </Link>
                                    <p className="text-text-muted mt-1">
                                        ${item.product.price.toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                                    <QuantitySelector
                                        quantity={item.quantity}
                                        onDecrease={() =>
                                            handleQuantityChange(
                                                item.id,
                                                item.quantity - 1
                                            )
                                        }
                                        onIncrease={() =>
                                            handleQuantityChange(
                                                item.id,
                                                item.quantity + 1
                                            )
                                        }
                                        max={item.product.stock}
                                    />
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="btn btn-error"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="lg:col-span-1">
                    <div className="card">
                        <h3 className="text-2xl font-bold mb-4">Order Summary</h3>
                        <div className="flex justify-between mb-2 text-text-muted">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-4 text-text-muted">
                            <span>Shipping</span>
                            <span>Free</span>
                        </div>
                        <hr className="border-border my-4" />
                        <div className="flex justify-between font-bold text-lg mb-6">
                            <span>Total</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <button className="btn btn-primary w-full">
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
