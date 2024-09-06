<template>
  <a-modal
    :visible="show"
    title="忘记密码"
    centered
    @cancel="handleCancel"
    width="1000px"
    class="forget-modal"
    :maskClosable="false"
    :footer="null"
  >
    <a-steps progress-dot :current="current">
      <a-step :title="item.title" v-for="(item, index) in items" :key="index" />
    </a-steps>
    <div class="forget-modal-content first" v-if="current === 0">
      <div class="forget-modal-content-item">
        <p class="item-label">账号</p>
        <a-input
          v-model:value.trim="userName"
          placeholder="账号"
          class="item-input long"
        >
          <template #prefix>
            <img src="@/assets/images/img/icon-user.svg" alt="账号" />
          </template>
        </a-input>
      </div>
      <div class="forget-modal-content-item">
        <p class="item-label">验证码</p>
        <a-input
          v-model:value.trim="checkword"
          placeholder="验证码"
          class="item-input short"
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
    <div class="forget-modal-content second" v-else-if="current === 1">
      <p class="tip-top">您可以通过以下方式进行信息校验</p>
      <a-tabs v-model:activeKey="activeKey">
        <a-tab-pane :key="1" tab="手机号验证">
          <a-input
            v-model:value.trim="phoneNumber"
            placeholder="手机号"
            class="item-input"
          >
            <template #prefix>
              <img src="@/assets/images/img/icon-phone.svg" alt="手机号" />
            </template>
          </a-input>
        </a-tab-pane>
        <a-tab-pane :key="2" tab="邮箱验证">
          <a-input
            v-model:value.trim="mail"
            placeholder="邮箱"
            class="item-input"
          >
            <template #prefix>
              <img src="@/assets/images/img/icon-mail.svg" alt="邮箱" />
            </template>
          </a-input>
        </a-tab-pane>
      </a-tabs>
      <p class="tip-bottom">
        以上方式都不能用？请联系我们<span class="tip-bottom-number"
          >400-7676-098</span
        >或者点击<a
          href="javascript: void(0)"
          class="tip-bottom-number"
          @click="resetModalShow(true)"
          >填写工单</a
        >
      </p>
    </div>
    <div class="forget-modal-content third" v-else-if="current === 2">
      <p class="tips">
        请设置账号<span class="user-name">{{ userName }}</span
        >的密码
      </p>
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
    </div>
    <div class="forget-modal-content fourth" v-else-if="current === 3">
      <img src="@/assets/images/img/finished.png" alt="" />
      <a-button type="primary" @click="handleCancel">去登录</a-button>
      <p class="finished-text">
        密码找回成功！正在跳转至登录页 <span class="time">{{ time }}</span> s
      </p>
    </div>
    <div class="forget-modal-footer" v-if="current !== 3">
      <a-button
        type="primary"
        @click="handleChangeCurrent('pre')"
        v-if="current > 0 && current < 3"
        >上一步</a-button
      >
      <a-button
        type="primary"
        @click="handleChangeCurrent('next')"
        v-if="current < 3"
        >下一步</a-button
      >
    </div>
  </a-modal>
  <ResetPassword
    v-if="isResetModalShow"
    :show="isResetModalShow"
    @changeModalShow="resetModalShow"
  />
</template>
<script>
import { changePasswordWidthToken, getVerCode } from "@/shared/api/login";
import { queryUserListWithToken } from "@/shared/api/right";
import { Button, Input, Modal, Steps, Tabs, message } from "ant-design-vue";
import { onMounted, reactive, toRefs } from "vue";
import ResetPassword from "./resetPassword";

const { Step } = Steps;
const { Password } = Input;
const { TabPane } = Tabs;

