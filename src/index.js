const { Promise } = require('./promise.js')

exports.noop = function noop() {}

/**
 * 转换称两位数
 * 0 => 00
 */
exports.toDouble = (n) => {
  const strN = n.toString()
  return strN[1] ? strN : `0${strN}`
}


/**
 * [秒 =》 分钟]
 * 100 => 01:40
 */
exports.secondToMinute = (s) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return [exports.formatNumber(m), exports.formatNumber(sec)].join(':')
}


/**
 * 格式化时间
 */
exports.formatTime = (date, fmt = 'yyyy/MM/dd hh:mm:ss') => {
  if (!date) return ''
  const myDate = typeof date === 'number' ? new Date(date) : date
  const arr = [
    { key: 'M+', value: myDate.getMonth() + 1 },
    { key: 'd+', value: myDate.getDate() },
    { key: 'h+', value: myDate.getDate() },
    { key: 'm+', value: myDate.getDate() },
    { key: 's+', value: myDate.getDate() }]
  let format = fmt
  if (/(y+)/.test(format)) format = format.replace(RegExp.$1, String(myDate.getFullYear()).substr(4 - RegExp.$1.length))

  for (let i = 0, len = arr.length; i < len; i += 1) {
    const cur = arr[i]
    if (new RegExp(`(${cur.key})`).test(format)) {
      format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ?
        (cur.value) :
        ((`00${cur.value}`).substr(String(cur.value).length)))
    }
  }
  return format
}

/**
 * 人性话格式时间
 */
exports.ctDate = (date) => {
  if (!date) return ''
  const now = Date.now()
  const myDate = typeof date === 'number' ? date : +(new Date(date))
  const diff = now - myDate
  switch (Math.floor(diff / 3600000 / 24)) {
  case 0:
    return '今天'
  case 1:
    return '昨天'
  case 2:
    return '两天前'
  case 3:
    return '三天前'
  case 4:
    return '四天前'
  case 5:
    return '五天前'
  default:
    return exports.formatTime(date)
  }
}

/**
 * 浅拷贝
 */
exports.assign = () => {
  const args = [].slice.apply(arguments)
  const target = args.shift()
  const length = args.length
  let i = 0
  let k = ''
  for (; i < length; i += 1) {
    const copy = args[i]
    for (k in copy) {
      target[k] = copy[k]
    }
  }
  return target
}

/**
 * 封装loadding
 */
exports.loading = (title = '加载中', duration = 10000, icon = 'loading') => {
  wx.showToast({
    title,
    icon,
    duration,
  })
}

/**
 * 封装hideLoading
 */
exports.hideLoading = () => {
  wx.hideToast()
}

/**
 * mode基类
 */
function modal(opt) {
  return new Promise((reslove, reject) => {
    const success = opt.success || exports.noop
    const fail = opt.fail || exports.noop
    opt.success = (res) => {
      success()
      if (res.confirm) {
        reslove(true)
      } else {
        reslove(false)
      }
    }
    opt.fail = () => {
      fail()
      reject()
    }
    wx.showModal(opt)
  })
}

/**
 * 判断model的
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
function builderModalOptions(options, title) {
  return typeof options === 'object' ? options : {
    title,
    content: options,
  }
}

/**
 * 弹出层
 */
exports.alert = (options, title = '提示') => {
  const opt = builderModalOptions(options, title)
  opt.showCancel = false
  return modal(opt)
}

/**
 * 对话框
 */
exports.confirm = (options, title = '提示') => modal(builderModalOptions(options, title))


exports.decodeHtml = (domString) => {
  if (!domString) return ''
  // string = typeof domString === 'function' ? domString() : domString.toString()

  const REGX_HTML_DECODE = /&\w+;|&#(\d+);|<\w+>/g
  const HTML_DECODE = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&nbsp;': ' ',
    '&quot;': '\'',
    '©': '',
    '<br>': '\n', //后端将\n转成了<br>
  }
  return domString.replace(REGX_HTML_DECODE, m => (HTML_DECODE[m] ? HTML_DECODE[m] : m))
}

// Object => queryString
exports.param = (obj) => {
  const arr = []
  for (const key in obj) {
    const val = obj[key]
    arr[arr.length] = `${key}'='${val}`
  }
  return arr.join('&')
}


/**
 * 封装wx.request
 * 引入promise
 * 建议在app.js中引入request并且定义全局请求配置
 */
