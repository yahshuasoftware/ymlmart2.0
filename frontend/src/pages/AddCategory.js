import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddCategory = () => {
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/categories', { name: categoryName });
      if (response.status === 201) {
        toast.success('Category added successfully!');
        setCategoryName('');
      } else {
        toast.error('Failed to add category. Please try again.');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-category-container bg-gray-100 p-6 rounded-lg shadow-md max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-700">Add Category</h1>
      <form onSubmit={handleSubmit} className="category-form">
        <div className="form-group mb-4">
          <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">Category Name:</label>
          <input
            type="text"
            id="categoryName"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Enter category name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Adding...' : 'Add Category'}
        </button>
      </form>
    </div>
  );
};

export default AddCategory;
