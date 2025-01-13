import React, { useState } from 'react';
import loginIcons from '../assest/signin.gif';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from 'react-router-dom';
import SummaryApi from '../common';
import { toast } from 'react-toastify';
import profile from "../assest/loginProfile1.png";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState({
    name: "",
    // email: "",
    password: "",
    refferredbycode: "",
    mobileNo: "",
    // profilePic: ""
  });

  const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [errors, setErrors] = useState({});
    const [sessionId, setSessionId] = useState('');
    const navigate = useNavigate();
    const API_KEY = '2c88d675-c1d8-11ef-8b17-0200cd936042';

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    setErrors((prev) => ({
      ...prev,
      [name]: ""
    }));
  };

  const validate = () => {
    const newErrors = {};

    // if (!data.email) {
    //   newErrors.email = "Email is required";
    // } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    //   newErrors.email = "Enter a valid email address";
    // }
    if (!data.mobileNo) {
      newErrors.mobileNo = "Mobile number is required";
    } else if (!/^\d{10}$/.test(data.mobileNo)) {
      newErrors.mobileNo = "Enter a valid 10-digit mobile number";
    }
    if (!data.password) {
      newErrors.password = "Password is required";
    } else if (data.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOtp = async () => {
      if (!data.mobileNo || !/^\d{10}$/.test(data.mobileNo)) {
        toast.error("Enter a valid mobile number");
        return;
      }
      try {
        const response = await fetch(`https://2factor.in/API/V1/${API_KEY}/SMS/${data.mobileNo}/AUTOGEN2/OTP1`, {
          method: "POST"
        });
        const result = await response.json();
        if (result.Status === "Success") {
          setOtpSent(true);
          setSessionId(result.Details); // Capture the sessionId
          toast.success("OTP sent to your mobile number");
        } else {
          toast.error("Failed to send OTP");
        }
      } catch (error) {
        toast.error("Error sending OTP");
      }
    };
    
  
    const verifyOtp = async () => {
      if (!otp) {
        toast.error("Please enter the OTP");
        return;
      }
      try {
        const response = await fetch(`https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`, {
          method: "GET"
        });
        const result = await response.json();
        if (result.Status === "Success") {
          setOtpVerified(true);
          toast.success("Mobile number verified successfully");
        } else {
          toast.error("Invalid OTP");
        }
      } catch (error) {
        toast.error("Error verifying OTP");
      }
    };
    

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validate()) return;
      if (!otpVerified) {
        toast.error("Please verify your mobile number first");
        return;
      }

    const formData = new FormData();
    formData.append('name', data.name);
    // formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('refferredbycode', data.refferredbycode);
    formData.append('mobileNo', data.mobileNo);

    const dataResponse = await fetch(SummaryApi.signUP.url, {
      method: SummaryApi.signUP.method,
      body: formData
    });

    const dataApi = await dataResponse.json();
    if (dataApi.success) {
      toast.success(dataApi.message);
      navigate("/login");
    } else {
      toast.error(dataApi.message);
    }
  };
    

  return (
    <section id='signup'>
      <div className='mx-auto container p-4'>
        <div className='bg-white p-5 w-full max-w-sm mx-auto'>
          <div className='w-20 h-20 mx-auto relative overflow-hidden rounded-full'>
            <div>
              <img src={profile} alt='login icons' />
            </div>
          </div>

          <form className='pt-6 flex flex-col gap-2' onSubmit={handleSubmit}>
          <label>Full Name :</label>
              <div className='bg-slate-100 p-2'>
                <input 
                  type='text' 
                  placeholder='Enter Your Full Name' 
                  name='name'
                  value={data.name}
                  onChange={handleOnChange}
                  required
                  className='w-full h-full outline-none bg-transparent' />
              </div>
          <div className='grid'>
              <label>Mobile No:</label>
              <div className='flex gap-2 items-center'>
                <input
                  type='number'
                  placeholder='Enter Mobile No'
                  name='mobileNo'
                  value={data.mobileNo}
                  onChange={handleOnChange}
                  className='w-full bg-slate-100 p-2 outline-none'
                  onWheel={(e) => e.target.blur()}
                />
                <button
                  type='button'
                  className='bg-blue-500 text-white px-4 py-1 rounded'
                  onClick={sendOtp}
                  disabled={otpSent || otpVerified}
                >
                  {otpVerified ? "Verified" : "Verify"}
                </button>
              </div>
              {errors.mobileNo && <p className='text-red-500 text-sm'>{errors.mobileNo}</p>}
            </div>

            {otpSent && !otpVerified && (
              <div className='grid'>
                <label>Enter OTP:</label>
                <div className='flex gap-2 items-center'>
                  <input
                    type='number'
                    placeholder='Enter OTP'
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className='w-full bg-slate-100 p-2 outline-none'
                  />
                  <button
                    type='button'
                    className='bg-green-500 text-white px-4 py-1 rounded'
                    onClick={verifyOtp}
                  >
                    Verify OTP
                  </button>
                </div>
              </div>
            )}
            {/* <div className='grid'>
              <label>Email :</label>
              <div className={`bg-slate-100 p-2 ${errors.email ? 'border border-red-500' : ''}`}>
                <input
                  type='email'
                  placeholder='Enter Email'
                  name='email'
                  value={data.email}
                  onChange={handleOnChange}
                  className='w-full h-full outline-none bg-transparent' />
              </div>
              {errors.email && <p className='text-red-500 text-sm'>{errors.email}</p>}
            </div> */}

            <div className='grid'>
              <label>Refferal Code :</label>
              <div className='bg-slate-100 p-2'>
                <input
                  type='text'
                  placeholder='Enter Refferal Code'
                  name='refferredbycode'
                  value={data.refferredbycode}
                  onChange={handleOnChange}
                  className='w-full h-full outline-none bg-transparent'
                  onWheel={(e) => e.target.blur()}
                  />

              </div>
            </div>

            <div>
              <label>Choose Password :</label>
              <div className={`bg-slate-100 p-2 flex ${errors.password ? 'border border-red-500' : ''}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder='Enter Password'
                  value={data.password}
                  name='password'
                  onChange={handleOnChange}
                  className='w-full h-full outline-none bg-transparent'
                  onWheel={(e) => e.target.blur()}
                  />
                <div className='cursor-pointer text-xl' onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              {errors.password && <p className='text-red-500 text-sm'>{errors.password}</p>}
            </div>

            <button className='bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 w-full max-w-[150px] rounded-full hover:scale-110 transition-all mx-auto block mt-6'>
              Sign Up
            </button>
          </form>

          <p className='my-5'>Already have account ? <Link to={"/login"} className=' text-sky-600 hover:text-sky-700 hover:underline'>Login</Link></p>
        </div>
      </div>
    </section>
  );
}

export default SignUp;