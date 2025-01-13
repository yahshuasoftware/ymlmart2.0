import React, { useState, useContext } from 'react';
import { CgClose } from "react-icons/cg";
import productCategory from '../helpers/productCategory'; // Include subcategories in this import
import { FaCloudUploadAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import SummaryApi from '../common';
import { toast } from 'react-toastify';
import AWS from 'aws-sdk';
import Context from "../context/index";
import { useSeller } from "../context/SellerContext";

const UploadProduct = ({ onClose, fetchData }) => {
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
    gst: "",
    gstAmount: "",
    soldBy: "",
    percentOff: "",
    sellerId: seller ? seller._id : null, // Default to null if no seller
  });

  const [subcategories, setSubcategories] = useState([]);
  const [openFullScreenImage, setOpenFullScreenImage] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState("");
  const [subSubcategories, setSubSubcategories] = useState([]);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => {
      const updatedData = { ...prev, [name]: value };

      // Auto-calculate selling price and GST amount if applicable
      if (updatedData.price && updatedData.percentOff) {
        const priceValue = parseFloat(updatedData.price);
        const discount = parseFloat(updatedData.percentOff);
        if (priceValue > 0 && discount >= 0) {
          const sellingPriceValue = priceValue - (priceValue * (discount / 100));
          updatedData.sellingPrice = sellingPriceValue.toFixed(2); // Calculate and set selling price
        }
      }

      if (updatedData.price && updatedData.gst) {
        const priceValue = parseFloat(updatedData.price);
        const gstPercentage = parseFloat(updatedData.gst);
        if (priceValue > 0 && gstPercentage >= 0) {
          updatedData.gstAmount = ((priceValue * gstPercentage) / 100).toFixed(2); // Calculate GST amount
        }
      }

      return updatedData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(SummaryApi.uploadProduct.url, {
      method: SummaryApi.uploadProduct.method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
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
          {/* Other input fields */}

          <label htmlFor='gst' className='mt-3'>GST Percentage (%):</label>
          <input
            type='number'
            id='gst'
            placeholder='Enter GST percentage'
            value={data.gst}
            name='gst'
            onChange={handleOnChange}
            className='p-2 bg-slate-100 border rounded'
            required
          />

          <label htmlFor='gstAmount' className='mt-3'>GST Amount:</label>
          <input
            type='text'
            id='gstAmount'
            placeholder='GST amount will be auto-calculated'
            value={data.gstAmount}
            name='gstAmount'
            className='p-2 bg-slate-100 border rounded'
            disabled
          />

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
