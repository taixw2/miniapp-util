import { Polyfill } from './promise'

const promiseApi = [
  // 网络
  'request', 'connectSocket', 'sendSocketMessage', 'closeSocket', 'getNetworkType',
  // 媒体
  'chooseImage', 'previewImage', 'getImageInfo', 'saveImageToPhotosAlbum', 'startRecord', 'stopRecord',
  'playVoice', 'pauseVoice', 'stopVoice', 'getBackgroundAudioPlayerState', 'playBackgroundAudio', 'seekBackgroundAudio',
  'chooseVideo', 'saveVideoToPhotosAlbum',
  // 文件
  'saveFile', 'getFileInfo', 'getSavedFileList', 'getSavedFileInfo', 'removeSavedFile', 'openDocument', 'uploadFile', 'downloadFile',
  // 存储
  'setStorage', 'getStorage', 'getStorageInfo', 'removeStorage',
  // 位置
  'getLocation', 'chooseLocation', 'openLocation',
  // 系统信息
  'getSystemInfo',
  // 加速统计
  'startAccelerometer', 'stopAccelerometer', 'startCompass',
  // 电话
  'makePhoneCall', 'addPhoneContact',
  // 二维码
  'scanCode',
  // 剪切板
  'setClipboardData', 'getClipboardData',
  // 蓝牙
  'openBluetoothAdapter', 'closeBluetoothAdapter', 'getBluetoothAdapterState', 'startBluetoothDevicesDiscovery',
  'stopBluetoothDevicesDiscovery', 'getBluetoothDevices', 'getConnectedBluetoothDevices', 'createBLEConnection',
  'closeBLEConnection', 'getBLEDeviceServices', 'getBLEDeviceCharacteristics', 'readBLECharacteristicValue',
  'writeBLECharacteristicValue', 'notifyBLECharacteristicValueChange',
  // iBeacon
  'startBeaconDiscovery', 'stopBeaconDiscovery', 'getBeacons',
  // 屏幕
  'setScreenBrightness', 'getScreenBrightness', 'setKeepScreenOn',
  // 振动
  'vibrateLong', 'vibrateShort',
  // NFC
  'getHCEState', 'startHCE', 'stopHCE', 'sendHCEMessage',
  // WIFI
  'startWifi', 'stopWifi', 'connectWifi', 'getWifiList', 'setWifiList', 'getConnectedWifi',
  // 交互
  'showToast', 'showLoading', 'showModal', 'showActionSheet',
  // 导航栏
  'setNavigationBarTitle', 'navigateTo', 'redirectTo', 'switchTab', 'reLaunch',
  // tabbar
  'setTabBarBadge', 'removeTabBarBadge', 'showTabBarRedDot', 'hideTabBarRedDot', 'setTabBarStyle', 'setTabBarItem',
  'showTabBar', 'hideTabBar', 'setTopBarText',
  // 绘图
  'canvasToTempFilePath', 'canvasGetImageData', 'canvasPutImageData',
  //  下拉刷新
  'startPullDownRefresh',
  //  登录
  'login', 'checkSession', 'authorize', 'getUserInfo',
  //  分享
  'showShareMenu', 'hideShareMenu', 'updateShareMenu', 'getShareInfo',
  // 支付
  'requestPayment',
  // 生物认证
  'checkIsSupportSoterAuthentication', 'startSoterAuthentication', 'checkIsSoterEnrolledInDevice',
  // 地址/卡卷/设置/运动数据
  'chooseAddress', 'addCard', 'openCard', 'openSetting', 'getSetting', 'getWeRunData',
  //  跳转其他小程序
  'navigateToMiniProgram', 'navigateBackMiniProgram',
  // 其他
  'getExtConfig', 'chooseInvoiceTitle', 'createWorker',
]

const wxp = {}
wx.p = {}
for (const key in wx) {
  if (promiseApi.indexOf(key) !== -1) {
    const apiPromise = options => new Polyfill((resolve, reject) => {
      wx[key]({
        ...options,
        success(res) {
          resolve(res)
        },
        fail(res) {
          reject(res)
        },
      })
    })
    wx.p[key] = apiPromise
    wxp[key] = apiPromise
  } else {
    wxp[key] = wx[key]
  }
}

export default wxp
