const mongoose = require('mongoose');

const Calculatedata = mongoose.Schema({
  calculate_dt        : {type: Date,default: new Date()},
  calculate_identifier: String,
  popular_items: [{
    popular_rank: Number,
    url         : String,
    title       : String
  }]
});

module.exports = mongoose.model('Calculatedata',Calculatedata)
