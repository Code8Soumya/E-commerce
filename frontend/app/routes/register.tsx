import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import Popup from "../components/Popup";

export default function Register() {
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [popup, setPopup] = React.useState<{
        message: string;
        type: "success" | "error" | "warning";
    } | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post("/auth/register", { name, email, password });
            const data = response.data;

            if (data.errors && Array.isArray(data.errors)) {
                const errorMessages = data.errors
                    .map((err: any) => `• ${err.msg}`)
                    .join("\n");
                setPopup({ message: errorMessages, type: "error" });
                return;
            }
            if (data.message) {
                setPopup({ message: data.message, type: "success" });
                setTimeout(() => {
                    window.location.href = "/login";
                }, 1500);
                return;
            }
            if (data.msg || data.error) {
                setPopup({ message: data.msg || data.error, type: "error" });
                return;
            }
        } catch (error: any) {
            if (error.response && error.response.data) {
                const errData = error.response.data;
                if (errData.errors && Array.isArray(errData.errors)) {
                    const errorMessages = errData.errors
                        .map((err: any) => `• ${err.msg}`)
                        .join("\n");
                    setPopup({ message: errorMessages, type: "error" });
                } else if (errData.message) {
                    setPopup({ message: errData.message, type: "error" });
                } else {
                    setPopup({
                        message: errData.msg || errData.error || "Registration failed",
                        type: "error",
                    });
                }
            } else {
                setPopup({ message: "Network Error", type: "error" });
            }
        }
    };

    if (isLoggedIn) {
        return (
            <section className="flex items-center justify-center bg-gray-50 w-full flex-grow">
                <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        You are already logged in.
                    </h2>
                    <p className="text-gray-600 mb-6">
                        You can logout to create a new account.
                    </p>
                    <button onClick={handleLogout} className="w-full btn btn-primary">
                        Logout
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="flex items-center justify-center bg-gray-50 w-full flex-grow">
            {popup && (
                <Popup
                    message={popup.message}
                    type={popup.type}
                    onClose={() => setPopup(null)}
                />
            )}
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 mt-10 mb-10">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-primary text-white p-3 rounded-full mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="17" y1="11" x2="23" y2="11"></line>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Create an Account
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Join us to start your shopping journey!
                    </p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <input
                            onChange={(e) => setName(e.target.value)}
                            type="text"
                            name="name"
                            id="name"
                            value={name}
                            required
                            className="form-input"
                            placeholder="e.g., John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            name="email"
                            id="email"
                            value={email}
                            required
                            className="form-input"
                            placeholder="e.g., you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            name="password"
                            id="password"
                            value={password}
                            required
                            className="form-input"
                            placeholder="Must be at least 8 characters"
                        />
                    </div>
                    <button type="submit" className="w-full btn btn-primary">
                        Sign Up
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <a
                        href="/login"
                        className="font-semibold text-secondary hover:text-secondary-dark"
                    >
                        Log In
                    </a>
                </p>
            </div>
        </section>
    );
}
