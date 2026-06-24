import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint to generate pokemon fusion details using Gemini 3.5 Flash
app.post("/api/fuse", async (req, res) => {
  try {
    const { pokemon1, pokemon2 } = req.body;

    if (!pokemon1 || !pokemon2) {
      return res.status(400).json({ error: "Two pokemon are required for fusion." });
    }

    const prompt = `You are a Pokemon Breeding and Fusion Master. 
Create a highly creative and visually and conceptually brilliant Pokemon Fusion (hybrid) between these two Pokemons:
Pokemon 1: ${pokemon1.name} (Types: ${pokemon1.types.join(", ")}, Base Stats: ${JSON.stringify(pokemon1.baseStats)})
Pokemon 2: ${pokemon2.name} (Types: ${pokemon2.types.join(", ")}, Base Stats: ${JSON.stringify(pokemon2.baseStats)})

Please generate a structured Pokemon Fusion file that contains:
1. A realistic fused name (e.g. Pikazard, Bulbasaur + Charmander = Bulbasaur/Charmander hybrid name like Bulbazard or Charmasaur). It must be catchy.
2. A balanced dual-type combination representing their nature (e.g. Grass/Fire, Electric/Ghost, etc.).
3. A highly creative Pokédex entry describing its hybrid traits, how it behaves, its habitat, and its visual appearance in detail.
4. Combined Base Stats (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed) that are balanced and reflect the strengths/weaknesses of both parent Pokemons.
5. A powerful signature hybrid ability (with a name and description) that combines both parents' style.
6. A powerful signature move (Name, Type, Description, Power, Accuracy) that represents a fusion of their signature moves.
7. Color palettes for visual formatting (primary hex color and secondary hex color) that best represent this hybrid pokemon for a gorgeous UI card display.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Game Designer specializing in Pokémon RPG games. Return only valid and safe JSON matching the requested Pokemon Fusion schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fusedName: { type: Type.STRING },
            types: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 1 or 2 hybrid typings",
            },
            pokedexEntry: { type: Type.STRING },
            stats: {
              type: Type.OBJECT,
              properties: {
                hp: { type: Type.INTEGER },
                attack: { type: Type.INTEGER },
                defense: { type: Type.INTEGER },
                spAtk: { type: Type.INTEGER },
                spDef: { type: Type.INTEGER },
                speed: { type: Type.INTEGER },
              },
              required: ["hp", "attack", "defense", "spAtk", "spDef", "speed"],
            },
            ability: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "description"],
            },
            signatureMove: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                power: { type: Type.INTEGER },
                accuracy: { type: Type.INTEGER },
                description: { type: Type.STRING },
              },
              required: ["name", "type", "power", "accuracy", "description"],
            },
            colors: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING, description: "HEX color string, e.g. #FF4400" },
                secondary: { type: Type.STRING, description: "HEX color string, e.g. #44FFAA" },
              },
              required: ["primary", "secondary"],
            },
          },
          required: [
            "fusedName",
            "types",
            "pokedexEntry",
            "stats",
            "ability",
            "signatureMove",
            "colors",
          ],
        },
      },
    });

    const fusionText = response.text;
    if (!fusionText) {
      throw new Error("No response from Gemini API");
    }

    const fusionData = JSON.parse(fusionText);
    res.json(fusionData);
  } catch (error: any) {
    console.error("Fusion error:", error);
    res.status(500).json({ error: "Failed to generate Pokémon Fusion. " + error.message });
  }
});

// Endpoint to generate unique shiny pokemon metadata using Gemini 3.5 Flash
app.post("/api/shiny", async (req, res) => {
  try {
    const { name, types } = req.body;

    if (!name || !types) {
      return res.status(400).json({ error: "Pokemon name and types are required." });
    }

    const prompt = `You are a Pokémon Master and Game Designer. Generate a highly creative and visually stunning "Shiny" version of metadata for this Pokémon species:
Name: ${name}
Types: ${types.join(", ")}

Generate unique "Shiny" attributes for this Pokémon, which has been touched by rare cosmic, celestial, or stellar energy:
1. A custom, highly creative, and detailed Pokédex entry describing its unique shiny color coloration, glowing starry highlights, cosmic sparkles, or rare aura and why it is so highly sought after.
2. Distinct shiny color palettes (primary hex color and secondary hex color) that look stunning together for a beautiful card UI background. Do NOT use the normal colors of this Pokémon. Use extremely exciting premium color combinations (e.g., gold, neon turquoise, deep violet, emerald green, iridescent silver, neon pink, deep space black).
3. A boosted, powerful shiny-themed ability (Ability Name and detailed description) combining its elemental type with stellar, cosmic, or radiant powers.
4. An ultimate shiny-themed signature move (Move Name, elemental Type, Description, Power (typically 65-80), and Accuracy (typically 90-100)) that represents its rare, brilliant energy burst.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Game Designer specializing in Pokémon RPG games. Return only valid and safe JSON matching the requested Pokémon Shiny metadata schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pokedexEntry: { type: Type.STRING },
            colors: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING, description: "HEX color string, e.g. #FFD700" },
                secondary: { type: Type.STRING, description: "HEX color string, e.g. #00FFEA" },
              },
              required: ["primary", "secondary"],
            },
            ability: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "description"],
            },
            signatureMove: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                power: { type: Type.INTEGER },
                accuracy: { type: Type.INTEGER },
                description: { type: Type.STRING },
              },
              required: ["name", "type", "power", "accuracy", "description"],
            },
          },
          required: [
            "pokedexEntry",
            "colors",
            "ability",
            "signatureMove",
          ],
        },
      },
    });

    const shinyText = response.text;
    if (!shinyText) {
      throw new Error("No response from Gemini API");
    }

    const shinyData = JSON.parse(shinyText);
    res.json(shinyData);
  } catch (error: any) {
    console.error("Shiny generation error:", error);
    res.status(500).json({ error: "Failed to generate Pokémon Shiny metadata. " + error.message });
  }
});

// Setup Vite Dev server or Production static serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

startServer();
