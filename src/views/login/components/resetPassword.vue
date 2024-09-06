<template>
  <a-modal
    centered
    :footer="false"
    :visible="show"
    width="456px"
    :closable="false"
    class="reset-modal"
    :maskClosable="false"
  >
    <div class="reset-modal-header">
      <p class="title">申请重置密码</p>
      <p class="sub-title">请留下您的联系方式，我们将尽快和您联系！</p>
    </div>
    <div class="reset-modal-content">
      <div class="reset-modal-content-item">
        <p class="item-label">账号</p>
        <a-input
          v-model:value.trim="userName"
          placeholder="账号"
          class="item-input"
        />
      </div>
      <div class="reset-modal-content-item">
        <p class="item-label">姓名</p>
        <a-input
          v-model:value.trim="name"
          placeholder="姓名"
          class="item-input"
        />
      </div>
      <div class="reset-modal-content-item">
        <p class="item-label">手机号</p>
        <a-input
          v-model:value.trim="phoneNumber"
          placeholder="手机号"
          class="item-input"
        />
      </div>
      <div class="reset-modal-content-item">
        <p class="item-label">邮箱</p>
        <a-input
          v-model:value.trim="mail"
          placeholder="邮箱"
          class="item-input"
        />
      </div>
      <div class="reset-modal-content-item">
        <p class="item-label">公司全称</p>
        <a-input
          v-model:value.trim="companyName"
          placeholder="公司全称"
          class="item-input"
        />
      </div>
      <div class="reset-modal-content-item">
        <p class="item-label">需求</p>
        <a-textArea
          v-model:value.trim="notes"
          placeholder="需求"
          class="item-input"
          :auto-size="{ minRows: 2, maxRows: 4 }"
        />
      </div>
    </div>
    <div class="reset-modal-footer">
      <div class="footer-top">
        <a-checkbox v-model:checked="checked">
          阅读并接受<a
            href="https://sso.transwarp.cn/privacy"
            target="_blank"
            class="link"
            >隐私政策</a
          >和<a
            href="https://sso.transwarp.cn/clause"
            target="_blank"
            class="link"
            >法律申明</a
          >
        </a-checkbox>
        <a-tooltip>
          <template #title>400-7676-098</template>
          <div class="footer-contact">
            <img src="@/assets/images/img/phone.png" alt="" />
            联系我们
          </div>
        </a-tooltip>
      </div>
      <div class="footer-bottom">
        <a-button @click="handleCancel">取消</a-button>
        <a-button @click="handleConfirm" type="primary">提交</a-button>
      </div>
    </div>
  </a-modal>
</template>
<script>
import { applyResetPassword } from "@/shared/api/login";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Tooltip,
  message,
} from "ant-design-vue";
import { reactive, toRefs } from "vue";

const { TextArea } = Input;

export default {
  name: "ResetPassword",
  components: {
    AButton: Button,
    ACheckbox: Checkbox,
    AModal: Modal,
    AInput: Input,
    ATextArea: TextArea,
    ATooltip: Tooltip,
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
      name: undefined,
      phoneNumber: undefined,
      mail: undefined,
      companyName: undefined,
      notes: undefined,
      checked: false,
    });

    const handleConfirm = async () => {
      message.destroy();
      if (!params.userName) {
        message.warning("请输入账号！");
        return false;
      } else if (!params.name) {
        message.warning("请输入姓名！");
        return false;
      } else if (!params.phoneNumber) {
        message.warning("请输入手机号！");
        return false;
      } else if (!params.mail) {
        message.warning("请输入邮箱！");
        return false;
      } else if (!params.companyName) {
        message.warning("请输入公司全称！");
        return false;
      } else if (!params.checked) {
        message.warning("请阅读并勾选隐私政策和法律申明！");
        return false;
      }
      const json = {
        accountAccount: params.userName,
        userName: params.name,
        mobile: params.phoneNumber,
        email: params.mail,
        organizationName: params.companyName,
        reason: params.notes,
      };
      const res = await applyResetPassword(json);
      if (res.message === "成功") {
        message.success("申请成功！");
        handleCancel();
      } else {
        message.error(res.message);
      }
    };

    const handleCancel = () => {
      emit("changeModalShow", false);
      params.userName = undefined;
      params.name = undefined;
      params.phoneNumber = undefined;
      params.mail = undefined;
      params.companyName = undefined;
      params.notes = undefined;
      params.checked = false;
    };

    return {
      ...toRefs(props),
      ...toRefs(params),
      handleCancel,
      handleConfirm,
    };
  },
};
</script>
<style lang="less">
.reset-modal {
  .ant-modal-body {
    padding: 24px 48px;
  }

  &-header {
    text-align: center;

    .title {
      color: var(--mainTextColor);
      font-weight: 600;
      font-size: 28px;
      margin-bottom: 4px;
    }

    .sub-title {
      color: var(--grey-400);
      font-size: 12px;
    }
  }

  &-content {
    margin-bottom: 16px;

    &-item {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 18px;

      &:last-child {
        margin-bottom: 0;
      }

      .item-label {
        width: 100%;
        margin-bottom: 8px;
        color: var(--mainTextColor);
      }

      .item-input {
        & {
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

  &-footer {
    .footer-top {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
      justify-content: space-between;

      .link {
        cursor: pointer;
        color: var(--blue);
      }

      .footer-contact {
        display: flex;
        cursor: pointer;
        color: var(--grey-400);
        align-items: center;

        img {
          margin-right: 8px;
        }
      }
    }

    .footer-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .ant-btn {
        width: 172px;

        &:first-child {
          margin-right: 16px;
        }
      }
    }
  }
}
</style>
