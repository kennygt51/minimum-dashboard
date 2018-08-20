var mongoose = require('mongoose');

var Crawldata = mongoose.Schema({
  crawl_dt: {type: Date,default: new Date()},
  crawl_identifier: String,
  items_list: [{
    rank_cnt: Number,
    url     : String,
    title   : String
  }]
});

module.exports = mongoose.model('Crawldata',Crawldata)
