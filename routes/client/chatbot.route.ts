import { Router } from "express";
import * as chatbotController from "../../controllers/client/chatbot.controller";

const router = Router();

router.post("/", chatbotController.createChatbotPost);

export default router;
