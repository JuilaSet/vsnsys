// mongodb
const MongoClient = require('mongodb').MongoClient;

class Mongo {
    constructor(){
        this.testMsg = "Nothing";
    }
    testOnline(){
        return this.testMsg;
    }
    setTestMsg(msg){
        this.testMsg = msg;
    }
}

exports.Mongo = Mongo;