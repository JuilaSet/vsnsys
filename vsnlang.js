const Mongo = require("./mongodb").Mongo;

function getData(data, defaultData){
    return (data == undefined ? defaultData : data);
}

function isEmpty(obj){
	return Object.keys(obj).length == 0;
}

// 服务端回应格式
class ResponseMessage {
    constructor(option){
        this.ok = getData(option.ok, true);
        this.msg = getData(JSON.stringify(option.msg), "");
        this.obj = getData(option.obj, {});
        this.errorType = getData(option.errorType, {});
    }
}

function createVsnFunction(handler){
	return function(args){
		if(args instanceof Array){
			for(let m of args){
				handler(m);
			}
		}else{
			handler(args);
		}
		return args;
	}
}

class Tree{
	constructor(key, value){
        this.key = key;
        this.value = value;
        this.subNode = {};
	}

	addSubNode(node){
		this.subNode[node.key] = node;
		return this;
	}

	getSub(key){
		return this.subNode[key];
	}

	getValue(key){
		return this.value;
	}
}

// Session对象: (以'_'开头为私有方法)
class Vsn {
	constructor(option){
		this.socket = getData(option.socket, null);
		this.UUID = getData(option.UUID, "0");
		this.db = getData(option.db, null);
		this.treeRoot = new Tree("_root_", undefined);
		this.resultList = [];
	}

	_init(){
		// skip
		this.resultList = [];
	}

	_addRootNode(node){
		this.treeRoot.addSubNode(node);
	}

	_flushResult(){
		let socket = this.socket;
		if(socket){
			for(let r of this.resultList){
				socket.emit('cResult', r);
			}
		}
	}

	getNode(key){
		let obj = this.treeRoot.getSub(key);
		return obj;
	}

	value(nodes){
		if(nodes){
			if(nodes instanceof Array){
				let arr = [];
				for(let n of nodes){
					arr.push(n.value);
				}
				return arr;
			}else{
				let node = nodes;
				if(node.subNode && isEmpty(node.subNode) && node.value)
					return node.value;
				else if(node.subNode)
					return node.subNode;
			}
		}
	}

	key(node){
        if(node){
			if(node instanceof Array){
				let arr = [];
				for(let n of node){
					arr.push(n.key);
				}
				return arr;
			}else{
				return node.key;
			}
        }
	}
	
	sum(args){
		let sum = 0;
		if(args instanceof Array){
			for(let m of args){
				sum += Number(m);
			}
		}else{
			sum += Number(args);
		}
		return sum;
	}

	console(args){
		let socket = this.socket;
		if(socket){
			return createVsnFunction(function(args){
				socket.emit('cConsole', new ResponseMessage({
					ok : true,
					msg : args
				}));
			})(args);
		}
		return args;
	}

	result(args){
		this.resultList.push(new ResponseMessage({
			ok : true,
			msg : args
		}));
		return args;
	}

	// 返回所有元素
	showCollection(name){
		let self = this;
		if(name){
			if(this.db){
				try{
					let db = this.db;
					// 返回集合中所有数据
					return db.collection(name).find({}).toArray(function(err, result) {
						if(err) throw err;
						console.log("用户: " + self.UUID, "查询集合: " + name, result);
						self.console(["show collection: " + name + " res: " + result]);
					});
				}catch(e){
					self.console(e);
				}
			}
		}
	}

	// 创建集合
	createCollection(name){
		if(name){
			if(this.db){
				try{
					let self = this;
					return this.db.createCollection(name, function (err, res) {
						if (err) throw err;
						console.log("用户: " + self.UUID, "创建集合: " + name);
						self.console("create collection: " + name);
					});
				}catch(e){
					self.console(e);
				}
			}
		}
		console.log("用户: " + this.UUID, "创建集合失败");
	}
	
	// 删除集合
	dropCollection(name){
		if(name){
			if(this.db){
				try{
					let self = this;
					return this.db.collection(name).drop(function(err, delOK) {
						if (err) throw err;
						if (delOK){
							console.log("用户: " + self.UUID, "删除集合: " + name);
							self.console("drop collection: " + name);
						}
					});
				}catch(e){
					self.console(e);
				}
			}
		}
		console.log("用户: " + this.UUID, "删除集合失败");
	}

	clear(){
		if(this.socket){
			this.socket.emit('clearConsole', null)
		}
		return null;
	}
}

exports.Vsn = Vsn;
exports.ResponseMessage = ResponseMessage;
