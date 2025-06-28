import React from "react";

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-100 text-gray-600 py-6">
            <div className="container mx-auto text-center">
                <p>&copy; {currentYear} E-com. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
