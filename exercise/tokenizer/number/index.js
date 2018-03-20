/*
 * @Author: zhaoye 
 * @Date: 2018-03-19 16:30:05 
 * @Last Modified by: zhaoye
 * @Last Modified time: 2018-03-20 20:10:21
 */
// 语法图
/*
                                                        _______________________________
 ||____________________ 0 _____________________________|__ . _________ digit __________|_____________________________________________||
     |___ - ____| |              |                                 |___________|       |                                        |
                  |____ 1-9 _____|_______________                                      |                                        |
                                    |            |                                     |___ e ___                               |
                                    |__ digit ___|                                     |___ E ___|                              |
                                                                                                 |      ___ + ___     __________|
                                                                                                 |_____|_________|___|_ digit___|
                                                                                                       |___ - ___|
*/
// BNF:
// Number           : float sience?
//                  | integer sience?
// float            : integer . digit*
// integer          : 0
//                  | '-' UnsignedInteger
//                  | UnsignedInteger
// UnsignedInteger  : [1-9] digit*
// sience           : e '+' digit+
//                  | E '+' digit+
// 

// TOKENS:
// Number
// UnsignedNumber
// sience
// integer
// float
// digit

const States = {
    digit: false,
    sience: false,
    unsignedInteger: false,
    integer: false,
    float: false,
    reset: function () {
        States.digit = false
        States.sience = false
        States.unsignedInteger = false
        States.integer = false
        States.float = false
    }
}

let Matching = false

function isDigit (str) {
    if (!str) {
        return false
    }
    if (str.match(/^[0-9]$/)) {
        return true
    }
}

function isSience (buf) {
    if (buf.getValue() == 'e' || buf.getValue() == 'E') {
        if (buf.store()) {
            if (buf.getCurChar() == '+') {
                if (buf.store()) {
                    let result = false
                    do {
                        if (!isDigit(buf.getCurChar())) {
                            buf.back()
                            break
                        } else {
                            result = true
                        }
                    } while (buf.next())
                    buf.restore()
                    buf.restore()
                    return result
                }
            }
            buf.restore()
        }
    }
    return false
}

function matchUnsignedInteger (buf) {
    if (buf.getValue().match(/^[1-9]$/)) {
        if (buf.store()) {
            do {
                if (!isDigit(buf.getCurChar())) {
                    buf.back()
                    break
                }
            } while (buf.next())
            buf.restore()
        }
        return true
    }
    return false
}

function matchInteger (buf) {
    if (buf.getValue() == '0') {
        if (buf.next()) {
            if (matchInteger(buf)) {
                return true
            } else {
                buf.back()
            }
        } else {
            return true
        }
    } else if (buf.getValue() == '-') {
        let result = false
        if (buf.store()) {
            if (matchUnsignedInteger(buf)) {
                result = true
            } else {
                result = false
            }
            buf.restore()
        }
        return result
    } else {
        return matchUnsignedInteger(buf)
    }
}


function matchFloat (buf) {
    if (matchInteger(buf)) {
        if (buf.store()) {
            if (buf.getCurChar() == '.') {
                if (buf.store()) {
                    do {
                        if (!buf.getCurChar().match(/[0-9]/)) {
                            buf.back()
                            break
                        }
                    } while(buf.next())
                    buf.restore()
                }
                buf.restore()
                return true
            } else {
                buf.unstore()
                return false
            }
        }
    } else {
        return false
    }
}

function matchNumber (buf) {
    if (matchFloat(buf)) {
        return true
    } else if (matchInteger(buf)) {
        return true
    }
}

class Token {
    constructor ({
        start,
        end,
        content,
        name,
    }) {
        this.start =  start || 0
        this.end = end || 0
        this.content = content || ''
        this.name = name || ''
    }
}

class Iter {
    constructor () {
        this._iter = 0
    }
    next () {
        this._iter++
    }
    back () {
        this._iter--
    }
    getValue () {
        return this._iter
    }
    setValue (val) {
        this._iter = val
    }
}

class Buf {
    constructor (str, iter) {
        Object.defineProperty(this, '_buf', {
            get () {
                return this._str.substring(this.start(), this.end() + 1)
            },
        })
        this._iter = iter
        this._str = str
        this._reserves = []
        this._start = this.iter()
        this.__buf = null
        this.__start = -1
        this._startStack = []
    }
    store () {
        if (this.next()) {
            this._startStack.push(this._start)
            this._start = this.iter()
            return true
        } else {
            return false
        }
    }
    restore () {
        this._start = this._startStack[this._startStack.length - 1]
        this._startStack.pop()
    }
    unstore () {
        this._start = this._startStack[this._startStack.length - 1]
        this._startStack.pop()
        this._iter.setValue(this._start)
    }
    next () {
        this._iter.next()
        if (typeof this._str[this._iter.getValue()] == 'undefined') {
            return false
        } else {
            return true
        }
    }
    back () {
        this._iter.back()
        return true
    }
    getCurChar () {
        return this._buf[this._buf.length - 1]
    }
    getValue () {
        return this._buf
    }
    iter () {
        return this._iter.getValue()
    }
    start () {
        return this._start
    }
    end () {
        return this.iter()
    }
    eat () {
        this._iter.next()
        this._start = this.iter()
        this._end = this.iter()
        return this.iter()
    }
}
const tokens = []
function tokenize (str) {
    const iter = new Iter
    let buf = new Buf(str, iter)
    let i = 0
    while (i < str.length) {
        if (matchNumber(buf)) {
            tokens.push(new Token({
                start: buf.start(),
                end: buf.end(),
                content: buf.getValue(),
                name: 'Number',
            }))
        } else if (isSience(buf)) {
            tokens.push(new Token({
                start: buf.start(),
                end: buf.end(),
                content: buf.getValue(),
                name: 'Sience',
            }))
        } else if (buf.getValue() == '{') {
            tokens.push(new Token({
                start: buf.start(),
                end: buf.end(),
                content: buf.getValue(),
                name: '{'
            }))
        } else if (buf.getValue() == '}') {
            tokens.push(new Token({
                start: buf.start(),
                end: buf.end(),
                content: buf.getValue(),
                name: '}'
            }))
        } else if (buf.getValue() == ':') {
            tokens.push(new Token({
                start: buf.start(),
                end: buf.end(),
                content: buf.getValue(),
                name: ':'
            }))
        }
        i = buf.eat()
        console.log(i)
    }
}

tokenize('{"E+123":-1.23f}')


console.log(tokens)




// buffer
// 标记start 和 end
// 内置一个栈
// 用来实现一个栈状态机
// 通过递归
// 匹配到一个规则，压栈一次，进入一个新状态
// 下一个规则匹配到，则继续
// 匹配到底之后，按顺序弹出栈
// 相当于，回到上一个状态
// 匹配链条中，如果出现匹配失败
// 中断匹配，弹出所有栈
// 重置栈状态机到初始态

// 有限状态机呢？