const Razorpay = require('razorpay');
const Order = require('../../models/order');
const userModel = require("../../models/userModel");
const productModel = require('../../models/productModel');
const Seller = require("../../models/sellerModel");
const PDFDocument = require('pdfkit');
const AWS = require('aws-sdk');
require('dotenv').config();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_KEY_SECRET_KEY,
});

// Configure AWS S3
AWS.config.update({
    accessKeyId: process.env.REACT_APP_ACCESS_KEY,
    secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY,
    region: process.env.REACT_APP_BUCKET_REGION,
});

const s3 = new AWS.S3();

// Create Razorpay Order
// Create Razorpay Order
const createOrder = async (req, res) => {
    const { amount, currency, receipt, userId, products, deliveryAddress } = req.body;

    try {
        // Razorpay order options
        const options = {
            amount:  Math.ceil(amount * 100), // Amount in paisa (Razorpay requires amount in smallest currency unit)
            currency: currency || "INR",
            receipt: receipt || `receipt_${Date.now()}`,
        };

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create(options);

        // Create new order in database
        const newOrder = new Order({
            order_id: razorpayOrder.id,
            products: products.map(product => ({
                productId: product.productId._id,
                name: product.productId.productName,
                quantity: product.quantity,
                price: product.productId.sellingPrice,
                image: product.productId.productImage,
            })),
            amount: razorpayOrder.amount / 100, // Convert back to main currency unit
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            userId: userId,
            deliveryAddress: deliveryAddress,
        });

        await newOrder.save();

        // Return success response
        res.status(200).json({
            success: true,
            order: razorpayOrder,
            finalAmount:  Math.ceil(amount), // Return the original amount as final amount
        });
    } catch (error) {
        console.error("Error creating Razorpay order", error);
        res.status(500).json({ success: false, message: "Server Error", error });
    }
};



// Handle Payment Success
const handlePaymentSuccess = async (req, res) => {
    const { order_id, payment_id, signature, userId } = req.body;

    try {
        const order = await Order.findOne({ order_id })
            .populate('userId')
            .populate('products.productId');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.payment_id = payment_id;
        order.signature = signature;
        order.status = 'paid';

        for (const item of order.products) {
            await userModel.findByIdAndUpdate(order.userId._id, { 
                $inc: { "businessPrices.myPurchase": order.amount } 
            });

            const product = await productModel.findById(item.productId);
            if (product) {
                if (product.quantity >= item.quantity) {
                    product.quantity -= item.quantity;
                    await product.save();

                    const sellerRevenue = Math.ceil(product.sellingPrice * 0.5);

                    await Seller.findByIdAndUpdate(product.sellerId, {
                        $inc: { totalRevenue: sellerRevenue }
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: `Not enough stock for product: ${product.productName}`,
                    });
                }
            }
        }

        // Generate and upload invoice
        const invoiceUrl = await generateInvoiceAndUploadToS3(order);
        order.invoicePath = invoiceUrl;
        await order.save();

        const user = await userModel.findById(userId);
        if (user && user.refferal.refferredbycode) {
            const referrer = await userModel.findOne({ 'refferal.refferalcode': user.refferal.refferredbycode });
            if (referrer) {
                // Increment totalPurchase and calculate 5% incentive
                const totalIncentive =  Math.floor(0.05 * order.amount);

                referrer.businessPrices.totalPurchase += order.amount; // Update totalPurchase
                referrer.businessPrices.totalIncentive += totalIncentive; // Update totalIncentive
                referrer.refferal.myrefferalorders.push({
                    userId: user._id,
                    order_id: order._id,
                });

                await referrer.save(); // Save the updated referrer details
            }
        }

        res.status(200).json({ success: true, message: "Payment successful, order updated", invoiceUrl });
    } catch (error) {
        console.error("Error updating order after payment", error);
        res.status(500).json({ success: false, message: "Server Error", error });
    }
};

// Generate Invoice and Upload to S3
const generateInvoiceAndUploadToS3 = async (order) => {
    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks);

            const params = {
                Bucket: process.env.REACT_APP_BUCKET_NAME,
                Key: `invoices/${order.order_id}.pdf`, // Path in S3
                Body: pdfBuffer,
                ContentType: 'application/pdf',
            };

            s3.upload(params, (err, data) => {
                if (err) {
                    console.error("Error uploading invoice to S3:", err);
                    return reject(err);
                }
                console.log("Invoice uploaded successfully:", data.Location);
                resolve(data.Location);
            });
        });

        doc.fontSize(20).text('YML MART', { align: 'center', bold: true });
        doc.moveDown(1);

