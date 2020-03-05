import voodoo from 'voodoo';

const SCRIPT_RE = /<script>([\s\S]*?)<\/script>/;
const NEW_LINES_RE = /(\r\n|\r|\n)/g;
const TEMPLATE_RE = /{{\s*(.+?)\s*}}/g;
const EACH_RE = /^each (.*) as (.*)$/;
const IF_RE = /^if (.*)$/;
const ELSE_IF_RE = /^else if (.*)$/;

function parseHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return document.importNode(template.content, true);
}

export default function viewdoo(source) {
    let script, html, render;
    html = source.replace(SCRIPT_RE, (all, js) => {
        script = js.trim();
        return '';
    }).trim();

    script = `
        ${script}
        __render__ = function() {
            let _strings = [], _sequence = [], _values = [];
            _sequence.push('${
                html.trim().replace(NEW_LINES_RE, '\\n').replace(TEMPLATE_RE, (all, code) => {
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
        }
    `;

    return (parent, props) => {
        props.__render__ = null;
        const exec = voodoo(script);
        const data = exec(props);
        render = data.__render__;
        const [strings, values] = render();
        const html = strings.reduce((acc, str, i) => acc + (values[i - 1]) + str);
        parent.appendChild(parseHTML(html));
    };
}
