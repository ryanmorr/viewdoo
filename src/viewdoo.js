import csscope from '@ryanmorr/csscope';
import { scheduleRender } from '@ryanmorr/schedule-render';

const STYLE_RE = /<style>([\s\S]*?)<\/style>/;
const SCRIPT_RE = /<script>([\s\S]*?)<\/script>/;
const NEW_LINES_RE = /(\r\n|\r|\n)/g;
const TEMPLATE_RE = /{{\s*(.+?)\s*}}/g;
const EACH_RE = /^each (.*) as (.*)$/;
const IF_RE = /^if (.*)$/;
const ELSE_IF_RE = /^else if (.*)$/;
const CSS_ATTR_PREFIX = 'viewdoo-';

const eventMap = {};

function uuid() {
    return Math.random().toString(36).substr(2, 9);
}

function normalize(val) {
    if (typeof val === 'function') {
        const id = uuid();
        eventMap[id] = val;
        return id;
    }
    return val;
}

function parseHTML(strings, values) {
    const html = strings.reduce((acc, str, i) => acc + normalize(values[i - 1]) + str);
    const template = document.createElement('template');
    template.innerHTML = html;
    const frag = document.importNode(template.content, true);
    Array.from(frag.querySelectorAll('*')).forEach((el) => {
        const attrs = el.attributes;
        for(let i = 0; i < attrs.length; i++) {
            const name = attrs[i].name;
            const value = attrs[i].value;
            if (name.startsWith('on') && value in eventMap) {
                el.removeAttribute(name);
                el.addEventListener(name.slice(2).toLowerCase(), eventMap[value]);
            }
        }
    });
    return frag;
}

function createStyleSheet(css, attr) {
    const style = document.createElement('style');
    style.setAttribute(attr, '');
    style.innerHTML = csscope(attr, css);
    document.head.appendChild(style);
}

function addStyleAttribute(element, attr) {
    Array.from(element.children).forEach((child) => {
        child.setAttribute(attr, '');
        addStyleAttribute(child, attr);
    });
}

function parseView(source) {
    let script, style;
    const html = source
        .replace(STYLE_RE, (all, css) => (style = css.trim()) && '')
        .replace(SCRIPT_RE, (all, js) => (script = js.trim()) && '')
        .trim()
        .replace(NEW_LINES_RE, '\\n');
    return [style, new Function(`
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
    let cssAttr;
    const [css, tpl] = parseView(source);
    if (css && !cssAttr) {
        cssAttr = CSS_ATTR_PREFIX + uuid();
        createStyleSheet(css, cssAttr);
    }
    return (props = {}) => {
        let elements, marker, rendering = false;
        const update = () => {
            const [strings, values] = render();
            const frag = parseHTML(strings, values);
            if (cssAttr) {
                addStyleAttribute(frag, cssAttr);
            }
            const nextElements = Array.from(frag.childNodes);
            if (!marker) {
                marker = document.createTextNode('');
                frag.appendChild(marker);
            }
            if (elements) {
                elements.forEach((node) => node.remove());
                marker.parentNode.insertBefore(frag, marker);
                elements = nextElements;
            } else {
                elements = nextElements;
                return frag;
            }
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
        const render = tpl.call(state);
        return [update(), state];
    };
}
