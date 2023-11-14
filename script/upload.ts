import axios from "axios";

//
import readFileToProducts from "./readFileToProducts";

const config = {
  inputSize: 5000,
  fileName: "data.csv",
  baseUrl: "https://o5xkhmldrg.execute-api.us-east-1.amazonaws.com",
};

const main = async () => {
  const { inputSize, fileName, baseUrl } = config;

  console.log("Starting to parse file");
  const { rawData } = await readFileToProducts(fileName, inputSize);

  console.log("File parsed");
  const response = await axios.get(`${baseUrl}/get-signed-url`);

  console.log("Starting to upload file");
  const { uploadURL } = response.data.payload;
  await axios.put(uploadURL, rawData);

  console.log("File uploaded");
};

main();
