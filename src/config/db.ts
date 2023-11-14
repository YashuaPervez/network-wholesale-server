import mongoose from "mongoose";

const { DB_URL = "" } = process.env;

export const dbConnect = async () => {
  const connection = await mongoose.connect(DB_URL, {
    dbName: "network-wholesale",
  });

  return connection;
};
