// jison
var fs = require("fs");
var jison = require("jison");

function bnfExport(filename){
    var bnf = fs.readFileSync("./jison/" + filename + ".jison", "utf8");
    var obj = new jison.Parser(bnf);
    obj.require = function(name){
        this.yy = require(name);
    }
    exports[filename] = obj;
}

bnfExport("calculator");
bnfExport("basic");
bnfExport("vslang");