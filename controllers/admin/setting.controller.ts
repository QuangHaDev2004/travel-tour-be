import { Request, Response } from "express";
import AccountAdmin from "../../models/account-admin.model";
import SettingWebsiteInfo from "../../models/setting-website-info.model";
import { AccountRequest } from "../../interfaces/resquest.interface";
import slugify from "slugify";
import Role from "../../models/role.model";
import bcrypt from "bcryptjs";

export const accountAdminList = async (req: Request, res: Response) => {
  try {
    const accountAdminList = await AccountAdmin.find({
      deleted: false,
    }).sort({
      createdAt: "desc",
    });

    const dataFinal = [];
    for (const item of accountAdminList) {
      const itemFinal = {
        id: item.id,
        fullName: item.fullName,
        avatar: item.avatar,
        email: item.email,
        phone: item.phone,
        roleName: "",
        positionCompany: item.positionCompany,
        status: item.status,
      };

      if (item.role) {
        const roleInfo = await Role.findOne({
          _id: item.role,
        });

        itemFinal.roleName = roleInfo?.name as string;
      }

      dataFinal.push(itemFinal);
    }

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
      accountAdminList: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi accountAdminList", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const accountAdminCreatePost = async (
  req: AccountRequest,
  res: Response
) => {
  try {
    const existAccount = await AccountAdmin.findOne({
      email: req.body.email,
    });

    if (existAccount) {
      return res.status(409).json({
        message: "Email đã tồn tại trong hệ thống!",
      });
    }

    req.body.createdBy = req.account.id;
    req.body.updatedBy = req.account.id;
    req.body.slug = slugify(req.body.email, { lower: true });
    req.body.avatar = req.file ? req.file.path : "";

    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    const newRecord = new AccountAdmin(req.body);
    await newRecord.save();

    res.status(201).json({ message: "Tạo tài khoản quản trị thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi accountAdminCreate", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const accountAdminEdit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const accountAdminDetail = await AccountAdmin.findOne({
      _id: id,
      deleted: false,
    });

    if (!accountAdminDetail) {
      return res.status(404).json({
        message: "Tài khoản quản trị không tồn tại!",
      });
    }

    const dataFinal = {
      id: accountAdminDetail.id,
      fullName: accountAdminDetail.fullName,
      email: accountAdminDetail.email,
      phone: accountAdminDetail.phone,
      role: accountAdminDetail.role,
      positionCompany: accountAdminDetail.positionCompany,
      status: accountAdminDetail.status,
      avatar: accountAdminDetail.avatar,
    };

    res.status(200).json({
      message: "Chi tiết tài khoản quản trị!",
      accountAdminDetail: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi accountAdminEdit", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const accountAdminEditPatch = async (
  req: AccountRequest,
  res: Response
) => {
  try {
    const id = req.params.id;

    const accountAdminDetail = await AccountAdmin.findOne({
      _id: id,
      deleted: false,
    });

    if (!accountAdminDetail) {
      return res.status(404).json({
        message: "Tài khoản quản trị không tồn tại!",
      });
    }

    const existEmail = await AccountAdmin.findOne({
      _id: { $ne: id }, // loại trừ chính tài khoản đang cập nhật
      email: req.body.email,
    });

    if (existEmail) {
      return res.status(409).json({
        message: "Email đã tồn tại trong hệ thống!",
      });
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    } else {
      delete req.body.password;
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

    res.status(200).json({
      message: "Cập nhật tài khoản quản trị thành công!",
    });
  } catch (error) {
    console.log("Lỗi khi gọi accountAdminEditPatch", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const websiteInfoPatch = async (req: Request, res: Response) => {
  try {
    const files = req.files as any;

    if (files && files.logo) {
      req.body.logo = files.logo[0].path;
    } else {
      delete req.body.logo;
    }

    if (files && files.favicon) {
      req.body.favicon = files.favicon[0].path;
    } else {
      delete req.body.favicon;
    }

    const websiteInfo = await SettingWebsiteInfo.findOne({});
    if (!websiteInfo) {
      const newRecord = new SettingWebsiteInfo(req.body);
      await newRecord.save();
    } else {
      await SettingWebsiteInfo.updateOne(
        {
          _id: websiteInfo.id,
        },
        req.body
      );
    }

    res.status(200).json({ message: "Cập nhật thông tin website thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi websiteInfoPatch", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const websiteInfo = async (req: Request, res: Response) => {
  try {
    const websiteInfo = await SettingWebsiteInfo.findOne({});

    if (!websiteInfo) {
      return res.status(404).json({
        message: "Thông tin website không tồn tại!",
      });
    }

    const dataFinal = {
      websiteName: websiteInfo?.websiteName,
      phone: websiteInfo?.phone,
      email: websiteInfo?.email,
      address: websiteInfo?.address,
      facebook: websiteInfo?.facebook,
      zalo: websiteInfo?.zalo,
      logo: websiteInfo?.logo,
      favicon: websiteInfo?.favicon,
    };

    res.status(200).json({
      message: "Chi tiết website info",
      websiteInfo: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi websiteInfo", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const roleCreatePost = async (req: AccountRequest, res: Response) => {
  try {
    req.body.createdBy = req.account.id;
    req.body.updatedBy = req.account.id;
    req.body.slug = slugify(req.body.name, { lower: true });

    const newRecord = new Role(req.body);
    await newRecord.save();

    res.status(201).json({
      message: "Tạo nhóm quyền thành công!",
    });
  } catch (error) {
    console.log("Lỗi khi gọi roleCreatePost", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const roleList = async (req: AccountRequest, res: Response) => {
  try {
    const roleList = await Role.find({
      deleted: false,
    }).sort({
      createdAt: "desc",
    });

    const dataFinal = [];
    for (const item of roleList) {
      const itemFinal = {
        id: item.id,
        name: item.name,
        description: item.description,
      };

      dataFinal.push(itemFinal);
    }

    res.status(200).json({
      message: "Danh sách nhóm quyền!",
      roleList: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi roleList", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const roleEdit = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    const roleDetail = await Role.findOne({
      _id: id,
      deleted: false,
    });

    if (!roleDetail) {
      return res.status(404).json({ message: "Nhóm quyền không tồn tại!" });
    }

    const dataFinal = {
      name: roleDetail.name,
      description: roleDetail.description,
      permissions: roleDetail.permissions,
    };

    res.status(200).json({
      message: "Chi tiết nhóm quyền!",
      roleDetail: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi roleEdit", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const roleEditPatch = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    const roleDetail = await Role.findOne({
      _id: id,
      deleted: false,
    });

    if (!roleDetail) {
      return res.status(404).json({ message: "Nhóm quyền không tồn tại!" });
    }

    req.body.updatedBy = req.account.id;
    req.body.slug = slugify(req.body.name, { lower: true });

    await Role.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body
    );

    res.status(200).json({ message: "Cập nhật nhóm quyền thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi roleEdit", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
