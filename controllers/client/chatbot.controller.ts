import { Request, Response } from "express";
import { extractIntent } from "../../services/ai.service";
import { searchTours } from "../../services/tour.service";
import { mapCity } from "../../services/mapCity.service";
import { ai } from "../../config/aiConfig";

/**
 * Xử lý yêu cầu trò chuyện với Trợ lý ảo (Chatbot) của 36Travel.
 * @author QuangHaDev - 20.03.2026
 */
export const createChatbotPost = async (req: Request, res: Response) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({
        message: "Tin nhắn là bắt buộc.",
      });
    }

    // hiểu câu hỏi user
    const intent = await extractIntent(message);
    console.log({
      "Msg: ": message,
      "Intent: ": intent,
    });

    let tours: any[] = [];

    switch (intent.intentType) {
      case "greeting":
        return res.json({
          opening: `
            Dạ em chào Anh/Chị, em là trợ lý ảo của 36Travel. 
            Em có thể hỗ trợ thông tin tour nào cho Anh/Chị ạ?`,
          tours: [],
        });

      case "out_of_scope":
        return res.json({
          opening:
            "Dạ em chuyên hỗ trợ tour du lịch ạ 😊 Anh/Chị đang quan tâm điểm đến nào để em tư vấn tốt hơn ạ?",
          tours: [],
        });

      case "tour_search":
        const toursRaw = await searchTours(intent);
        const tourMap = await mapCity(toursRaw);
        if (tourMap.length > 0) {
          for (const item of tourMap) {
            const itemFinal = {
              id: item._id,
              name: item.name,
              slug: item.slug,
              avatar: item.avatar,
              priceNewAdult: item.priceNewAdult,
              locationsToName: item.locationsToName,
            };

            tours.push(itemFinal);
          }
        }

      case "small_talk":
        break;
    }

    // format dữ liệu tour
    const tourText = tours
      .map(
        (t: any) => `
        Tên: ${t.name},
        Giá: ${t.priceNewAdult?.toLocaleString()} VNĐ
        Điểm đến: ${t.locationsToName?.join(", ")}
        Thời gian: ${t.time}
     `,
      )
      .join("\n");

    const prompt = `
      Bạn là nhân viên tư vấn tour chuyên nghiệp của công ty du lịch 36Travel.

      Câu hỏi khách: "${message}"
      Intent: ${intent.intentType}
      Dữ liệu tour:  ${tourText || "Không có tour nào phù hợp."}

      NHIỆM VỤ:
        - Nếu là small_talk → trả lời đúng câu hỏi (tự nhiên, KHÔNG sai ngữ cảnh)
        - Sau đó dẫn nhẹ về du lịch (1 câu)
        - Nếu là tour_search → tư vấn dựa trên dữ liệu tour
        - Nếu không có tour → hỏi thêm thông tin
      
      QUY TẮC:
        - Xưng "em", gọi "Anh/Chị"
        - Ngắn gọn 2-3 câu
        - Có emoji 😊
        - Không bịa dữ liệu

      FORMAT JSON:
      {
        "opening": "",
        "closing": ""
      }
    `;

    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL!,
      contents: prompt,
    });

    try {
      const reply = JSON.parse(
        result.text?.replace(/```json|```/g, "").trim() ?? "{}",
      );

      return res.json({
        opening: reply.opening,
        tours: tours,
        closing: reply.closing,
      });
    } catch (error) {
      return res.json({
        opening: "Cảm ơn Anh/Chị đã tin tưởng 36Travel!",
        tours: tours,
        closing: "Em rất mong được hỗ trợ Anh/Chị sớm ạ!",
      });
    }
  } catch (error) {
    console.error("Có lỗi khi gọi createChatbotPost.", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
