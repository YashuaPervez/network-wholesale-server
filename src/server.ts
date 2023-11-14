import express from "express";
import csvtojson from "csvtojson";

//
import Entry, { EntryTypeEnum } from "./models/Entry";
import {
  Brand,
  getAllBrands,
  Category,
  getAllCategories,
} from "./utils/bigcommerce";
import axiosInstance from "./config/axios";
import { fileExists, getFileStream } from "./config/s3";
import { fileStreamToDatasets } from "./utils/parseFile";
import { transformProduct, uploadProduct } from "./utils/product";

const app = express();

app.use(express.json());

app.post("/parse-file", async (req, res) => {
  try {
    /**
     * Check no entry is currently processing
     */

    console.log("Checking for un complete entries");
    const unCompletedEntry = await Entry.findOne({ completed: false });
    if (unCompletedEntry) {
      throw new Error("An entry is already under processing");
    }

    const csv_file_key = req.body.csv_file_key;

    if (!csv_file_key) {
      throw new Error("CSV file key required");
    }

    /**
     * Check file exist with provided key
     */
    console.log("Checking file exists in s3 bucket");
    const exists = await fileExists(csv_file_key);
    if (!exists) {
      throw new Error("CSV file with specified key do not exists");
    }

    res.status(200).json({
      message: "Starting to process entry",
    });
    /**
     * ==============================================
     */

    /**
     * Get datasets from fileStream
     */
    console.log("Starting to read file from s3");
    const fileStream = await getFileStream(csv_file_key);
    const { dataSets, entryType, totalCount } = await fileStreamToDatasets(
      fileStream,
      {
        onLineRead: (lineNumber) => {
          console.log("line read >>", lineNumber);
        },
      }
    );

    console.log("Creating entry in database");
    const entry = new Entry({
      csv_file_key,
      type: entryType,

      total_count: totalCount,
      resolved_count: 0,
      failed_count: 0,
      completed: false,
      logs: [],
    });
    await entry.save();

    let brands: Brand[] = [];
    let categories: Category[] = [];

    if (entryType === EntryTypeEnum.FULL) {
      brands = await getAllBrands();
      categories = await getAllCategories();
    }

    const batchSize = 10;
    console.log("Parsing file");
    for (const dataSetIndex in dataSets) {
      const products = await csvtojson().fromString(dataSets[dataSetIndex]);

      if (entryType === EntryTypeEnum.FULL) {
        for (const product of products) {
          const brandName = product.Brand.trim().toUpperCase();
          if (brandName) {
            const brandExists = brands.find(
              (brand) => brand.name === brandName
            );
            if (!brandExists) {
              const response = await axiosInstance.post("/catalog/brands", {
                name: brandName,
              });
              const { id } = response.data.data;

              brands.push({
                id,
                name: brandName,
              });
            }
          }

          const categoryList = product.Classification.split(">").map(
            (item: string) => item.trim().toUpperCase()
          );
          const categoryName = categoryList[categoryList.length - 1];
          const categoryExist = categories.find(
            (category) => category.name === categoryName
          );
          if (!categoryExist) {
            let parentId = 0;
            for (const cat of categoryList) {
              const exist = categories.find((c) => c.name === cat);
              if (exist) {
                parentId = exist.id;
                continue;
              }
              const response = await axiosInstance.post("/catalog/categories", {
                name: cat,
                parent_id: parentId,
              });
              const { id } = response.data.data;
              parentId = id;

              categories.push({
                id,
                name: cat,
              });
            }
          }
        }
      }

      const batchCount = Math.ceil(products.length / batchSize);

      for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize;
        const endIndex = startIndex + batchSize;

        const batchProducts = products.slice(startIndex, endIndex);

        await Promise.all(
          batchProducts.map(
            (product: any) =>
              new Promise<void>(async (resolve, reject) => {
                const bcProduct = transformProduct(product, {
                  entryType,
                  getBrandId: (brandName) => {
                    if (!brandName) {
                      return 0;
                    }

                    const brand = brands.find((b) => b.name === brandName);
                    if (brand) {
                      return brand.id;
                    }

                    return 0;
                  },
                  getCategoryId: (categoryList) => {
                    const categoryName = categoryList[categoryList.length - 1];

                    const category = categories.find(
                      (category) => category.name === categoryName
                    );
                    if (category) {
                      return category.id;
                    }

                    return 0;
                  },
                });

                const { log, resolved } = await uploadProduct(bcProduct, {
                  entryType,
                });

                await Entry.findByIdAndUpdate(entry.id, {
                  $inc: {
                    [resolved ? "resolved_count" : "failed_count"]: 1,
                  },
                  $push: {
                    logs: log,
                  },
                });

                resolve();
              })
          )
        );
      }
    }

    await Entry.findByIdAndUpdate(entry.id, {
      $set: {
        completed: true,
      },
    });
  } catch (e) {
    console.log(e);

    if (res.headersSent) {
      return;
    }

    return res.status(400).json({
      message: e.message,
    });
  }
});

export default app;
