import axiosInstance from "@/shared/api/index.js";

export async function getData(src) {
  if (typeof src === "string") {
    return await axiosInstance.get(src, {
      // responseType: "blob",
      // headers: {
      //   "Content-Type": "application/octet-stream;charset=UTF-8",
      // },
    });
  }
  return Promise.resolve(src);
}
