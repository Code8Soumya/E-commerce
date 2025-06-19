import React from "react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-neutral-50 text-text-light py-8 mt-12 border-t border-neutral-200">
            <div className="container mx-auto px-4 text-center">
                <div className="mb-4">
                    <a href="/about" className="mx-2 hover:text-secondary">
                        About Us
                    </a>
                    <a href="/contact" className="mx-2 hover:text-secondary">
                        Contact
                    </a>
                    <a href="/privacy" className="mx-2 hover:text-secondary">
                        Privacy Policy
                    </a>
                    <a href="/terms" className="mx-2 hover:text-secondary">
                        Terms of Service
                    </a>
                </div>
                <p className="text-sm">
                    &copy; {currentYear} E-commerce Inc. All rights reserved.
                </p>
                <p className="text-xs mt-2">Built with Next.js and Tailwind CSS</p>
            </div>
        </footer>
    );
};

export default Footer;
