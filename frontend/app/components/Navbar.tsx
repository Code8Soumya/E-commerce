import React from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => {
    const activeLinkStyle = {
        color: "var(--color-secondary-light)",
        textDecoration: "underline",
    };

    return (
        <nav className="bg-white text-gray-800 p-4 shadow-md border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <NavLink to="/" className="text-2xl font-bold text-primary">
                    E-commerce
                </NavLink>
                <div className="space-x-6">
                    <NavLink
                        to="/store"
                        className="transition duration-300 hover:text-secondary"
                        style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
                    >
                        Store
                    </NavLink>
                    <NavLink
                        to="/cart"
                        className="transition duration-300 hover:text-secondary"
                        style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
                    >
                        Cart
                    </NavLink>
                    <NavLink
                        to="/order"
                        className="transition duration-300 hover:text-secondary"
                        style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
                    >
                        Order
                    </NavLink>
                    <NavLink
                        to="/login"
                        className="transition duration-300 hover:text-secondary"
                        style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
                    >
                        Login
                    </NavLink>
                    <NavLink
                        to="/register"
                        className="transition duration-300 hover:text-secondary"
                        style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
                    >
                        Register
                    </NavLink>
                    <NavLink
                        to="/profile"
                        className="transition duration-300 hover:text-secondary"
                        style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
                    >
                        Profile
                    </NavLink>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
