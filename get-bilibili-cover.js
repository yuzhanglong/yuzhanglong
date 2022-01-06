/*
 * File: cover.js
 * Description: 获取b站封面配图
 * Created: 2021-2-9 13:14:38
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */

const axios = require('axios')

const getData = async (id) => {
  const url = 'https://www.bilibili.com/video/' + id
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.146 Safari/537.36'
  }
  const res = await axios.get(
    url, {
      headers: headers
    }
  )
  const text = res.data
  const tmp = text.split(/itemprop="image" content="/)[1]
  const endIndex = tmp.search('">')
  return tmp.slice(0, endIndex)
}

getData('BV1cp4y1p74j')
  .then(res => {
    console.log(res)
  })
