import React, { useEffect } from "react";

interface PopupProps {
    message: string;
    type: "success" | "error" | "warning";
    onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-close after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    const getAlertClasses = () => {
        switch (type) {
            case "success":
                return "alert alert-success";
            case "error":
                return "alert alert-error";
            case "warning":
                return "alert alert-warning";
            default:
                return "alert";
        }
    };

    return (
        <div
            className={`fixed top-5 right-5 max-w-md z-50 transition-transform transform animate-slide-in-right ${getAlertClasses()}`}
        >
            <div className="flex items-center justify-between">
                <p className="font-medium whitespace-pre-line">{message}</p>
                <button
                    onClick={onClose}
                    className="ml-4 p-1 rounded-full text-inherit hover:bg-black/10"
                    aria-label="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Popup;
