"use strict"; //厳密なコーディングを開発者に求めるstrictモード
require('date-utils');
const http            = require('http'); //Node.jsの標準ライブラリであるhttpをインポート（Node.jsでHTTP通信が扱える様になる）
const express         = require('express'); //Expressをインポート
const bodyparser      = require('body-parser'); //body-parser
const path            = require('path'); //pathモジュール（絶対パス作成のために使用）
const mongoose        = require('mongoose'); //mongodbに接続するモジュール
const Calculatedata   = require('./models/Calculatedata'); //DBに接続する為のスキーマを読み込む。

const app       = express() //expressのインスタンスであるappに対して様々なミドルウェアを設定することで、Webアプリを実装していく。



// mongoDBへの接続の確立
mongoose.connect('mongodb://localhost:27017/minimum-dash',function(err) {
  if(err) {
    console.log(err);
  } else {
    console.log("successfully connected to mongoDB");
  }
});


//body-parserの設定（実際にリクエストを返すルーティングよりも前の位置で設定する）
app.use(bodyparser());

//公開ディレクトリ
app.use(express.static('node_modules/bootstrap/dist/css'));
app.use(express.static('node_modules/bootstrap/dist/js'));
app.use(express.static('node_modules/jquery/dist'));
app.use(express.static('node_modules/popper.js/dist/umd'));

app.use(express.static('public'));

// テンプレートエンジンの設定
app.set('views',path.join(__dirname,'views')); //テンプレートを入れているviewsディレクトリの絶対パスを作成する
app.set('view engine','pug');

app.get("/", function(req,res,next) {
  Calculatedata.find({}, function(err, data) {
    if(err) throw err;


    let QiitaTrend = data.filter(function(item, index){
      if (item.calculate_identifier == 'QiitaTrend') return true;
    });
    let HatenaTech = data.filter(function(item, index){
      if (item.calculate_identifier == 'HatenaTech') return true;
    });
    let GitHubTrend = data.filter(function(item, index){
      if (item.calculate_identifier == 'GitHubTrend') return true;
    });
    HatenaTech[0]['calculate_dt_format']  = HatenaTech[0]['calculate_dt'].toFormat("YYYY/MM/DD HH24時MI分");
    QiitaTrend[0]['calculate_dt_format']  = QiitaTrend[0]['calculate_dt'].toFormat("YYYY/MM/DD HH24時MI分");
    GitHubTrend[0]['calculate_dt_format'] = GitHubTrend[0]['calculate_dt'].toFormat("YYYY/MM/DD HH24時MI分");
    //投稿一覧のデータ（msgsオブジェクト）を、テンプレートエンジンに渡す
    return res.render('index',{
      QiitaTrend: QiitaTrend[0],
      HatenaTech: HatenaTech[0],
      GitHubTrend: GitHubTrend[0]
    });
  });
});

// Node.jsで定義したhttpサーバに、Expressのインスタンスであるappを設置して、ローカルホストの3000ポートに関連付けている
var server = http.createServer(app);
server.listen('3000');
