import axios from "axios";

const { BC_STORE_HASH, BC_ACCESS_TOKEN } = process.env;

const axiosInstance = axios.create({
  baseURL: `https://api.bigcommerce.com/stores/${BC_STORE_HASH || ""}/v3/`,
  headers: {
    "Content-Type": "application/json",
    Accept: "*/*",
    "X-Auth-Token": BC_ACCESS_TOKEN || "",
  },
});

export default axiosInstance;
