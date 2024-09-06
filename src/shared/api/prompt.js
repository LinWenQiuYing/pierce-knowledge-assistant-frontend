import axiosInstance from "./index.js";

const promptUrl = "/chat/prompts";

// 添加prompt
export async function addPrompt(json) {
  const res = await axiosInstance.post(`${promptUrl}/addPrompt`, json);
  return res;
}

//获取自定义prompt列表
export async function getPromptList() {
  const res = await axiosInstance.get(`${promptUrl}/queryPromptList`);
  return res;
}

//获取自定义prompt列表
export async function searchPromptList(json) {
  const res = await axiosInstance.post(`${promptUrl}/queryPromptList`, json);
  return res;
}

// 根据id删除prompt
export async function delPromptById(id) {
  const res = await axiosInstance.delete(`${promptUrl}/deletePrompt/${id}`);
  return res;
}

// 批量删除prompt
export async function batchDeletePrompt(arr) {
  const res = await axiosInstance.delete(`${promptUrl}/deletePrompt`, {
    data: arr,
  });
  return res;
}

//重命名prompt
export async function updatePrompt(json) {
  const res = await axiosInstance.put(`${promptUrl}/updatePrompt`, json);
  return res;
}
