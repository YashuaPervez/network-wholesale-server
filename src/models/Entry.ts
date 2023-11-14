import mongoose, { HydratedDocument, Schema } from "mongoose";

export enum EntryTypeEnum {
  FULL = "FULL",
  PRICE_QTY = "PRICE_QTY",
  NON_PRICED = "NON_PRICED",
}

export type IEntry = {
  csv_file_key: string;
  type: EntryTypeEnum;

  total_count: number;
  resolved_count: number;
  failed_count: number;
  completed: boolean;
  logs: string[];
};

export type EntryDocument = HydratedDocument<IEntry>;

const entrySchema = new Schema<IEntry>(
  {
    csv_file_key: {
      type: Schema.Types.String,
      required: true,
      unique: true,
    },
    type: {
      type: Schema.Types.String,
      required: true,
      enum: Object.values(EntryTypeEnum),
    },

    total_count: {
      type: Schema.Types.Number,
      required: true,
    },
    resolved_count: {
      type: Schema.Types.Number,
      required: true,
      default: 0,
    },
    failed_count: {
      type: Schema.Types.Number,
      required: true,
      default: 0,
    },
    completed: {
      type: Schema.Types.Boolean,
      required: true,
      default: false,
    },
    logs: [
      {
        type: Schema.Types.String,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Entry = mongoose.model<IEntry>("entries", entrySchema);
export default Entry;
