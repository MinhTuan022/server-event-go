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

const getCategory = async (req, res) => {
  try {
    const {cateId} = req.query
    const category = await CategoryModel.findById(cateId);
    res
      .status(200)
      .json({ message: "Get Category Successfully", data: category });
  } catch (error) {
    res.status(500).json({ message: "Failed to Get Category" });
  }
};
const addCategory = async (req, res) => {
  try {
    const { categoryName } = req.body;
    const newCategory = new CategoryModel({ categoryName });
    await newCategory.save();

    res.status(200).json({ message: "Successfully", data: newCategory });
  } catch (error) {
    res.status(500).json({ message: "Failed to Add Category" });
  }
};

module.exports = {
  getAllCategory,
  addCategory,
  getCategory
}
