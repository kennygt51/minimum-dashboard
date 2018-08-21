/*
  GitHubトレンドをクローリングするスクリプト
*/

require('date-utils');
const puppeteer = require('puppeteer');
const mongoose  = require('mongoose');
const Crawldata = require('../models/Crwaldata')

//リンク先アドレス作成に使用する為、GitHubのドメインを定義
const url_github_domain = 'https://github.com'
//クローリング先の識別子
const crawl_identifier = 'GitHubTrend'
//結果JSONにデータを保持させるため、クローリング実施時間を取得
const crawl_dt         = new Date();
//結果JSONを宣言（ついでにクローリング実施時間・クロール先の識別子を保持）
let result = {'crawl_dt': crawl_dt,'crawl_identifier': crawl_identifier};

// mongoDBへの接続の確立
mongoose.connect('mongodb://localhost:27017/minimum-dash',function(err) {
  if(err) {
    console.log(err);
  } else {
    console.log("successfully connected to mongoDB");
  }
});

puppeteer.launch({args: ['--no-sandbox']}).then(async browser => {
    const page = await browser.newPage();
    await page.goto(url_github_domain + '/trending');

    const page_whole      = await page.$('.repo-list');
    const page_parse_all  = await (await page_whole.getProperty('innerHTML')).jsonValue()
    const page_parse_list = page_parse_all.match(/\<h3>[\s\S]*?<\/h3>/g);

    //ランキングがパース出来ないため、取得したページの上のリストから順番にランク付け（rank_cnt）
    items_list    = [];
    let rank_cnt  = 1;

    // item_parse_listの個々のリストをパースして必要な情報を取得しitems_listに格納し、最後に結果JSONに格納
    for (r in page_parse_list) {
      const item_dict       = {};
      item_dict["rank_cnt"] = rank_cnt
      item_dict["url"]      = url_github_domain + page_parse_list[r].match(/href=\"(.*?)\"/)[1];
      item_dict["title"]    = page_parse_list[r].match(/<span .*?>(.*?)<\/span>/)[1] + page_parse_list[r].match(/<\/span>(.*?)\n?<\/a>/)[1];
      items_list.push(item_dict);
      rank_cnt++;
    };
    result['items_list'] = items_list.slice(0,9);

    const crawldata = new Crawldata(result);
    console.log(result);
    crawldata.save(function(err) {
      if (err) throw err;
      mongoose.disconnect();
    });
    browser.close();
});
