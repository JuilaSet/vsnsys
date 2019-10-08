const express = require('express')
const app = express();
const server = require('http').Server(app);
var io = require('socket.io')(server);

// mongodb
const MongoClient = require('mongodb').MongoClient;
let url = 'mongodb://localhost:27017/vsndb';
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    console.log('Success: 数据库已创建');
    var vsndb = db.db("vsndb");

    // UUID
    // var uuid = require('node-uuid');

    // 解释器
    let vsnModule = require("./vsnlang");
    const bnf = require("./bnf");
    const vslang = bnf.vslang;
    vslang.yy = vsnModule;
    vslang.yy.vsn = {};
    vslang.yy.curvsn = {};

    // WS 服务器
    io.on('connection', function (socket) {
        console.log('a user connected');
        let ResponseMessage = vsnModule.ResponseMessage;

        function cResult(data){
            socket.emit('cResult', new ResponseMessage(data));
        }

        function cclearConsole(){
            socket.emit('clearConsole', null);
        }

        function cclearResult(){
            socket.emit('clearResult', null);
            
        };

        function cConsole(msg){
            socket.emit('cConsole', new ResponseMessage(msg));
        }

        // 清空控制台
        cclearConsole();

        // 分配UUID
        let UUID = socket.id; // uuid.v4();
        socket.emit('cConnect', new ResponseMessage({
            obj : {
                uuid: UUID 
            }
        }));

        // 分配Vsn对象(Session对象)
        vslang.yy.vsn[UUID] = new vslang.yy.Vsn({
            socket: socket,
            UUID: UUID,
            db : vsndb
        });

        socket.on('sendCommand', function(msg){
            // 清空结果
            cclearResult();
            
            let data = msg.msg;
            let uuid = msg.uuid;
            // 设置为当前的用户
            vslang.yy.curvsn = vslang.yy.vsn[uuid];
            console.log("Command: ", data);
            try{
                let resObj = vslang.parse(data);
                let result = resObj.result;
                console.log("Parse result: ", resObj);
                cConsole({
                    ok : true,
                    msg : "Return: " + result,
                    obj : result
                });
                // 发生结果
                vslang.yy.curvsn._flushResult();
                // 初始化
                vslang.yy.curvsn._init();
            } catch(e) {
                console.error("Parse Failed", e)
                cConsole({
                    ok : false,
                    errorType : "synatx error",
                    msg : e,
                    obj : e
                });
            }
        });

        socket.on('disconnect', function (data) {
            console.log('a usr leave');
            socket.emit('c_leave','离开');
        });
    });

    // WEB 服务器
    app.use(express.static(__dirname + '/public'));
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/public/index.html');
    });
    server.listen(8080, function () {
        console.log(`Listening on ${server.address().port}`);
    });
});