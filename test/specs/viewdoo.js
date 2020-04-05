import viewdoo from '../../src/viewdoo';

describe('html', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    const neutralDOM = document.createElement('div');
    document.body.appendChild(neutralDOM);

    function compactHTML(html) {
        return html.replace(/\s{2,}/g, '');
    }

    function expectHTML(element, html) {
        expect(compactHTML(element.innerHTML)).to.equal(compactHTML(html));
    }

    function getCSSAttr(element) {
        const attrs = element.attributes;
        for(let i = 0; i < attrs.length; i++) {
            if (attrs[i].name.startsWith('viewdoo')) {
                return attrs[i].name;
            }
        }
        return null;
    }

    beforeEach(() => {
        neutralDOM.innerHTML = `
            <div class="foo">
                <span bar>
                    <em></em>
                </span>
            </div>
        `;
    });

    afterEach(() => {
        root.innerHTML = '';
    });

    after(() => {
        document.body.removeChild(root);
        document.body.removeChild(neutralDOM);
    });

    it('should render a view', () => {
        const view = viewdoo(`
            <div class="foo"></div>
        `);

        expect(view).to.be.a('function');

        view(root);

        expectHTML(root, `
            <div class="foo"></div>
        `);
    });

    it('should render a view with multiple root elements', () => {
        const view = viewdoo(`
            <div></div>
            <span></span>
            <section></section>
        `);

        view(root);

        expectHTML(root, `
            <div></div>
            <span></span>
            <section></section>
        `);
    });

    it('should render a view with state', () => {
        const view = viewdoo(`
            <div class="{{foo}}">{{bar}}</div>
        `);

        view(root, {
            foo: 'abc',
            bar: 123
        });

        expectHTML(root, `
            <div class="abc">123</div>
        `);
    });

    it('should return a state object that automatically updates the view when changing properties', () => {
        const view = viewdoo(`
            <div class="{{foo}}">{{bar}}</div>
        `);

        const state = view(root, {
            foo: 'abc',
            bar: 123
        });

        expectHTML(root, `
            <div class="abc">123</div>
        `);

        state.foo = 'xyz';

        expectHTML(root, `
            <div class="xyz">123</div>
        `);

        state.bar = 789;

        expectHTML(root, `
            <div class="xyz">789</div>
        `);
    });

    it('should update a view with multiple root elements', () => {
        const view = viewdoo(`
            <div>{{foo}}</div>
            <span>{{bar}}</span>
            <section>{{baz}}</section>
        `);

        const state = view(root, {
            foo: 5,
            bar: 15,
            baz: 30
        });

        expectHTML(root, `
            <div>5</div>
            <span>15</span>
            <section>30</section>
        `);
    });

    it('should support expressions', () => {
        const view = viewdoo(`
            <div>{{foo + bar}}</div>
        `);

        const state = view(root, {
            foo: 10,
            bar: 20
        });

        expectHTML(root, `
            <div>30</div>
        `);

        state.foo = 100;

        expectHTML(root, `
            <div>120</div>
        `);

        state.bar = 200;

        expectHTML(root, `
            <div>300</div>
        `);
    });

    it('should support loops', () => {
        const view = viewdoo(`
            <ul>
                {{each items as item, i}}
                    <li>{{i}}: {{item}}</li>
                {{/each}}
            </ul>
        `);

        const state = view(root, {
            items: ['foo', 'bar', 'baz', 'qux']
        });

        expectHTML(root, `
            <ul>
                <li>0: foo</li>
                <li>1: bar</li>
                <li>2: baz</li>
                <li>3: qux</li>
            </ul>
        `);

        state.items = [10, 20, 30, 40, 50];

        expectHTML(root, `
            <ul>
                <li>0: 10</li>
                <li>1: 20</li>
                <li>2: 30</li>
                <li>3: 40</li>
                <li>4: 50</li>
            </ul>
        `);
    });

    it('should support conditionals', () => {
        const view = viewdoo(`
            {{if foo === 1}}
                <div>a</div>
            {{else if foo === 2}}
                <div>b</div>
            {{else}}
                <div>c</div>
            {{/if}}
        `);

        const state = view(root, {
            foo: 1
        });

        expectHTML(root, `
            <div>a</div>
        `);

        state.foo = 2;

        expectHTML(root, `
            <div>b</div>
        `);

        state.foo = 3;

        expectHTML(root, `
            <div>c</div>
        `);
    });

    it('should support scoped styles', () => {
        const view = viewdoo(`
            <style>
                .foo {
                    padding: 3px;
                }

                [bar] {
                    padding: 7px;
                }

                :not(div):not(span) {
                    padding: 16px;
                }
            </style>
    
            <div class="foo">
                <span bar>
                    <em></em>
                </span>
            </div>
        `);

        view(root);

        expect(window.getComputedStyle(root.querySelector('div')).getPropertyValue('padding')).to.equal('3px');
        expect(window.getComputedStyle(root.querySelector('span')).getPropertyValue('padding')).to.equal('7px');
        expect(window.getComputedStyle(root.querySelector('em')).getPropertyValue('padding')).to.equal('16px');

        expect(window.getComputedStyle(neutralDOM.querySelector('div')).getPropertyValue('padding')).to.equal('0px');
        expect(window.getComputedStyle(neutralDOM.querySelector('span')).getPropertyValue('padding')).to.equal('0px');
        expect(window.getComputedStyle(neutralDOM.querySelector('em')).getPropertyValue('padding')).to.equal('0px');
    });

    it('should maintain scoped styles after updates', () => {
        const view = viewdoo(`
            <style>
                .foo {
                    padding: 8px;
                }

                [bar] {
                    padding: 11px;
                }

                :not(div):not(span) {
                    padding: 2px;
                }
            </style>

            <div class="foo">
                <span bar>
                    <em>{{count}}</em>
                </span>
            </div>
        `);

        const state = view(root, {
            count: 0
        });

        let viewEm = root.querySelector('em');
        expectHTML(viewEm, '0');
        expect(window.getComputedStyle(root.querySelector('div')).getPropertyValue('padding')).to.equal('8px');
        expect(window.getComputedStyle(root.querySelector('span')).getPropertyValue('padding')).to.equal('11px');
        expect(window.getComputedStyle(viewEm).getPropertyValue('padding')).to.equal('2px');

        expect(window.getComputedStyle(neutralDOM.querySelector('div')).getPropertyValue('padding')).to.equal('0px');
        expect(window.getComputedStyle(neutralDOM.querySelector('span')).getPropertyValue('padding')).to.equal('0px');
        expect(window.getComputedStyle(neutralDOM.querySelector('em')).getPropertyValue('padding')).to.equal('0px');

        state.count++;
        viewEm = root.querySelector('em');
        expectHTML(viewEm, '1');
        expect(window.getComputedStyle(root.querySelector('div')).getPropertyValue('padding')).to.equal('8px');
        expect(window.getComputedStyle(root.querySelector('span')).getPropertyValue('padding')).to.equal('11px');
        expect(window.getComputedStyle(viewEm).getPropertyValue('padding')).to.equal('2px');

        expect(window.getComputedStyle(neutralDOM.querySelector('div')).getPropertyValue('padding')).to.equal('0px');
        expect(window.getComputedStyle(neutralDOM.querySelector('span')).getPropertyValue('padding')).to.equal('0px');
        expect(window.getComputedStyle(neutralDOM.querySelector('em')).getPropertyValue('padding')).to.equal('0px');
    });

    it('should create one stylesheet per view', () => {
        const view = viewdoo(`
            <style>
                div {
                    padding: 5px;
                }
            </style>
    
            <div></div>
        `);

        const styleCount = document.querySelectorAll('style').length;

        const element1 = document.createElement('div');
        view(element1);

        const element2 = document.createElement('div');
        view(element2);

        const id1 = getCSSAttr(element1.querySelector('div'));
        const id2 = getCSSAttr(element2.querySelector('div'));
        expect(id1).to.not.equal(null);
        expect(id2).to.not.equal(null);
        expect(id1).to.equal(id2);

        const styles = document.querySelectorAll('style');
        expect(styles.length).to.equal(styleCount + 1);
        const lastStyle = styles[styles.length - 1];
        const styleID = getCSSAttr(lastStyle);
        expect(styleID).to.equal(id1);
        expect(styleID).to.equal(id2);
    });

    it('should render a view with script variables', () => {
        const view = viewdoo(`
            <script>
                const baz = 3;
            </script>

            <div class="container">
                <p>{{foo}} {{bar}} {{baz}}</p>
            </div>
        `);

        const state = view(root, {
            foo: 1,
            bar: 2
        });

        expectHTML(root, `
            <div class="container">
                <p>1 2 3</p>
            </div>
        `);

        expect(state).to.have.property('foo', 1);
        expect(state).to.have.property('bar', 2);
    });

    it('should automatically update a view when a state variable changes', () => {
        const view = viewdoo(`
            <script>
                increment = () => count++;
            </script>

            <div>{{count}}</div>
        `);

        const state = view(root, {
            count: 0,
            increment: null
        });

        expectHTML(root, '<div>0</div>');
        expect(state).to.have.property('count', 0);

        state.increment();
        expectHTML(root, '<div>1</div>');
        expect(state).to.have.property('count', 1);

        state.increment();
        expectHTML(root, '<div>2</div>');
        expect(state).to.have.property('count', 2);
    });

    it('should support async updates', (done) => {
        const view = viewdoo(`
            <script>
                setTimeout(() => count++, 100);
            </script>
    
            <div>{{count}}</div>
        `);
    
        const state = view(root, {
            count: 0,
            increment: null
        });
    
        expectHTML(root, '<div>0</div>');
        expect(state).to.have.property('count', 0);
    
        setTimeout(() => {
            expectHTML(root, '<div>1</div>');
            expect(state).to.have.property('count', 1);
            done();
        }, 200);
    });

    it('should support multiple instances of the same view', () => {
        const view = viewdoo(`
            <style>
                div {
                    padding: 4px;
                }
            </style>

            <script>
                increment = () => count++;
            </script>

            <div>{{count}}</div>
        `);
    
        const element1 = document.createElement('div');
        document.body.appendChild(element1);
        const state1 = view(element1, {
            count: 3,
            increment: null
        });
        expect(state1).to.have.property('count', 3);
        let view1Div = element1.querySelector('div');
        expectHTML(view1Div, '3');
        expect(window.getComputedStyle(view1Div).getPropertyValue('padding')).to.equal('4px');
    
        const element2 = document.createElement('div');
        document.body.appendChild(element2);
        const state2 = view(element2, {
            count: 7,
            increment: null
        });
        expect(state2).to.have.property('count', 7);
        let view2Div = element2.querySelector('div');
        expectHTML(view2Div, '7');
        expect(window.getComputedStyle(view2Div).getPropertyValue('padding')).to.equal('4px');

        const element3 = document.createElement('div');
        document.body.appendChild(element3);
        const state3 = view(element3, {
            count: 20,
            increment: null
        });
        expect(state3).to.have.property('count', 20);
        let view3Div = element3.querySelector('div');
        expectHTML(view3Div, '20');
        expect(window.getComputedStyle(view3Div).getPropertyValue('padding')).to.equal('4px');

        state1.increment();
        expect(state1).to.have.property('count', 4);
        view1Div = element1.querySelector('div');
        expectHTML(view1Div, '4');
        expect(window.getComputedStyle(view1Div).getPropertyValue('padding')).to.equal('4px');
        expect(state2).to.have.property('count', 7);
        expectHTML(element2.querySelector('div'), '7');
        expect(state3).to.have.property('count', 20);
        expectHTML(element3.querySelector('div'), '20');

        state2.increment();
        expect(state1).to.have.property('count', 4);
        expectHTML(element1.querySelector('div'), '4');
        expect(state2).to.have.property('count', 8);
        view2Div = element2.querySelector('div');
        expectHTML(view2Div, '8');
        expect(window.getComputedStyle(view2Div).getPropertyValue('padding')).to.equal('4px');
        expect(state3).to.have.property('count', 20);
        expectHTML(element3.querySelector('div'), '20');

        state3.increment();
        expect(state1).to.have.property('count', 4);
        expectHTML(element1.querySelector('div'), '4');
        expect(state2).to.have.property('count', 8);
        expectHTML(element2.querySelector('div'), '8');
        expect(state3).to.have.property('count', 21);
        view3Div = element3.querySelector('div');
        expectHTML(view3Div, '21');
        expect(window.getComputedStyle(view3Div).getPropertyValue('padding')).to.equal('4px');

        document.body.removeChild(element1);
        document.body.removeChild(element2);
        document.body.removeChild(element3);
    });
});
