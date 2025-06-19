import React from "react";
const Navbar: React.FC = () => {
    return (
        <nav className="bg-primary text-black p-4 px-32 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <a href="/" className="text-xl text-blue-500 font-bold">
                    E-commerce
                </a>
                <div className="space-x-4">
                    <a href="/stores" className="hover:text-primary-light">
                        Stores
                    </a>
                    <a href="/cart" className="hover:text-primary-light">
                        Cart
                    </a>
                    <a href="/profile" className="hover:text-primary-light">
                        Profile
                    </a>
                    <a href="/login" className="hover:text-primary-light">
                        Login
                    </a>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
