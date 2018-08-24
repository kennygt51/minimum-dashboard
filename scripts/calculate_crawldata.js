/*
  前日にクローリングしたデータを集計するバッチスクリプト
*/

const mongoose      = require('mongoose');
const Crawldata     = require('../models/Crwaldata')
const Calculatedata = require('../models/Calculatedata');

// mongoDBへの接続の確立
mongoose.connect('mongodb://localhost:27017/minimum-dash',function(err) {
  if(err) {
    console.log(err);
  } else {
    console.log("successfully connected to mongoDB");
  }
});

//集計の対象となるクローリング識別子をリストで定義
const crawl_identifier_list = ['QiitaTrend','HatenaTech','GitHubTrend'];

//定義したクローリング識別リスト毎に集計処理を実行
for(let m = 0; m < crawl_identifier_list.length; m++) {
  //-crawling日時照準で24回分取得
  Crawldata.find({ crawl_identifier: crawl_identifier_list[m] }).sort('-crawl_dt').limit(24).exec(function(err, result){
    if (err) throw err;
    const crawl_identifier      = result[0]["crawl_identifier"]
    let   calculate_items_list  = []

    //レコメンドスコアを計算し、連想配列に追加
    const base_score = 21  //score計算の基準値
    for(let i = 0; i < result.length; i++) {
      const items_list = result[i]['items_list']
      for(let j = 0; j < items_list.length; j++) {
        let score   = base_score - items_list[j]['rank_cnt']
        const url   = items_list[j]['url']
        const title = items_list[j]['title']
        calculate_items_list.push({'url': url,'title':title,'score':score});
      };
    };
    /*
    console.log(calculate_items_list);
    [ { url: 'https://qiita.com/〜〜',
        title: 'AAA',
        score: 100 },
      { url: 'https://qiita.com/〜〜',
        title: 'BBB',
        score: 99 },
    */

    //取得したURLを重複排除してリストに格納
    let url_list = [];
    for(let i = 0; i < calculate_items_list.length; i++) {
      if (url_list.indexOf(calculate_items_list[i]['url']) == -1) {
        url_list.push(calculate_items_list[i]['url'])
      };
    };

    //popular_items形式に変換
    let result_list = [];
    for(let i = 0; i < url_list.length; i++) {
      let score_cnt = 0
      for(let j = 0; j < calculate_items_list.length; j++) {
        if (calculate_items_list[j]['url'] == url_list[i]) {
          score_cnt = score_cnt + calculate_items_list[j]['score'];
        };
      };
      let tmp_title;
      for(let k = 0; k < calculate_items_list.length; k++) {
        if (calculate_items_list[k]['url'] == url_list[i]) {
          tmp_title = calculate_items_list[k]['title']
        };
      };
      result_list.push({'popular_rank': score_cnt,'url':url_list[i],'title':tmp_title});
    };
    //Popular_rankで降順ソート
    result_list.sort(function (a,b) {
      return (a.popular_rank > b.popular_rank) ? -1 : 1;
    });
    /*
    console.log(result_list);
    [ { popular_rank: 20,
    url: 'https://~~',
    title: 'XXXXXXXXX' },
    ・・・
    */

    //mongoDBに集計データをインポート
    const import_data = new Calculatedata({
      calculate_dt        : new Date(),
      calculate_identifier: crawl_identifier_list[m],
      popular_items: result_list.slice(0,3)
    });
    import_data.save(function(err) {
      if (err) throw err;
      mongoose.disconnect();
    });
  });
};
