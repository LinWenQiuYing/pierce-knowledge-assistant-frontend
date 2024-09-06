import axiosInstance from "./index.js";

const readUrl = "/chat/reading";

//分页查询子任务目录
export async function getTaskList(json) {
  const res = await axiosInstance.post(`${readUrl}/getReadTaskList`, json);
  return res;
}

//更新阅读子任务
export async function updateReadTask(json) {
  const res = await axiosInstance.put(`${readUrl}/updateReadTask`, json);
  return res;
}

//删除阅读任务
export async function delReadTask(id) {
  const res = await axiosInstance.delete(`${readUrl}/deleteReadTask/${id}`);
  return res;
}

//批量删除阅读任务
export async function batchDelReadTask(arr) {
  const res = await axiosInstance.delete(`${readUrl}/deleteReadTask`, {
    data: arr,
  });
  return res;
}

//创建子任务
export async function addReadTask(json) {
  const res = await axiosInstance.post(`${readUrl}/addReadTask`, json);
  return res;
}

//上传文件
export async function uploadFile(json) {
  const res = await axiosInstance.post(`${readUrl}/uploadFile`, json);
  return res;
}

//删除指定文件
export async function delFile(id) {
  const res = await axiosInstance.delete(`${readUrl}/deleteFile/${id}`);
  return res;
}

//查询子任务下文件列表
export async function getFileList(id) {
  const res = await axiosInstance.get(`${readUrl}/getFileList/${id}`);
  return res;
}

// 根据文件id获取文件
export async function getFileById(id) {
  const res = await axiosInstance.get(`${readUrl}/checkOutFile/${id}`, {
    responseType: "blob",
    headers: {
      "Content-Type": "application/octet-stream;charset=UTF-8",
    },
  });
  return res;
}

// 根据文件id获取文件加密路径
export async function getFilePathById(id) {
  const res = await axiosInstance.get(`${readUrl}/getFileURL/${id}`);
  return res;
}

//开始对话
export async function startDialogue(json) {
  const res = await axiosInstance.post(`${readUrl}/confirmFile`, json);
  return res;
}

//从资源库上传文件
export async function uploadFileFromResource(json) {
  const res = await axiosInstance.post(
    `${readUrl}/uploadFileFromResource`,
    json
  );
  return res;
}

//点击任务栏，查看任务时调用，获取taskId
export async function getTaskId() {
  const res = await axiosInstance.get(`${readUrl}/task/vector`);
  return res;
}

//穿梭框获取获取目录
export async function getTransferFileTree() {
  let res = await axiosInstance.get(`${readUrl}/menu`);
  return res;
}
