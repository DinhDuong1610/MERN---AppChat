import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.config";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import { generateGeminiResponse } from "./ai.service";
import {
  emitLastMessageToParticipants,
  emitNewMessageToChatRoom,
} from "../lib/socket";
import UserModel from "../models/user.model";
import axios from "axios";
import FormData from "form-data";

const checkToxicImage = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    const formData = new FormData();
    formData.append("file", buffer, { filename: "image.jpg" });

    const pythonApiUrl = "http://localhost:8000/predict";
    const result = await axios.post(pythonApiUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    return result.data.is_toxic;
  } catch (error) {
    console.error("Error checking toxic image:", error);
    return false;
  }
};


export const sendMessageService = async (
  userId: string,
  body: {
    chatId: string;
    content?: string;
    image?: string;
    replyToId?: string;
  }
) => {
  const { chatId, content, image, replyToId } = body;

  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  });
  if (!chat) throw new BadRequestException("Chat not found or unauthorized");

  if (replyToId) {
    const replyMessage = await MessageModel.findOne({
      _id: replyToId,
      chatId,
    });
    if (!replyMessage) throw new NotFoundException("Reply message not found");
  }

  let imageUrl;
  let isToxic = false;

  if (image) {
    //upload the image to cloudinary
    const uploadRes = await cloudinary.uploader.upload(image);
    imageUrl = uploadRes.secure_url;

    isToxic = await checkToxicImage(imageUrl);
  }

  const newMessage = await MessageModel.create({
    chatId,
    sender: userId,
    content,
    image: imageUrl,
    isToxic: isToxic,
    replyTo: replyToId || null,
  });

  await newMessage.populate([
    { path: "sender", select: "name avatar" },
    {
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    },
  ]);

  chat.lastMessage = newMessage._id as mongoose.Types.ObjectId;
  await chat.save();

  emitNewMessageToChatRoom(userId, chatId, newMessage);

  const allParticipantIds = chat.participants.map((id) => id.toString());
  emitLastMessageToParticipants(allParticipantIds, chatId, newMessage);

  const otherParticipants = await UserModel.find({
    _id: { $in: chat.participants },
    isAI: true,
  });

  const aiUser = otherParticipants[0];

  if (aiUser && content) {
    (async () => {
      try {
        const aiResponseText = await generateGeminiResponse(chatId, content);

        const aiUserId = aiUser._id as mongoose.Types.ObjectId;

        const aiMessage = await MessageModel.create({
          chatId,
          sender: aiUserId,
          content: aiResponseText,
          image: null,
          replyTo: newMessage._id,
        });

        await aiMessage.populate([
          { path: "sender", select: "name avatar isAI" },
          { path: "replyTo", select: "content" }
        ]);

        chat.lastMessage = aiMessage._id as mongoose.Types.ObjectId;
        await chat.save();

        emitNewMessageToChatRoom(aiUserId.toString(), chatId, aiMessage);

        const allParticipantIds = chat.participants.map((id) => id.toString());
        emitLastMessageToParticipants(allParticipantIds, chatId, aiMessage);

      } catch (err) {
        console.error("Error generating AI response:", err);
      }
    })();
  }

  return {
    userMessage: newMessage,
    chat,
  };
};
