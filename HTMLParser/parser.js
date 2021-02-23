const void_elements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']

const exeptions = ['svg']

function parse(text, raw=true) {
    text = text.trim()
    let document = {
        //links: {},
        //styles: {},
        //scripts: {},
        //metas: {},
        content: {},
        raw: text
    }
    
    let index = 0
    if(/^<!doctype/i.test(text)) {
        let match = text.match(/^<!doctype\s*(?<name>\w+)\s*(?<extra>[^>]+)?\s*>/i)
        index += match[0].length
        document.doctype = {}
        document.doctype.raw = match[0]
        document.doctype.name = match.groups.name
        document.doctype.extra = match.groups.extra || null
    } else document.doctype = null
    while(/\s/.test(text.charAt(index))) index++
    if(!text.charAt(index)) return document
    let nextTag = parseNextTag(text, index, raw)
    if(nextTag.tagName === 'html') document.html = nextTag
    else if(nextTag.tagName === 'body') document.body = nextTag
    else if(nextTag.tagName === 'head') document.head = nextTag
    else document.content = nextTag
    if(document.html) {
        document.body = document.html.children.find(x => x.tagName === 'body') || {}
        document.head = document.html.children.find(x => x.tagName === 'head') || {}
    }
    if(!raw) {
        function deleteRaw(obj) {
            try {
                return Object.entries(obj).map(x => {
                    if(x[1] !== null && typeof x[1] === 'object' && Array.isArray(x[1])) {
                        x[1] = x[1].map(y => typeof y === 'object' ? deleteRaw(y) : y)
                    } else if(x[1] !== null && typeof x[1] === 'object' && !Array.isArray(x[1])) {
                        x[1] = deleteRaw(x[1])
                    }
                    return x
                }).filter(x => x[0] !== 'raw').reduce((a,b) => (a[b[0]] = b[1], a), {})
            } catch(e) {
                console.error(e)
                return obj
            }
        }
        document = deleteRaw(document)
    }
    return document
}

function parseNextTag(text, index, raw=true, ignore_voids=false) {
    //check if it's a tag or a text
    if(text.charAt(index) === '<' && text.slice(index, index + 4) !== '<!--') {
        index++
        let nextSpc = text.indexOf(' ', index) === -1 ? Infinity : text.indexOf(' ', index)
        let nextChvr = text.indexOf('>', index)
        let nextSlsh = text.indexOf('/', index)
        let tag = {
            tagName: null,
            rawTagName: null,
            attributes: {},
            startIndex: index-1
        }
        //check if it's an empty tag
        if(nextSpc > nextChvr) {
            if(nextSlsh === nextChvr - 1) {
                tag.tagName = text.slice(index, nextSlsh).toLowerCase()
                tag.rawTagName = text.slice(index, nextSlsh)
                if(!void_elements.includes(tag.tagName) && !ignore_voids) throw new Error('Unexpected self-closing tag for a non-void element.')
                index += tag.tagName.length + 2
            } else {
                tag.tagName = text.slice(index, nextChvr).toLowerCase()
                tag.rawTagName = text.slice(index, nextChvr)
                index += tag.tagName.length + 1
            }
        } else {
            tag.tagName = text.slice(index, nextSpc).toLowerCase()
            tag.rawTagName = text.slice(index, nextSpc)
            index += tag.tagName.length
            while(/\s/.test(text.charAt(index))) index++
            
            let end = '>'
            let stringOpnd = false
            
            //get attributes
            while(text.charAt(index) !== end && !stringOpnd) {
                if(text.charAt(index) === '/') {
                    index++
                    continue
                }
                let attrName = ''
                let attrEnd
                let attrValue = ''
                
                while(!/\s|=/.test(text.charAt(index))) {
                    attrName += text.charAt(index)
                    index++
                }
                while(/\s/.test(text.charAt(index))) index++
                if(text.charAt(index) !== '=') {
                    tag.attributes[attrName] = true
                    continue
                }
                index++
                while(/\s/.test(text.charAt(index))) index++
                
                if(text.charAt(index) === '"') {
                    attrEnd = /"/
                    index++
                    stringOpnd = true
                } else if(text.charAt(index) === "'") {
                    attrEnd = /'/
                    index ++
                    stringOpnd = true
                } else attrEnd = /\s/
                
                while(!attrEnd.test(text.charAt(index))) {
                    attrValue += text.charAt(index)
                    index++
                }
                index++
                stringOpnd = false
                tag.attributes[attrName] = attrValue
            }
            index += end.length
            
            if(tag.attributes.class) tag.classes = tag.attributes.class.split(' ')
            
            if(text.slice(index - 2, index) === '/>' && !void_elements.includes(tag.tagName) && !ignore_voids) throw new Error('Unexpected self-closing tag for a non-void element.')
        }
        if(!void_elements.includes(tag.tagName)) {
            tag.children = []
            let endTag = `</${tag.rawTagName}>`
            while(/\s/.test(text.charAt(index))) index++
            while(text.slice(index, index + endTag.length) !== endTag) {
                let parsed = parseNextTag(text, index, raw, tag.tagName === 'svg' || ignore_voids)
                index += typeof parsed === 'string' ? parsed.length : parsed.raw.length
                tag.children.push(parsed)
                while(/\s/.test(text.charAt(index))) index++
            }
            tag.endIndex = index + endTag.length
            tag.raw = text.slice(tag.startIndex, tag.endIndex)
        } else {
            tag.endIndex = index
            tag.raw = text.slice(tag.startIndex, tag.endIndex)
        }
        return tag
       
    
    
    } else if(text.slice(index, index + 4) === '<!--') {
        let end = text.indexOf('-->', index)+3
        return {
            raw: text.slice(index, end),
            comment: text.slice(index + 4, end-3).trim()
        }
    } else {
        let nextChvr = text.indexOf('<', index)
        return text.slice(index, nextChvr)
    }
}

module.exports = parse