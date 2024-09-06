<template>
  <a-modal
    :visible="show"
    title="修改密码"
    @ok="handleConfirm"
    @cancel="handleCancel"
    ok-text="确定"
    cancel-text="取消"
    centered
    width="572px"
    class="password-modal"
    :maskClosable="false"
  >
    <div class="password-modal-content">
      <div class="password-modal-content-item">
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
      <div class="password-modal-content-item">
        <p class="item-label">原密码</p>
        <a-input-password
          v-model:value.trim="password"
          placeholder="原密码"
          class="item-input long"
          autoComplete="new-password"
        >
          <template #prefix>
            <img src="@/assets/images/img/icon-lock.svg" alt="密码" />
          </template>
        </a-input-password>
      </div>
      <div class="password-modal-content-item">
        <p class="item-label">新密码</p>
        <a-input-password
          v-model:value.trim="newPassword"
          placeholder="新密码"
          class="item-input long"
          autoComplete="new-password"
        >
          <template #prefix>
            <img src="@/assets/images/img/icon-lock.svg" alt="密码" />
          </template>
        </a-input-password>
      </div>
      <div class="password-modal-content-item">
        <p class="item-label">确认新密码</p>
        <a-input-password
          v-model:value.trim="confirmNewPassword"
          placeholder="确认新密码"
          class="item-input long"
          autoComplete="new-password"
        >
          <template #prefix>
            <img src="@/assets/images/img/icon-lock.svg" alt="密码" />
          </template>
        </a-input-password>
      </div>
      <div class="password-modal-content-item">
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
    </div>
  </a-modal>
</template>
<script>
import { changePassword, getVerCode } from "@/shared/api/login";
import { Input, Modal, message } from "ant-design-vue";
import { onMounted, reactive, toRefs } from "vue";

const { Password } = Input;

export default {
  name: "ChangePassword",
  components: {
    AModal: Modal,
    AInput: Input,
    AInputPassword: Password,
  },
  props: {
    show: {
      type: Boolean,
      require: true,
    },
  },
  emits: ["changeModalShow"],
  setup(props, { emit }) {
    const params = reactive({
      userName: undefined,
      password: undefined,
      newPassword: undefined,
      confirmNewPassword: undefined,
      checkword: "",
      verCodeImg: "",
      verCodeValue: "",
    });

    const handleConfirm = async () => {
      message.destroy();
      if (!params.userName) {
        message.warning("请输入账号！");
        return false;
      } else if (!params.password) {
        message.warning("请输入密码！");
        return false;
      } else if (!params.newPassword) {
        message.warning("请输入新密码！");
        return false;
      } else if (!params.confirmNewPassword) {
        message.warning("请确认新密码！");
        return false;
      } else if (params.newPassword !== params.confirmNewPassword) {
        message.warning("两次密码输入不一致，请重新输入！");
        return false;
      } else if (!params.checkword) {
        message.warning("请输入验证码！");
        return false;
      } else if (
        params.checkword.toLocaleLowerCase() !==
        params.verCodeValue.toLocaleLowerCase()
      ) {
        message.error("验证码输入有误！");
        getVerCode();
        params.checkword = "";
        return false;
      }
      const json = {
        account: params.userName,
        password: params.password,
        newPassword: params.newPassword,
        verifyPassword: params.confirmNewPassword,
        code: params.checkword,
        temToken: params.tempToken,
      };
      const res = await changePassword(json);
      if (res.message === "成功") {
        message.success("密码修改成功！");
        handleCancel();
      } else {
        message.error(res.message);
      }
    };

    const handleCancel = () => {
      emit("changeModalShow", false);
      params.userName = undefined;
      params.password = undefined;
      params.newPassword = undefined;
      params.confirmNewPassword = undefined;
      params.checkword = "";
      params.verCodeImg = "";
      params.verCodeValue = "";
    };

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

    onMounted(() => {
      getCode();
    });

    return {
      ...toRefs(props),
      ...toRefs(params),
      handleCancel,
      handleConfirm,
      getCode,
    };
  },
};
</script>
<style lang="less">
.password-modal {
  .ant-modal-body {
    padding: 24px 106px;
  }

  &-content {
    &-item {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .item-label {
        width: 100%;
        margin-bottom: 4px;
        color: var(--mainTextColor);
      }

      .item-input {
        &.long {
          width: 100%;
        }

        &.short {
          width: 187px;
          margin-right: 8px;
        }
      }

      .item-verify {
        width: 165px;
      }
    }
  }
}
</style>
