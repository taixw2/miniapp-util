const promise = require('./promise.js').Promise;

const noop = function() {};


/**
 * 转换称两位数
 * 0 => 00
 */
function formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
}


/**
 * [秒 =》 分钟]
 * 100 => 01:40
 */
function secondToMinute(s) {
    let m = Math.floor(s / 60);
    s = s % 60;
    return [formatNumber(m), formatNumber(s)].join(":");
}


/**
 * 格式化时间
 */
exports.formatTime = function(date, fmt = "yyyy/MM/dd hh:mm:ss") {
    if (!date) return "";
    date = typeof date == "number" ? new Date(date) : date;
    var o = {

        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒

    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));

    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ?
                (o[k]) :
                (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
};

/**
 * 人性话格式时间
 */
exports.ctDate = function(date) {
    if (!date) return "";
    const now = Date.now();
    let diff;
    date = typeof date == "number" ? date : +(new Date(date));
    diff = now - date;
    switch (Math.floor(diff / 3600000 / 24)) {
        case 0:
            return "今天";
        case 1:
            return "昨天";
        case 2:
            return "两天前";
        case 3:
            return "三天前";
        case 4:
            return "四天前";
        case 5:
            return "五天前";
        default:
            return formatTime(date);
    }

};

/**
 * 浅拷贝
 */
const assign = exports.assign = function() {
    const args = [].slice.apply(arguments);
    const target = args.shift();
    const length = args.length;
    let i = 0;
    let k;

    for (; i < length; i++) {

        let copy = args[i];

        for (k in copy) {

            target[k] = copy[k];

        }

    }

    return target;

};

/**
 * 封装loadding
 */
exports.loading = function(title = "加载中", duration = 10000, icon = "loading") {
    wx.showToast({
        title,
        icon,
        duration
    });
};

/**
 * 封装hideLoading
 */
exports.hideLoading = function() {
    wx.hideToast();
};

/**
 * mode基类
 */
function modal(options, showCancel = false) {
    return new promise((reslove, reject) => {

        const SUCCESS = options.success || noop;
        const FAIL = options.fail || noop;
        options.success = function(res) {
            SUCCESS(res);
            if (res.confirm) {
                reslove(true);
            } else {
                reslove(false);
            }
        };
        options.fail = function(res) {
            FAIL(res);
            reject(res);
        };
        options.showCancel = showCancel;
        wx.showModal(options);
    });
}

/**
 * 判断model的
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
function modalOptions (options) {
  if (typeof options == "string") {
      return {
          title,
          content: opt
      };
  }
  return options;
}

/**
 * 弹出层
 */
const _alert = exports._alert = function(options, title = "提示") {
    options = modalOptions(options);
    return model(options);
};

/**
 * 对话框
 */
const _confirm = exports._confirm = function(options, title = "提示") {
  options = modalOptions(options);
  return modal(options,true);
};


exports.decodeHtml = function(domString) {
    if (!domString) return "";

    domString = typeof domString === "function" ? domString()  : domString.toString();

    const REGX_HTML_DECODE = /&\w+;|&#(\d+);|<\w+>/g;
    const HTML_DECODE = {
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&nbsp;": " ",
        "&quot;": "\"",
        "©": "",
        "<br>": "\n",   //后端将\n转成了<br>
    };

    return domString.replace(REGX_HTML_DECODE,function(m,$1){
      return HTML_DECODE[m] ? HTML_DECODE[m] : m;
    });

};

//Object => queryString
exports.param = function(obj) {
    var key, val,
        arr = [];
    for (key in obj) {

        val = obj[key];
        arr[arr.length] = key + "=" + val;

    }
    return arr.join("&");
};


/**
 * 封装wx.request
 * 引入promise
 * 建议在app.js中引入request并且定义全局请求配置
 */
