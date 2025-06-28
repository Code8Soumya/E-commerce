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
