import React, { useState, useContext } from 'react';
import { CgClose } from "react-icons/cg";
import productCategory from '../helpers/productCategory'; // Include subcategories in this import
import { FaCloudUploadAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import SummaryApi from '../common';
import { toast } from 'react-toastify';
import AWS from 'aws-sdk';
import Context from "../context/index";
import { useSeller } from "../context/SellerContext"

const UploadProduct = ({
  onClose,
  fetchData,
}) => {
  const { seller } = useSeller(); // Get seller data from context
  const { authToken } = useContext(Context); // Get the authToken from Context

  const [data, setData] = useState({
    productName: "",
    brandName: "",
    category: "",
    subcategory: "",
    productImage: [],
    price: "",
    sellingPrice: "",
    quantity: "",
    soldBy: "",
    percentOff: "5",
    gst: "",
    gstAmount: "",
    sellerId: seller ? seller._id : null, // Default to null if no seller
  });
  console.log("Product Data Sent from Frontend: ", data);

  const [subcategories, setSubcategories] = useState([]);
  const [openFullScreenImage, setOpenFullScreenImage] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState("");
  const [subSubcategories, setSubSubcategories] = useState([]);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    
    console.log('Before Update - name:', name, 'value:', value);
    
    setData((prev) => {
      const updatedData = {
        ...prev,
        [name]: value,
      };
  
      // Recalculate sellingPrice if price or percentOff changes
      if (updatedData.price && updatedData.percentOff) {
        const priceValue = parseFloat(updatedData.price);
        const discount = parseFloat(updatedData.percentOff);
        
        if (priceValue > 0 && discount >= 0) {
          const sellingPriceValue = priceValue - (priceValue * (discount / 100));
          updatedData.sellingPrice = Math.ceil(sellingPriceValue);
        }
      }
  
      // Recalculate gstAmount if sellingPrice or gst changes
      if (updatedData.price && updatedData.gst) {
        const priceValue = parseFloat(updatedData.price);
        const gstPercentage = parseFloat(updatedData.gst);
  
        if (priceValue > 0 && gstPercentage >= 0) {
          const gstvalue = priceValue * (gstPercentage / 100); // GST Amount
          updatedData.gstAmount = Math.ceil(gstvalue); // Rounded GST amount
        }
      }
      return updatedData;
    });
  };

  // Handle category change and update subcategories
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    const selected = productCategory.find((cat) => cat.value === selectedCategory);
    setData((prev) => ({
      ...prev,
      category: selectedCategory,
      subcategory: "", // Reset subcategory
      subSubcategory: "", // Reset sub-subcategory
    }));
    setSubcategories(selected ? selected.subcategories : []);
    setSubSubcategories([]); // Clear sub-subcategories
  };

  // Configure AWS
  console.log(process.env.REACT_APP_ACCESS_KEY, process.env.REACT_APP_SECRET_ACCESS_KEY, process.env.REACT_APP_BUCKET_REGION)
  AWS.config.update({
    accessKeyId: process.env.REACT_APP_ACCESS_KEY,
    secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY,
    region: process.env.REACT_APP_BUCKET_REGION
  });

  const s3 = new AWS.S3();

  const handleUploadProduct = async (e) => {
    const files = e.target.files; // Get all selected files
    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(file);
      try {
        const url = await uploadImageToS3(file);
        uploadedImages.push(url); // Store the uploaded image URL
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    // Update the state with the uploaded images
    setData((prev) => ({
      ...prev,
      productImage: [...prev.productImage, ...uploadedImages], // Add new images to existing ones
    }));
  };

  const uploadImageToS3 = async (file) => {
    const params = {
      Bucket: process.env.REACT_APP_BUCKET_NAME,
      Key: `products/${Date.now()}_${file.name}`, // you can change the path as per your structure
      Body: file,
      ContentType: file.type,
    };

    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data.Location); // URL of the uploaded file
      });
    });
  };

  const handleDeleteProductImage = (index) => {
    const newProductImage = [...data.productImage];
    newProductImage.splice(index, 1);
    setData((prev) => ({
      ...prev,
      productImage: [...newProductImage]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitted Data:", data); 
    const response = await fetch(SummaryApi.uploadProduct.url, {
      method: SummaryApi.uploadProduct.method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data)
    });
    const responseData = await response.json();

    if (responseData.success) {
      toast.success(responseData?.message);
      onClose();
      fetchData();
    } else {
      toast.error(responseData?.message);
    }
  };

  return (
    <div className='fixed w-full h-full bg-slate-200 bg-opacity-35 top-0 left-0 right-0 bottom-0 flex justify-center items-center'>
      <div className='bg-white p-4 rounded w-full max-w-2xl h-full max-h-[80%] overflow-hidden'>
        <div className='flex justify-between items-center pb-3'>
          <h2 className='font-bold text-lg'>Upload Product</h2>
          <div className='w-fit ml-auto text-2xl hover:text-sky-600 cursor-pointer' onClick={onClose}>
            <CgClose />
          </div>
        </div>

        <form className='grid p-4 gap-2 overflow-y-scroll h-full pb-5' onSubmit={handleSubmit}>
          <label htmlFor='productName'>Product Name :</label>
          <input
            type='text'
            id='productName'
            placeholder='enter product name'
            name='productName'
            value={data.productName}
            onChange={handleOnChange}
            className='p-2 bg-slate-100 border rounded'
            required
          />

          <label htmlFor='brandName' className='mt-3'>Brand Name :</label>
          <input
            type='text'
            id='brandName'
            placeholder='enter brand name'
            value={data.brandName}
            name='brandName'
            onChange={handleOnChange}
            className='p-2 bg-slate-100 border rounded'
            required
          />

          {/* Category Dropdown */}
          <label htmlFor="category" className="mt-3">Category :</label>
          <select
            required
            value={data.category}
            name="category"
            onChange={handleCategoryChange}
            className="p-2 bg-slate-100 border rounded"
          >
            <option value={""}>Select Category</option>
            {productCategory.map((el, index) => (
              <option value={el.value} key={el.value + index}>
                {el.label}
              </option>
            ))}
          </select>

          <label htmlFor='productImage' className='mt-3'>Product Image :</label>
          <label htmlFor='uploadImageInput'>
            <div className='p-2 bg-slate-100 border rounded h-32 w-full flex justify-center items-center cursor-pointer'>
              <div className='text-slate-500 flex justify-center items-center flex-col gap-2'>
                <span className='text-4xl'><FaCloudUploadAlt /></span>
                <p className='text-sm'>Upload Product Image</p>
                <input type='file' id='uploadImageInput' multiple onChange={handleUploadProduct} />
              </div>
            </div>
          </label>

          <div>
            {data?.productImage[0] ? (
              <div className='flex items-center gap-2'>
                {data.productImage.map((el, index) => (
                  <div className='relative group' key={index}>
                    <img
                      src={el}
                      alt={el}
                      width={80}
                      height={80}
                      className='bg-slate-100 border cursor-pointer'
                      onClick={() => {
                        setOpenFullScreenImage(true);
                        setFullScreenImage(el);
                      }}
                    />
                    <div className='absolute bottom-0 right-0 p-1 text-white bg-sky-600 rounded-full hidden group-hover:block cursor-pointer' onClick={() => handleDeleteProductImage(index)}>
                      <MdDelete />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sky-600 text-xs'>*Please upload product image</p>
            )}
          </div>

          <label htmlFor='price' className='mt-3'>MRP Price :</label>
        <input
          type='number'
          id='price'
          placeholder='Enter MRP price'
          value={data.price}
          name='price'
          onChange={handleOnChange}
          className='p-2 bg-slate-100 border rounded'
          required
          onWheel={(e) => e.target.blur()} // Prevents scroll behavior
        />

          <label htmlFor='percentOff' className='mt-3'>Discount Percentage (%):</label>
          <input
            type="number"
            id="percentOff"
            placeholder="Enter discount percentage"
            value={data.percentOff}
            name="percentOff"
            onChange={handleOnChange}
            className="p-2 bg-slate-100 border rounded"
            required
            onWheel={(e) => e.target.blur()}
          />

          <label htmlFor='sellingPrice' className='mt-3'>Selling Price :</label>
          <input
            type='number'
            id='sellingPrice'
            placeholder='selling price will be auto-calculated'
            value={data.sellingPrice}
            name='sellingPrice'
            onChange={handleOnChange}
            className='p-2 bg-slate-100 border rounded'
            disabled
          />

          <label htmlFor="gst" className="mt-3">GST Percentage (%):</label>
          <select
            id="gst"
            name="gst"
            value={data.gst}
            onChange={handleOnChange}
            className="p-2 bg-slate-100 border rounded"
            required
          >
            <option value="" disabled>Select GST percentage</option>
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>

          <label htmlFor='gstAmount' className='mt-3'>GST Amount:</label>
          <input
            type='number'
            id='gstAmount'
            placeholder='GST amount will be auto-calculated'
            value={data.gstAmount}
            name='gstAmount'
            className='p-2 bg-slate-100 border rounded'
            disabled
          />

          <label htmlFor='quantity' className='mt-3'>Quantity :</label>
          <input
            type='Number'
            id='quantity'
            placeholder='enter quantity'
            name='quantity'
            value={data.quantity}
            onChange={handleOnChange}
            className='p-2 bg-slate-100 border rounded'
            required
          />

          <label htmlFor="soldBy" className="mt-3 block">
            Sold By:
          </label>
          <textarea
            id="soldBy"
            placeholder="Enter Sold by"
            value={data.soldBy}
            name="soldBy"
            onChange={handleOnChange}
            className="p-2 bg-slate-100 border rounded w-full h-10 overflow-y-auto"
          ></textarea>

          <button
            type='submit'
            className='bg-sky-600 text-white p-2 rounded w-full mt-5'
          >
            Upload Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadProduct;
