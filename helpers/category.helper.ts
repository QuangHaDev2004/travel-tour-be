import Category from "../models/category.model";

export const buildCategoryTree = (categories: any, parentId = "") => {
  // Tạo mảng lưu danh mục con
  const tree: any = [];

  categories.forEach((item: any) => {
    // Nếu parent của danh mục hiện tại khớp với parentId
    if (item.parent === parentId) {
      // Đệ quy để tìm các danh mục con của danh mục hiện tại
      const children = buildCategoryTree(categories, item.id);

      // Thêm danh mục hiện tại vào cây cùng với danh mục con
      tree.push({
        id: item.id,
        name: item.name,
        slug: item.slug,
        children: children,
      });
    }
  });

  return tree;
};

export const getCategoryChild: any = async (parentId: string) => {
  // Tạo mảng lưu danh mục con
  const result = [];

  const childList = await Category.find({
    status: "active",
    deleted: false,
    parent: parentId,
  });

  for (const item of childList) {
    result.push({
      id: item.id,
      name: item.name,
    });

    const subChild = await getCategoryChild(item.id);

    for (const child of subChild) {
      result.push({
        id: child.id,
        name: child.name,
      });
    }
  }

  return result;
};
