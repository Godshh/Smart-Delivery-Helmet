module.exports = {
  lintOnSave: false,
  css: {
    loaderOptions: {

    },
  },

  devServer: {
    host: '0.0.0.0',
    port: 8080,
    https: true,
    allowedHosts: 'all',
    // client: {
    //   webSocketURL: 'wss://6f23-182-91-58-40.ngrok-free.app/ws',
    // },
    proxy: {
      '/api': {
        target: 'http://192.168.99.20:8081', // Flask 服务器端口
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      },
      '/baidu': {
        target: 'https://openapi.baidu.com', // 百度开放平台地址
        changeOrigin: true,
        secure: true,
        pathRewrite: { '^/baidu': '' }
      }
    }
  },
};
