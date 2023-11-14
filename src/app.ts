import "./loadEnv";

// Server
import app from "./server";

//
import { dbConnect } from "./config/db";

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);

  await dbConnect();

  console.log("Database connected");
});
