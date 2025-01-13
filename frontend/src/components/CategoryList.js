import React, { useEffect, useState } from 'react';
import SummaryApi from '../common';
import { Link } from 'react-router-dom';
import productCategory from '../helpers/productCategory';
import personalCareImage from '../assest/CategoryImgs/Personal Care.jpg';
import beautyImage from '../assest/CategoryImgs/Beauty.jpg';
import stationaryImage from '../assest/CategoryImgs/Stationary.jpg';
import electronicsImage from '../assest/CategoryImgs/Electronics.jpg';
import homeDecorImage from '../assest/CategoryImgs/Home Decor.jpg';
import groceriesImage from '../assest/CategoryImgs/Groceries.jpg';
import gifthampersImage from '../assest/CategoryImgs/Gifts & Hampers.jpg';
import kitchenwareImage from '../assest/CategoryImgs/Kitchenware.jpg';
import toysandgamesImage from '../assest/CategoryImgs/toys and games.jpg';
import fashion from '../assest/CategoryImgs/fashion.jpg';
import food from '../assest/CategoryImgs/food.png';
import healthcare from '../assest/CategoryImgs/helth.png';
import vegetables from '../assest/CategoryImgs/vegetables.png';
import nonvage from '../assest/CategoryImgs/nonvage.png';
import dairy from '../assest/CategoryImgs/dairy.png';
import furniture from '../assest/CategoryImgs/furniture.png';
import fruitsImage from '../assest/CategoryImgs/fruits.jpg';
import homecare from '../assest/CategoryImgs/homecare.png'
import bags from '../assest/CategoryImgs/bags.png'
import sports from '../assest/CategoryImgs/sports.png'

const CategoryList = () => {
  const categoryImages = {
    "personal care": personalCareImage,
    "stationary": stationaryImage,
    "electronics": electronicsImage,
    "groceries": groceriesImage,
    "gifts, hampers": gifthampersImage,
    "kitchenware": kitchenwareImage,
    "toys, games": toysandgamesImage,
    "garments": fashion,
    "health care": healthcare,
    "vegitables": vegetables,
    "fruits": fruitsImage,
    "non veg": nonvage,
    "dairy": dairy,
    "furniture": furniture,
    "food": food,
    "home decor" : homeDecorImage,
    "home care" : homecare,
    "bags" : bags,
    "sports" : sports,
  };

  const [categoryProduct, setCategoryProduct] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategoryProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(SummaryApi.categoryProduct.url);
      const dataResponse = await response.json();
      let products = Array.isArray(dataResponse.data) ? dataResponse.data : [];

      // Move 'grocery' category to the first position

      setCategoryProduct(products);
    } catch (error) {
      console.error('Failed to fetch category products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryProduct();
  }, []);

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Categories</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="bg-gray-200 h-40 rounded-lg animate-pulse"></div>
            ))
          : categoryProduct.map((product) => (
              <Link
                key={product?.category || product?._id}
                to={`/product-category?category=${product?.category}`}
                className="bg-yellow-100 rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow transform hover:scale-105 text-center"
              >
                <div className="w-full bg-white h-40 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                  <img
                    src={
                      categoryImages[product?.category.toLowerCase()] ||
                      categoryImages['default']
                    }
                    alt={product?.category}
                    className="h-28 object-contain"
                  />
                </div>
                <h3 className="text-sm font-medium text-gray-800 capitalize">
                  {product?.category}
                </h3>
              </Link>
            ))}
      </div>
    </div>
  );
};

export default CategoryList;
