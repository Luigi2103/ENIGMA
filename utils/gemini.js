"use strict";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CreatePrompt } from "./prompt.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function GeneraEnigma(tema = "qualsiasi") {
    const prompt = CreatePrompt(tema);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return JSON.parse(text);
}
