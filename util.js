const promise = require('./promise.js').Promise;

const noop = function() {};

/**
 * 格式化时间
 */
function formatTime(date, fmt = "yyyy/MM/dd hh:mm:ss") {
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
}

/**
 * 人性话格式时间
 */
function ctDate(date) {
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
 * 转换称两位数
 */
function formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
}

/**
 * 浅拷贝
 */
function assign() {
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

}



/**
 * 封装loadding
 */
function loading(title = "加载中", duration = 10000, icon = "loading") {
    wx.showToast({
        title,
        icon,
        duration
    });
}

/**
 * 封装hideLoading
 */
function hideLoading() {
    wx.hideToast();
}


/**
 * 封装wx.request
 * 引入promise
 * 建议在app.js中引入request并且定义全局请求配置
 */
function request(configuration) {

    const DEFALUT_CONFIG = {

      root : "",
      url : "",
      method : "POST",
      header : {
        "content-type" : "application/x-www-form-urlencoded;charset=utf-8"
      },
      data : {},
      success : noop,
      fail : noop,
      complete : noop,
      resloveStatus :  noop,
      loading : false,
    };

    configuration = assign(DEFALUT_CONFIG,configuration);

    return function(requestParams) {

        return new promise(function(fulfill, reject) {

                requestParams = assign(configuration,requestParams);

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
                    success({ data }) {

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
 * 获取自己的用户信息
 * @param  {Function} callback [获取信息之后的回调]
 * @param  {[type]}   force    [是否强制从服务器上拉去]
 * @return {[type]}            [promise]
 */
function getUserInfo(callback, force) {

    return new promise(function(reslove, reject) {
        if (wx.code && !force) {
            reslove(wx.code);
        } else {
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
        }
    }).then(function(code) {
        return !force && wx.userInfo ||
            new promise(function(reslove, reject) {
                wx.getUserInfo({
                    success(res) {
                        reslove({
                            code,
                            res
                        });
                    },
                    fail(res) {
                        console.log(res);
                        reject({
                            code,
                            res
                        });
                    }
                });
            });

    }).then(
        function(res) {
            return !force && wx.userInfo ||
                request({
                    url: "user/cgi_user_login",
                    data: {
                        source: 1,
                        code: res.code,
                        raw_data: res.res.rawData,
                        signature: res.res.signature,
                        encrypted_data: res.res.encryptedData,
                        iv: res.res.iv
                    }
                });
        },
        function(res) {
            console.log(res);
            _alert("登录失败，请重新登录")
                .then(res => {
                    getUserInfo(callback, true);
                });
            throw new Error("login fail");
        }
    ).then(function(res) {
        wx.userInfo = res;
        return callback && callback(res) || res;
    });
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
function uploadFile(opt) {
    return new promise(function(reslove, reject) {
        const base_path = "https://www.huxiao.com/cgi-bin/pa/q/";
        opt.success = function(res) {
            let data;

            try {
                data = JSON.parse(res.data);
            } catch (e) {
                data = {};
            }

            console.log(data);
            if (data.ec !== 0) {
                reject(res);
            } else {
                reslove(data);
            }

        };
        opt.fail = function(res) {
            console.log(res);
            reject(res);
        };
        // opt.complete = function() {
        //   hideLoading();
        // };
        opt.url = opt.url && (base_path + opt.url) || base_path + "common/cgi_common_pic_upload";
        console.log(opt);
        wx.uploadFile(opt);
    });
}

function uploadFiles(opts) {
    var paths = opts.filePaths;
    opts.filePaths = null;
    return promise.all(paths.map(v => {
        opts.filePath = v;
        return uploadFile(opts);
    }));
}

function modal(opt) {
    return new promise((reslove, reject) => {
        var success = opt.success || function() {};
        var fail = opt.fail || function() {};
        opt.success = function(res) {
            success();
            if (res.confirm) {
                reslove(true);
            } else {
                reslove(false);
            }
        };
        opt.fail = function() {
            fail();
            reject();
        };
        wx.showModal(opt);
    });

}

function _alert(opt, title = "提示") {
    var content;
    if (typeof opt == "string") {
        opt = {
            title,
            content: opt
        };
    }
    opt.showCancel = false;
    return modal(opt);
}

function _confirm(opt, title = "提示") {

    var content;
    if (typeof opt == "string") {
        opt = {
            title,
            content: opt
        };
    }

    return modal(opt);
}

function decodeHtml(s) {
    var HTML_DECODE = {
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&nbsp;": " ",
        "&quot;": "\"",
        "©": "",
        "<br>": "\n",
    };
    var REGX_HTML_DECODE = /&\w+;|&#(\d+);|<\w+>/g;

    s = (s !== undefined) ? s : "";
    return (typeof s != "string") ? s : s.replace(REGX_HTML_DECODE, function($0, $1) {
        var c = HTML_DECODE[$0];
        if (c === undefined) {
            if (!isNaN($1)) {
                c = String.fromCharCode(($1 == 160) ? 32 : $1);
            } else {
                c = $0;
            }
        }
        return c;
    });
}

function param(obj) {
    var key, val,
        arr = [];
    for (key in obj) {

        val = obj[key];
        arr[arr.length] = key + "=" + val;

    }
    return arr.join("&");
}


module.exports = {
    formatTime,
    getUserInfo,
    request,
    uploadFiles,
    uploadFile,
    param,
    loading,
    decodeHtml,
    hideLoading,
    payment,
    alert: _alert,
    ctDate: ctDate,
    confirm: _confirm,
    getOtherInfo,
    secondToMinute
};
