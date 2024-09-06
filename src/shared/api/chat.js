import axiosInstance from "./index.js";

const taskUrl = "/chat/tasks";

//分页查看任务列表
export async function getTaskList(json) {
  const res = await axiosInstance.put(`${taskUrl}/list`, json);
  return res;
}

// 查看会话历史列表
export async function getHistoryList(id) {
  const res = await axiosInstance.get(`${taskUrl}/conversations/${id}`);
  return res;
}

//查询会话详情
export async function getConversationDetail(id) {
  const res = await axiosInstance.get(`${taskUrl}/conversations/detail/${id}`);
  return res;
}

// 会话删除
export async function delHistoryConversation(id) {
  const res = await axiosInstance.delete(`${taskUrl}/conversations/${id}`);
  return res;
}

//重命名历史会话名称
export async function updateHistoryName(json) {
  const res = await axiosInstance.put(`${taskUrl}/dialogue`, json);
  return res;
}

// 新建对话时获得会话id
export async function getConversationId() {
  const res = await axiosInstance.get(`${taskUrl}/uuid`);
  return res;
}

//刷新会话配置  包括prompt 大模型和知识库  下面单独刷新的接口updateDocBase和updatePrompt弃用
export async function updateConfig(json) {
  const res = await axiosInstance.put(`${taskUrl}/dialogue/config`, json);
  return res;
}

//刷新任务prompt
export async function updatePrompt(json) {
  const res = await axiosInstance.put(`${taskUrl}/prompts`, json);
  return res;
}

//刷新任务知识库
export async function updateDocBase(json) {
  const res = await axiosInstance.put(`${taskUrl}/library`, json);
  return res;
}

//下拉框：分页查询大模型数据
export async function getModelList(json) {
  const res = await axiosInstance.post(`${taskUrl}/llm/list`, json);
  return res;
}

//刷新大模型
export async function updateModel(json) {
  const res = await axiosInstance.put(`${taskUrl}/llm/refresh`, json);
  return res;
}

//停止会话接口
export async function stopCall(id) {
  const res = await axiosInstance.get(`${taskUrl}/call/stop/${id}`);
  return res;
}
