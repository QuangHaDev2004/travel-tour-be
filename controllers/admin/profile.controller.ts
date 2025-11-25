import { Response } from "express";
import { AccountRequest } from "../../interfaces/resquest.interface";
import Role from "../../models/role.model";
import AccountAdmin from "../../models/account-admin.model";
import slugify from "slugify";
import bcrypt from "bcryptjs";

export const profileEdit = async (req: AccountRequest, res: Response) => {
  try {
    const profileDetail = {
      fullName: req.account.fullName,
      email: req.account.email,
      phone: req.account.phone,
      positionCompany: req.account.positionCompany,
      roleName: "",
      avatar: req.account.avatar,
    };

    if (req.account.role) {
      const roleInfo = await Role.findOne({
        _id: req.account.role,
      });

      profileDetail.roleName = roleInfo?.name as string;
    }

    res.status(200).json({
      message: "Chi tiết thông tin cá nhân!",
      profileDetail,
    });
  } catch (error) {
    console.log("Lỗi khi gọi profileEdit", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const profileEditPatch = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.account.id;

    const existEmail = await AccountAdmin.findOne({
      _id: { $ne: id }, // loại trừ chính tài khoản đang cập nhật
      email: req.body.email,
    });

    if (existEmail) {
      return res.status(409).json({
        message: "Email đã tồn tại trong hệ thống!",
      });
    }

    req.body.updatedBy = req.account.id;
    req.body.slug = slugify(req.body.email, { lower: true });
    if (req.file) {
      req.body.avatar = req.file.path;
    } else {
      delete req.body.avatar;
    }

    await AccountAdmin.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body
    );

    const account = await AccountAdmin.findOne({
      _id: id,
      deleted: false,
    });

    const dataFinal = {
      fullName: account?.fullName,
      avatar: account?.avatar,
      roleName: "",
    };

    if (account?.role) {
      const roleInfo = await Role.findOne({
        _id: account?.role,
      });

      dataFinal.roleName = roleInfo?.name as string;
    }

    res.status(200).json({
      message: "Cập nhật thông tin cá nhân thành công!",
      account: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi profileEditPatch", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const profileChangePasswordPatch = async (
  req: AccountRequest,
  res: Response
) => {
  try {
    const id = req.account.id;

    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    await AccountAdmin.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body
    );

    res.status(200).json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi profileChangePasswordPatch", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
