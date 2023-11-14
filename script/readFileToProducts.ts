import { createReadStream } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { createInterface } from "node:readline";

const readFileToProducts = async (fileName: string, dataSize: number) => {
  const filePath = join(cwd(), fileName);
  const fileStream = await createReadStream(filePath, {
    encoding: "utf-8",
  });

  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let data = "";
  let lineIndex = 0;

  for await (const line of rl) {
    if (lineIndex === 0) {
      data = line;
    } else {
      data += `\r\n${line}`;
    }

    const dataIndex = lineIndex - 1;

    if (dataIndex + 1 >= dataSize) {
      break;
    } else {
      lineIndex++;
    }
  }

  return { rawData: data };
};
export default readFileToProducts;
