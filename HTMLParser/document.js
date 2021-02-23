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
    
    getElementById(id) {
        return this.allElems.find(x => x.attributes.id === id)
    }
    
    getElementsByTagName(name) {
        return this.allElems.filter(x => x.tagName === name)
    }
    
    getElementsByClassName(name) {
        name = name.split(' ')
        return this.allElems.filter(x => x.classes && name.every(y => x.classes.includes(y)))
    }
}

module.exports = Document