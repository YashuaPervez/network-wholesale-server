import * as joi from "joi";

export const fullProduct = joi
  .object()
  .keys({
    "Auction Title": joi.string().required(),
    "Inventory Number": joi.string().required(),
    "Short Description": joi.string().required(),
    "Retail Price": joi.number().required(),
    Quantity: joi.number().required(),
    Brand: joi.string().required(),
    Classification: joi.string().required(),
  })
  .unknown(true);

export const priceQuantityProduct = joi
  .object()
  .keys({
    "VARIANT ID": joi.string().required(),
    Quantity: joi.number().required(),
    Price: joi.number().required(),
  })
  .unknown(true);

export const nonPricedProduct = joi
  .object()
  .keys({
    SKU: joi.string().required(),
    Manufacturer: joi.string().required(),
    "Part Number": joi.string().required(),
    Condition: joi.string().required(),
  })
  .unknown(true);