// "Issued To" Section
doc.fontSize(14).text('Issued To:', { underline: true });
doc.fontSize(12)
    .text(`${order.deliveryAddress.name}`)
    .text(`${order.deliveryAddress.mobileNo}`)
    .text(`${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.zip}`)
    .moveDown(2);

// Invoice Details Section
doc.fontSize(14).text('Invoice Details:', { underline: true });
doc.fontSize(12)
    .text(`Invoice No: ${order._id}`)
    .text(`Date: ${new Date().toLocaleDateString()}`)
    // .text(`Due Date: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}`)
    .moveDown(2);

// Table Header
doc.fontSize(12).font('Helvetica-Bold');
const headerY = doc.y;

doc.text('Description', 50, headerY)
    .text('Unit Price', 120, headerY, { align: 'center' })
    .text('Qty', 220, headerY, { align: 'center' })
    .text('GST%', 320, headerY, { align: 'center' })
    .text('', 350, headerY, { align: 'center' })
    .text('Total', 460, headerY, { align: 'right' });

// Draw a line below the header
doc.moveTo(50, headerY + 20).lineTo(550, headerY + 20).stroke();
doc.y = headerY + 25;
doc.font('Helvetica').fontSize(10);
const headerYz = doc.y;
let totalAmount = 0;

const productDetailsMap = await Promise.all(
    order.products.map(async (product) => {
        const productDetails = await productModel.findById(product.productId);
        return {
            productId: product.productId,
            mrpPrice: productDetails?.price || 0,
            gst: productDetails?.gst || 0,
            gstAmount: productDetails?.gstAmount || 0,
        };
    })
);

const productDetailsLookup = productDetailsMap.reduce((acc, curr) => {
    acc[curr.productId.toString()] = {
        mrpPrice: curr.mrpPrice,
        gst: curr.gst,
        gstAmount: curr.gstAmount
    };
    return acc;
}, {});


let currentY = headerYz; // Start from the initial position

order.products.forEach((product, index) => {
    const productData = productDetailsLookup[product.productId.toString()] || {};
    const mrpPrice = productData.mrpPrice || 0;
    const gst = productData.gst || 0;
    const gstAmount = productData.gstAmount || 0;

    const productTotal = mrpPrice * product.quantity;
    totalAmount += productTotal;

    // Print product details in a row
    doc.text(`${index + 1}. ${product.name}`, 50, currentY)
        .text(`${mrpPrice.toFixed(2)}`, 120, currentY, { align: 'center' })
        .text(`${product.quantity}`, 220, currentY, { align: 'center' })
        .text(`${gst}%`, 300, currentY, { align: 'center' }) 
        .text(`(${gstAmount})`, 350, currentY, { align: 'center' })
        .text(`${productTotal.toFixed(2)}`, 460, currentY, { align: 'right' });

    // Draw a line below the product row
    doc.moveTo(50, currentY + 10).lineTo(550, currentY + 10).stroke();

    // Increment currentY for the next product row
    currentY += 20; // Adjust row height as needed
});

// Subtotal, Discount, and Final Total calculations remain unchanged
const discount = totalAmount * 0.05; // 5% discount
const discountedAmount = totalAmount - discount;
const finalTotal = Math.ceil(discountedAmount);

// Subtotal, Discount, and Final Total section
doc.moveDown(1);
doc.font('Helvetica-Bold');
doc.text('Subtotal (including all GST):', 300, doc.y, { align: 'right', continued: true })
   .text(`${Math.ceil(totalAmount)}`, 350, doc.y, { align: 'right' });

doc.text('Discount (5%):', 300, doc.y, { align: 'right', continued: true })
   .text(`-${Math.floor(discount)}`, 350, doc.y, { align: 'right' });

doc.moveDown(1);
doc.fontSize(14).font('Helvetica-Bold')
   .text('Total:', 300, doc.y, { align: 'right', continued: true })
   .text(`${finalTotal}`, 350, doc.y, { align: 'right' });

// Finalize the PDF
doc.end();
        
        
        
    });
};

module.exports = { createOrder, handlePaymentSuccess };
