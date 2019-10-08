/* description: Parses end executes mathematical expressions. */

%{
    function isEmpty(obj){
        return Object.keys(obj).length == 0;
    }

    let vsn;
    function nodeTree(key, value){
        this.key = key;
        this.value = value;
        this.subNode = {};
    }

    nodeTree.prototype.addSubNode = function(node){
        this.subNode[node.key] = node;
        return this;
    }

    nodeTree.prototype.getSub = function(key){
        return this.subNode[key];
    }
%}

/* lexical grammar */
%lex
%%

\s+     /* skip */
\n+     /* skip */

"@"                     return '@'
"->"                    return '->'
"("                     return 'TUPLE_BEGIN'
")"                     return 'TUPLE_END'
"{"                     return 'PACK_BEGIN'
"}"                     return 'PACK_END'
"*"                     return 'NODE_HEAD'
"#"                     return 'FUNC_HEAD'
":"                     return ':'
";"                     return ';'
[0-9]+("."[0-9]+)?\b    return 'NUMBER'
"`".+"`"                return 'STRING'
[a-zA-Z0-9_\u4e00-\u9fa5]+([' ']+[a-zA-Z0-9_\u4e00-\u9fa5]+)*
                        return 'CONTEXT'
"[".+"]"                return 'CALC_BLOCK'
<<EOF>>                 return 'EOF'
','                     return ','
.+                      return 'INVALID'

/lex
%left '->'

/* operator associations and precedence */

%start expression

%% /* language grammar */

expression
    : expList EOF {
        let obj = {
            result: $1
        };
        return obj;
    }
    ;

expList
    : expList exp {
        $$ = $1 + $2;
    }
    | exp {
        $$ = $1
    }
    ;

// 结点声明 或 函数调用
exp
    : rootNode {
        yy.curvsn._addRootNode($1);
        $$ = $1;
    }
    | function {
        $$ = $1;
    }
    | nodeRef {
        $$ = $1;
    }
    ;

// 基本单元
context
    // 文字
    : CONTEXT {
        $$ = String(yytext)
    }
    // 数字
    | NUMBER {
        $$ = Number(yytext)
    }
    | STRING {
        $$ = String(yytext)
    }
    // 计算块
    | CALC_BLOCK {
        vsn = yy.curvsn;
        let str = yytext;
        str = str.slice(1, str.length - 1);
        try{
            var res = eval(str);
            $$ = (res == undefined ? " " : res);
        }catch(e){
            // 输出错误
            $$ = "[" + e + "]";
        }
    }
    ;

/*
 * 结点
 */

// key : $(valueList)
valueList
    : valueList value {
        $$ = $1.concat($2)
    }
    | value {
        $$ = [$1]
    }
    ;

// key : $(value)
value
    : context {
        $$ = $1
    }
    | tag {
        $$ = $1
    }
    ;

// $(Key : Value)
tag
    : context ':' valueList ';' {
        $$ = new nodeTree($1, $3);
    }
    ;

// * 结点头 $结点体
nodeBody
    : tag {
        $$ = $1;
    }
    // 无值tag
    | context {
        $$ = new nodeTree($context, undefined);
    }
    | context PACK_BEGIN nodeList PACK_END {
        var tree = new nodeTree($1, undefined);
        if($nodeList instanceof Array){
            var len = $nodeList.length;
            for(var i = 0; i < len; ++i){
                tree.addSubNode($nodeList[i]);
            }
        }
        else{
            tree.addSubNode($nodeList);
        }
        $$ = tree;
    }
    ;

// 结点列表
nodeList
    : node nodeList {
        $$ = [$1].concat($2);
    }
    | node {
        $$ = $1;
    }
    ;

// $(* 结点头: 结点体)
node
    : NODE_HEAD nodeBody {
        $$ = $2;
    }
    ;

rootNode
    : NODE_HEAD nodeBody {
        $$ = $2;
    }
    ;

/* 
 * 函数
 */

// 参数列表
argList
    : arg ',' argList {
        $$ =  [$1].concat($3);
    }
    | arg {
        $$ = $1
    }
    ;

// 参数
arg
    : tag {
        $$ = $1
    }
    | function {
        $$ = $1
    }
    | context {
        $$ = $1
    }
    | nodeRef {
        $$ = $1
    }
    ;

function
    : FUNC_HEAD context ':' argList ';' {
        if($2[0] != '_' && yy.curvsn[$2]){
            $$ = yy.curvsn[$2]($4);
        }
    }
    | FUNC_HEAD context ';' {
        if($2[0] != '_' && yy.curvsn[$2]){
            $$ = yy.curvsn[$2]();
        }
    }
    ;

// 获取结点
nodeRef
    : '@' nodeRefPath {
        $$ = $nodeRefPath
    }
    ;

nodeRefPath
    :  nodeRefPath '->' context {
        if($1){
            $$ = $1.getSub($3);
        }else{
            $$ = $1
        }
    }
    | context {
        $$ = yy.curvsn.getNode($context);
    }
    ;

