import axiosInstance from "../config/axios";

type IterateablePagination = {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
};

type Iterateable<t> = (options?: {
  pageNumber?: number;
  perPage?: number;
}) => Promise<{
  data: t[];
  pagination: IterateablePagination;
}>;

type Iterator<t> = () => Promise<t[]>;

export const toIterator = <t>(iterateable: Iterateable<t>): Iterator<t> => {
  const iterator = async (): Promise<t[]> => {
    const allData: t[] = [];

    let pageNumber = 1;
    while (true) {
      const { data, pagination } = await iterateable({
        pageNumber,
      });

      data.forEach((item) => {
        allData.push(item);
      });

      const { current_page, total_pages } = pagination;

      if (current_page >= total_pages) {
        break;
      } else {
        pageNumber++;
      }
    }

    return allData;
  };

  return iterator;
};

export const makeIterateable = <t>(
  baseUrl: string,
  options?: {
    queryParams?: Record<string, string>;
  }
): Iterateable<t> => {
  const { queryParams: additionalQueryParams } = options || {};

  const iterateable: Iterateable<t> = async (options) => {
    const { pageNumber = 1, perPage = 250 } = options || {};

    const queryParams = {
      ...additionalQueryParams,
      limit: perPage,
      page: pageNumber,
    };

    const queryParamsString = `?${Object.entries(queryParams)
      .map(([key, value]) => {
        return `${key}=${value}`;
      })
      .join("&")}`;

    const response = await axiosInstance.get(`${baseUrl}${queryParamsString}`);

    const { data, meta } = response.data;

    return {
      data,
      pagination: meta.pagination,
    };
  };

  return iterateable;
};

export type Brand = {
  id: number;
  name: string;
};
export const getBrands: Iterateable<Brand> = makeIterateable(
  "/catalog/brands",
  {
    queryParams: {
      include_fields: "name",
    },
  }
);
export const getAllBrands = toIterator(getBrands);

export type Category = {
  id: number;
  name: string;
};
export const getCategories: Iterateable<Category> = makeIterateable(
  "/catalog/categories",
  {
    queryParams: {
      include_fields: "name",
    },
  }
);
export const getAllCategories = toIterator(getCategories);
