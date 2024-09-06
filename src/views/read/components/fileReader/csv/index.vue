<template>
  <a-table
    class="csv-table"
    :columns="columns"
    :data-source="dataSource"
    :pagination="false"
    :loading="loading"
  >
  </a-table>
</template>
<script>
import { checkEncoding } from "@/utils/common";
import { Table } from "ant-design-vue";
import Papa from "papaparse";
import { computed, ref, watch } from "vue";
import { getData } from "./csv";

export default {
  name: "Csv",
  props: {
    src: {
      require: true,
      type: String,
    },
    csvLoading: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    ATable: Table,
  },
  setup(props, { emit }) {
    const loading = computed({
      get: () => {
        return props.csvLoading;
      },
      set: (newVal) => {
        emit("update:csvLoading", newVal);
      },
    });
    const columns = ref([]);
    const dataSource = ref([]);

    const init = async () => {
      loading.value = true;
      // 先获取csv文件内容
      const res = await getData(props.src);
      // 得到csv文件对象(blob)---res
      loading.value = false;
      // 创建文件阅读器
      const fReader = new FileReader();
      // 将文件对象(blob)转换为base64字符串
      fReader.readAsDataURL(res);
      fReader.onload = function (evt) {
        // data即base64字符串
        const data = evt.target.result;
        // 根据base64字符串识别编码
        const encoding = checkEncoding(data);
        // Papa.parse读取文件，转换成二维数组，需要引入Papaparse.js
        Papa.parse(res, {
          encoding: encoding,
          complete: (res) => {
            const arrs = res.data;
            const lastItem = arrs[arrs.length - 1].every((val) => val === "");
            lastItem && arrs.pop();
            setTable(arrs);
          },
        });
      };
    };

    const setTable = (data) => {
      for (let i = 0; i < data.length; i++) {
        if (i == 0) {
          columns.value = data[i].map((item) => {
            return {
              title: item,
              key: item,
              dataIndex: item,
            };
          });
        } else {
          let obj = {};
          data[i].forEach((e, index) => {
            obj[data[0][index]] = e;
          });
          dataSource.value.push(obj);
        }
      }
    };

    watch(
      () => props.src,
      () => {
        if (props.src) {
          init();
        }
      },
      { immediate: true }
    );

    return {
      loading,
      columns,
      dataSource,
    };
  },
};
</script>
<style lang="less" scoped></style>
