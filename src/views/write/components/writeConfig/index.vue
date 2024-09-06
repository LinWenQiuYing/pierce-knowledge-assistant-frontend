<template>
  <div class="write-config">
    <div class="write-config-header">
      <span class="header-title">
        <img
          src="@/assets/images/img/icon-file.svg"
          alt=""
          class="header-icon"
        />
        AI写作
      </span>
    </div>
    <div class="write-config-content" ref="configContent">
      <div class="write-config-content-item">
        <div class="item-header">
          <span class="item-header-title">
            <img
              src="@/assets/images/img/icon-text.svg"
              alt=""
              class="item-header-title-icon"
            />
            写作标题
          </span>
          <img
            v-if="isTitleShow"
            src="@/assets/images/img/up.svg"
            alt=""
            class="item-header-fold"
            @click="isTitleShow = !isTitleShow"
          />
          <img
            v-else
            src="@/assets/images/img/down.svg"
            alt=""
            class="item-header-fold"
            @click="isTitleShow = !isTitleShow"
          />
        </div>
        <div class="item-content" v-show="isTitleShow">
          <div class="item-content-box">
            <a-input
              type="text"
              v-model:value.trim="writeTitle"
              placeholder="请输入写作标题"
            />
          </div>
        </div>
      </div>
      <div class="write-config-content-item">
        <div class="item-header">
          <span class="item-header-title">
            <img
              src="@/assets/images/img/icon-model.svg"
              alt=""
              class="item-header-title-icon"
            />
            写作模型
          </span>
          <img
            v-if="isWriteShow"
            src="@/assets/images/img/up.svg"
            alt=""
            class="item-header-fold"
            @click="isWriteShow = !isWriteShow"
          />
          <img
            v-else
            src="@/assets/images/img/down.svg"
            alt=""
            class="item-header-fold"
            @click="isWriteShow = !isWriteShow"
          />
        </div>
        <div class="item-content" v-show="isWriteShow">
          <div class="item-content-title">模型选择</div>
          <div class="item-content-box">
            <a-select
              :options="modelList"
              placeholder="请选择"
              v-model:value="selectModel"
              class="item-content-input"
              @change="selectModelChange"
            />
          </div>
        </div>
      </div>
      <div class="write-config-content-item">
        <div class="item-header">
          <span class="item-header-title">
            <img
              src="@/assets/images/img/icon-annex.svg"
              alt=""
              class="item-header-title-icon"
            />
            参考资料
          </span>
          <img
            v-if="isFileShow"
            src="@/assets/images/img/up.svg"
            alt=""
            class="item-header-fold"
            @click="isFileShow = !isFileShow"
          />
          <img
            v-else
            src="@/assets/images/img/down.svg"
            alt=""
            class="item-header-fold"
            @click="isFileShow = !isFileShow"
          />
        </div>
        <div class="item-content" v-show="isFileShow">
          <div class="title" @click="showSelectFile">
            <img src="@/assets/images/img/icon-pointer.svg" alt="" />
            选择资料
          </div>
          <div class="item-content-filelist" v-show="fileList.length">
            <div
              class="filelist-item"
              v-for="(file, index) in fileList"
              :key="file.id"
            >
              <span class="filelist-item-name" :title="file.label">{{
                file.label
              }}</span>
              <img
                src="@/assets/images/img/close_2.svg"
                alt=""
                @click="deleteSelectFile(index)"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="write-config-content-item">
        <div class="item-header">
          <span class="item-header-title">
            <img
              src="@/assets/images/img/icon-template.svg"
              alt=""
              class="item-header-title-icon"
            />
            写作模板
          </span>
          <img
            v-if="isTemplateShow"
            src="@/assets/images/img/up.svg"
            alt=""
            class="item-header-fold"
            @click="isTemplateShow = !isTemplateShow"
          />
          <img
            v-else
            src="@/assets/images/img/down.svg"
            alt=""
            class="item-header-fold"
            @click="isTemplateShow = !isTemplateShow"
          />
        </div>
        <div class="item-content" v-show="isTemplateShow">
          <div class="item-content-refer">
            <a-dropdown
              overlayClassName="refer-dropdown"
              v-model:visible="dropdownVisible"
              :trigger="[]"
            >
              <div
                ref="referContent"
                class="refer-content"
                contenteditable
                placeholder="请输入写作模板"
                @input="handleInput"
                @blur="onBlur"
                @click.prevent
                @compositionstart="compositionstart"
                @compositionend="compositionend"
              />
              <template #overlay>
                <a-menu
                  @click="onSelectFile($event, 'template')"
                  v-if="
                    fileList.filter(
                      (item) => templateReferFiles.indexOf(item.id) === -1
                    ).length
                  "
                >
                  <a-menu-item
                    v-for="item in fileList.filter(
                      (item) => templateReferFiles.indexOf(item.id) === -1
                    )"
                    :key="item.id"
                    :title="item.label"
                    >{{ item.label }}</a-menu-item
                  >
                </a-menu>
                <a-menu v-else>
                  <a-menu-item disabled>暂无可选引用文件</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <div class="refer-delete" @click="clearTemplate">清除</div>
          </div>
          <div class="item-content-template">
            <div class="item-content-font-number">
              <span class="label">字数要求：</span>
              <a-input-number
                style="width: 100px"
                v-model:value="writeNumber"
                :step="200"
                :min="1"
                :max="1000"
                :precision="0"
                placeholder="字数要求"
              />
            </div>
            <span class="item-content-template-btn" @click="setTemplate">
              设置段落模板
            </span>
          </div>
          <div class="item-content-action" v-show="setParagraphShow">
            <div
              class="item-content-action-item"
              :key="index"
              v-for="(item, index) in templateAction"
              @click="handleAction(item)"
            >
              <a-upload
                v-if="item === '导入模板'"
                name="file"
                accept=".csv"
                class="btn-upload"
                :show-upload-list="false"
                :beforeUpload="beforeUpload"
              >
                <span class="action-item-btn">{{ item }}</span>
              </a-upload>
              <span v-else class="action-item-btn">{{ item }}</span>
            </div>
          </div>
          <div
            ref="contentList"
            class="item-content-detail"
            v-show="setParagraphShow && template.length"
          >
            <div
              class="item-content-detail-item"
              :key="index"
              :index="index"
              @drop="(e) => handleDrop(index)"
              @dragover="(e) => handleDragOver(e)"
              @dragenter="(e) => e.preventDefault()"
              v-for="(item, index) in template"
            >
              <close-outlined
                @click="deleteParagraph(index)"
                class="item-close"
              />
              <div
                class="item-content-trigger"
                draggable="true"
                @dragstart="(e) => handleDragStart(e, index)"
              >
                <img src="@/assets/images/img/resizeTriggers.svg" alt="" />
              </div>
              <div class="item-content-box">
                <div
                  class="item-title"
                  contenteditable
                  placeholder="请输入本段落标题"
                  @input="handleTitleInput(index, $event)"
                >
                  {{ item.title }}
                </div>
                <a-dropdown
                  :key="index"
                  overlayClassName="content-dropdown"
                  v-model:visible="contentDropdownVisible"
                  :trigger="[]"
                >
                  <div
                    class="item-content"
                    contenteditable
                    placeholder="请输入本段落要点及字数要求，输入@选择参考文件，如：@大模型发展"
                    @input="handleContentInput(index, $event)"
                    @blur="onBlur"
                    @click.prevent
                    @compositionstart="compositionstart"
                    @compositionend="compositionend($event, index, 'paragraph')"
                  />
                  <template #overlay v-if="contentIndex === index">
                    <a-menu
                      @click="onSelectFile($event, 'paragraph', index)"
                      v-if="
                        fileList.filter(
                          (f) => item.fileIds.indexOf(f.id) === -1
                        ).length
                      "
                    >
                      <a-menu-item
                        v-for="file in fileList.filter(
                          (f) => item.fileIds.indexOf(f.id) === -1
                        )"
                        :key="file.id"
                        :title="file.label"
                        >{{ file.label }}</a-menu-item
                      >
                    </a-menu>
                    <a-menu v-else>
                      <a-menu-item disabled>暂无可选引用文件</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
                <div class="item-content-font-number">
                  <span class="label">字数要求：</span>
                  <a-input-number
                    style="width: 100px"
                    v-model:value="item.writeNumber"
                    :step="200"
                    :min="1"
                    :max="1000"
                    :precision="0"
                    placeholder="字数要求"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="item-content-add" v-show="setParagraphShow">
            <a-button class="add-btn" @click="addParagraph">新增段落</a-button>
          </div>
        </div>
      </div>
      <div class="write-config-content-item">
        <div class="item-header">
          <span class="item-header-title">
            <img
              src="@/assets/images/img/icon-write.svg"
              alt=""
              class="item-header-title-icon"
            />
            写作参数
          </span>
          <img
            v-if="isParamShow"
            src="@/assets/images/img/up.svg"
            alt=""
            class="item-header-fold"
            @click="isParamShow = !isParamShow"
          />
          <img
            v-else
            src="@/assets/images/img/down.svg"
            alt=""
            class="item-header-fold"
            @click="isParamShow = !isParamShow"
          />
        </div>
        <div class="item-content" v-show="isParamShow">
          <div class="item-content-title">模型回答自由度</div>
          <div class="item-content-box">
            <div class="box-radio">
              <div
                :class="[
                  'box-radio-item',
                  item.value === freedomValue ? 'active' : '',
                ]"
                v-for="item in freedomList"
                :key="item.value"
                @click="setFreedom(item.value)"
              >
                {{ item.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="write-config-footer">
      <a-button class="footer-btn" @click="handleReturn">返回</a-button>
      <a-button
        type="primary"
        class="footer-btn"
        @click="stopCreate"
        v-if="meet.isCreating"
        >停止生成</a-button
      >
      <a-button
        type="primary"
        class="footer-btn"
        @click="handleCreateContent"
        v-else
        >生成内容</a-button
      >
    </div>
  </div>
  <!-- <TransferModal
    v-if="isResourceShow"
    :isResourceShow="isResourceShow"
    @changeSelectFiles="changeSelectFiles"
    @changeIsResourceShow="changeIsResourceShow"
  ></TransferModal> -->
  <tree-transfer
    ref="treeTransferCp"
    v-if="isResourceShow"
    :treeData="tData"
    :isResourceShow="isResourceShow"
    :choosedFileId="choosedFileId"
    @changeIsResourceShow="changeIsResourceShow"
    @confirmTransfer="confirmTransfer"
  ></tree-transfer>
</template>
<script>
import TreeTransfer from "@/components/treeTransfer";
import { getModelList, updateModel } from "@/shared/api/chat";
import { getTransferFileTree } from "@/shared/api/read";
import { downloadTemplate, importTemplate } from "@/shared/api/write";
import { downloadFile, scrollToBottom, textPaste } from "@/utils/common";
import {
  Button,
  Dropdown,
  Input,
  InputNumber,
  Menu,
  Select,
  Upload,
  message,
} from "ant-design-vue";
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRefs,
} from "vue";
// import TransferModal from "../transferModal";
import { find } from "lodash";
const { Item } = Menu;

export default {
  name: "WriteConfig",
  components: {
    AButton: Button,
    ADropdown: Dropdown,
    AInput: Input,
    AInputNumber: InputNumber,
    AMenu: Menu,
    AMenuItem: Item,
    ASelect: Select,
    AUpload: Upload,
    TreeTransfer,
    // TransferModal,
  },
  props: {
    meet: {
      type: Object,
      required: true,
    },
    detailData: {
      type: Object,
      required: true,
    },
  },
  emits: ["sseListener", "stopCreate", "changeDetailShow"],
  setup(props, { emit }) {
    const params = reactive({
      modelList: [],
      freedomList: [
        {
          label: "发散",
          value: 0,
        },
        {
          label: "平衡",
          value: 1,
        },
        {
          label: "严谨",
          value: 2,
        },
      ],
      templateAction: ["导入模板", "下载示例", "智能生成"],
      isChineseSpelling: false, // 是否正在输入中文拼音
      dropdownVisible: false, // 是否输入了@，触发了选择文件下拉
      contentDropdownVisible: false, // 模板段落，是否输入了@，触发了选择文件下拉
      position: undefined, // 光标位置
      referContent: null,
      isTitleShow: true, // 写作标题是否显示
      isWriteShow: true, // 写作模型是否显示
      isFileShow: true, // 参考资料是否显示
      isTemplateShow: true, // 写作模板是否显示
      isParamShow: true, // 写作参数是否显示
      isResourceShow: false, // 选择资源库是否展示
      configContent: null, // 绑定参数配置区域
      contentList: null, // 绑定段落区域
      contentIndex: 0, // 当前为哪个dropdown

      // 以下是需要从props里获取的参数
      setParagraphShow: props.detailData.template.length ? true : false, // 设置段落模板是否显示
      writeContent: props.detailData.writeContent,
      writeTitle: props.detailData.writeTitle,
      selectModel: props.detailData.selectModel,
      freedomValue: props.detailData.freedomValue,
      writeNumber: props.detailData.writeNumber, // 模板字数要求
      fileList: props.detailData.fileList,
      template: props.detailData.template,
      templateReferFiles: props.detailData.templateReferFiles, // 模板的引用文件
    });

    // 方向输入writeContent和template中的content到对应html中
    const handleInputContent = () => {
      params.referContent.innerHTML = params.writeContent;
      params.template.map((item, index) => {
        const currentRef =
          params.contentList.children[index].getElementsByClassName(
            "item-content"
          )[0];
        currentRef.innerHTML = item.content;
      });
    };

    // 上传前
    const beforeUpload = async (file) => {
      if (file) {
        const fileType = file.name.split(".")[1];
        if (fileType !== "csv") {
          message.info("当前只支持上传csv类型的文件！", 3);
          return false;
        }
        const formData = new FormData();
        formData.append("file", file);
        // const loading = message.loading("正在导入", 0);
        const res = await importTemplate(formData);
        // loading();
        if (res.message === "成功") {
          // message.success("导入成功");
          parseCsvToTemplate(res.data);
        } else {
          message.error(res.message);
        }
      }
      return false;
    };

    // 将csv解析结果转换成template
    const parseCsvToTemplate = (data) => {
      const lastTemp = params.template[params.template.length - 1];
      if (lastTemp && !lastTemp.title && !lastTemp.content) {
        // 如果模板最后一项没有内容，则删除最后一项
        params.template.splice(params.template.length - 1, 1);
      }
      const oldLength = params.template.length;
      data.map((item, index) => {
        params.template.push({
          title: item.paraTitle,
          content: item.paraContent,
          fileIds: [],
          writeNumber: item.paraLength,
        });
        // 动态插入模板文字，不能使用v-html，否则光标会有问题
        // 此处不用动态ref，因为会有bug
        nextTick(() => {
          const currentRef =
            params.contentList.children[
              oldLength + index
            ].getElementsByClassName("item-content")[0];
          currentRef.innerHTML = item.paraContent;
        });
      });
      scrollToBottom(params.configContent, 50);
    };

    // 获取光标位置
    const onBlur = () => {
      params.position = window.getSelection().getRangeAt(0);
    };

    // 监听写作模板输入
    const handleInput = (e) => {
      if (params.isChineseSpelling) return;
      const data = e.data; // 当前输入的内容
      if (data === "@" && params.fileList.length) {
        params.dropdownVisible = true;
      } else {
        params.dropdownVisible = false;
      }
      const value = e.target.innerHTML;
      params.writeContent = value;
    };

    // 中文输入开始
    const compositionstart = () => {
      params.isChineseSpelling = true;
    };

    // 中文输入结束
    const compositionend = (e, index, type) => {
      params.isChineseSpelling = false;
      const value = e.target.innerHTML;
      if (type === "paragraph") {
        params.template[index].content = value;
      } else {
        params.writeContent = value;
      }
    };

    // 写作模板选择@文件
    const onSelectFile = (file, type, index) => {
      const startIndex = params.position.startOffset;
      // 光标start向前移动一个单位
      params.position.setStart(params.position.startContainer, startIndex - 1);
      // 因为光标end没有变，start向左移动一位，所以range里就是@字符，deleteContents删除@字符
      params.position.deleteContents();

      // 插入新的@ + fileName
      const span = document.createElement("span");
      span.classList = "at-span";
      span.dataset.key = file.key;
      span.dataset.type = type;
      if (type === "paragraph") {
        span.dataset.index = index;
      }
      span.innerHTML = "@" + file.item.title;
      params.position.insertNode(span);
      if (type === "template") {
        params.dropdownVisible = false;
        // params.templateReferFiles.push(file.key); // 添加操作转移到handleListenerParamChange中进行
        params.writeContent = params.referContent.innerHTML;
      } else {
        params.contentDropdownVisible = false;
        const target =
          params.contentList.children[
            params.contentIndex
          ].getElementsByClassName("item-content")[0];
        // params.template[params.contentIndex].fileIds.push(file.key); // 添加操作转移到handleListenerParamChange中进行
        params.template[params.contentIndex].content = target.innerHTML;
      }
    };

    // 清除写作模板
    const clearTemplate = () => {
      params.referContent.innerHTML = "";
      params.writeContent = "";
      params.templateReferFiles = [];
      params.dropdownVisible = false;
    };

    // 设置段落模板
    const setTemplate = () => {
      params.setParagraphShow = true;
      if (params.template.length) return;
      addParagraph();
    };

    // 新增段落
    const addParagraph = () => {
      params.template.push({
        title: "",
        content: "",
        fileIds: [],
        writeNumber: undefined,
      });
      scrollToBottom(params.configContent, 20);
    };

    // 删除段落
    const deleteParagraph = (index) => {
      params.template.splice(index, 1);
    };

    // 填写段落标题
    const handleTitleInput = (index, e) => {
      const value = e.target.innerText;
      params.template[index].title = value;
    };

    // 填写段落要求
    const handleContentInput = (index, e) => {
      if (params.isChineseSpelling) return;
      const data = e.data; // 当前输入的内容
      if (data === "@" && params.fileList.length) {
        params.contentDropdownVisible = true;
      } else {
        params.contentDropdownVisible = false;
      }
      const value = e.target.innerHTML;
      params.contentIndex = index;
      params.template[index].content = value;
    };

    // 生成内容
    const handleCreateContent = async () => {
      console.log("handleCreateContent", params);
      if (!params.writeTitle) {
        message.error("请输入写作标题！");
        return false;
      }
      for (let i = 0; i < params.template.length; i++) {
        if (!params.template[i].title.trim()) {
          message.error("请输入段落标题！");
          return false;
        } else if (!params.template[i].content.trim()) {
          message.error("请输入段落要求！");
          return false;
        }
      }
      if (!params.writeContent.trim() && !params.template.length) {
        message.error("请输入写作模板！");
        return false;
      }
      // 去掉模板中的html字符串
      params.templateReferFiles.map((fileId) => {
        const targetFile = find(params.fileList, (v) => v.id === fileId);
        const reg = new RegExp(
          `<span class="at-span" data-key="${targetFile.id}" data-type="template">@${targetFile.label}</span>`,
          "g"
        );
        params.writeContent = params.writeContent.replace(reg, "");
      });

      const json = {
        taskId: props.detailData.id,
        writingTitle: params.writeTitle,
        freedom: params.freedomValue,
        llmId: params.selectModel,
        refFileIdList: params.fileList.map((item) => item.id),
        question: params.writeContent.trim()
          ? {
              question: params.writeContent.trim(),
              refFileIdList: params.templateReferFiles,
              writingLength: params.writeNumber,
            }
          : null,
        paraQueryList: params.template.map((item, index) => {
          // 去掉模板中的html字符串
          item.fileIds.map((fileId) => {
            const targetFile = find(params.fileList, (v) => v.id === fileId);
            const reg = new RegExp(
              `<span class="at-span" data-key="${targetFile.id}" data-type="paragraph" data-index="${index}">@${targetFile.label}</span>`,
              "g"
            );
            item.content = item.content.replace(reg, "");
          });
          return {
            question: item.content.trim(),
            refFileIdList: item.fileIds,
            title: item.title.trim(),
            writingLength: item.writeNumber,
          };
        }),
      };
      emit("sseListener", json);
    };

    // 停止回答
    const stopCreate = () => {
      emit("stopCreate");
    };

    // 设置自由度
    const setFreedom = (value) => {
      params.freedomValue = value;
    };

    // 获取模型列表
    const getModels = async () => {
      const json = {
        pageNo: 1,
        pageSize: 1000,
      };
      const res = await getModelList(json);
      if (res.message === "成功") {
        if (res.data && res.data.dateList.length) {
          params.modelList = res.data.dateList.map((item) => {
            return {
              label: item.name,
              value: item.modelId,
            };
          });
          params.selectModel = params.modelList[0].value;
          selectModelChange(params.selectModel);
        }
      } else {
        message.error(res.message);
      }
    };

    // 切换模型
    const selectModelChange = async (value) => {
      params.selectModel = value;
      const json = {
        taskId: "1153282747616342016",
        name: value.split("+")[0],
        llmUrl: value.split("+")[1],
      };
      const res = await updateModel(json);
      if (res.message !== "成功") {
        message.error(res.message);
      }
    };

    // 打开选择文件弹窗
    const showSelectFile = () => {
      changeIsResourceShow(true);
    };

    // 选定完了文件
    // const changeSelectFiles = (files) => {
    //   params.fileList = files;
    // };

    // 删除选定的文件
    const deleteSelectFile = (index) => {
      params.fileList.splice(index, 1);
    };

    const changeIsResourceShow = (value) => {
      params.isResourceShow = value;
    };

    // 模板三个按钮事件
    const handleAction = async (key) => {
      // "导入模板", "下载示例", "智能生成"
      let res = null;
      switch (key) {
        case "导入模板":
          break;
        case "下载示例":
          res = await downloadTemplate();
          downloadFile(res, "模板示例.csv");
          break;
        case "智能生成":
          message.info("智能生成功能正在开发中，敬请期待！");
          break;
        default:
          break;
      }
    };

    // 粘贴事件-阻止图片粘贴
    const handlePaste = (e) => {
      const items = e.clipboardData.items;
      let image = null;
      if (items && items.length) {
        for (var i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            image = items[i].getAsFile();
            break;
          }
        }
      }
      if (image) {
        // 阻止图片粘贴
        e.preventDefault();
      } else {
        // 粘贴为纯文本
        textPaste(e);
      }
    };

    // 返回方法
    const handleReturn = () => {
      emit("changeDetailShow", false);
    };

    // 拖拽所用到的变量
    let draggingNode = null; // 正在被拖拽的dom节点
    let draggingIndex = null; // 正在被拖拽的节点对应的index

    // 拖拽开始方法
    const handleDragStart = (e, index) => {
      draggingNode = e.target;
      draggingIndex = index;
      e.dataTransfer.effectAllowed = "grabbing";
    };

    // 正在拖拽方法
    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "grabbing";
    };

    // 拖拽停止方法
    const handleDrop = (index) => {
      if (draggingNode !== null && draggingIndex !== index) {
        const srcTarget = params.template[draggingIndex];
        const dstTarget = params.template[index];
        params.template.splice(index, 1, srcTarget);
        params.template.splice(draggingIndex, 1, dstTarget);
        const srcDom =
          params.contentList.children[draggingIndex].getElementsByClassName(
            "item-content"
          )[0];
        const srcInner = srcDom.innerHTML;
        const dstDom =
          params.contentList.children[index].getElementsByClassName(
            "item-content"
          )[0];
        const dstInner = dstDom.innerHTML;
        srcDom.innerHTML = dstInner;
        dstDom.innerHTML = srcInner;
        // 重置相关变量
        draggingNode = null;
        draggingIndex = null;
      }
    };

    //------leftMenu资源库导入文件，穿梭框所需数据
    const tData = ref([]);
    let cloneTreeData = [];
    const treeTransferCp = ref(null);
    // 获取分类树数据
    const getTreeData = async () => {
      const res = await getTransferFileTree();
      if (res.message === "成功") {
        if (res.data && res.data.child && res.data.child.length) {
          const arr = res.data.child.slice(1);
          tData.value = getChildData(arr);
          // cloneTreeData = tData.value; //不要这么写
          cloneTreeData = JSON.parse(JSON.stringify(tData.value)); //克隆一份原始tData,否则后续findTreeNodeById，会查找不到
        }
      } else {
        message.error(res.message);
      }
    };

    //将包含child的数据解析构成a-cascader需要的结构
    const getChildData = (arr) => {
      const result = [];
      // 遍历 tree
      arr.forEach((item) => {
        // 赋值
        // let key = item.category !== undefined ? item.category.id : item.id
        // let title = item.category !== undefined ? item.category.categoryName : item.fileName
        let id = item.id ? item.id : item.category.id;
        let label = item.fileName ? item.fileName : item.category.categoryName;
        let pid = item.categoryId
          ? item.categoryId
          : item.category.parentId == -1
          ? null
          : item.category.parentId;
        let children =
          item.child !== undefined
            ? [...item.child, ...item.files]
            : item.files;
        // 如果有子节点，递归
        if (children && children.length) {
          children = getChildData(children);
        }
        result.push({
          id,
          label,
          pid,
          children,
        });
      });

      return result;
    };

    //弹框确认按钮
    const confirmTransfer = async (res) => {
      if (!res.length) {
        message.warning("请选择要导入的文件");
        return false;
      }
      const result = [];
      res.map((id) => {
        //这里不要用tData.value进行查找，因为穿梭过程中，tData会删除右边树的节点，这样永远都找不到啊！！！！
        const node = findTreeNodeById(cloneTreeData, id);
        result.push(node);
      });
      // emit("changeSelectFiles", result);
      console.log("89898", result);
      choosedFileId.value = result.map((item) => item.id);
      params.fileList = result;
      params.isResourceShow = false;
      treeTransferCp.value.init();
      // cancel();
    };

    // 根据id递归查找树状节点
    const findTreeNodeById = (nodeList, id) => {
      // console.log("这是", nodeList, "id", id, "克隆数据", cloneTreeData);
      for (let i = 0; i < nodeList.length; i++) {
        const node = nodeList[i];
        if (node.id == id) {
          return node;
        } else if (node.children && node.children.length) {
          let target = findTreeNodeById(node.children, id);
          if (target) {
            return target;
          }
        }
      }
      return null;
    };

    // 监听at-span dom的删除事件
    const handleListenerParamChange = () => {
      const observer = new MutationObserver((mutationsList) => {
        mutationsList.map((item) => {
          if (item.type === "childList") {
            // 监听childList的变化
            // console.log("item", item);
            if (item.removedNodes.length) {
              const targetNode = item.removedNodes[0];
              const classname = targetNode.className;
              if (classname === "at-span") {
                const key = targetNode.dataset.key;
                const type = targetNode.dataset.type;
                const index = targetNode.dataset.index;
                if (type === "template") {
                  const num = params.templateReferFiles.indexOf(key);
                  params.templateReferFiles.splice(num, 1);
                } else if (type === "paragraph") {
                  const num = params.template[index].fileIds.indexOf(key);
                  params.template[index].fileIds.splice(num, 1);
                }
              }
            } else if (item.addedNodes.length) {
              const targetNode = item.addedNodes[0];
              const classname = targetNode.className;
              if (classname === "at-span") {
                const key = targetNode.dataset.key;
                const type = targetNode.dataset.type;
                const index = targetNode.dataset.index;
                console.log("test", key, type, index);
                if (type === "template") {
                  // const num = params.templateReferFiles.indexOf(key);
                  // if (num > -1) return; // 阻止重复添加
                  params.templateReferFiles.push(key);
                } else if (type === "paragraph") {
                  // const num = params.template[index].fileIds.indexOf(key);
                  // if (num > -1) return; // 阻止重复添加
                  params.template[index].fileIds.push(key);
                }
              }
            }
            // console.log("fileArr", params.templateReferFiles, params.template);
          }
        });
      });
      observer.observe(document.body, {
        childList: true, // 观察目标子节点的变化，是否有添加或者删除
        attributes: false, // 观察属性变动
        subtree: true, // 观察后代节点，默认为 false
      });
    };

    const handleKeyDown = (e) => {
      // 阻止ctrl+z,ctrl+y
      if ((e.keyCode === 89 && e.ctrlKey) || (e.keyCode === 90 && e.ctrlKey)) {
        e.preventDefault();
      }
    };

    //点击选择资料，将当前已选中的体现在穿梭框里
    const choosedFileId = ref([]);

    const handleTransferChoosed = () => {
      choosedFileId.value = params.fileList.map((item) => item.id);
      console.log("choosedFileId", choosedFileId);
    };

    onMounted(async () => {
      console.log("这里是config已经选中的file", params.fileList);
      handleTransferChoosed();
      await getTreeData();
      getModels();
      document.addEventListener("paste", handlePaste);
      document.body.addEventListener("keydown", handleKeyDown);
      handleInputContent();

      // 监听at-span dom的删除事件
      handleListenerParamChange();
    });

    onBeforeUnmount(() => {
      document.removeEventListener("paste", handlePaste);
      document.body.removeEventListener("keydown", handleKeyDown);
    });

    return {
      ...toRefs(params),
      beforeUpload,
      onBlur,
      handleInput,
      compositionstart,
      compositionend,
      onSelectFile,
      clearTemplate,
      setTemplate,
      addParagraph,
      deleteParagraph,
      handleTitleInput,
      handleContentInput,
      handleCreateContent,
      setFreedom,
      showSelectFile,
      changeIsResourceShow,
      // changeSelectFiles,
      deleteSelectFile,
      handleAction,
      selectModelChange,
      stopCreate,
      handleReturn,
      handleDrop,
      handleDragStart,
      handleDragOver,
      tData,
      treeTransferCp,
      confirmTransfer,
      choosedFileId,
    };
  },
};
</script>
<style lang="less">
@import url(./index.less);
</style>
