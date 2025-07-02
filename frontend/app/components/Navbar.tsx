import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
const navigate = useNavigate();
const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        navigate("/login");
    };

    const activeLinkClasses = "text-primary font-semibold";
    const linkClasses = "text-gray-600 hover:text-primary transition-colors duration-300";

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <NavLink to="/" className="text-3xl font-bold text-primary">
                    e-com
                </NavLink>
                <div className="hidden md:flex items-center space-x-8">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            isActive ? activeLinkClasses : linkClasses
                        }
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/store"
                        className={({ isActive }) =>
                            isActive ? activeLinkClasses : linkClasses
                        }
                    >
                        Store
                    </NavLink>
                    <NavLink
                        to="/cart"
                        className={({ isActive }) =>
                            isActive ? activeLinkClasses : linkClasses
                        }
                    >
                        Cart
                    </NavLink>
                    <NavLink
                        to="/orders"
                        className={({ isActive }) =>
                            isActive ? activeLinkClasses : linkClasses
                        }
                    >
                        Orders
                    </NavLink>
                </div>
                <div className="flex items-center space-x-4">
                    {isLoggedIn ? (
                        <>
<NavLink to="/profile" className={({ isActive }) => (isActive ? activeLinkClasses : linkClasses)}>
    Profile
</NavLink>
                            <button onClick={handleLogout} className="btn btn-secondary">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="btn btn-outline">
                                Login
                            </NavLink>
                            <NavLink to="/register" className="btn btn-primary">
                                Register
                            </NavLink>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
