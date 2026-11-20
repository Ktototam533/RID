import "dotenv/config";

import express from "express";

import cors from "cors";

import rateLimit from "express-rate-limit";

import OpenAI from "openai";
 
const app = express();

const port = process.env.PORT || 3000;
 
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")

    .split(",")

    .map(origin => origin.trim())

    .filter(Boolean);
 
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

        return res.status(400).json({ error: "Вкажіть назву страви до 100 символів." });

    }
 
    try {

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 
        const response = await openai.responses.create({

            model: "gpt-4.1-mini",

            input: [

                {

                    role: "system",

                    content: `Du erstellst einfache Kochrezepte auf Deutsch.

Antworte ausschließlich mit gültigem JSON, ohne Markdown.

Verwende genau diese Struktur:

{

  "time": "z. B. 20 Min",

  "servings": "z. B. 2 Portionen",

  "ingredients": ["Zutat 1", "Zutat 2"],

  "steps": ["Schritt 1", "Schritt 2"]

}`

                },

                {

                    role: "user",

                    content: `Erstelle ein verständliches Rezept für: ${title}`

                }

            ]

        });
 
        const recipe = JSON.parse(response.output_text);

        res.json(recipe);

    } catch (error) {

        console.error("Rezept-Fehler:", error.message);

        res.status(500).json({ error: "Das Rezept konnte nicht erstellt werden." });

    }

});
 
app.listen(port, () => {

    console.log(`Server läuft auf Port ${port}`);

});
 