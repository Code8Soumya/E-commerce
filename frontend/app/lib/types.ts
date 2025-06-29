export interface Product {
    id: number;
    title: string;
    description: string;
    price: number;
    stock: number;
    ownerId: number;
    createdAt: string;
    images: {
        id: number;
        productId: number;
        imageData: {
            type: "Buffer";
            data: number[];
        };
    }[];
}

export interface CartItem {
    id: number;
    cartId: number;
    productId: number;
    quantity: number;
    product: Product;
}

export interface CartWithItems {
    id: number;
    userId: number;
    items: CartItem[];
}
