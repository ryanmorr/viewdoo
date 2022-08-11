import csscope from '@ryanmorr/csscope';
import scheduleRender from '@ryanmorr/schedule-render';

const STYLE_RE = /<style>([\s\S]*?)<\/style>/;
const SCRIPT_RE = /<script>([\s\S]*?)<\/script>/;
const NEW_LINES_RE = /(\r\n|\r|\n)/g;
const TEMPLATE_RE = /{{\s*(.+?)\s*}}/g;
const EACH_RE = /^each\s+(.*)\s+as\s+(.*)$/;
const IF_RE = /^if\s+(.*)$/;
const ELSE_IF_RE = /^else if\s+(.*)$/;
const CSS_ATTR_PREFIX = 'viewdoo-';
const template = document.createElement('template');

function uuid() {
    return Math.random().toString(36).substring(2, 9);
}

function createStyleSheet(css, attr) {
    const style = document.createElement('style');
    style.setAttribute(attr, '');
    style.innerHTML = csscope(attr, css);
    document.head.appendChild(style);
}

function parseHTML(strings, values, cssAttr) {
    const events = {};
    template.innerHTML = strings.reduce((acc, str, i) => {
        let val = values[i - 1];
        if (typeof val === 'function') {
            let id = uuid();
            events[id] = val;
            val = id;
        }
        return acc + val + str;
    });
    const frag = template.content;
    frag.querySelectorAll('*').forEach((el) => {
        const attrs = el.attributes;
        for (let i = 0; i < attrs.length; i++) {
            const name = attrs[i].name;
            const value = attrs[i].value;
            if (name.startsWith('on') && value in events) {
                el.removeAttribute(name);
                el.addEventListener(name.slice(2).toLowerCase(), events[value]);
            }
        }
        if (cssAttr) {
            el.setAttribute(cssAttr, '');
        }
    });
    return frag;
}

function parseView(source) {
    let script, style, cssAttr;
    const html = source
        .replace(STYLE_RE, (all, css) => (style = css.trim()) && '')
        .replace(SCRIPT_RE, (all, js) => (script = js.trim()) && '')
        .trim()
        .replace(NEW_LINES_RE, '\\n');
    if (style) {
        cssAttr = CSS_ATTR_PREFIX + uuid();
        createStyleSheet(style, cssAttr);
    }
    return [cssAttr, new Function(`
        with (this) {
            ${script}
            return function() {
                let _strings = [], _sequence = [], _values = [];
                _sequence.push('${
                    html.replace(TEMPLATE_RE, (all, code) => {
                        if (code.startsWith('each')) {
                            let loop = EACH_RE.exec(code);
                            if (loop) {
                                return `'); (${loop[1]}).forEach((${loop[2]}) => { _sequence.push('`;
                            }
                        } else if (code.startsWith('if')) {
                            let conditional = (IF_RE).exec(code);
                            if (conditional) {
                                return `'); if (${conditional[1]}) { _sequence.push('`;
                            }
                        } else if (code.startsWith('else if')) {
                            let conditionalElse = (ELSE_IF_RE).exec(code);
                            if (conditionalElse) {
                                return `'); } else if (${conditionalElse[1]}) { _sequence.push('`;
                            }
                        } else if (code === 'else') {
                            return `'); } else { _sequence.push('`;
                        } else if (code === '/each') {
                            return `'); }); _sequence.push('`;
                        } else if (code === '/if') {
                            return `'); } _sequence.push('`;
                        }
                        return `'); _strings.push(_sequence.join('')); _sequence = []; _values.push(${code}); _sequence.push('`;
                    })
                }');
                _strings.push(_sequence.join(''));
                return [_strings, _values];
            };
        }
    `)];
}

export default function viewdoo(source) {
    const [cssAttr, tpl] = parseView(source);
    return (props = {}) => {
        let render, elements, marker, rendering = false;
        const update = () => {
            const [strings, values] = render();
            const frag = parseHTML(strings, values, cssAttr);
            const nextElements = Array.from(frag.childNodes);
            if (!marker) {
                marker = document.createTextNode('');
                frag.appendChild(marker);
            }
            if (elements) {
                elements.forEach((node) => node.remove());
                marker.parentNode.insertBefore(frag, marker);
            }
            elements = nextElements;
            return frag;
        };
        const state = new Proxy(props, {
            set(obj, prop, nextVal) {
                const prevVal = obj[prop];
                obj[prop] = nextVal;
                if (render && !rendering && (nextVal !== prevVal || (nextVal && typeof nextVal === 'object'))) {
                    rendering = true;
                    scheduleRender(() => {
                        update();
                        rendering = false;
                    });
                }
                return true;
            }
        });
        render = tpl.call(state);
        return [update(), state];
    };
}
