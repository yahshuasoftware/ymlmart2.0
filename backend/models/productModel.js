const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    productName: String,
    brandName: String,
    category: String,
    subcategory: String, // Subcategory field
    productImage: [], // Array for product images
    description: String,
    price: Number,
    percentOff: Number,
    sellingPrice: Number,
    quantity: Number,
    gst: Number, // GST percentage
    gstAmount: Number, // Calculated GST amount
    soldBy: String,
    features: String,
    productInfo: String,
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: false }, // Optional field
    profit: { type: Number, default: 0 }, // Add profit field
  },
  {
    timestamps: true,
  }
);

const productModel = mongoose.model('product', productSchema);

module.exports = productModel;
