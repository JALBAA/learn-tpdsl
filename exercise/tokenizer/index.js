/*
 * @Author: zhaoye 
 * @Date: 2018-01-30 15:46:16 
 * @Last Modified by: zhaoye
 * @Last Modified time: 2018-02-13 14:47:26
 */
const fs = require('fs')
const htmlContent = String(fs.readFileSync('./index.html'))
let nodeContentState = false
function bracketStart (buffer) {
    if (buffer == '<') return true
}
function bracketSlash (buffer) {
    if (buffer == '</') return true
}
function bracketEnd (buffer) {
    if (buffer == '>') return true
}
function name (buffer) {
    if (buffer.match(/^[a-zA-Z_0-9-]+$/)) return true
}
function nodeStart () {

}
function equalToken (buffer) {
    if (buffer == '=') return true
}
let stringBuffer = ''
let stringStartFlag = false
let singleQuoteString = false
let doubleQuoteString = false
function stringToken (buffer) {
    if (!doubleQuoteString && !singleQuoteString) {
        if (buffer == '"') {
            doubleQuoteString = true
        }
        if (buffer == "'") {
            singleQuoteString = true
        }
    }
    if ((buffer == '"' && doubleQuoteString) || (buffer == "'" && singleQuoteString)) {
        if (!stringStartFlag) {
            stringStartFlag = true
        } else {
            stringStartFlag = false
            doubleQuoteString = false
            singleQuoteString = false
        }
        return true
    }
}
function exprToken (buffer) {
    if (buffer == '=') {
        return true
    }
}
function tagCommentStart () {

}
function tagCommentEnd () {
    
}
//state优先，然后按顺序排布

// tagStart <
// tagEnd   >
// nodeEnd  </
// name     [a-zA-Z_0-9-]+
// equal    =
// string   ".*"


// 词法
// < startAngleBracket
// > endAngleBracet
// / slash
// /[a-zA-Z0-9_-]+/ word
// '' string
// "" string
// 语法
// nodeContent
//     node
//          nodeStart
//                      startBracket
//                      name
//                      nodeProperty
//                            name
//                            equal
//                            string
//                      nodeContent
//                                  node
//                                  string
//                      endBracket
//                                  
//          nodeEnd
//                  endStartBracket
//                          startBracket
//                          slash
//                  nodeName
//                  endBracket
//                  
//    content
tokens = []
let index = 0
// 向前预测一个字符
let buffer = ''
function tokenizer () {
    if (index >= htmlContent.length) {
        if (stringStartFlag) {
            if (doubleQuoteString) {
                throw new Error('expected token:" , got EOF')
            } else {
                throw new Error("expected token:' , got EOF")
            }
        }
        return
    }
    
    let nextWord
   
    while (index < htmlContent.length) {
        let word = htmlContent[index]
        let nextWord = htmlContent[index] + htmlContent[index+1]
        // string token
        if (stringToken(word) || stringStartFlag) {
            buffer += word
            if (!stringStartFlag) {
                tokens.push({
                    code: buffer,
                    name: 'string',
                })
                buffer = ''
            }
            index++
            continue
        }
        if (!stringStartFlag) {
            if (name(word)) {
                buffer += word
                if (name(nextWord)) {
                    index++
                    continue
                } else {
                    tokens.push({
                        code: buffer,
                        name: 'name'
                    })
                    buffer = ''
                }
            } else if (bracketStart(word)) {
                if (bracketSlash(nextWord)) {
                    nodeContentState = false
                    index++
                    tokens.push({
                        code: nextWord,
                        name: 'bracketSlash'
                    })
                    continue
                } else {
                    nodeContentState = true
                    tokens.push({
                        code: word,
                        name: 'bracketStart'
                    })
                    buffer =''
                }
            } else if (equalToken(word)) {
                tokens.push({
                    code: word,
                    name: 'equal',
                })
            } else if (bracketEnd(word)) {
                let end
                if (nodeContentState == true) {
                    // this is a node start tag
                    end = false
                } else {
                    // this is a node end tag
                    end = true
                }
                tokens.push({
                    code: word,
                    name: 'bracketEnd',
                    end,
                })
            }
        }

        // name
        // exprToken
        // string
        // queto
        // bracketSlash
        // bracketStart
        // bracketEnd
        index++
    }
    tokenizer()
}
tokenizer()
const result = tokens.map((item, index) => {
    if (tokens[index+1] && tokens[index+1].name == 'name' && !item.name.match(/bracket/)) {
        item.code += ' '
    }
    return item.code
}).join('')

fs.writeFileSync('result.html', new Buffer(result))