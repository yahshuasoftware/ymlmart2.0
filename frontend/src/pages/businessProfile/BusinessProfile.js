import React, { useState, useEffect, useContext } from 'react';
import { FaUserFriends, FaListAlt, FaMoneyCheckAlt, FaTimes, FaBars, FaIdCard } from "react-icons/fa";
import { FaRegCircleUser } from "react-icons/fa6";
import MyProfile from './ProfileForm';
import moment from 'moment';
import SummaryApi from '../../common';
import Context from "../../context/index";

const BusinessProfile = () => {
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [activeSection, setActiveSection] = useState("My Team");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [orderData, setOrderData] = useState([]);

  const { authToken } = useContext(Context);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    fetchUserData(authToken);
    fetchOrderData(authToken);
  }, []);

  const fetchUserData = async (authToken) => {
    try {
      const response = await fetch(SummaryApi.current_user.url, {
        method: SummaryApi.current_user.method,
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchOrderData = async (authToken) => {
    try {
      const response = await fetch(SummaryApi.referralOrders.url, {
        method: SummaryApi.referralOrders.method,
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrderData(data.orders || []);
        setUsersData(data.users || []);
      } else {
        throw new Error("Failed to fetch order data");
      }
    } catch (error) {
      console.error("Error fetching order data:", error);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'Business':
        return <div className="p-4">Business Content...</div>;
      case 'Your KYC':
        return <MyProfile />;
      case 'My Team':
        return (
          <div className="p-4">
            {Array.isArray(usersData) && usersData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 text-left text-gray-600 font-semibold">Sr. No.</th>
                      <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referral Name</th>
                      <th className="py-3 px-4 text-left text-gray-600 font-semibold">Mobile No</th>
                      <th className="py-3 px-4 text-left text-gray-600 font-semibold">Purchasing</th>
                      <th className="py-3 px-4 text-left text-gray-600 font-semibold">Incentive</th>
                    </tr>
                  </thead>
                  <tbody>
                  {usersData.map((referral, index) => (
                    <tr key={referral._id || index} className="border-b hover:bg-gray-50 border-gray-200">
                      <td className="py-3 px-4 text-gray-700">{index + 1}</td>
                      <td className="py-3 px-4 text-gray-700">{referral.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-700">{referral.mobileNo || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-700">₹{referral.businessPrices?.myPurchase || 0}</td>
                      <td className="py-3 px-4 text-gray-700">
                        ₹{Math.floor((referral.businessPrices?.myPurchase || 0) * 0.05)}
                      </td>
                    </tr>
                  ))}

                  </tbody>
                </table>
              </div>
            ) : (
              <p>No referrals available.</p>
            )}
          </div>
        );
      default:
        return <div className="p-4">Select an item to view details</div>;
    }
  };

  const isBusinessPriceLow = userData?.data?.businessPrices?.myPurchase < 5000;

  return (
    <div className="relative">
    <div className="relative max-w-6xl mx-auto mt-10 p-6 bg-gray-50 rounded-lg shadow-lg flex flex-col md:flex-row">
        {/* Mobile sidebar toggle button */}
        <button
            onClick={toggleSidebar}
            className={`md:hidden text-gray-700 z-50 pb-5 pl-2 focus:outline-none focus:ring transition-transform duration-300 ${
                sidebarOpen ? 'transform translate-x-32' : ''
            }`}
        >
            {sidebarOpen ? <FaTimes size={30} /> : <FaBars size={30} />}
        </button>

        {/* Sidebar and Content Wrapper */}
        <div className="flex w-full">
            {/* Sidebar */}
            <div
                className={`fixed md:relative md:w-1/4 p-4 bg-white shadow-lg h-full transition-transform duration-300 ease-in-out z-10 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 top-0 left-0 md:static md:rounded-lg`}
                style={{ minHeight: '100%' }}
            >
                <div className="flex items-center mb-6 flex-col">
             
                        <FaRegCircleUser size={40} className="text-gray-500" />
                        <h2 className="text-lg font-semibold pt-2">{userData?.data.name}</h2>
                    
                </div>
                <nav className="space-y-4">
                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            setActiveSection('My Team');
                        }}
                        className={`flex items-center w-full p-3 rounded-lg text-left transition ${
                            activeSection === 'My Team'
                                ? 'bg-sky-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <FaUserFriends className="mr-2" /> My Team
                    </button>
                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            setActiveSection('Your KYC');
                        }}
                        disabled={isBusinessPriceLow}
                        className={`flex items-center w-full p-3 rounded-lg text-left transition ${
                            isBusinessPriceLow
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : activeSection === 'Your KYC'
                                ? 'bg-sky-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <FaIdCard className="mr-2" /> Your KYC
                    </button>
                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            setActiveSection('Business');
                        }}
                        disabled={isBusinessPriceLow}
                        className={`flex items-center w-full p-3 rounded-lg text-left transition ${
                            isBusinessPriceLow
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : activeSection === 'Business'
                                ? 'bg-sky-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <FaMoneyCheckAlt className="mr-2" /> Transaction
                    </button>
                </nav>
            </div>

            {/* Main content */}
            <div className="md:w-3/4 md:ml-4 flex-grow p-4">
                {/* Heading for low purchase */}
                {isBusinessPriceLow && (
                    <div className="p-4 mb-4 text-sm text-red-600 bg-red-100 rounded-lg">
                        You need to purchase more than ₹5000 to activate KYC and Transaction options for your business.
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-white shadow-lg rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-600">Self Purchasing</h3>
                        <p className="text-2xl">₹{userData?.data?.businessPrices?.myPurchase}</p>
                    </div>
                    <div className="p-4 bg-white shadow-lg rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-600">Team Purchasing</h3>
                        <p className="text-2xl">₹{userData?.data?.businessPrices?.totalPurchase}</p>
                    </div>
                    <div className="p-4 bg-white shadow-lg rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-600">Business Incentive</h3>
                        <p className="text-2xl">
                            ₹{Number(userData?.data?.businessPrices?.totalIncentive || 0).toFixed(2)}
                        </p>
                    </div>
                </div>
                {renderContent()}
            </div>
        </div>
    </div>
</div>

  );
  
};

export default BusinessProfile;