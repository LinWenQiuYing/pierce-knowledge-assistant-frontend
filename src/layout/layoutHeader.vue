<template>
  <a-layout-header class="knowledge-assistant-layout-header">
    <div class="layout-header-logo">
      <img
        alt="知识助理"
        class="logo-img"
        src="../assets/images/img/logo.svg"
      />
    </div>
    <a-menu :selectedKeys="activeKey" class="layout-menu" mode="horizontal">
      <a-menu-item
        v-for="item in menuList"
        :key="item.key"
        class="layout-menu-item"
        @click="handleChangeLink(item.key)"
      >
        <template #icon>
          <!-- <search-outlined v-if="item.key === 'search'" />
          <fund-view-outlined v-if="item.key === 'overview'" /> -->
          <icon-svg className="layout-menu-item-img" :icon-class="item.key" />
        </template>
        {{ item.title }}
      </a-menu-item>
    </a-menu>
    <div class="layout-header-user">
      <a-dropdown class="user-part" overlayClassName="user-part-dropdown">
        <a class="ant-dropdown-link" @click.prevent>
          <div class="layout-header-user-pic">
            <img src="../assets/images/img/user.svg" />
          </div>
          <span class="user-name">{{ userInfo.account }}</span>
          <down-outlined class="user-arrow" />
        </a>
        <template #overlay>
          <a-menu>
            <a-menu-item v-for="item in subMenuList" :key="item.key">
              <a
                href="javascript:;"
                v-if="item.type === 'menu'"
                @click="handleChangeLink(item.key)"
                >{{ item.title }}</a
              >
              <a
                href="javascript:;"
                v-else-if="item.type === 'logout'"
                @click="handleLogout"
                class="item-logout"
                ><PoweroffOutlined />{{ item.title }}</a
              >
              <a
                href="javascript:;"
                v-else
                @click="handleClick(item.key)"
                class="item-btn"
                >{{ item.title }}</a
              >
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </a-layout-header>
  <ChangePassword
    v-if="isModalShow"
    :show="isModalShow"
    @changeModalShow="changeModalShow"
  />
</template>
<script>
import { LocalStorage } from "@/utils/common";
import { Dropdown, Layout, Menu } from "ant-design-vue";
import ChangePassword from "views/login/components/changePassword";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";

const { Header } = Layout;
const { Item } = Menu;

export default {
  name: "LayoutHeader",
  components: {
    ADropdown: Dropdown,
    ALayoutHeader: Header,
    AMenu: Menu,
    AMenuItem: Item,
    ChangePassword,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const store = useStore();
    const state = store.state.appStore;
    const userInfo = computed(() => state.userInfo);

    const isModalShow = ref(false);
    const activeKey = computed(() => state.activeKey);
    const menuList = ref([
      {
        key: "overview",
        title: "总 览",
      },
      {
        key: "chat",
        title: "聊 天",
      },
      {
        key: "read",
        title: "阅 读",
      },

      {
        key: "search",
        title: "搜 索",
      },
      {
        key: "write",
        title: "写 作",
      },
    ]);
    const subMenuList = ref([
      {
        type: "menu",
        key: "resource",
        title: "我的资源库",
      },
      {
        type: "menu",
        key: "prompt",
        title: "我的prompt",
      },
      {
        type: "btn",
        key: "changePassword",
        title: "修改密码",
      },
      {
        type: "logout",
        key: "logout",
        title: "退出登录",
      },
    ]);

    // 修改密码弹窗是否展示
    const changeModalShow = (value) => {
      isModalShow.value = value;
    };

    // 点击切换顶部菜单
    const handleChangeLink = (url) => {
      if (route.path === `/${url}`) {
        // 跳转路由与当前路由相同
        return;
      } else {
        router.push(`/${url}`);
      }
    };

    // 登出
    const handleLogout = () => {
      LocalStorage.removeItem("userInfo");
      store.commit("setUserInfo", {});
      store.commit("setTarget", route.path);
      router.replace("/login");
    };

    // 点击其他菜单
    const handleClick = (key) => {
      switch (key) {
        case "changePassword":
          changeModalShow(true);
          break;

        default:
          break;
      }
    };

    return {
      activeKey,
      menuList,
      subMenuList,
      isModalShow,
      userInfo,

      handleChangeLink,
      handleLogout,
      handleClick,
      changeModalShow,
    };
  },
};
</script>
<style lang="less" scoped></style>
