import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

// PATH     : /api/users/profile/:username"
// METHOD   : GET
// ACCESS   : PUBLIC
// DESC     : Get a User Profile
export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile", error.message);
    res.status(500).json({ error: error.message });
  }
};

// PATH     : /api/users/follow/id"
// METHOD   : POST
// ACCESS   : PRIVATE
// DESC     : Follow Unfollow a User
export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You can't Follow/Unfollow yourself" });
    }

    if (!userToModify || !currentUser)
      return res.status(400).json({ error: "User not found" });

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // Unfollow The User
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });

      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: id },
      });

      return res.status(200).json({ message: "User Unfollowed Successfully" });
    } else {
      // follow The User
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });

      await User.findByIdAndUpdate(req.user._id, {
        $push: { following: id },
      });

      //*   Send Notification to the User
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });
      await newNotification.save();
    }

    res.status(200).json({ message: "User followed Successfully" });
  } catch (error) {
    console.log("Error in followUnfollowUser", error.message);
    res.status(500).json({ error: error.message });
  }
};

// PATH     : /api/users/suggested"
// METHOD   : GET
// ACCESS   : PUBLIC
// DESC     : Suggested User
export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const { following } = await User.findById(userId).select("following");

    // Get 10 random users excluding the current user
    const users = await User.aggregate([
      { $match: { _id: { $ne: userId } } },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter((user) => !following.includes(user._id));
    const suggestedUsers = filteredUsers.slice(0, 4);

    // Remove password field from suggested users
    suggestedUsers.forEach((user) => delete user.password);

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in getSuggestedUsers", error.message);
    res.status(500).json({ error: error.message });
  }
};

// PATH     : /api/users/update"
// METHOD   : POST
// ACCESS   : PRIVATE
// DESC     : update User
export const updateUser = async (req, res) => {
  let { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;

  let { profileImg, coverImg } = req.body;

  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res.status(400).json({
        error: "Please provide both current password and new password",
      });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch)
        return res.status(400).json({ error: "Current password is incorrect" });

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }

      const uploadedRespone = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedRespone.secure_url;
    }

    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }

      const uploadedRespone = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedRespone.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();

    // password should be null in respone
    user.password = null;

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in updateUser", error.message);
    res.status(500).json({ error: error.message });
  }
};
