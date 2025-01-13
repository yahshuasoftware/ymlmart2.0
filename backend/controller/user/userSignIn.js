const bcrypt = require('bcryptjs')
const userModel = require('../../models/userModel')
const jwt = require('jsonwebtoken');
        
async function userSignInController(req,res){
    try{
        const { mobileNo , password} = req.body

        if(!mobileNo){
            throw new Error("Please provide mobile number")
        }
        if(!password){
             throw new Error("Please provide password")
        }

        const user = await userModel.findOne({mobileNo})

       if(!user){
            throw new Error("User not found")
       }

       const checkPassword = await bcrypt.compare(password,user.password)

    //    console.log("checkPassoword",checkPassword)

       if(checkPassword){
        const tokenData = {
            _id : user._id,
            mobileNo : user.mobileNo,
            type: "user"
        }
        const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, { expiresIn: 60 * 60 * 8 });

        const tokenOption = {
            httpOnly : true,
            secure : true
        //  secure : process.env.NODE_ENV === 'production', // Ensure this is set to true in production

        }

        res.cookie("token",token,tokenOption).status(200).json({
            message : "Login successfully",
            data : token,
            userData:user,
            success : true,
            error : false
        })

       }else{
         throw new Error("Please check Password")
       }

    }catch(err){
        res.json({
            message : err.message || err  ,
            error : true,
            success : false,
        })
    }

}

module.exports = userSignInController