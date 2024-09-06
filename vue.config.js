const path = require("path");
const resolve = (dir) => path.resolve(__dirname, dir);
const isProd = process.env.NODE_ENV === "production";

const localUrl0 = "http://172.18.192.66:8200";
const userUrl = "http://172.22.204.30:8200";

module.exports = {
  /** 区分打包环境与开发环境
   * process.env.NODE_ENV==='production'  (打包环境)
   * process.env.NODE_ENV==='development' (开发环境)
   * publicPath: process.env.NODE_ENV==='production'?"https://cdn.didabisai.com/front/":'front/',
   */
  // 项目部署的基础路径
  // 我们默认假设你的应用将会部署在域名的根部,
  // 例如 https://www.my-app.com/
  // 如果你的应用部署在一个子路径下，那么你需要在这里
  // 指定子路径。比如将你的应用部署在
  // https://www.foobar.com/my-app/
  // 那么将这个值改为 '/my-app/'
  publicPath: "/",
  // 构建好的文件输出到哪里
  outputDir: "dist",
  // where to put static assets (js/css/img/font/...)
  // assetsDir: "",
  // 是否在保存时使用‘eslint-loader’进行检查 // 有效值: true | false | 'error' // 当设置为‘error’时，检查出的错误会触发编译失败
  lintOnSave: false,
  // 使用带有浏览器内编译器的完整构建版本 // https://vuejs.org/v2/guide/installation.html#Runtime-Compiler-vs-Runtime-only
  runtimeCompiler: true,
  // babel-loader默认会跳过`node_modules`依赖. // 通过这个选项可以显示转译一个依赖
  transpileDependencies: ["pdfjs-dist"],
  // 是否为生产环境构建生成sourceMap?
  productionSourceMap: false,
  // 调整内部的webpack配置. // see https://github.com/vuejs/vue-cli/blob/dev/docs/webpack.md
  // chainWebpack通过链式编程的形式，来修改默认的webpack配置
  chainWebpack: (config) => {
    // 修改内部svg规则
    config.module
      .rule("svg")
      .exclude.add(resolve("src/assets/images/svg"))
      .end();
    config.module
      .rule("icons")
      .test(/\.svg$/)
      .include.add(resolve("src/assets/images/svg"))
      .end()
      .use("svg-sprite-loader")
      .loader("svg-sprite-loader")
      .options({
        symbolId: "icon-[name]",
      })
      .end();
    config.when(isProd, (config) => {
      // use terser
      config.optimization.minimizer("terser").tap((args) => {
        // remove debugger
        args[0].terserOptions.compress.drop_debugger = true;
        // remove console.log
        // args[0].terserOptions.compress.pure_funcs = ["console.log"];
        // remove comments
        args[0].terserOptions.output = {
          comments: false,
        };
        // parallel
        args[0].terserOptions.parallel = 4;
        return args;
      });
    });
    config
      .plugin("mini-css-extract-plugin")
      .use(require("mini-css-extract-plugin"), [
        {
          filename: "[name].[contenthash].css",
          chunkFilename: "[id].[contenthash].css",
        },
      ])
      .end();
  },
  // configureWebpack通过操作对象的形式，来修改默认的webpack配置
  configureWebpack: (config) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        "@": resolve("src"),
        utils: resolve("src/utils"),
        assets: resolve("src/assets"),
        components: resolve("src/components"),
        api: resolve("src/shared/api"),
        store: resolve("src/store"),
        views: resolve("src/views"),
      },
    };
  },
  // CSS 相关选项
  css: {
    // 将组件内部的css提取到一个单独的css文件（只用在生产环境）
    // 也可以是传递给 extract-text-webpack-plugin 的选项对象
    extract: true,
    // 允许生成 CSS source maps?
    sourceMap: false,
    // pass custom options to pre-processor loaders. e.g. to pass options to // sass-loader, use { sass: { ... } }
    loaderOptions: {
      less: {
        javascriptEnabled: true, // 可以在less中使用js
      },
    },
    // Enable CSS modules for all css / pre-processor files. // This option does not affect *.vue files.
    // 默认情况下，只有 *.module.[ext] 结尾的文件才会被视作 CSS Modules 模块。
    // 设置为 false 后你就可以去掉文件名中的 .module 并将所有的 *.(css|scss|sass|less|styl(us)?) 文件视为 CSS Modules 模块。
    requireModuleExtension: true,
  },
  // use thread-loader for babel & TS in production build // enabled by default if the machine has more than 1 cores
  parallel: require("os").cpus().length > 1,
  // PWA 插件相关配置 // see https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-pwa
  pwa: {
    iconPaths: {
      favicon32: "favicon.ico",
      favicon16: "favicon.ico",
      appleTouchIcon: "favicon.ico",
      maskIcon: "favicon.ico",
      msTileImage: "favicon.ico",
    },
  }, // configure webpack-dev-server behavior
  devServer: {
    disableHostCheck: false,
    host: "0.0.0.0",
    // host: "172.16.223.56",
    port: 8088,
    hot: true,
    // host: HOST_IP,
    // port: PORT,
    quiet: true,
    open: true,
    // openPage: "/",
    compress: true,
    historyApiFallback: true,
    inline: true,
    // https: true,
    // publicPath: "/",
    // hotOnly: false, // See https://github.com/vuejs/vue-cli/blob/dev/docs/cli-service.md#configuring-proxy
    proxy: {
      "/chat": {
        target: process.env.VUE_APP_SERVER_URL,
        // 开启跨域
        changeOrigin: true,
        //changeOrigin: process.env.NODE_ENV === "development" ? true : false, // 开发环境才开启反向代理, 生产环境不开启 也就是是否允许跨域问题
        ws: false, //如果要代理 websockets，配置这个参数
        logLevel: "debug",
        secure: false,
        // 路径重写
        // pathRewrite: {
        //   ["^" + process.env.VUE_APP_BASE_API]: "",
        // },
      },
      // "/chat": {
      //   target: localUrl0,
      //   secure: false,
      //   changeOrigin: false,
      //   ws: false, //如果要代理 websockets，配置这个参数
      //   logLevel: "debug",
      //   // pathRewrite: { "^/api": "" },
      // },
      // "/warpdrive": {
      //   target: "http://172.34.120.88:23334",
      //   changeOrigin: true,
      //   secure: false,
      //   logLevel: "debug",
      // },
    },
    // before: app => {}
  },
  // 第三方插件配置
  pluginOptions: {
    "style-resources-loader": {
      preProcessor: "less",
      patterns: [
        // 这个是加上自己的路径,不能使用(如下:alias)中配置的别名路径
        path.resolve(__dirname, "./src/assets/theme/style.less"),
      ],
    },
  },
};
