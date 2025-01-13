const userModel = require("../../models/userModel");
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/userProfilePics');  // Set your destination folder for profile pictures
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // Rename the file with a timestamp
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpeg, jpg, png)'));
    }
  }
}).single('profilePic');  // Accept only one file and the field name is 'profilePic'

async function userSignUpController(req, res) {
  try {
    // Handle file upload
    upload(req, res, async function (err) {
      if (err) {
        return res.json({ error: true, success: false, message: err.message });
      }

      const { name, password, mobileNo, refferredbycode } = req.body;
      const defaultReferredByCode = refferredbycode || "NXH058";

      // Check if the user already exists
      const existingUser = await userModel.findOne({ mobileNo });
      if (existingUser) {
        return res.json({ success: false, message: "User already exists" });
      }

      if (!password || !mobileNo || !name) {
        return res.json({ success: false, message: "Please provide all required fields (email, password, mobileNo)" });
      }

      // Encrypt password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = await bcrypt.hashSync(password, salt);

      // Generate referral code
      function generateReferralCode() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let code = '';
        for (let i = 0; i < 3; i++) {
          code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 3; i++) {
          code += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        return code;
      }

      const referralCode = generateReferralCode();
      const profilePicPath = req.file ? req.file.path : '';

      // Create new user
      const userData = new userModel({
        name,
        password: hashedPassword,
        mobileNo,
        profilePic: profilePicPath,
        refferal: {
          refferalcode: referralCode,
          refferredbycode: defaultReferredByCode,
        },
      });

      // Save the new user
      await userData.save();

      // Handle referral system
      if (userData.refferal.refferredbycode) {
        const referrer = await userModel.findOne({ 'refferal.refferalcode': userData.refferal.refferredbycode });
        if (referrer) {
          referrer.refferal.myrefferals.push({ userId: userData._id, name: userData.name });
          await referrer.save();
        }
      }

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: userData,
      });

    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || err,
    });
  }
}

module.exports = userSignUpController;