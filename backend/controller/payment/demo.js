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
doc.fontSize(14).font('Helvetica-Bold');
const headerY = doc.y;

doc.text('Description', 50, headerY)
.text('Unit Price', 250, headerY, { align: 'center' })
.text('Qty', 350, headerY, { align: 'center' })
.text('Total', 450, headerY, { align: 'right' });

// Draw a line below the header
doc.moveTo(50, headerY + 20).lineTo(550, headerY + 20).stroke();
doc.y = headerY + 25;

// Product Details in Table
doc.font('Helvetica').fontSize(12);
const headerYz = doc.y;
let totalAmount = 0;

const productDetailsMap = await Promise.all(
order.products.map(async (product) => {
const productDetails = await productModel.findById(product.productId);
return { productId: product.productId, mrpPrice: productDetails?.price || 0 };
})
);

const productDetailsLookup = productDetailsMap.reduce((acc, curr) => {
acc[curr.productId.toString()] = curr.mrpPrice;
return acc;
}, {});

let currentY = headerYz; // Start from the initial position

order.products.forEach((product, index) => {
const mrpPrice = productDetailsLookup[product.productId.toString()] || 0;
const productTotal = mrpPrice * product.quantity;
totalAmount += productTotal;

// Print product details in a row
doc.text(`${index + 1}. ${product.name}`, 50, currentY)
.text(`${mrpPrice}`, 250, currentY, { align: 'center' })
.text(`${product.quantity}`, 350, currentY, { align: 'center' })
.text(`${productTotal.toFixed(2)}`, 450, currentY, { align: 'right' });

// Draw a line below the product row
doc.moveTo(50, currentY + 10).lineTo(550, currentY + 10).stroke();

// Increment currentY for the next product row
currentY += 20; // Adjust row height as needed
});



// Discount and GST Calculations
const discount = totalAmount * 0.05; // 5% discount
const discountedAmount = totalAmount - discount;
const finalTotal = Math.ceil(discountedAmount);

// Subtotal, Discount, GST, and Final Total Section
// Subtotal, Discount, GST, and Final Total Section
doc.moveDown(1);
doc.font('Helvetica-Bold');

// Subtotal
doc.text('Subtotal (including all GST):', 300, doc.y, { align: 'right', continued: true })
.text(`${Math.ceil(totalAmount)}`, 350, doc.y, { align: 'right' });

// Discount
doc.text('Discount (5%):', 300, doc.y, { align: 'right', continued: true })
.text(`-${Math.floor(discount)}`, 350, doc.y, { align: 'right' });

// Final Total (on its own row for emphasis)
doc.moveDown(1);
doc.fontSize(14).font('Helvetica-Bold')
.text('Total:', 300, doc.y, { align: 'right', continued: true })
.text(`${finalTotal}`, 350, doc.y, { align: 'right' });

// Finalize the PDF
doc.end(); 