<template>
  <svg
    :class="['svg-icon', svgClass]"
    :style="{ fill: iconColor }"
    aria-hidden="true"
  >
    <use :xlink:href="iconName" />
  </svg>
</template>

<script>
import { computed, reactive, toRefs } from "vue";

export default {
  name: "IconSvg",
  props: {
    // 图标名称(存在svg文件夹中的名称)
    iconClass: {
      type: [String, null],
      required: true,
    },
    // 图标颜色
    color: {
      type: String,
    },
    // 组件类名
    className: {
      type: [Array, String],
      default: "",
    },
  },
  setup(props) {
    let icon = reactive({
      iconName: "",
      svgClass: "",
      iconColor: "",
    });

    icon.iconName = computed(() => {
      return `#icon-${props.iconClass}`;
    });
    icon.svgClass = computed(() => {
      if (Array.isArray(props.className)) {
        return props.className.join(" ");
      } else {
        return props.className;
      }
    });
    icon.iconColor = computed(() => {
      if (props.color) {
        return props.color;
      } else {
        return "";
      }
    });

    return {
      ...toRefs(icon),
    };
  },
};
</script>

<style lang="less" scoped>
.svg-icon {
  width: 100%;
  height: 100%;
  vertical-align: middle;
  fill: currentColor;
  overflow: hidden;

  &:focus {
    outline: none;
  }
}
</style>
