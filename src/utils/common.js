import { Modal, message } from "ant-design-vue";
import hljs from "highlight.js";
import jschardet from "jschardet";
import { Remarkable } from "remarkable"; // 代码高亮插件
import { nextTick } from "vue";
import clipboard3 from "vue-clipboard3"; // 复制插件

const { toClipboard } = clipboard3();

// 确认弹窗
export function modalConfirm(title, content, onOk) {
  Modal.confirm({
    title: title,
    class: "common-confirm-modal",
    // icon: <exclamation-circle-outlined style="color: #FE9E17 " />,
    content: content,
    okText: "确认",
    okType: "primary",
    centered: true,
    cancelText: "取消",
    onOk: onOk,
    onCancel: () => {
      // message.info("已取消");
    },
  });
}

// 确认弹窗
export function modalConfirmCancel(title, content, onOk, onCancel) {
  Modal.confirm({
    title: title,
    class: "common-confirm-modal",
    // icon: <exclamation-circle-outlined style="color: #FE9E17 " />,
    content: content,
    okText: "确认",
    okType: "primary",
    centered: true,
    cancelText: "取消",
    onOk: onOk,
    onCancel: onCancel,
  });
}

//将包含child的数据解析构成a-cascader需要的结构
export const convertTree = (rst) => {
  const result = [];
  // 遍历 tree
  rst.forEach((item) => {
    // 赋值
    let value = item.category.bucketAlias;
    let label = item.category.categoryName;
    let children = item.child;
    // 如果有子节点，递归
    if (children) {
      children = convertTree(children);
    }
    result.push({
      value,
      label,
      children,
    });
  });

  return result;
};

// 重置toRefs导出的响应式变量
export const resetData = (data) => {
  const keys = Object.keys(data);
  let obj = {};
  keys.forEach((item) => {
    if (Array.isArray(data[item])) {
      obj[item] = [];
    } else if (data[item] instanceof Object) {
      obj[item] = {};
    } else {
      obj[item] = undefined;
    }
  });
  Object.assign(data, obj);
};

/**
 * 下载文件
 * @param {Blob|string} content - 文件内容或 URL
 * @param {string} fileName - 文件名
 * @param {Object} config - 配置选项，包括文件类型
 */
export function downloadFile(content, fileName, config) {
  let blob =
    content instanceof Blob
      ? content
      : new Blob([content], config || undefined);
  let aLink = document.createElement("a");
  let evt = new MouseEvent("click", {
    view: window,
    bubbles: false,
    cancelable: true,
  });
  evt.initEvent("click", false, false);
  aLink.href = URL.createObjectURL(blob);
  aLink.download = fileName || "";
  document.body.appendChild(aLink);
  aLink.dispatchEvent(evt);

  window.setTimeout(() => {
    document.body.removeChild(aLink);
    aLink = null;
    evt = null;
  });
}

// 根据id递归查找树状节点
export const findTreeNodeById = (nodeList, id) => {
  for (let i = 0; i < nodeList.length; i++) {
    const node = nodeList[i];
    if (node.key === id) {
      return node;
    } else if (node.children && node.children.length) {
      const target = findTreeNodeById(node.children, id);
      if (target) {
        return target;
      }
    }
  }
  return null;
};

const md = new Remarkable({
  html: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (err) {}
    }
    try {
      return hljs.highlightAuto(str).value;
    } catch (err) {}
    return "";
  },
});

export const CreateMd = function ({ content }) {
  const html = md.render(content);
  return html;
  // return <div v-html={html}></div>
};

//参考文献类型
export const getContextType = function (file = "07-R-REC-M.541-10-C.docx") {
  const index = file.lastIndexOf(".");
  const fileType = file.substring(index + 1);
  switch (fileType.toLocaleLowerCase()) {
    case "doc":
      return "word";
    case "docx":
      return "word";
    default:
      return fileType;
  }
};

