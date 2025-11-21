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
