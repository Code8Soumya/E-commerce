import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

const Orders = () => {
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchOrders = async () => {
            try {
                const response = await api.get("/orders");
                setMessage(response.data.message);
            } catch (error) {
                console.error("Error fetching orders:", error);
                setMessage("Failed to fetch orders.");
            }
        };

        fetchOrders();
    }, [navigate]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">My Orders</h1>
            <p>{message}</p>
        </div>
    );
};

export default Orders;
