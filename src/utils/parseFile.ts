import { createInterface as createReadlineInterface } from "node:readline";
import { Readable } from "node:stream";

import { ObjectSchema } from "joi";
import csvtojson from "csvtojson";

//
import { EntryTypeEnum } from "../models/Entry";
import {
  fullProduct as fullProductSchema,
  priceQuantityProduct as priceQuantityProductSchema,
  nonPricedProduct as nonPricedProductSchema,
} from "../schemas/product";

const dataSetLength = 1000;

const findEntryType = (product: any): EntryTypeEnum => {
  const entryTypeSchemas: {
    key: EntryTypeEnum;
    schema: ObjectSchema<any>;
  }[] = [
    {
      key: EntryTypeEnum.FULL,
      schema: fullProductSchema,
    },
    {
      key: EntryTypeEnum.PRICE_QTY,
      schema: priceQuantityProductSchema,
    },
    {
      key: EntryTypeEnum.NON_PRICED,
      schema: nonPricedProductSchema,
    },
  ];

  for (const { key, schema } of entryTypeSchemas) {
    const { error } = schema.validate(product);

    if (!error) {
      return key;
    }
  }

  throw new Error("Failed to determine type of your file.");
};

const findFileType = async (file: string): Promise<EntryTypeEnum> => {
  const results = await csvtojson().fromString(file);

  if (!results[0]) {
    throw new Error("Failed to determine type of your file.");
  }

  return findEntryType(results[0]);
};

export const fileStreamToDatasets = async (
  fileStream: Readable,
  options?: {
    onLineRead?: (lineNumber: number) => void;
  }
): Promise<{
  dataSets: string[];
  entryType: EntryTypeEnum;
  totalCount: number;
}> => {
  const { onLineRead } = options || {};

  const rl = createReadlineInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const dataSets: string[] = [];
  let head = "";

  let lineIndex = 0;
  let entryType = EntryTypeEnum.FULL;

  for await (const line of rl) {
    if (lineIndex === 0) {
      head = line;
      lineIndex++;

      continue;
    }

    const dataIndex = lineIndex - 1;
    const setIndex = Math.floor(dataIndex / dataSetLength);

    if (dataSets[setIndex]) {
      dataSets[setIndex] += `\r\n${line}`;
    } else {
      dataSets[setIndex] = `${head}\r\n${line}`;
    }

    if (dataIndex === 0) {
      entryType = await findFileType(dataSets[setIndex]);
    }

    lineIndex++;
    onLineRead?.(lineIndex);
  }

  return { dataSets, entryType, totalCount: lineIndex - 1 };
};
