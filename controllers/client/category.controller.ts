import { Request, Response } from "express";
import Category from "../../models/category.model";

export const list = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const categoryDetail = await Category.findOne({
      slug: slug,
      deleted: false,
      status: "active",
    });

    if (!categoryDetail) {
      return res.status(404).json({ message: "Danh mục không tồn tại!" });
    }

    // Breadcrumb
    const breadcrumb = [];

    if (categoryDetail.parent) {
      const categoryParent = await Category.findOne({
        _id: categoryDetail.parent,
        deleted: false,
        status: "active",
      });

      if (categoryParent) {
        breadcrumb.push({
          id: categoryParent.id,
          name: categoryParent.name,
          slug: categoryParent.slug,
          avatar: categoryParent.avatar,
        });
      }
    }

    breadcrumb.push({
      id: categoryDetail.id,
      name: categoryDetail.name,
      slug: categoryDetail.slug,
      avatar: categoryDetail.avatar,
    });

    res.status(200).json({
      message: "Danh sách tour theo danh mục!",
      breadcrumb,
    });
  } catch (error) {
    console.log("Lỗi khi gọi list", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
