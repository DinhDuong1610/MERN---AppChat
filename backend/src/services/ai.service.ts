import { GoogleGenerativeAI } from "@google/generative-ai";
import { Env } from "../config/env.config";
import MessageModel from "../models/message.model";

const genAI = new GoogleGenerativeAI(Env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateGeminiResponse = async (
    chatId: string,
    userMessage: string
) => {
    try {
        const historyMessages = await MessageModel.find({ chatId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("sender", "name isAI");

        const history = historyMessages.reverse().map((msg: any) => ({
            role: msg.sender.isAI ? "model" : "user",
            parts: [{ text: msg.content || "" }],
        }));

        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Xin lỗi, hiện tại tôi đang quá tải. Vui lòng thử lại sau.";
    }
};