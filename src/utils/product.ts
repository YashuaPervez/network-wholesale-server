import axiosInstance from "../config/axios";
import { EntryTypeEnum } from "../models/Entry";

export const transformProduct = (
  product: any,
  config: {
    entryType: EntryTypeEnum;
    getBrandId: (brandName: string) => number;
    getCategoryId: (categoryList: string[]) => number;
  }
) => {
  const prodObj: any = {
    type: "physical",
    inventory_tracking: "product",
    is_visible: true,
  };

  if (config.entryType === EntryTypeEnum.FULL) {
    /**
     * FULL
     */
    const brandName = product.Brand.toUpperCase().trim();
    const categoryList = product.Classification.split(">").map((item: string) =>
      item.toUpperCase().trim()
    );

    const images = product["Picture URLs"].split(",");

    prodObj.name = `${product["Auction Title"]}${
      product["Condition"] === "New" ? "" : ` ${product["Condition"]}`
    }`;
    prodObj.sku = product["Inventory Number"];
    prodObj.description = `${
      product.brokerbin_description
        ? `<p>${product.brokerbin_description}</p>`
        : ""
    }${product.Description || product["Short Description"]}`;
    prodObj.weight = product.Weight ?? "1";
    prodObj.width = product.Width ?? "1";
    prodObj.height = product.Height ?? "1";
    prodObj.depth = product.Length ?? "1";
    prodObj.price = product["Retail Price"];
    prodObj.calculated_price = product["Retail Price"];
    prodObj.inventory_level = Number(product.Quantity);
    prodObj.upc = product.UPC ?? "";
    prodObj.mpn = product.MPN ?? "";
    prodObj.gtin = product.GTIN ?? "";
    prodObj.brand_id = config.getBrandId(brandName);
    prodObj.categories = [config.getCategoryId(categoryList)];
    prodObj.images = images
      .filter((image: string) => image)
      .map((image: string, i: number) => ({
        image_url: image,
        is_thumbnail: i === 0,
      }));
    prodObj.custom_fields = [
      ...(product.Manufacturer
        ? [{ name: "Manufacturer", value: product.Manufacturer }]
        : []),
      ...(product.Vendor ? [{ name: "Vendor", value: product.Vendor }] : []),
    ];
  } else if (config.entryType === EntryTypeEnum.PRICE_QTY) {
    /**
     * PRICE_QTY
     */
    prodObj.sku = product["VARIANT ID"];
    prodObj.price = Number(product.Price);
    prodObj.inventory_level = Number(product.Quantity);
  }

  return prodObj;
};

export const createProduct = async (_product: any): Promise<number> => {
  const { options, ...product } = _product;

  const response = await axiosInstance.post("/catalog/products", product);

  return response.data.data.id;
};

export const uploadProduct = async (
  product: any,
  config: { entryType: EntryTypeEnum }
): Promise<{ resolved: boolean; log: string }> => {
  try {
    const response = await axiosInstance.get(
      `/catalog/products?sku=${product.sku}`
    );
    const bcProduct = response.data.data[0];

    if (bcProduct) {
      const updateObject: any = {
        inventory_tracking: "product",
        inventory_level: product.inventory_level,
        price: product.price,
      };

      if (config.entryType === EntryTypeEnum.FULL) {
        updateObject.description = product.description;
      }

      await axiosInstance.put(
        `/catalog/products/${bcProduct.id}`,
        updateObject
      );

      return {
        resolved: true,
        log: `Updated product with SKU "${product.sku}"`,
      };
    } else if (config.entryType === EntryTypeEnum.FULL) {
      const productId = await createProduct(product);

      return {
        resolved: true,
        log: `Created product for sku "${product.sku}" with id "${productId}"`,
      };
    }

    return {
      resolved: true,
      log: `No action taken for sku "${product.sku}"`,
    };
  } catch (e) {
    console.log(e);

    let errorMessage = e.message;

    if (!errorMessage) {
      errorMessage = e?.response?.data?.message;
    }

    return {
      resolved: false,
      log: `Failed to upload product with sku "${product.sku}": ${errorMessage}`,
    };
  }
};
