window.onload = function(){
    let socket = io.connect('49.234.66.103:8080'),	//与服务器进行连接
    send = document.getElementById('sendBtn'),
    leave = document.getElementById('leaveBtn'),
    command = document.getElementById('command'),
    resultWindow = document.getElementById('resultWindow'),
    myconsole = document.getElementById('myconsole'),
    clear = document.getElementById('clear'),
    cdownload = document.getElementById('download');
    
    // 效果插件
    $("#command").setTextareaCount({
        width: "30px",
        bgColor: "#3e4ef9",
        color: "#FFF",
        display: "inline-block"
    });

    // 实现TAB的输入
    document.onkeydown = function(event){
        let e = event || window.event || arguments.callee.caller.arguments[0];
        let keychar = String.fromCharCode(e.keyCode);
        // console.log(keychar);
        if(e && e.keyCode == 9){
            command.focus();
            if(command.selectionStart || command.selectionStart == 0){
                var endPos = command.selectionEnd;
                var startPos = command.selectionStart;
                var str = command.value;
                command.value = str.substr(0, startPos) + "\t" + str.substr(endPos, str.length);
            } else {
                command.value += '\t';
            }
            command.selectionStart = endPos+1;
            command.selectionEnd = endPos+1;
            return false;
        }
        return true;
    }; 

    // 下载文件
    function downloadCodeFile(code) {
        var file = new File([code], "code.vsn", { type: "text/plain;charset=utf-8" });
        saveAs(file);
    }

    cdownload.onclick = function(){
        downloadCodeFile(command.value);
    }

    // 显示结果
    resultWindow.log = function (data){
        resultWindow.value += data + "\n";
    }
    resultWindow.clear = function(){
        resultWindow.value = "结果; \n";
    }

    myconsole.log = function (data){
        myconsole.value += data + "\n";
    }
    myconsole.clear = function(){
        myconsole.value = "控制台; \n";
    }

    // 事件响应
    let usrID;  // UUID
    // 回应结构
    class RequestMessage {
        constructor(uuid, msg){
            this.uuid = uuid;
            this.msg = msg;
        }
    }

    // 发送并运行
    send.onclick = function(){
        socket.emit('sendCommand', new RequestMessage(usrID, command.value));
    }

    // 离开
    leave.onclick = function(){
        socket.emit('leave', 'leave');
        myconsole.log('socket close');
        socket.close();
    }

    // 清空
    clear.onclick = function(){
        resultWindow.log("");
        command.value = "";
    }

    // 连接事件
    socket.on('cConnect', function(msg){
        usrID = msg.obj.uuid;
        myconsole.log("uuid " + usrID);
    })

    // 接收来自服务端的信息事件cReply
    socket.on('cResult', function(msg){
        if(msg.ok){
            resultWindow.log(msg.msg);
        }else{
            resultWindow.log(errorHander(msg.obj, command.value, msg.errorType));
        }
    });

    socket.on('cConsole', function(msg){
        if(msg.ok){
            myconsole.log(msg.msg);
        }else{
            myconsole.log(errorHander(msg.obj, command.value, msg.errorType));
        }
    })

    socket.on('clearConsole', function(){
        myconsole.clear();
    })

    socket.on('clearResult', function(){
        resultWindow.clear();
    })

    socket.on('disconnect', function(){
        resultWindow.log('');
    })
}

let hook;
function errorHander(emsg, rawCommand, errortype = "parse failed"){
    try{
        let hash = emsg.hash;
        let loca = hash.loc;
        let line1 = loca.last_line;
        let col1 = loca.last_column;
        let commandline = rawCommand.split("\n");
        let msg = errortype + ": \n";
        msg += "on line: [" + line1 + "]\n";
        msg += commandline[line1 - 1];

        msg += "\n"

        let n = Number(col1);
        let flagStr = "^";
        for(let i = 0; i <= n; i++){
            flagStr = "." + flagStr;
        }
        msg += flagStr;
        return msg;
    }catch(e){
        console.log(e);
        console.log(hook);
    }
}