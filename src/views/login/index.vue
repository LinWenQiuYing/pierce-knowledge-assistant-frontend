<template>
  <div class="login">
    <div class="login-content">
      <img
        class="login-content-img"
        src="@/assets/images/img/login-logo.svg"
        alt="logo"
      />
      <div class="login-content-item">
        <p class="item-label">账号</p>
        <a-input
          v-model:value.trim="userName"
          placeholder="账号"
          class="item-input long"
          autoComplete="new-password"
        >
          <template #prefix>
            <img src="@/assets/images/img/icon-user.svg" alt="账号" />
          </template>
        </a-input>
      </div>
      <div class="login-content-item">
        <p class="item-label">密码</p>
        <a-input-password
          v-model:value.trim="password"
          placeholder="密码"
          class="item-input long"
          autoComplete="new-password"
        >
          <template #prefix>
            <img src="@/assets/images/img/icon-lock.svg" alt="密码" />
          </template>
        </a-input-password>
      </div>
      <div class="login-content-item">
        <p class="item-label">验证码</p>
        <a-input
          v-model:value.trim="checkword"
          placeholder="验证码"
          class="item-input short"
          autoComplete="new-password"
        >
          <template #prefix>
            <img src="@/assets/images/img/icon-check.svg" alt="验证码" />
          </template>
        </a-input>
        <div class="item-verify" @click="getCode">
          <img :src="verCodeImg" alt="验证码" />
        </div>
      </div>
      <a-button
        class="login-content-btn"
        type="primary"
        @click="handleLogin"
        :loading="loading"
        >登录</a-button
      >
      <div class="login-content-btns">
        <span class="btns-text" @click="changeModalShow(true)">修改密码</span>
        <span class="btns-text" @click="forgetModalShow(true)">重置密码</span>
      </div>
      <img src="@/assets/images/img/copyright.png" alt="copyright" />
    </div>
  </div>
  <ChangePassword
    v-if="isChangeModalShow"
    :show="isChangeModalShow"
    @changeModalShow="changeModalShow"
  />
  <ForgetPassword
    v-if="isForgetModalShow"
    :show="isForgetModalShow"
    @changeModalShow="forgetModalShow"
  />
</template>
<script>
import { getVerCode, userLogin } from "@/shared/api/login";
import { LocalStorage } from "@/utils/common.js";
import { Button, Input, message } from "ant-design-vue";
import { computed, onBeforeUnmount, onMounted, reactive, toRefs } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import ChangePassword from "./components/changePassword";
import ForgetPassword from "./components/forgetPassword";

const { Password } = Input;

export default {
  name: "Login",
  components: {
    AButton: Button,
    AInput: Input,
    AInputPassword: Password,
    ChangePassword,
    ForgetPassword,
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    const state = store.state.appStore;
    const target = computed(() => state.target);
    const userInfo = computed(() => state.userInfo);

    const params = reactive({
      userName: undefined,
      password: undefined,
      checkword: "",
      verCodeImg: undefined,
      verCodeValue: "",
      tempToken: "",
      loading: false,
      isChangeModalShow: false,
      isForgetModalShow: false,
    });

    // 获取二维码
    const getCode = async () => {
      const data = await getVerCode();
      if (!data) {
        message.error("获取验证码失败，请重新尝试");
        return false;
      }
      params.verCodeImg = data.base64ImageCode;
      params.verCodeValue = data.code;
      params.tempToken = data.tempToken;
    };

    // 登录方法
    const handleLogin = async () => {
      message.destroy();
      if (!params.userName) {
        message.warning("请输入账号！");
        return false;
      } else if (!params.password) {
        message.warning("请输入密码！");
        return false;
      } else if (!params.checkword) {
        message.warning("请输入验证码！");
        return false;
      } else if (
        params.checkword.toLocaleLowerCase() !==
        params.verCodeValue.toLocaleLowerCase()
      ) {
        message.error("验证码输入有误！");
        getCode();
        params.checkword = "";
        return false;
      }
      const json = {
        account: params.userName,
        password: params.password,
        temToken: params.tempToken,
        code: params.checkword,
      };
      params.loading = true;
      const res = await userLogin(json);
      params.loading = false;
      if (res.message === "成功") {
        message.success("登录成功！");

        // 一切就绪，保存用户信息与用户权限信息
        const userInfo = {
          token: res.data.token,
          account: res.data.account,
          userId: res.data.id,
          userName: res.data.userName,
        };
        LocalStorage.setItem({
          name: "userInfo",
          value: JSON.stringify(userInfo),
          expires: 172800000, // 两天
        });
        store.commit("setUserInfo", userInfo);

        router.replace(target.value);
      } else {
        message.error(res.message);
      }
    };

    const changeModalShow = (value) => {
      params.isChangeModalShow = value;
    };

    const forgetModalShow = (value) => {
      params.isForgetModalShow = value;
    };

    // 监听键盘输入
    const handleKeyDown = (e) => {
      if (params.isChangeModalShow || params.isForgetModalShow) return;
      console.log("handleKeyDown---", e);
      e.stopPropagation();
      if (e.keyCode === 13) {
        handleLogin();
      }
    };

    onMounted(() => {
      getCode();
      if (userInfo.value.token) {
        router.replace(target.value);
      }
      document.body.addEventListener("keydown", handleKeyDown);
    });

    onBeforeUnmount(() => {
      document.body.removeEventListener("keydown", handleKeyDown);
    });

    return {
      ...toRefs(params),
      getCode,
      handleLogin,
      changeModalShow,
      forgetModalShow,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
