const userModel = require("../../models/userModel");

async function usernameupdate(req, res) {
  try {
    const {userId} = req.body; // Extract user ID from the request
    const { name } = req.body; // Extract name from the request body

    if (!name) {
      return res.status(400).json({
        message: "Name is required",
        error: true,
        success: false,
      });
    }

    // Find and update the user's name
    const user = await userModel.findByIdAndUpdate(
      userId,
      { name },
      { new: true } // Return the updated user
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    res.status(200).json({
      data: user,
      error: false,
      success: true,
      message: "User name updated successfully",
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}
async function usernameandemail(req, res) {
  try {
    const {userId} = req.body; // Extract user ID from the request
    const { name } = req.body;
    const {email}  = req.body;// Extract name from the request body

    if (!name) {
      return res.status(400).json({
        message: "Name is required",
        error: true,
        success: false,
      });
    }

    // Find and update the user's name
    const user = await userModel.findByIdAndUpdate(
      userId,
      { name },
      {email},
      { new: true } // Return the updated user
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    res.status(200).json({
      data: user,
      error: false,
      success: true,
      message: "User name updated successfully",
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}



module.exports = usernameupdate,usernameandemail;
