const mongoose      = require('mongoose');
const Crawldata     = require('../models/Crwaldata')
const Calculatedata = require('../models/Calculatedata');

/*
const now       = new Date();
const now_JST   = new Date(now.getFullYear(), now.getMonth(), now.getDate(),now.getHours() + 9,now.getMinutes(),now.getSeconds());
now_JST.setDate(now_JST.getDate() - 1);
console.log(now_JST);
const yesterdat_JST = new Date(now_JST.getFullYear(),now_JST.getMonth(), now_JST.getDate());
console.log(yesterdat_JST);
*/

// mongoDBへの接続の確立
mongoose.connect('mongodb://localhost:27017/minimum-dash',function(err) {
  if(err) {
    console.log(err);
  } else {
    console.log("successfully connected to mongoDB");
  }
});

/*
Crawldata.find({}, function(err, result) {
  if (err) throw err;
  console.log(result);
  mongoose.disconnect();
})
*/

const crawl_identifier_list = ['QiitaTrend','QiitaTrend']

for(let m = 0; m < crawl_identifier_list.length; m++) {
  Crawldata.find({ crawl_identifier: crawl_identifier_list[m] }).sort('-crawl_dt').limit(2).exec(function(err, result){
    if (err) throw err;
    const crawl_identifier      = result[0]["crawl_identifier"]
    let   calculate_items_list  = []
    for(let i = 0; i < result.length; i++) {
      const items_list = result[i]['items_list']
      for(let j = 0; j < items_list.length; j++) {
        let score = 101 - items_list[j]['rank_cnt']
        const url = items_list[j]['url']
        const title = items_list[j]['title']
        calculate_items_list.push({'url': url,'title':title,'score':score});
      };
    };

    let url_list = [];
    for(let i = 0; i < calculate_items_list.length; i++) {
      if (url_list.indexOf(calculate_items_list[i]['url']) == -1) {
        url_list.push(calculate_items_list[i]['url'])
      };
    };

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
        //console.log(calculate_items_list[k]['url'])
        //console.log(url_list[i])
        if (calculate_items_list[k]['url'] == url_list[i]) {
          tmp_title = calculate_items_list[k]['title']
        };
      };
      result_list.push({'popular_rank': score_cnt,'url':url_list[i],'title':tmp_title});
    };

    var test_qiita = new Calculatedata({
      calculate_dt        : new Date(),
      calculate_identifier: crawl_identifier_list[m],
      popular_items: result_list
    });
    test_qiita.save(function(err) {
      if (err) throw err;
      mongoose.disconnect();
    });
  });
};
