# miniapp-util

一些常用的方法， 以及微信小程序 api promise 化  
如果已经使用了 wepy 框架, 则没有必要再将 api promise 化了

### 安装 

```
复制 dist 目录中的内容到你的项目中  
因为小程序不支持 node_modules
```

### 使用

``` javascript
var miniapp = require('./miniapp-util.js')

// Promise 的 polyfill
miniapp.Promise

// 被 promise 化的 api 命名空间
miniapp.wxp
miniapp.wxp.login
// 或者
wx.p.login
...

// 其他一些 util 函数
miniapp.noop

// 将一位数的数值转换成两位数： 1 => 01
miniapp.numToDouble

// 格式化时间戳
miniapp.formatTime

// 可读性更好的时间格式化，如：今天，一天前，两天前...
miniapp.readableDate
// 秒转分， 如: 100 => 01:40
miniapp.secondToMinute
```
