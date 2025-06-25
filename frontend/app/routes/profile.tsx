import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";
import Popup from "../components/Popup";

interface User {
    id: number;
    name: string;
    email: string;
    createdAt: string;
}

const Profile = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", password: "" });
    const [popup, setPopup] = useState<{
        message: string;
        type: "success" | "error" | "warning";
    } | null>(null);
    const navigate = useNavigate();

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/auth/profile");
            setUser(data.user);
            setFormData({
                name: data.user.name,
                email: data.user.email,
                password: "",
            });
        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (popup) {
            const timer = setTimeout(() => {
                setPopup(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [popup]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: { name: string; email: string; password?: string } = {
            name: formData.name,
            email: formData.email,
        };

        if (formData.password) {
            payload.password = formData.password;
        }

        try {
            await api.put("/auth/UpdateProfile", payload);
            setPopup({ message: "Profile updated successfully!", type: "success" });
            await fetchProfile();
            setEditMode(false);
        } catch (err: any) {
            if (
                err.response &&
                err.response.data &&
                Array.isArray(err.response.data.errors)
            ) {
                const errorMessages = err.response.data.errors
                    .map((err: any) => `• ${err.msg}`)
                    .join(".\n");
                setPopup({ message: errorMessages, type: "error" });
            } else {
                setPopup({
                    message: err.response?.data?.message || "An error occurred",
                    type: "error",
                });
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="profile-card">
                    <h1 className="profile-header">Access Denied</h1>
                    <p>{error}</p>
                    <button
                        onClick={() => navigate("/login")}
                        className="btn btn-primary"
                    >
                        Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {popup && (
                <Popup
                    message={popup.message}
                    type={popup.type}
                    onClose={() => setPopup(null)}
                />
            )}
            <div className="profile-card">
                <h1 className="profile-header">Profile</h1>
                {editMode ? (
                    <form onSubmit={handleUpdate}>
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Leave blank to keep current password"
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                                Save Changes
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditMode(false);
                                    setFormData({
                                        name: user?.name || "",
                                        email: user?.email || "",
                                        password: "",
                                    });
                                }}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        {user && (
                            <div className="profile-details">
                                <p>
                                    <strong>ID:</strong> {user.id}
                                </p>
                                <p>
                                    <strong>Name:</strong> {user.name}
                                </p>
                                <p>
                                    <strong>Email:</strong> {user.email}
                                </p>
                                <p>
                                    <strong>Member Since:</strong>{" "}
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                        <div className="profile-actions">
                            <button
                                onClick={() => setEditMode(true)}
                                className="btn btn-primary"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="btn btn-secondary logout-btn"
                            >
                                Logout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Profile;
