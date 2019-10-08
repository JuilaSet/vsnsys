// mongodb
const MongoClient = require('mongodb').MongoClient;
mongodb();

function mongodb(){
    var url = 'mongodb://localhost:27017/runoob';
    MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {
        if (err) throw err;
        console.log('数据库已创建');
        var dbase = db.db("runoob");
        dbase.createCollection('site', function (err, res) {
            if (err) throw err;
            console.log("创建集合!");
            db.close();
        });
    });
}