function request(configuration) {

    const DEFALUT_CONFIG = {
        root: "",
        url: "",
        method: "POST",
        header: {
            "content-type": "application/x-www-form-urlencoded;charset=utf-8"
        },
        data: {},
        success: noop,
        fail: noop,
        complete: noop,
        resloveStatus: noop,
        loading: false,
    };

    configuration = assign({},DEFALUT_CONFIG, configuration);

    return function(requestParams) {

        return new promise(function(fulfill, reject) {

                requestParams = assign({},configuration, requestParams);

                if (requestParams.loading) {
                    loading();
                }

                wx.request({
                    /**
                     * 每个项目的跟路径不一样，
                     */
                    url: requestParams.root + requestParams.url,
                    method: requestParams.method,
                    data: requestParams.data,
                    header: requestParams.header,
                    success({
                        data
                    }) {

                        /**
                         * 服务端通过code判断服务器超时/参数错误等
                         */
                        if (requestParams.resloveStatus(data)) {
                            fulfill(data);
                        } else {
                            reject(data);
                        }

                    },
                    fail(res) {
                        /**
                         * 可能是网络错误
                         */
                        reject(res);
                    },
                    complete() {
                        requestParams.complete(res);
                        hideLoading();
                    }
                });
            })
            .then(function(res) {
                requestParams.success(res);
                return res;
            }, function(res) {
                requestParams.fail(res);
                throw new Error("request fail:" + res);
            });

    };
}

/**
 * 配置获取用户信息的参数
 * @return {[type]}               [getUserInfo]
 */
function configUserInfo(userInfo) {

    const DETAULT_USERINFO = {
        code: "",
        data: {},
        /**
         * 把认证信息传到服务器登录
         * @param  {[type]} userInfo [认证信息]
         * @param  {[type]} code     [登录code]
         * @return {[type]}          [promise]
         */
        requestLogin: function(userInfo, code) {
            //必须返回一个promise
            return {
                then: noop
            };
        }
    };

    userInfo = assign({},DETAULT_USERINFO, userInfo);

    /**
     * 获取自己的用户信息
     * @param  {Function} callback [获取信息之后的回调]
     * @param  {[type]}   force    [是否强制从服务器上使用新的code拉取用户信息]
     * @return {[type]}            [promise]
     */
    return function getUserInfo(callback = noop, force = false) {
        return new promise(function(reslove, reject) {
            if (userInfo.code && !force) {
                reslove(userInfo.code);
                return;
            }
            wx.login({
                success(res) {
                    wx.code = res.code;
                    reslove(res.code);
                },
                fail(res) {
                    console.log(res);
                    reject(res);
                }
            });
        }).then(function(code) {
            if (!force && userInfo.data) return userInfo.data;
            return new promise(function(reslove, reject) {
                wx.getUserInfo({
                    success(res) {
                        reslove(res);
                    },
                    fail(res) {
                        reject(res);
                    }
                });
            });
        }).then(
            function(res) {
                if (!force && userInfo.data) return userInfo.data;
                return userInfo.requestLogin(res, userInfo.code);
            },
            function(res) {
                console.log(res);
                _alert("登录失败，请重新登录")
                    .then(res => {
                        getUserInfo(callback, true);
                    });
                throw new Error("login fail:" + res);
            }
        ).then(function(res) {
            userInfo.data = res;
            return callback(res) || res;
        });
    };
}

/**
 * 支付
 * @param  {[type]} payParams [description]
 * @return {[type]}           [description]
 */
function payment(payParams) {
    return new promise(function(fulfill, reject) {
        payParams.success = function(res) {
            console.log(res);
            fulfill(res);
        };
        payParams.fail = function(res) {
            console.log(res);
            reject(res);
        };
        console.log(payParams);
        wx.requestPayment(payParams);
    });
}

/**
 * 上传文件
 * @param  {[type]} opt [description]
 * @return {[type]}     [description]
 */
function uploadFile(uploadFileConfig) {

    const DEFAULT_UPLOAD_CONFIG = {

        root: "",
        defaultURL: "",
        resloveStatus: noop,
        requestParams: {
            header: {},
            name: ""
        }

    };

    uploadFileConfig = assign({}, DEFAULT_UPLOAD_CONFIG, uploadFileConfig);

    return function(options) {

        return new promise(function(fulfill, reject) {

            options = assign({}, uploadFileConfig.requestParams, options);
            options.url = options.url ? uploadFileConfig.root + options.url : uploadFileConfig.root + uploadFileConfig.defaultURL;

            options.success = function(res) {
                let fileData;
                try {
                    fileData = JSON.parse(res.data);
                } catch (e) {
                    reject(e);
                }
                if (uploadFileConfig.resloveStatus(fileData)) {
                    fulfill(fileData);
                } else {
                    reject(fileData);
                }
            };

            options.fail = function(res) {
                console.log(res);
                reject(res);
            };

            wx.uploadFile(options);
        });

    };
}

exports.pubsub = {

  cache : {},

  $on () {},
  $emit () {}


};