exports.request = (configuration) => {
  const DEFALUT_CONFIG = {
    root: '',
    url: '',
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    data: {},
    success: exports.noop,
    fail: exports.noop,
    complete: exports.noop,
    resloveStatus: exports.noop,
    loading: false,
  }
  const config = exports.assign({}, DEFALUT_CONFIG, configuration)
  return requestParams => (
    new Promise((fulfill, reject) => {
      const params = exports.assign({}, config, requestParams)
      if (params.loading) {
        exports.loading()
      }
      wx.request({
        /**
         * 每个项目的跟路径不一样，
         */
        url: params.root + params.url,
        method: params.method,
        data: params.data,
        header: params.header,
        success({ data }) {
          /**
           * 服务端通过code判断服务器超时/参数错误等
           */
          if (params.resloveStatus(data)) {
            fulfill(data)
          } else {
            reject(data)
          }
        },
        fail(res) {
          /**
           * 可能是网络错误
           */
          reject(res)
        },
        complete(res) {
          params.complete(res)
          exports.hideLoading()
        },
      })
    })
    .then((res) => {
      requestParams.success(res)
      return res
    }, (res) => {
      requestParams.fail(res)
      throw new Error(`request fail:${res}`)
    })
  )
}

/**
 * 配置获取用户信息的参数
 * @return {[type]}               [getUserInfo]
 */
exports.configUserInfo = (userInfo) => {
  const DETAULT_USERINFO = {
    code: '',
    data: {},
    /**
     * 把认证信息传到服务器登录
     * @param  {[type]} userInfo [认证信息]
     * @param  {[type]} code     [登录code]
     * @return {[type]}          [promise]
     */
    requestLogin() {
      // 必须返回一个promise
      return {
        then: exports.noop,
      }
    },
  }

  const loginUserMeta = exports.assign({}, DETAULT_USERINFO, userInfo)

  /**
   * 获取自己的用户信息
   * @param  {Function} callback [获取信息之后的回调]
   * @param  {[type]}   force    [是否强制从服务器上使用新的code拉取用户信息]
   * @return {[type]}            [promise]
   */
  return function getUserInfo(callback = exports.noop, force = false) {
    return new Promise((reslove, reject) => {
      if (loginUserMeta.code && !force) {
        reslove(loginUserMeta.code)
        return
      }
      wx.login({
        success(res) {
          wx.code = res.code
          reslove(res.code)
        },
        fail(res) {
          reject(res)
        },
      })
    }).then(() => {
      if (!force && loginUserMeta.data) return loginUserMeta.data
      return new Promise((reslove, reject) => {
        wx.getUserInfo({
          success(res) {
            reslove(res)
          },
          fail(res) {
            reject(res)
          },
        })
      })
    }).then(
      (res) => {
        if (!force && loginUserMeta.data) return loginUserMeta.data
        return loginUserMeta.requestLogin(res, loginUserMeta.code)
      },
      (res) => {
        exports.alert('登录失败，请重新登录')
          .then(() => getUserInfo(callback.bind(null, res), true))
        throw new Error(`login fail:${res}`)
      })
    .then((res) => {
      userInfo.data = res
      return callback(res) || res
    })
  }
}

/**
 * 支付
 * @param  {[type]} payParams [description]
 * @return {[type]}           [description]
 */
exports.payment = payParams => new Promise((fulfill, reject) => {
  payParams.success = (res) => {
    fulfill(res)
  }
  payParams.fail = (res) => {
    reject(res)
  }
  wx.requestPayment(payParams)
})

/**
 * 上传文件
 * @param  {[type]} opt [description]
 * @return {[type]}     [description]
 */
exports.uploadFile = opt => new Promise((reslove, reject) => {
  const basePath = 'https://www.huxiao.com/cgi-bin/pa/q/'
  opt.success = (res) => {
    let data

    try {
      data = JSON.parse(res.data)
    } catch (e) {
      data = {}
    }
    if (data.ec !== 0) {
      reject(res)
    } else {
      reslove(data)
    }
  }
  opt.fail = (res) => {
    reject(res)
  }
  opt.url = opt.url ? (basePath + opt.url) : `${basePath}common/cgi_common_pic_upload`
  wx.uploadFile(opt)
})

exports.uploadFiles = (opts) => {
  const paths = opts.filePaths
  opts.filePaths = null
  return Promise.all(paths.map((v) => {
    opts.filePath = v
    return exports.uploadFile(opts)
  }))
}

exports.pubsub = {

  cacheEvent: {},

  $on(tag, fn) {
    const { cacheEvent } = this
    if (!cacheEvent[tag]) {
      cacheEvent[tag] = []
    }
    cacheEvent[tag].push(fn)
  },
  $emit(tag, params) {
    const { cacheEvent } = this
    let fn = cacheEvent[tag].shift()
    if (cacheEvent[tag]) {
      while (fn) {
        fn(params)
        fn = cacheEvent[tag].shift()
      }
    }
  },
}