export default {
  name: "ChangePassword",
  components: {
    AButton: Button,
    AInput: Input,
    AInputPassword: Password,
    AModal: Modal,
    AStep: Step,
    ASteps: Steps,
    ATabs: Tabs,
    ATabPane: TabPane,
    ResetPassword,
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
      phoneNumber: undefined,
      mail: undefined,
      current: 0,
      items: [
        {
          title: "输入账号",
        },
        {
          title: "信息校验",
        },
        {
          title: "设置密码",
        },
        {
          title: "找回成功",
        },
      ],
      activeKey: 1,
      time: 3,
      verCodeImg: "",
      verCodeValue: "",
      isResetModalShow: false,
      authType: undefined,
    });

    const handleCancel = () => {
      emit("changeModalShow", false);
      params.userName = undefined;
      params.password = undefined;
      params.newPassword = undefined;
      params.confirmNewPassword = undefined;
      params.checkword = "";
      params.phoneNumber = undefined;
      params.mail = undefined;
      params.current = 0;
      params.activeKey = 1;
      params.time = 3;
      params.verCodeImg = "";
      params.verCodeValue = "";
      params.isResetModalShow = false;
    };

    const getCode = async () => {
      const data = await getVerCode();
      if (!data) {
        message.error("获取验证码失败，请重新尝试");
        return false;
      }
      params.verCodeImg = data.base64ImageCode;
      params.verCodeValue = data.code;
    };

    // 上一步 && 下一步
    const handleChangeCurrent = async (type) => {
      const json1 = {
        pageNo: 1,
        pageSize: 10,
      };
      const json2 = {};
      let res = null;
      if (type === "pre") {
        // 上一步
        params.current--;
      } else {
        // 下一步
        switch (params.current) {
          case 0:
            // 校验账号
            if (!params.userName) {
              message.warning("请输入账号！");
              return false;
            } else if (!params.checkword) {
              message.warning("请输入验证码！");
              return false;
            } else if (
              params.checkword.toLocaleLowerCase() !==
              params.verCodeValue.toLocaleLowerCase()
            ) {
              message.warning("验证码输入有误！");
              getCode();
              params.checkword = "";
              return false;
            }
            json1.accountAccount = params.userName;
            res = await queryUserListWithToken(json1);
            if (
              res.message !== "成功" ||
              !res.data ||
              !res.data.dateList ||
              !res.data.dateList.length
            ) {
              message.error("当前账号不存在!");
              return false;
            }
            break;
          case 1:
            if (params.activeKey === 1 && !params.phoneNumber) {
              message.warning("请输入手机号！");
              return false;
            } else if (params.activeKey === 2 && !params.mail) {
              message.warning("请输入邮箱！");
              return false;
            }
            if (params.activeKey === 1) {
              // 手机号验证
              json1.mobile = params.phoneNumber;
            } else {
              // 邮箱验证
              json1.email = params.mail;
            }
            res = await queryUserListWithToken(json1);
            if (
              res.message !== "成功" ||
              !res.data ||
              !res.data.dateList ||
              !res.data.dateList.length
            ) {
              if (params.activeKey === 1) {
                // 手机号验证
                message.error("手机号输入错误！");
              } else {
                // 邮箱验证
                message.error("邮箱输入错误！");
              }
              return false;
            } else {
              params.authType = res.data.dateList[0].authType;
            }
            break;
          case 2:
            if (!params.newPassword) {
              message.warning("请输入新密码！");
              return false;
            } else if (!params.confirmNewPassword) {
              message.warning("请确认新密码！");
              return false;
            } else if (params.newPassword !== params.confirmNewPassword) {
              message.warning("两次密码输入不一致，请重新输入！");
              return false;
            }
            json2.verify = 2; // 0-校验验证码、原密码；1-校验原密码；2-不校验验证码、原密码
            json2.authType = params.authType;
            json2.account = params.userName;
            json2.newPassword = params.newPassword;
            json2.verifyPassword = params.confirmNewPassword;
            res = await changePasswordWidthToken(json2);
            if (res.message !== "成功") {
              message.error(res.message);
              return false;
            }
            break;
          default:
            break;
        }
        params.current++;
      }
    };

    const resetModalShow = (value) => {
      params.isResetModalShow = value;
    };

    onMounted(() => {
      getCode();
    });

    return {
      ...toRefs(props),
      ...toRefs(params),
      handleCancel,
      getCode,
      handleChangeCurrent,
      resetModalShow,
    };
  },
};
</script>
<style lang="less">
.forget-modal {
  .ant-modal-body {
    padding: 24px 50px;
    position: relative;
    padding-bottom: 52px;
  }

  .ant-steps {
    &-item {
      .ant-steps-item-container {
        .ant-steps-item-content {
          .ant-steps-item-title {
            font-size: 16px;
          }
        }
      }
    }
  }

  &-content {
    height: 332px;
    display: flex;
    flex-wrap: wrap;
    padding: 24px 270px;
    flex-direction: column;

    &.first {
      justify-content: center;
    }

    &.second {
      position: relative;
      padding-top: 60px;

      .tip-top {
        text-align: center;
        font-size: 12px;
        color: var(--grey-400);
      }

      .ant-tabs {
        align-items: center;

        &-nav {
          width: 192px;

          &-wrap {
            justify-content: center;

            .ant-tabs-tab {
              font-size: 16px;
            }
          }
        }

        &-content-holder {
          width: 100%;
        }
      }

      .tip-bottom {
        left: 0;
        right: 0;
        margin: 0;
        bottom: 24px;
        text-align: center;
        position: absolute;

        &-number {
          cursor: pointer;
          color: var(--blue);
        }
      }
    }

    &.third {
      justify-content: center;

      .tips {
        text-align: center;
        margin-bottom: 16px;

        .user-name {
          color: var(--blue);
        }
      }
    }

    &.fourth {
      flex-wrap: nowrap;
      align-items: center;

      img {
        width: 250px;
        margin-bottom: 16px;
      }

      .ant-btn {
        margin-bottom: 16px;
      }

      .finished-text {
        color: var(--mainTextColor);

        .time {
          color: var(--blue);
        }
      }
    }

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

  &-footer {
    left: 0;
    right: 0;
    bottom: 0;
    height: 52px;
    display: flex;
    position: absolute;
    padding-right: 24px;
    align-items: center;
    justify-content: flex-end;
    border-top: 1px solid #e3e6eb;

    .ant-btn {
      &:last-child {
        margin-left: 16px;
      }
    }
  }
}
</style>
