import { Pinecone } from "@pinecone-database/pinecone";
// import dotenv from 'dotenv'; // Removed as env is loaded via --env-file in package.json script

// dotenv.config({ path: './.env' }); // Removed as env is loaded via --env-file in package.json script

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "";
const PINECONE_INDEX_URL = process.env.PINECONE_INDEX_URL || ""; // Assuming this is the host

if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME || !PINECONE_INDEX_URL) {
    console.error("Pinecone API key, index name, or index URL are not set.");
    // Depending on your application's needs, you might want to throw an error or handle this differently.
    // For now, we'll proceed, but operations will fail if keys are missing.
}

const pc = new Pinecone({
    apiKey: PINECONE_API_KEY,
});

let pineconeIndex: any;

async function initializePinecone() {
    try {
        pineconeIndex = pc.index(PINECONE_INDEX_NAME, PINECONE_INDEX_URL);
        console.log("Pinecone initialized successfully.");
    } catch (error) {
        console.error("Error initializing Pinecone.");
        // Handle error gracefully without throwing
    }
}

initializePinecone();

// Re-defining ProductRecord based on the working upsertProductToPinecone signature
interface ProductRecord {
    id: string; // Changed from _id to id as per user's working upsert
    text: string; // Changed from chunk_text to text as per user's working upsert
    category?: string;
    price?: number;
    description?: string;
}

export const upsertProductToPinecone = async (productId: string, description: string) => {
    try {
        // User confirmed this is working, so keeping the signature and call as is.
        // It implies that the 'text' field is used for integrated embedding.
        await pineconeIndex.upsertRecords([{ id: productId, text: description }]);
    } catch (error) {
        console.error(`Error upserting product ${productId} to Pinecone.`);
        // Handle error gracefully without throwing
    }
};

export const deleteProductFromPinecone = async (productId: string) => {
    if (!pineconeIndex) {
        console.error("Pinecone index not initialized.");
        return;
    }
    try {
        // User provided sample: await index.deleteOne('record-1');
        await pineconeIndex.deleteOne(productId);
    } catch (error) {
        console.error(`Error deleting product ${productId} from Pinecone.`);
        // Handle error gracefully without throwing
    }
};

export const searchProductsInPinecone = async (
    queryText: string,
    topK: number = 10,
    minSimilarityScore: number = 0.2
): Promise<string[]> => {
    if (!pineconeIndex) {
        console.error("Pinecone index not initialized.");
        return [];
    }
    try {
        const searchResult = await pineconeIndex.searchRecords({
            query: {
                topK: topK,
                inputs: { text: queryText },
            },
            // We need to include scores to filter by minSimilarityScore
            // Pinecone's searchRecords returns _score by default, so no need for includeValues/includeMetadata for score.
            rerank: {
                model: "bge-reranker-v2-m3",
                rankFields: ["text"],
                topN: topK,
            },
        });

        let hits = searchResult.result?.hits || [];

        // Filter hits by minSimilarityScore if provided
        if (minSimilarityScore !== undefined) {
            hits = hits.filter((hit: any) => hit._score >= minSimilarityScore);
        }

        // Extract and return only the product IDs
        return hits.map((hit: any) => hit._id);
    } catch (error) {
        console.error(`Error searching products in Pinecone for query "${queryText}".`);
        // Handle error gracefully without throwing, return empty array as per function signature
        return [];
    }
};
