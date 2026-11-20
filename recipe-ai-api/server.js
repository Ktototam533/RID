import "dotenv/config";

import express from "express";

import cors from "cors";

import rateLimit from "express-rate-limit";

import { GoogleGenAI, Type } from "@google/genai";
 
const app = express();

app.set("trust proxy", 1);
 
const port = process.env.PORT || 3000;
 
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")

    .split(",")

    .map(origin => origin.trim())

    .filter(Boolean);
 
const ai = new GoogleGenAI({

    apiKey: process.env.GEMINI_API_KEY

});
 
app.use(cors({

    origin(origin, callback) {

        if (!origin || allowedOrigins.includes(origin)) {

            return callback(null, true);

        }
 
        return callback(new Error("Цей сайт не дозволений для запитів."));

    }

}));
 
app.use(express.json({ limit: "10kb" }));

app.use("/api/", rateLimit({ windowMs: 60 * 1000, limit: 20 }));
 
app.get("/health", (req, res) => {

    res.json({ status: "ok" });

});
 
app.post("/api/recipe", async (req, res) => {

    const title = typeof req.body?.title === "string"

        ? req.body.title.trim()

        : "";
 
    if (!title || title.length > 100) {

        return res.status(400).json({

            error: "Вкажіть назву страви до 100 символів."

        });

    }
 
    try {

        const response = await ai.models.generateContent({

            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",

            contents: `Erstelle ein einfaches, verständliches Rezept auf Deutsch für: ${title}.

Gib realistische Zutatenmengen und Zubereitungsschritte an.`,

            config: {

                responseMimeType: "application/json",

                responseSchema: {

                    type: Type.OBJECT,

                    properties: {

                        time: { type: Type.STRING },

                        servings: { type: Type.STRING },

                        ingredients: {

                            type: Type.ARRAY,

                            items: { type: Type.STRING }

                        },

                        steps: {

                            type: Type.ARRAY,

                            items: { type: Type.STRING }

                        }

                    },

                    required: ["time", "servings", "ingredients", "steps"]

                }

            }

        });
 
        if (!response.text) {

            throw new Error("Gemini повернув порожню відповідь.");

        }
 
        const recipe = JSON.parse(response.text);
 
        res.json(recipe);

    } catch (error) {

        console.error("Gemini recipe error:", error.message);

        res.status(500).json({

            error: "Das Rezept konnte gerade nicht erstellt werden."

        });

    }

});
 
console.log("Gemini API key configured:", Boolean(process.env.GEMINI_API_KEY?.trim()));

app.post("/api/recipes-from-ingredients", async (req, res) => {
    const ingredients = Array.isArray(req.body?.ingredients)
        ? req.body.ingredients
            .filter(item => typeof item === "string")
            .map(item => item.trim().slice(0, 60))
            .filter(Boolean)
            .slice(0, 20)
        : [];
 
    if (ingredients.length === 0) {
        return res.status(400).json({
            error: "Bitte gib mindestens eine Zutat ein."
        });
    }
 
    try {
        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
            contents: `Erstelle 3 einfache Rezepte auf Deutsch, die möglichst viele dieser Zutaten verwenden: ${ingredients.join(", ")}.
Grundlegende Zutaten wie Salz, Pfeffer und Öl dürfen ergänzt werden.
Gib pro Rezept Titel, Zubereitungszeit, Portionen, Zutaten und Zubereitungsschritte an.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recipes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    time: { type: Type.STRING },
                                    servings: { type: Type.STRING },
                                    ingredients: {
                                        type: Type.ARRAY,
                                        items: { type: Type.STRING }
                                    },
                                    steps: {
                                        type: Type.ARRAY,
                                        items: { type: Type.STRING }
                                    }
                                },
                                required: [
                                    "title",
                                    "time",
                                    "servings",
                                    "ingredients",
                                    "steps"
                                ]
                            }
                        }
                    },
                    required: ["recipes"]
                }
            }
        });
 
        if (!response.text) {
            throw new Error("Gemini hat keine Antwort zurückgegeben.");
        }
 
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("Ingredient recipe error:", error.message);
        res.status(500).json({
            error: "Rezepte konnten gerade nicht erstellt werden."
        });
    }
});

app.listen(port, () => {

    console.log(`Server läuft auf Port ${port}`);

});
 