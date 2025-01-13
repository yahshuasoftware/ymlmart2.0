import React, { useEffect, useState } from 'react';
import SummaryApi from '../common';
import ChangeDeliveryStatus from '../components/ChangeDeliveryStatus';
import * as XLSX from 'xlsx'; // Import xlsx for Excel manipulation
import Loader from '../components/Loader';
import { useSeller } from '../context/SellerContext';

const OrderList = () => {
  const [orderData, setOrderData] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { seller } = useSeller(); // Get seller data from context

  const [openDropdown, setOpenDropdown] = useState(false);
  const [loading, setLoading] = useState(true); // State for loading
  const [updateDeliveryDetails, setUpdateDeliveryDetails] = useState({
    _id: '',
    deliveryStatus: '',
  });

  const fetchAllOrders = async () => {
    setLoading(true); // Set loading to true when fetching starts
    try {
      const response = await fetch(SummaryApi.getOrders.url);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setOrderData(data.orders);
      setFilteredOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false); // Set loading to false when fetching ends
    }
  };

  const handleSearch = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);
    const filtered = orderData.filter((order) =>
      order.userId?.name?.toLowerCase().includes(text)
    );
    setFilteredOrders(filtered);
  };

  const handleFilterStatus = (e) => {
    const status = e.target.value;
    setFilterStatus(status);
    const filtered =
      status === ''
        ? orderData
        : orderData.filter((order) => order.deliveryStatus === status);
    setFilteredOrders(filtered);
  };

  const handleStatusChangeClick = (order) => {
    setUpdateDeliveryDetails(order);
    setOpenDropdown(true);
  };

  const downloadExcel = () => {
    const dataToExport = orderData.map((order, index) => ({
      "Sr. No.": index + 1,
      "Customer Name": order.userId?.name || 'No name available',
      Amount: `${order.amount} ₹`,
      "Delivery Date": order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'No date available',
      "Delivery Status": order.deliveryStatus || 'Ordered',
      "Delivery Address": order.deliveryAddress
        ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.zip}`
        : 'No address available',
      "Invoice Path": order.invoicePath || 'No invoice available',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    XLSX.writeFile(workbook, 'OrderList.xlsx');
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">Order List</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by name"
            value={searchText}
            onChange={handleSearch}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={handleFilterStatus}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="Ordered">Ordered</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="In-transit">In-Transit</option>
            <option value="Out Of Delivery">Out Of Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button
            onClick={downloadExcel}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-200"
          >
            Download Excel
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center w-full h-64">
          <Loader /> {/* Display Loader */}
        </div>
      ) : (
        <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
          <thead>
            <tr className="bg-gray-800 text-white text-left">
              <th className="p-4">Sr. No.</th>
              <th className="p-4">Customer Name</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Delivery Date</th>
              <th className="p-4">Delivery Status</th>
              <th className="p-4">Delivery Address</th>
              <th className="p-4">Invoice</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          {filteredOrders.map((order, orderIndex) => (
            <tbody key={orderIndex} className="border-b border-gray-200 divide-y divide-gray-200">
              {order.products.map((product, productIndex) => (
                <tr key={`${orderIndex}-${productIndex}`} className="bg-white hover:bg-gray-100 relative">
                  {productIndex === 0 && (
                    <>
                      <td
                        rowSpan={order.products.length}
                        className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200"
                      >
                        {orderIndex + 1}
                      </td>
                      <td
                        rowSpan={order.products.length}
                        className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200"
                      >
                        {order.userId?.name || 'No name available'}
                      </td>
                      <td rowSpan={order.products.length} className="p-4 text-center font-medium text-gray-700 border-r border-gray-200">
                      ₹{order.amount}
                      </td>
                      <td rowSpan={order.products.length} className="p-4 text-center font-medium text-gray-700 border-r border-gray-200">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'No date available'}
                      </td>

                      <td
                        rowSpan={order.products.length}
                        className="p-4 text-center font-medium text-gray-700 border-r border-gray-200"
                      >
                        {order.deliveryStatus || 'Ordered'}
                      </td>
                      <td rowSpan={order.products.length} className="p-4 text-center font-medium text-gray-700 border-r border-gray-200">
                        {order.deliveryAddress
                          ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.zip}`
                          : 'No address available'}
                      </td>
                      <td rowSpan={order.products.length} className="p-4 text-center font-medium text-blue-600 underline border-r border-gray-200">
                        <a href={order.invoicePath || '#'} target="_blank" rel="noopener noreferrer">
                          View Invoice
                        </a>
                      </td>

                      <td rowSpan={order.products.length} className="p-4 text-center">
                        <button
                          className="bg-blue-500 text-white px-3 py-1 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
                          onClick={() => handleStatusChangeClick(order)}
                        >
                          Change Status
                        </button>
                      </td>
                    </>
                  )}
                  {order.deliveryStatus === 'Ordered' && (
                    <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 m-1 rounded-md text-sm animate-pulse">
                      NEW
                    </div>
                  )}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      )}

      {openDropdown && (
        <ChangeDeliveryStatus
          onClose={() => setOpenDropdown(false)}
          _id={updateDeliveryDetails._id}
          deliveryStatus={updateDeliveryDetails.deliveryStatus}
          callFunc={fetchAllOrders}
        />
      )}
    </div>
  );
};

export default OrderList;
