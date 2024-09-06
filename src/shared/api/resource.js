import axiosInstance from "./index.js";

const resUrl = "/chat/resource";

// 获取文件目录
export async function getFileTree() {
  let res = await axiosInstance.get(`${resUrl}/menu`);
  return res;
}

// 分页查询文件
export async function getFileList(json) {
  let res = await axiosInstance.post(`${resUrl}/resourceListQuery`, json);
  return res;
}

// 添加子文件夹
export async function createFolder(categoryId, folderName) {
  let res = await axiosInstance.get(
    `${resUrl}/createFolder?categoryId=${categoryId}&folderName=${folderName}`
  );
  return res;
}

// 移动、重命名文件
export async function editFile(json) {
  let res = await axiosInstance.post(`${resUrl}/removeObject`, json);
  return res;
}

// 重命名文件夹
export async function editFolder(id, folderName) {
  let res = await axiosInstance.get(
    `${resUrl}/renameFolder?id=${id}&folderName=${folderName}`
  );
  return res;
}

// 移动文件夹
export async function moveFolder(id, targetId) {
  let res = await axiosInstance.get(
    `${resUrl}/removeFolder?id=${id}&targetId=${targetId}`
  );
  return res;
}

// 删除文件夹
export async function deleteFolder(id) {
  let res = await axiosInstance.get(`${resUrl}/deleteFolder/${id}`);
  return res;
}

// 删除文件
export async function deleteFile(id) {
  let res = await axiosInstance.get(`${resUrl}/deleteFile/${id}`);
  return res;
}

// 上传文件
export async function uploadFile(json) {
  let res = await axiosInstance.post(`${resUrl}/uploadFile`, json);
  return res;
}

// 下载文件
export async function downloadRes(id) {
  return axiosInstance.get(`${resUrl}/download?id=${id}`, {
    responseType: "blob",
  });
}

// 下载文件夹——根据文件夹id，获取文件id集合
export async function downloadFolder(arr) {
  let res = await axiosInstance.post(`${resUrl}/folder/files`, arr);
  return res;
}

// 手动向量化
export async function manualVector(id) {
  let res = await axiosInstance.get(`${resUrl}/doc2vec/${id}`);
  return res;
}

// 批量删除文件
export async function batchDelete(json) {
  let res = await axiosInstance.post(`${resUrl}/batchDelete`, json);
  return res;
}
