import { ai } from "../config/aiConfig";

/**
 * Hàm phân tích ý định (Intent) của người dùng từ tin nhắn văn bản.
 * Sử dụng Gemini AI để trích xuất các thông tin du lịch cụ thể.
 * @param message - Câu hỏi hoặc nội dung chat từ người dùng (VD: "Tôi muốn đi Đà Lạt 3 ngày giá rẻ")
 * @returns Đối tượng JSON chứa các thông tin: địa điểm, ngân sách, số ngày và phương tiện.
 */
export const extractIntent = async (message: string) => {
  const prompt = `
    Bạn là AI phân tích ý định người dùng trong lĩnh vực du lịch.

    Nhiệm vụ:
    1. Phân loại intent:
      - "greeting": chào hỏi (xin chào, hello...)
      - "small_talk": hỏi thăm, nói chuyện phiếm (ăn cơm chưa, khỏe không...)
      - "tour_search": tìm tour du lịch
      - "out_of_scope": không liên quan (mua điện thoại, hỏi code...)

    2. Trích xuất thông tin và CHỈ trả về JSON hợp lệ.
      - locationTo: địa điểm đến (VD: Đà Lạt, Phú Quốc)
      - days: số ngày (VD: 3 ngày, 3N2Đ)
      - vehicle: phương tiện (xe, máy bay...)
      - price: ngân sách (chỉ lấy số, ví dụ: 5000000)

    Nếu không có thì:
      - string → ""
      - number → null

    QUAN TRỌNG:
      - Chỉ trả về JSON
      - Không giải thích
      - Không thêm text ngoài JSON

    Format JSON:
    {
      "intentType": "greeting | small_talk | tour_search | out_of_scope",
      "locationTo": "",
      "days": "",
      "vehicle": "",
      "price": null
    }

    Câu hỏi: ${message}
  `;

  try {
    const res = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL!,
      contents: prompt,
    });

    let text = res.text || "";

    // clean response
    text = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);

    return {
      intentType: parsed.intentType || "out_of_scope",
      locationTo: parsed.locationTo || "",
      days: parsed.days || "",
      vehicle: parsed.vehicle || "",
      price: parsed.price ? Number(parsed.price) : null,
    };
  } catch (error) {
    console.error("Có lỗi khi gọi extractIntent:", error);

    return {
      intentType: "out_of_scope",
      locationTo: "",
      days: "",
      vehicle: "",
      price: null,
    };
  }
};
