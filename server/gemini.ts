import fs from "fs";
import path from "path";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

export interface MatchResult {
  match_percentage: number;
  reasoning: string;
}

/**
 * Uses Gemini Vision to compare a lost item description with a found item image.
 * Returns the match percentage (0-100) and reasoning.
 */
export async function matchItemWithImage(
  lostDescription: string,
  imageUrl: string
): Promise<MatchResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // Resolve the image from disk (uploaded files)
  const uploadDir = path.join(process.cwd(), "uploads");
  const imagePath = path.join(process.cwd(), imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl);

  // Ensure the resolved path is within the uploads directory
  const relativePath = path.relative(uploadDir, imagePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid image path");
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  const prompt = `You are a highly accurate Lost and Found matching system for a university laundry service.
Look at the attached image of a "Found" item.
A student reported a lost item with these details:
- Clothing Type: ${lostDescription.split(" ")[lostDescription.split(" ").length - 1]}
- Description: (Provided in structured format below)

Compare them and return a JSON object with exactly two keys:
1. "match_percentage": A number between 0 and 100 representing how likely these are the same item. (e.g., 85)
2. "reasoning": A 1-2 sentence explanation mentioning matching or conflicting details like color, brand, type, or marks.

Lost item description: ${JSON.stringify(lostDescription)}
`;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Image } },
      ],
    }],
    generationConfig: { response_mime_type: "application/json" },
  };

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  return JSON.parse(text) as MatchResult;
}
