require('date-utils');
const FeedParser = require('feedparser');
const request = require('request'); // for fetching the feed
const mongoose = require('mongoose');
const Crawldata = require('../models/Crwaldata')

//RSS配信先URLを定義
const url_hatena_rss = 'http://b.hatena.ne.jp/hotentry/it.rss'
//クローリング先の識別子
const crawl_identifier = 'HatenaTech'
//結果JSONにデータを保持させるため、クローリング実施時間を取得
const crawl_dt         = new Date();
//結果JSONを宣言（ついでにクローリング実施時間・クロール先の識別子を保持）
let result = {'crawl_dt': crawl_dt,'crawl_identifier': crawl_identifier};
let items_list = [];

// feedparser定義
const feedparser = new FeedParser();
const options = {
  url: url_hatena_rss,
  json: true,
  headers: {
    'User-Agent': 'request'
  }
};
const req = request(options)

// mongoDBへの接続の確立
mongoose.connect('mongodb://localhost:27017/minimum-dash',function(err) {
  if(err) {
    console.log(err);
  } else {
    console.log("successfully connected to mongoDB");
  }
});

//HTTPリクエストが失敗した時にエラー出力
req.on('error', function (error) {
  console.log("http request error!");
});

//responseイベントが発生した時にconsole
req.on('response', function (res) {
  var stream = this;

  if (res.statusCode !== 200) {
    this.emit('error', new Error('Bad status code'));
  }
  else {
    stream.pipe(feedparser);
  }
});

feedparser.on('error', function (error) {
  console.log('feer parser error!');
});

feedparser.on('readable', function () {
  while (item = this.read()) {
    items_list.push ({
      'title': item.title,
      'url'  : item.link
    });
  }
});

feedparser.on('end', function () {
  items_list = items_list.slice(0,10)
  let rank_cnt = 1;
  for(let i = 0; i < items_list.length; i++) {
    items_list[i]["rank_cnt"] = rank_cnt;
    rank_cnt++;
  };
  result['items_list'] = items_list.slice(0,9)

  const crawldata = new Crawldata(result);
  console.log(result);
  crawldata.save(function(err) {
    if (err) throw err;
    mongoose.disconnect();
  });
});
