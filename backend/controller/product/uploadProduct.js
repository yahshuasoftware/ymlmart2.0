const uploadProductPermission = require("../../helpers/permission");
const productModel = require("../../models/productModel");

async function UploadProductController(req, res) {
  try {
    const { 
      productName, brandName, category, subcategory, productImage, 
      description, price, percentOff, sellingPrice, quantity, 
      gst, gstAmount, soldBy, features, productInfo, sellerId 
    } = req.body;

    // Calculate profit
    const profit = (sellingPrice - price) * quantity; // Profit per product multiplied by quantity

    const productData = {
      productName,
      brandName,
      category,
      subcategory,
      productImage,
      description,
      price,
      percentOff,
      sellingPrice,
      quantity,
      gst,
      gstAmount,
      soldBy,
      features,
      productInfo,
      sellerId,
      profit, // Add profit to the product data
    };

    console.log("Product data to save:", productData);

    const uploadProduct = new productModel(productData);
    const saveProduct = await uploadProduct.save();

    res.status(201).json({
      message: "Product uploaded successfully",
      error: false,
      success: true,
      data: saveProduct,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || "An error occurred",
      error: true,
      success: false,
    });
  }
}

module.exports = UploadProductController;
