const {getTrendingByMoreLanguage} = require("@attachments/github-trending");
const axios = require("axios");
const core = require('@actions/core')

const runApp = async () => {
  const trending = await getTrendingByMoreLanguage(['javascript', 'java', 'typescript'], {
    spokenLanguage: 'zh',
    period: 'week',
  });

  const feData = [].concat(trending['java'].slice(0, 10)).concat(trending['javascript'].slice(0, 5)).concat(trending['typescript'].slice(0, 5));

  const trendingDataPerLanguage = feData.map((item) => {
    return [
      {
        "tag": "div",
        "text": {
          "content": `**[${item.name}](${item.href}) ⭐ ${item.stars}**\n\n${item.description}\n\n使用语言：**${item.language}**`,
          "tag": "lark_md"
        }
      },
      {
        "tag": "hr"
      }
    ]
  });

  const res = await axios.post(`${core.getInput('robotHooksUrl')}`, {
    "msg_type": "interactive",
    card: {
      "config": {
        "wide_screen_mode": true
      },
      "elements": trendingDataPerLanguage.reduce((prev, curr) => {
        return prev.concat(curr);
      }, []),
      "header": {
        "template": "blue",
        "title": {
          "content": "🎉 今日 GitHub Trending, 每天上午 9:00 更新 🎉",
          "tag": "plain_text"
        }
      }
    }
  })
  console.log(res.data);
}

runApp().catch(e => {
  console.log(e);
})
