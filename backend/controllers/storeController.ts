import { Request, Response } from "express";
import * as StoreModel from "../models/storeModel";
import { validationResult } from "express-validator";

// Define a more specific user type, aligning with a potential UserOutput from auth middleware
interface AuthenticatedUser {
    id: number;
    name: string; // Made non-optional
    email: string; // Made non-optional
    createdAt: Date; // Added based on UserOutput requirement
    // Add other properties from UserOutput if necessary
}

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}

/**
 * Creates a new store.
 */
export async function createStoreHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const ownerId = req.user?.id;
    if (!ownerId) {
        res.status(401).json({ message: "Unauthorized - Owner ID not found" });
        return;
    }

    const { name, description, stripeAccountId } = req.body;

    try {
        const storeData: StoreModel.CreateStoreInput = {
            ownerId,
            name,
            description: description ?? null,
            stripeAccountId: stripeAccountId ?? null,
        };
        const newStore = await StoreModel.createStore(storeData);
        res.status(201).json(newStore);
    } catch (error) {
        console.error("[storeController.ts] Error in createStoreHandler:", error);
        if (error instanceof Error && error.message.includes("Could not create store")) {
            res.status(500).json({ message: "Failed to create store." });
        } else {
            res.status(500).json({ message: "An unexpected error occurred." });
        }
    }
}

/**
 * Retrieves a store by its ID.
 */
export async function getStoreByIdHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const storeId = parseInt(req.params.id, 10);
    const ownerId = req.user?.id;

    if (!ownerId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const store = await StoreModel.findStoreById(storeId);
        if (!store) {
            res.status(404).json({ message: "Store not found." });
            return;
        }
        // Optional: Check if the authenticated user is the owner of the store
        if (store.ownerId !== ownerId) {
            res.status(403).json({ message: "Forbidden: You do not own this store." });
            return;
        }
        res.status(200).json(store);
    } catch (error) {
        console.error(`[storeController.ts] Error in getStoreByIdHandler for ID ${storeId}:`, error);
        res.status(500).json({ message: "Failed to retrieve store." });
    }
}

/**
 * Retrieves all stores (potentially for an admin or a generic listing).
 * If an ownerId is available from auth, it filters by owner.
 */
export async function getAllStoresHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
     const ownerId = req.user?.id;

    if (!ownerId) {
        // If no ownerId, this could be an admin route or public listing.
        // For now, let's assume it requires an owner context based on current storeRoutes logic.
        // If public/admin access is needed, this logic should be adjusted.
        res.status(401).json({ message: "Unauthorized - Owner ID required to list stores." });
        return;
    }

    try {
        // Fetch stores specifically for the authenticated owner
        const stores = await StoreModel.findStoresByOwnerId(ownerId);
        res.status(200).json(stores);
    } catch (error) {
        console.error("[storeController.ts] Error in getAllStoresHandler (for owner):", error);
        res.status(500).json({ message: "Failed to retrieve stores." });
    }
}


/**
 * Updates an existing store.
 */
export async function updateStoreHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const storeId = parseInt(req.params.id, 10);
    const ownerId = req.user?.id;

    if (!ownerId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const { name, description, stripeAccountId } = req.body;
    const updates: StoreModel.UpdateStoreInput = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (stripeAccountId !== undefined) updates.stripeAccountId = stripeAccountId;


    if (Object.keys(updates).length === 0) {
        res.status(400).json({ message: "No update data provided." });
        return;
    }

    try {
        // First, verify the store exists and belongs to the user
        const existingStore = await StoreModel.findStoreById(storeId);
        if (!existingStore) {
            res.status(404).json({ message: `Store with ID ${storeId} not found.` });
            return;
        }
        if (existingStore.ownerId !== ownerId) {
            res.status(403).json({ message: "Forbidden: You do not own this store." });
            return;
        }

        const updatedStore = await StoreModel.updateStore(storeId, updates);
        res.status(200).json(updatedStore);
    } catch (error) {
        console.error(`[storeController.ts] Error in updateStoreHandler for ID ${storeId}:`, error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                 res.status(404).json({ message: error.message });
            } else if (error.message.includes("No effective changes")) {
                res.status(400).json({ message: error.message });
            }
            else {
                res.status(500).json({ message: "Failed to update store." });
            }
        } else {
            res.status(500).json({ message: "An unexpected error occurred during store update." });
        }
    }
}

/**
 * Deletes a store.
 */
export async function deleteStoreHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const storeId = parseInt(req.params.id, 10);
    const ownerId = req.user?.id;

    if (!ownerId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        // Optional: Verify ownership before deletion
        const store = await StoreModel.findStoreById(storeId);
        if (!store) {
            res.status(404).json({ message: `Store with ID ${storeId} not found.` });
            return;
        }
        if (store.ownerId !== ownerId) {
            res.status(403).json({ message: "Forbidden: You do not own this store." });
            return;
        }

        await StoreModel.deleteStore(storeId);
        res.status(200).json({ message: `Store with ID ${storeId} deleted successfully.` });
    } catch (error) {
        console.error(`[storeController.ts] Error in deleteStoreHandler for ID ${storeId}:`, error);
         if (error instanceof Error && error.message.includes("not found")) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Failed to delete store." });
        }
    }
}
