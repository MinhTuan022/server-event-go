const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, require: true },
});

const Catygory = mongoose.model("Category", categorySchema);

module.exports = Catygory;
