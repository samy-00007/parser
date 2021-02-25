class Document {
    constructor(obj) {
        this.documentElement = obj.html || null
        this.body = obj.body || null
        this.head = obj.head || null
        this.doctype = obj.doctype || { raw: '<!doctype html>', name: 'html', extra: null }
        if(!this.body) this.body =  {
            tagName: 'body',
            rawTagName: 'body',
            attributes: {},
            children: Object.keys(obj.content) ? [obj.content] : [],
            raw: '<body></body>'
        }
        if(!this.head) this.head =  {
            tagName: 'head',
            rawTagName: 'head',
            attributes: {},
            children: [],
            raw: '<head></head>'
        }
        if(!this.documentElement) this.documentElement =  {
            tagName: 'html',
            rawTagName: 'html',
            attributes: {},
            children: [this.head, this.body],
            raw: '<html></html>'
        }
        
        Object.defineProperty(this, 'allElems', {
            value: [this.documentElement],
            enumerable: false
        })
        let pushChildren = obj => {
            if(!obj.children) return 
            this.allElems.push(...obj.children.filter(x => typeof x === 'object'))
            obj.children.filter(x => typeof x === 'object').forEach(pushChildren)
        }
        pushChildren(this.documentElement)
    }
    
    getElementsByTagName(name) {
        return this.allElems.filter(x => x.tagName === name)
    }
    
    getElementsByClassName(name) {
        name = name.split(' ')
        return this.allElems.filter(x => x.classes && name.every(y => x.classes.includes(y)))
    }
    
    getElementById(id) {
        let res = {}
        function findRecursive(obj, val) {
            if(res.value) return
            if(obj.attributes.id === id) {
                val.value = obj
                return
            }
            if(obj.children) obj.children.filter(x => typeof x === 'object').forEach(x => findRecursive(x, val))
        }
        findRecursive(this.documentElement, res)
        return res.value /*? new Document({content: res.value }) :*/|| null
    }
    
    innerText(element) {
        function recursive(obj) {
            if(!obj.children) return;
            let t = []
            t.push(...obj.children.map(x => typeof x === 'string' ? x : recursive(x)))
            return t
        }
        let res = recursive(element).flat(Infinity)
        return res.join('')
    }
}

module.exports = Document