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
                <h1 className="text-4xl font-bold text-gray-900">My Store</h1>
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
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-lg shadow mb-8"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-gray-700">Title</label>
                            <div className="flex items-center">
                                <input
                                    name="title"
                                    value={formState.title}
                                    onChange={handleInput}
                                    className="form-input mt-1 w-full"
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateTitle}
                                    className="ml-2 btn btn-sm btn-ai"
                                    disabled={isGenerating.title}
                                >
                                    {isGenerating.title ? "..." : "✨ AI"}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700">Price ($)</label>
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                value={formState.price}
                                onChange={handleInput}
                                className="form-input mt-1 w-full"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-700">Description</label>
                            <div className="flex items-start">
                                <textarea
                                    name="description"
                                    value={formState.description}
                                    onChange={handleInput}
                                    rows={3}
                                    className="form-input mt-1 w-full"
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    className="ml-2 btn btn-sm btn-ai"
                                    disabled={isGenerating.description}
                                >
                                    {isGenerating.description ? "..." : "✨ AI"}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700">Stock</label>
                            <input
                                name="stock"
                                type="number"
                                value={formState.stock}
                                onChange={handleInput}
                                className="form-input mt-1 w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Images</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFiles}
                                className="mt-1"
                            />
                            {(formState.images.length > 0 ||
                                (editing && editing.images.length > 0)) && (
                                <div className="mt-2 flex space-x-2 overflow-x-auto">
                                    {formState.images.length > 0
                                        ? formState.images.map((file, idx) => (
                                              <img
                                                  key={idx}
                                                  src={URL.createObjectURL(file)}
                                                  alt={`preview-${idx}`}
                                                  className="h-20 w-20 object-cover rounded"
                                              />
                                          ))
                                        : editing!.images.map((imgObj, idx) => {
                                              const blob = new Blob(
                                                  [
                                                      Uint8Array.from(
                                                          imgObj.imageData.data
                                                      ),
                                                  ],
                                                  { type: "image/png" }
                                              );
                                              return (
                                                  <img
                                                      key={idx}
                                                      src={URL.createObjectURL(blob)}
                                                      alt={`existing-${idx}`}
                                                      className="h-20 w-20 object-cover rounded"
                                                  />
                                              );
                                          })}
                                </div>
                            )}
                        </div>
                    </div>
                    <button type="submit" className="mt-4 btn btn-secondary">
                        {editing ? "Update Product" : "Create Product"}
                    </button>
                </form>
            )}

            {loading ? (
                <div className="text-center py-16 text-gray-600">Loading...</div>
            ) : error ? (
                <div className="alert alert-error text-center">{error}</div>
            ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((p) => (
                        <div
                            key={p.id}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition flex flex-col"
                        >
                            <Link
                                to={`/products/${p.id}`}
                                className="block overflow-hidden rounded-t-lg"
                            >
                                {p.images[0] ? (
                                    <img
                                        src={URL.createObjectURL(
                                            new Blob(
                                                [
                                                    Uint8Array.from(
                                                        p.images[0].imageData.data
                                                    ),
                                                ],
                                                {
                                                    type: "image/png",
                                                }
                                            )
                                        )}
                                        alt={p.title}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                                        No Image
                                    </div>
                                )}
                            </Link>
                            <div className="p-4 flex-1 prose">
                                <Link to={`/products/${p.id}`}>
                                    <h2 className="text-lg font-semibold text-gray-900 hover:text-primary">
                                        <ReactMarkdown>{p.title}</ReactMarkdown>
                                    </h2>
                                    <div className="text-gray-600 mt-1 line-clamp-2">
                                        <ReactMarkdown>{p.description}</ReactMarkdown>
                                    </div>
                                </Link>
                            </div>
                            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-primary font-bold">${p.price}</span>
                                <span className="text-gray-500 text-sm">
                                    Stock: {p.stock}
                                </span>
                            </div>
                            <div className="p-4 border-t border-gray-100 flex space-x-2">
                                <button
                                    onClick={() => startEditing(p)}
                                    className="flex-1 btn btn-primary"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => confirmDelete(p.id)}
                                    className="flex-1 btn btn-error"
                                >
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
