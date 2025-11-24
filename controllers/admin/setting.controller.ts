import { Request, Response } from "express";
import AccountAdmin from "../../models/account-admin.model";

export const accountAdminList = async (req: Request, res: Response) => {
  try {
    const fullAccountAdminList = await AccountAdmin.find({});
    const fullAccountListFinal = [];
    for (const item of fullAccountAdminList) {
      const itemFinal = {
        id: item.id,
        fullName: item.fullName,
      };

      fullAccountListFinal.push(itemFinal);
    }

    res.status(200).json({
      message: "Danh sách tài khoản quản trị!",
      fullAccountAdminList: fullAccountListFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi accountAdminList", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
