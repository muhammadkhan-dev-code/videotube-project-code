import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const dbConnection = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(
      `MONGO DB CONNECTED SUCCESSFULLY .. ${dbConnection.connection.host}`
    );
  } catch (err) {
    console.log("MONGO DB CONNECTION ERROR", err);
    process.exit(1);
  }
};

export default connectDB;
