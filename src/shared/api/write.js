import axiosInstance from "./index.js";

const writeUrl = "/chat/writing";

// 获取历史记录
export async function getHistory(id) {
  const res = await axiosInstance.get(`${writeUrl}/getHistory/${id}`);
  return res;
}

// 获取历史记录
export async function stopWrite(sseKey) {
  const res = await axiosInstance.get(`${writeUrl}/stopWriting/${sseKey}`);
  return res;
}

// 下载模板csv
export async function downloadTemplate() {
  const res = await axiosInstance.get(`${writeUrl}/getTemplate`, {
    responseType: "blob",
  });
  return res;
}

// 导入模板
export async function importTemplate(json) {
  const res = await axiosInstance.post(`${writeUrl}/getParaByCSV`, json);
  return res;
}

// 获取写作任务列表
export async function getWriteList(json) {
  const res = await axiosInstance.post(`${writeUrl}/getWritingTaskList`, json);
  return res;
}

// 获取写作任务详情
export async function getWriteDetail(id) {
  const res = await axiosInstance.get(`${writeUrl}/getParameterByTaskId/${id}`);
  return res;
}

// 添加写作任务
export async function createWriteTask(json) {
  const res = await axiosInstance.post(`${writeUrl}/createWritingTask`, json);
  return res;
}

// 单个删除写作任务
export async function deleteWriteTask(id) {
  const res = await axiosInstance.delete(`${writeUrl}/deleteWritingTask/${id}`);
  return res;
}

// 批量删除写作任务
export async function batchDeleteWriteTask(arr) {
  const res = await axiosInstance.delete(`${writeUrl}/deleteWritingTask`, {
    data: arr,
  });
  return res;
}

// 更新写作任务-重命名
export async function updateWriteTask(json) {
  const res = await axiosInstance.put(`${writeUrl}/updateWritingTask`, json);
  return res;
}
