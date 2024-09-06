import axiosInstance from "./index.js";

const searchUrl = "/chat/search";
const taskUrl = "/chat/tasks";

//搜索前获得chat_id
export async function getChatId() {
  const res = await axiosInstance.get(`${taskUrl}/uuid`);
  return res;
}

// //AI搜索
// export async function searchWithAI(json) {
//   const res = await axiosInstance.post(`${searchUrl}/searchWithAI`, json);
//   return res;
// }
//AI搜索
export async function searchWithAI(json) {
  const res = await axiosInstance.post(`${searchUrl}/hippo`, json);
  return res;
}

//关键字搜索
export async function searchWithKeyword(json) {
  const res = await axiosInstance.post(`${searchUrl}/keyword`, json);
  return res;
}

//获取热门搜索问题
export async function getPresetQuestion(json) {
  const res = await axiosInstance.post(`${searchUrl}/getPresetQuestion`, json);
  return res;
}
