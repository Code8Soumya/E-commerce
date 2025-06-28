import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

// Initialize Google GenAI client
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

const config = {
    thinkingConfig: {
        thinkingBudget: -1,
    },
    responseMimeType: "text/plain",
};

const model = "gemini-2.5-pro";

// Handler to generate product title from images
export async function generateTitleHandler(req: Request, res: Response): Promise<void> {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
        res.status(400).json({
            message: "At least one image is required for title generation.",
        });
        return;
    }

    // Convert images to base64 data URIs
    const imagesBase64 = files.map((file) => {
        const type = file.mimetype;
        const base = file.buffer.toString("base64");
        return `data:${type};base64,${base}`;
    });

    const { userInput } = req.body;
    const prompt = `Based on the following images and user input, generate a single, final product title. Do not provide multiple options. ${
        userInput
            ? `The user has already typed: "${userInput}". Refine or complete this.`
            : ""
    } Images: ${imagesBase64.join(" ")}`;

    try {
        const stream = await ai.models.generateContentStream({
            model,
            config,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        let resultText = "";
        for await (const chunk of stream) {
            resultText += chunk.text;
        }
        const text = resultText.trim();
        res.status(200).json({ text });
    } catch (error) {
        console.error("[aiController] Error generating title:", error);
        res.status(500).json({ message: "Failed to generate title." });
    }
}

// Handler to generate product description from images
export async function generateDescriptionHandler(
    req: Request,
    res: Response
): Promise<void> {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
        res.status(400).json({
            message: "At least one image is required for description generation.",
        });
        return;
    }

    // Convert images to base64 data URIs
    const imagesBase64 = files.map((file) => {
        const type = file.mimetype;
        const base = file.buffer.toString("base64");
        return `data:${type};base64,${base}`;
    });

    const { userInput } = req.body;
    const prompt = `Based on the following images and user input, generate a single, final product description. Do not provide multiple options or variations. Use proper markdown. ${
        userInput
            ? `The user has already typed: "${userInput}". Refine or complete this.`
            : ""
    } Images: ${imagesBase64.join(" ")}`;

    try {
        const stream = await ai.models.generateContentStream({
            model,
            config,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        let resultText = "";
        for await (const chunk of stream) {
            resultText += chunk.text;
        }
        const text = resultText.trim();
        res.status(200).json({ text });
    } catch (error) {
        console.error("[aiController] Error generating description:", error);
        res.status(500).json({ message: "Failed to generate description." });
    }
}
