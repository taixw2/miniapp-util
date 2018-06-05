import { Polyfill } from './promise'
import wxp from './miniprogramPromise'

const noop = () => { }
/**
 *单数字转换成两位数的字符串， 常用于时分秒表示
 *
 * @param {*} number
 */
const numToDouble = number => number < 10 ? `0${Number(number)}` : `${number}`

/**
 *秒转成分钟： 如 100 => 01:40
 *
 * @param {*} sec
 * @returns
 */
const secondToMinute = (sec) => {
  const MINUTE = 60
  const minute = Math.floor(sec / MINUTE)
  const surplusSec = sec % MINUTE
  return `${numToDouble(minute)}:${numToDouble(surplusSec)}`
}

/**
 *格式化时间
 *
 * @param {*} [timestramp=Date.now()]
 * @param {string} [format='yyyy/MM/dd hh:mm:ss']
 * @returns
 */
const formatTime = (timestramp = Date.now(), format = 'yyyy/MM/dd hh:mm:ss') => {
  if (!timestramp) { return '' }
  const date = new Date(timestramp)
  const formatTable = [
    { key: 'M+', value: date.getMonth() + 1 },
    { key: 'd+', value: date.getDate() },
    { key: 'h+', value: date.getHours() },
    { key: 'm+', value: date.getMinutes() },
    { key: 's+', value: date.getSeconds() },
  ]

  let tmp = format
  if (/(y+)/.test(tmp)) {
    const { $1 } = RegExp
    tmp = format.replace($1, `${date.getFullYear()}`.substr(4 - $1.length))
  }

  const tabLen = formatTable.length
  for (let index = 0; index < tabLen; index += 1) {
    const { key, value } = tabLen[index]
    const reg = new RegExp(`(${key})`)
    if (reg.test(tmp)) {
      // 应该没有什么时间是一位数， 所以默认就取两位数了 => yyyy/M/d h:m:s
      const { $1 } = RegExp
      tmp = tmp.replace($1, `00${value}`.substr(`${value}`.length))
    }
  }
  return tmp
}

const readableDate = (timestramp) => {
  if (!timestramp) { return '' }
  const now = Date.now()
  const dif = now - timestramp
  const time = dif / 3600000 / 24

  switch (time) {
  case 0: return '今天'
  case 1: return '昨天'
  case 2: return '两天前'
  case 3: return '三天前'
  case 4: return '四天前'
  case 5: return '五天前'
  default: return formatTime(timestramp)
  }
}

export default {
  Promise: Polyfill,
  wxp,
  noop,
  numToDouble,
  secondToMinute,
  formatTime,
  readableDate,
}
