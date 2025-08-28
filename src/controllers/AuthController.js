const UserModel = require("../models/UserModel");

const loginUser = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.json("Email and password are required! ");
    }
    const user = await UserModel.findOne({
      emailId: emailId,
      password: password,
    });

    if (!user) return res.status(404).json({ message: "User not found!" });

    const token = await user.signJWT();
    console.log("token : ", token);
    console.log("User : ", user);
    res.json({ token, user });
  } catch (error) {
    console.log("Error: ", error.message);
  }
};

const signupUser = async (req, res, next) => {
  try {
    const userData = req.body;
    if (!userData) return res.send("Please fill the details");
    const user = new UserModel({
      name: userData?.name,
      age: userData?.age,
      emailId: userData?.emailId,
      password: userData?.password,
      location: userData?.location || null,
      bio: userData?.bio || null,
      interests: userData?.interests || null,
      profileURL: userData?.profileURL,
    });
    await user.save();
    res.send({ message: "User added sucessfully! " });
    next();
  } catch (error) {
    console.log("Error: ", error.message);
  }
};

const updateUser = async (req, res) => {
  // Update user profile
};

const logoutUser = async (req, res) => {
  // End user session
  // const  = req.body;
  res.clearCookie("token");
};

module.exports = { loginUser, signupUser, updateUser, logoutUser };
