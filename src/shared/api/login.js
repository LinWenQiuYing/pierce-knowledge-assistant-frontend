import axiosInstance from "./index.js";

const authUrl = "/chat/auth";
const pswUrl = "/chat/password";

// 生成验证码
export async function getVerCode() {
  const res = await axiosInstance.post(`${authUrl}/verificationCode`);
  return res.data;
}

// 登录
export async function userLogin(json) {
  const res = await axiosInstance.post(`${authUrl}/accountLogin`, json);
  return res;
}

// 修改密码-带token
export async function changePasswordWidthToken(json) {
  const res = await axiosInstance.post(`${authUrl}/updatePassword`, json, {
    headers: {
      authentication: "transwarp",
    },
  });
  return res;
}

// 修改密码-不带token
export async function changePassword(json) {
  const res = await axiosInstance.post(`${authUrl}/updatePassword`, json);
  return res;
}

// 提交重置密码请求
export async function applyResetPassword(json) {
  const res = await axiosInstance.post(`${pswUrl}/applyResetPassword`, json);
  return res;
}