// 复制问题、复制回答
export const handleCopy = async (context) => {
  try {
    await toClipboard(context);
    message.success("复制成功！");
  } catch (error) {
    //console.log("err", error);
    message.error("复制失败！");
  }
};

// 粘贴为纯文本
export const textPaste = (event) => {
  event.preventDefault();
  var text;
  var clp = (event.originalEvent || event).clipboardData;
  // 兼容针对于opera ie等浏览器
  if (clp === undefined || clp === null) {
    text = window.clipboardData.getData("text") || "";
    if (text !== "") {
      if (window.getSelection) {
        // 针对于ie11 10 9 safari
        var newNode = document.createElement("span");
        newNode.innerHTML = text;
        window.getSelection().getRangeAt(0).insertNode(newNode);
      } else {
        // 兼容ie10 9 8 7 6 5
        document.selection.createRange().pasteHTML(text);
      }
    }
  } else {
    // 兼容chorme或hotfire
    text = clp.getData("text/plain") || "";
    if (text !== "") {
      document.execCommand("insertText", false, text);
    }
  }
};

// Storage封装
class Storage {
  constructor(name) {
    this.name = name;
  }
  //设置缓存
  setItem(params) {
    let obj = {
      name: "",
      value: "",
      expires: 0,
      startTime: new Date().getTime(), //记录何时将值存入缓存，毫秒级
    };
    let options = {};
    //将obj和传进来的params合并
    Object.assign(options, obj, params);
    if (options.expires) {
      //如果options.expires设置了的话
      //以options.name为key，options为值放进去
      localStorage.setItem(options.name, JSON.stringify(options));
    } else {
      //如果options.expires没有设置，就判断一下value的类型
      let type = Object.prototype.toString.call(options.value);
      //如果value是对象或者数组对象的类型，就先用JSON.stringify转一下，再存进去
      if (type == "[object Object]" || type == "[object Array]") {
        options.value = JSON.stringify(options.value);
      }
      localStorage.setItem(options.name, options.value);
    }
  }
  //拿到缓存
  getItem(name) {
    let item = JSON.parse(localStorage.getItem(name));
    //如果有expires的值，说明设置了失效时间
    if (item && item.expires) {
      let date = new Date().getTime();
      //何时将值取出减去刚存入的时间，与item.expires比较，如果大于就是过期了，如果小于或等于就还没过期
      if (date - item.startTime > item.expires) {
        //缓存过期，清除缓存，返回false
        localStorage.removeItem(name);
        return false;
      } else {
        //缓存未过期，返回值
        return item.value;
      }
    } else {
      //如果没有设置失效时间，直接返回值
      return item;
    }
  }
  //移出缓存
  removeItem(name) {
    localStorage.removeItem(name);
  }
  //移出全部缓存
  clear() {
    localStorage.clear();
  }
}

export const LocalStorage = new Storage();

// 获取缓存里的用户信息
export function getUserInfo() {
  return JSON.parse(LocalStorage.getItem("userInfo"));
}

// 滚动到底部
export function scrollToBottom(domRef, step) {
  // step: 每次滚动幅度
  nextTick(() => {
    // 找到是哪个区域在滚动-domId
    let scrollTop = domRef.scrollTop;
    const clientHeight = domRef.clientHeight;
    const scrollHeight = domRef.scrollHeight;
    const timer = setInterval(() => {
      if (scrollTop + clientHeight < scrollHeight) {
        domRef.scrollTop += step;
        scrollTop += step;
      } else {
        clearInterval(timer);
      }
    }, 10);
  });
}

//  识别编码
export const checkEncoding = (base64Str) => {
  // 这种方式得到的是一种二进制串
  let str = atob(base64Str.split(";base64,")[1]);
  // 要用二进制格式
  let encoding = jschardet.detect(str).encoding;
  if (encoding === "windows-1252") {
    //有时会识别错误（如UTF8的中文二字）
    encoding = "ANSI";
  }
  return encoding;
};
