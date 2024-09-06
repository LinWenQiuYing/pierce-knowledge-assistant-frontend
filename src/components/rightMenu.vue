<template>
  <div class="right-menu">
    <a-menu
      v-if="show"
      class="context-menu"
      @click="onMenuClick"
      :style="{
        top: contextMenuData.position.y + 'px',
        left: contextMenuData.position.x + 'px',
      }"
    >
      <a-menu-item
        v-for="item in contextMenuData.context"
        :key="item.key"
        class="context-menu-item"
        :disabled="item.isDisabled"
      >
        <div
          :class="['context-menu-item-box', item.isDisabled ? 'disabled' : '']"
          v-if="item.show"
        >
          <icon-svg
            v-if="item.icon"
            :icon-class="item.icon"
            :color="item.color ? item.color : null"
          />
          <span class="box-title">{{ item.title }}</span>
        </div>
      </a-menu-item>
    </a-menu>
  </div>
</template>
<script>
import { Menu } from "ant-design-vue";

const { Item } = Menu;

export default {
  name: "RightMenu",
  props: {
    // 记录菜单的位置与内容
    contextMenuData: {
      type: Object,
      require: true,
    },
    // 记录菜单是否展示
    show: {
      type: Boolean,
      require: true,
    },
  },
  emits: ["onMenuClick"],
  components: {
    AMenu: Menu,
    AMenuItem: Item,
  },
  setup(props, { emit }) {
    const onMenuClick = (key) => {
      emit("onMenuClick", key);
    };

    return {
      onMenuClick,
    };
  },
};
</script>
<style lang="less">
.right-menu {
  .context-menu {
    position: absolute;
    // min-width: 170px;
    max-width: 400px;
    box-shadow: 0px 10px 16px 4px rgba(31, 48, 78, 0.04),
      0px 2px 8px 0px rgba(31, 48, 78, 0.05);

    color: #485378;
    background-color: var(--white);
    border-radius: 2px;

    &-item {
      padding: 0;
      width: 100%;
      height: auto;
      margin: 0 !important;

      &:not(.ant-menu-item-selected) {
        .context-menu-item-box {
          &:not(.disabled):hover {
            .box-title {
              color: var(--blue);
            }
          }
        }
      }

      &-box {
        height: 32px;
        margin: 4px 0;
        padding: 0 16px;
        line-height: 32px;

        &.disabled {
          .svg-icon,
          .box-title {
            color: var(--black-15);
          }
        }

        .svg-icon {
          width: 14px;
          height: 14px;
          margin-right: 8px;
        }

        .box-title {
          color: var(--black-85);
        }
      }
    }
  }
}
</style>
