/* description: Parses end executes mathematical expressions. */

%{
    function Res(value){
        this.value = value;
    }
    Res.prototype.getValue = function(){
        return this.value;
    }
%}

/* lexical grammar */
%lex
%%

\s+     /* skip */
\n+     /* skip */

"A"     return 'A'
"B"     return 'B'
','     return ','
<<EOF>> return 'EOF'
.+      return 'INVALID'

/lex
%left '+'

/* operator associations and precedence */

%start expression

%% /* language grammar */

expression
    : explist EOF {
        let obj = {
            result: $1.getValue()
        };
        return obj;
    }
    ;

explist
    : exp explist {
        $$ = $1;
    }
    | exp {
        $$ = $1;
    }
    ;

exp
    : A B {
        $$ = new Res($A + ', ' + $B);
    }
    ;
