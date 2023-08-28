# in 东师 小程序/App

[![作者: Mr.Hope](https://img.shields.io/badge/作者-Mr.Hope-blue.svg?style=for-the-badge)](https://mister-hope.com)

> 请注意，此项目虽然公开了源代码，但是包含了对应的 [协议](https://github.com/inNENU/inNENU/tree/main/LICENSE) 进行限制。请勿以为本项目代码可随意使用。

## 目前 QQ 与微信小程序的差异

### 已兼容的

- QQ 与微信的联系客服区别
- QQ 无法进行 bug 反馈
- QQ 不支持 canvas 同层
- QQ 地图支持较差(限制地图功能)
- QQ 不支持腾讯地图插件
- QQ 支持添加好友
- QQ 支持添加群聊
- QQ 支持添加到桌面
- QQ 支持分享到多个渠道
- QQ 无法打开公众号图文
- QQ 无法添加联系人
- 微信支持添加文件到收藏
- 微信支持跳转个人号主页

### 可以兼容但未兼容的

- QQ 不支持在 json 中配置组件样式隔离选项 (兼容方式: 写在 ts 里)
- QQ 的 input 不支持 `catch:` 写法 (兼容方式: 使用 `bind` 写法)
- QQ 需要补全分包的页面 json (兼容方式: 直接补全)

### 无法兼容的

- QQ 不兼容 darkmode 的主题配置， app.json 写法有差异 (编译失败)
- QQ 不支持 text 的 user-select (旧写法出现警告)
- QQ 的 app.json 声明了 groupIdList (旧写法出现警告)

## TODO

借阅书籍添加刷新按钮
