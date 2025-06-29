import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import type { ChangeEvent, FormEvent } from "react";

import {
    addProduct,
    deleteProduct,
    generateDescription,
    generateTitle,
    getMyProducts,
    updateProduct,
} from "../lib/api";
import type { Product } from "../lib/types";
import Popup from "../components/Popup";

interface FormState {
    title: string;
    description: string;
    price: string;
    stock: string;
    images: File[];
}

interface FormErrors {
    price?: string;
    stock?: string;
}

const StorePage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [formVisible, setFormVisible] = useState<boolean>(false);
    const [formState, setFormState] = useState<FormState>({
        title: "",
        description: "",
        price: "",
        stock: "",
        images: [],
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [editing, setEditing] = useState<Product | null>(null);
    const [popup, setPopup] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);
    const [isGenerating, setIsGenerating] = useState<{
        title: boolean;
        description: boolean;
    }>({
        title: false,
        description: false,
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const navigate = useNavigate();

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getMyProducts();
            setProducts(data);
        } catch {
            setError("Failed to load your products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            navigate("/login");
            return;
        }
        loadProducts();
    }, [navigate]);

    const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState((prev) => ({ ...prev, [name]: value }));

        if (name === "price") {
            if (!/^\d*(\.\d{0,2})?$/.test(value)) {
                setFormErrors((prev) => ({
                    ...prev,
                    price: "Price must be a number with up to two decimal places.",
                }));
            } else if (parseFloat(value) <= 0) {
                setFormErrors((prev) => ({
                    ...prev,
                    price: "Price must be greater than 0.",
                }));
            } else {
                setFormErrors((prev) => ({ ...prev, price: undefined }));
            }
        }

        if (name === "stock") {
            if (
                !/^\d+$/.test(value) ||
                parseInt(value, 10) < 1 ||
                parseInt(value, 10) > 10000
            ) {
                setFormErrors((prev) => ({
                    ...prev,
                    stock: "Stock must be an integer between 1 and 10000.",
                }));
            } else {
                setFormErrors((prev) => ({ ...prev, stock: undefined }));
            }
        }
    };

    const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            setFormState((prev) => ({ ...prev, images: Array.from(files) }));
        }
    };

    const getFilesToSend = (): File[] => {
        if (formState.images.length > 0) {
            return formState.images;
        }
        if (editing?.images.length) {
            return editing.images.map((img, idx) => {
                const uint8 = Uint8Array.from(img.imageData.data);
                return new File([uint8], `image-${idx}.png`, { type: "image/png" });
            });
        }
        return [];
    };

    const handleGenerateTitle = async () => {
        const filesToSend = getFilesToSend();
        if (filesToSend.length === 0) {
            setPopup({
                message: "Upload at least one image before generating title",
                type: "error",
            });
            return;
        }
        setIsGenerating((prev) => ({ ...prev, title: true }));

        try {
            const res = await generateTitle(filesToSend, formState.title);
            setFormState((prev) => ({ ...prev, title: res.text }));
        } catch {
            setPopup({ message: "Failed to generate title", type: "error" });
        } finally {
            setIsGenerating((prev) => ({ ...prev, title: false }));
        }
    };

    const handleGenerateDescription = async () => {
        const filesToSend = getFilesToSend();
        if (filesToSend.length === 0) {
            setPopup({
                message: "Upload at least one image before generating description",
                type: "error",
            });
            return;
        }
        setIsGenerating((prev) => ({ ...prev, description: true }));

        try {
            const res = await generateDescription(filesToSend, formState.description);
            setFormState((prev) => ({ ...prev, description: res.text }));
        } catch {
            setPopup({ message: "Failed to generate description", type: "error" });
        } finally {
            setIsGenerating((prev) => ({ ...prev, description: false }));
        }
    };

    const resetForm = () => {
        setFormState({ title: "", description: "", price: "", stock: "", images: [] });
        setEditing(null);
        setFormVisible(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const { title, description, price, stock, images } = formState;

        if (!title || !description || !price || !stock) {
            setPopup({ message: "All fields except images are required", type: "error" });
            return;
        }

        if (formErrors.price || formErrors.stock) {
            setPopup({
                message: "Please fix the errors before submitting",
                type: "error",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            if (editing) {
                await updateProduct(editing.id, {
                    title,
                    description,
                    price: parseFloat(price),
                    stock: parseInt(stock, 10),
                    images,
                });
                setPopup({ message: "Product updated", type: "success" });
            } else {
                await addProduct({
                    title,
                    description,
                    price: parseFloat(price),
                    stock: parseInt(stock, 10),
                    images,
                });
                setPopup({ message: "Product added", type: "success" });
            }

            resetForm();
            loadProducts();
        } catch (err: any) {
            const msg = err.response?.data?.errors?.[0]?.msg || "Operation failed";
            setPopup({ message: msg, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEditing = (prod: Product) => {
        setEditing(prod);
        setFormState({
            title: prod.title,
            description: prod.description,
            price: prod.price.toString(),
            stock: prod.stock.toString(),
            images: [],
        });
        setFormVisible(true);
        window.scrollTo(0, 0);
    };

    const confirmDelete = async (id: number) => {
        if (!window.confirm("Delete this product?")) return;
        try {
            await deleteProduct(id);
            setPopup({ message: "Product deleted", type: "success" });
            loadProducts();
        } catch {
            setPopup({ message: "Delete failed", type: "error" });
        }
    };

    return (
        <div className="container mx-auto px-6 py-8">
            {popup && (
                <Popup
                    message={popup.message}
                    type={popup.type}
                    onClose={() => setPopup(null)}
                />
            )}

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold" style={{ color: "var(--color-primary)" }}>My Store</h1>
                <button
                    onClick={() => {
                        formVisible ? resetForm() : setFormVisible(true);
                    }}
                    className="btn btn-primary"
                >
                    {formVisible ? "Cancel" : "Add Product"}
                </button>
            </div>

            {formVisible && (
                <div className="card mb-8">
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="block font-semibold mb-1">Title</label>
                                <input
                                    name="title"
                                    value={formState.title}
                                    onChange={handleInput}
                                    className="form-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateTitle}
                                    className="btn btn-ai w-full mt-2"
                                    disabled={isGenerating.title}
                                >
                                    {isGenerating.title
                                        ? "Generating..."
                                        : "✨ AI Generate Title"}
                                </button>
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Price ($)</label>
                                <input
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    value={formState.price}
                                    onChange={handleInput}
                                    className="form-input"
                                />
                                {formErrors.price && (
                                    <p className="text-sm mt-1" style={{ color: "var(--color-error)" }}>
                                        {formErrors.price}
                                    </p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block font-semibold mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formState.description}
                                    onChange={handleInput}
                                    rows={4}
                                    className="form-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    className="btn btn-ai w-full mt-2"
                                    disabled={isGenerating.description}
                                >
                                    {isGenerating.description
                                        ? "Generating..."
                                        : "✨ AI Generate Description"}
                                </button>
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Stock</label>
                                <input
                                    name="stock"
                                    type="number"
                                    min="1"
                                    max="10000"
                                    value={formState.stock}
                                    onChange={handleInput}
                                    className="form-input"
                                />
                                {formErrors.stock && (
                                    <p className="text-sm mt-1" style={{ color: "var(--color-error)" }}>
                                        {formErrors.stock}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Images</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFiles}
                                    className="form-input"
                                />
                                {(formState.images.length > 0 ||
                                    (editing && editing.images.length > 0)) && (
                                    <div className="mt-4 flex space-x-2 overflow-x-auto">
                                        {formState.images.length > 0
                                            ? formState.images.map((file, idx) => (
                                                <img
                                                    key={idx}
                                                    src={URL.createObjectURL(file)}
                                                    alt={`preview-${idx}`}
                                                    className="h-24 w-24 object-cover rounded-lg border-2"
                                                    style={{ borderColor: "var(--color-border)" }}
                                                />
                                            ))
                                            : editing!.images.map((imgObj, idx) => {
                                                const blob = new Blob(
                                                    [Uint8Array.from(imgObj.imageData.data)],
                                                    { type: "image/png" }
                                                );
                                                return (
                                                    <img
                                                        key={idx}
                                                        src={URL.createObjectURL(blob)}
                                                        alt={`existing-${idx}`}
                                                        className="h-24 w-24 object-cover rounded-lg border-2"
                                                        style={{ borderColor: "var(--color-border)" }}
                                                    />
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-6"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? editing
                                    ? "Updating..."
                                    : "Creating..."
                                : editing
                                    ? "Update Product"
                                    : "Create Product"}
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>Loading products...</div>
            ) : error ? (
                <div className="alert alert-error text-center">{error}</div>
            ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((p) => (
                        <div key={p.id} className="card flex flex-col">
                            <Link to={`/products/${p.id}`} className="block overflow-hidden rounded-t-lg -m-6 mb-0">
                                {p.images[0] ? (
                                    <img
                                        src={URL.createObjectURL(
                                            new Blob([Uint8Array.from(p.images[0].imageData.data)], { type: "image/png" })
                                        )}
                                        alt={p.title}
                                        className="w-full h-56 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-56 flex items-center justify-center" style={{ backgroundColor: "var(--color-background)", color: "var(--color-text-muted)" }}>
                                        No Image
                                    </div>
                                )}
                            </Link>
                            <div className="pt-4 flex-1 flex flex-col">
                                <Link to={`/products/${p.id}`} className="flex-1 product-details-link">
                                    <h2 className="text-lg font-bold">
                                        <ReactMarkdown>{p.title}</ReactMarkdown>
                                    </h2>
                                    <div className="mt-1 text-sm line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                                        <ReactMarkdown>{p.description}</ReactMarkdown>
                                    </div>
                                </Link>
                            </div>
                            <div className="pt-4 mt-auto border-t flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
                                <span className="font-bold text-xl" style={{ color: "var(--color-primary)" }}>
                                    ${p.price}
                                </span>
                                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                                    Stock: {p.stock}
                                </span>
                            </div>
                            <div className="pt-4 mt-4 border-t grid grid-cols-2 gap-3" style={{ borderColor: "var(--color-border)" }}>
                                <button onClick={() => startEditing(p)} className="btn btn-secondary w-full">
                                    Edit
                                </button>
                                <button onClick={() => confirmDelete(p.id)} className="btn btn-error w-full">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StorePage;
