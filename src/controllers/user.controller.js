import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("All fields are required", 400);
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError("Username or email already exists", 409);
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError("Avatar is required", 400);
  }

  const avatarImg = await uploadOnCloudinary(avatarLocalPath);
  const coverImg = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatarImg) {
    throw new ApiError("Error in uploading avatar image", 500);
  }

  let newUser = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    avatar: avatarImg.url,
    coverImage: coverImg?.url || "",
    password,
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken "
  );

  if (!createdUser) {
    throw new ApiError("Something went wrong while fetching created user", 500);
  }

  return res
    .status(201)
    .json(new ApiResponse(200, "User Registered  successfully", createdUser));
});

export { registerUser };
