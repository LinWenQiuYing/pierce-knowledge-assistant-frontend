import axiosInstance from "./index.js";

const authUrl = "/chat/auth";

// 查询用户列表-带token
export async function queryUserListWithToken(json) {
  const res = await axiosInstance.post(
    `${authUrl}/queryAccountInfoByPage`,
    json,
    {
      headers: {
        authentication: "transwarp",
      },
    }
  );
  return res;
}

// 查询用户列表-默认不带token
export async function queryUserList(json) {
  const res = await axiosInstance.post(
    `${authUrl}/queryAccountInfoByPage`,
    json
  );
  return res;
}
