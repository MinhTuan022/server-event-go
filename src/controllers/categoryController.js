const CategoryModel = require("../models/CategoryModel");

const getAllCategory = async (req, res) => {
  try {
    const categoryList = await CategoryModel.find();
    res
      .status(200)
      .json({ message: "Get all Category Successfully", data: categoryList });
  } catch (error) {
    res.status(500).json({ message: "Failed to Get List Category" });
  }
};

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const newCategory = new CategoryModel({ name });
    await newCategory.save();

    res.status(200).json({ message: "Successfully", data: newCategory });
  } catch (error) {
    res.status(500).json({ message: "Failed to Add Category" });
  }
};

module.exports = {
  getAllCategory,
  addCategory
}
