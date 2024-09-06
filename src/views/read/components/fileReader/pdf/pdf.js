import { getFileById } from "@/shared/api/read.js";

export function getData(src, options = {}) {
  return fetchPdf(src, options);
}

const fetchPdf = async (src, options) => {
  return await getFileById(src);
  return fetch(src, options).then((res) => {
    if (res.status !== 200) {
      return Promise.reject(res);
    }
    return res;
  });
};
