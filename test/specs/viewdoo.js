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

        const returnValue = view();

        expect(returnValue).to.be.an('array');

        const [element, state] = returnValue;
        expect(element.nodeType).to.equal(11);
        expect(state).to.be.a('object');
        expect(state).to.deep.equal({});

        root.appendChild(element);

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

        const [element] = view();

        root.appendChild(element);

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

        const [element] = view({
            foo: 'abc',
            bar: 123
        });

        root.appendChild(element);

        expectHTML(root, `
            <div class="abc">123</div>
        `);
    });

    it('should return a state object that automatically updates the view when changing properties', (done) => {
        const view = viewdoo(`
            <div class="{{foo}}">{{bar}}</div>
        `);

        const [element, state] = view({
            foo: 'abc',
            bar: 123
        });

        root.appendChild(element);

        expectHTML(root, `
            <div class="abc">123</div>
        `);

        state.foo = 'xyz';

        requestAnimationFrame(() => {
            expectHTML(root, `
                <div class="xyz">123</div>
            `);

            state.bar = 789;

            requestAnimationFrame(() => {
                expectHTML(root, `
                    <div class="xyz">789</div>
                `);

                done();
            });
        });
    });

    it('should update a view with multiple root elements', (done) => {
        const view = viewdoo(`
            <div>{{foo}}</div>
            <span>{{bar}}</span>
            <section>{{baz}}</section>
        `);

        const [element, state] = view({
            foo: 5,
            bar: 15,
            baz: 30
        });

        root.appendChild(element);

        expectHTML(root, `
            <div>5</div>
            <span>15</span>
            <section>30</section>
        `);

        state.foo = 'foo';
        state.bar = 'bar';
        state.baz = 'baz';

        requestAnimationFrame(() => {
            expectHTML(root, `
                <div>foo</div>
                <span>bar</span>
                <section>baz</section>
            `);

            done();
        });
    });

    it('should update a view between sibling nodes', (done) => {
        const view = viewdoo(`
            <div>{{foo}}</div>
            <span>{{bar}}</span>
            <section>{{baz}}</section>
        `);

        const [element, state] = view({
            foo: 5,
            bar: 10,
            baz: 15
        });

        const p = document.createElement('p');
        const em = document.createElement('em');
        const i = document.createElement('i');
        const text = document.createTextNode('foo');

        root.append(p, text, element, em, i);

        expectHTML(root, `
            <p></p>
            foo
            <div>5</div>
            <span>10</span>
            <section>15</section>
            <em></em>
            <i></i>
        `);

        state.foo = 'foo';
        state.bar = 'bar';
        state.baz = 'baz';

        requestAnimationFrame(() => {
            expectHTML(root, `
                <p></p>
                foo
                <div>foo</div>
                <span>bar</span>
                <section>baz</section>
                <em></em>
                <i></i>
            `);

            done();
        });
    });

    it('should support expressions', (done) => {
        const view = viewdoo(`
            <div>{{foo + bar}}</div>
        `);

        const [element, state] = view({
            foo: 10,
            bar: 20
        });

        root.appendChild(element);

        expectHTML(root, `
            <div>30</div>
        `);

        state.foo = 100;

        requestAnimationFrame(() => {
            expectHTML(root, `
                <div>120</div>
            `);

            state.bar = 200;

            requestAnimationFrame(() => {
                expectHTML(root, `
                    <div>300</div>
                `);

                done();
            });
        });  
    });

    it('should support loops', (done) => {
        const view = viewdoo(`
            <ul>
                {{each items as item, i}}
                    <li>{{i}}: {{item}}</li>
                {{/each}}
            </ul>
        `);

        const [element, state] =  view({
            items: ['foo', 'bar', 'baz', 'qux']
        });

        root.appendChild(element);

        expectHTML(root, `
            <ul>
                <li>0: foo</li>
                <li>1: bar</li>
                <li>2: baz</li>
                <li>3: qux</li>
            </ul>
        `);

        state.items = [10, 20, 30, 40, 50];

        requestAnimationFrame(() => {
            expectHTML(root, `
                <ul>
                    <li>0: 10</li>
                    <li>1: 20</li>
                    <li>2: 30</li>
                    <li>3: 40</li>
                    <li>4: 50</li>
                </ul>
            `);

            done();
        });
    });

    it('should support conditionals', (done) => {
        const view = viewdoo(`
            {{if foo === 1}}
                <div>a</div>
            {{else if foo === 2}}
                <div>b</div>
            {{else}}
                <div>c</div>
            {{/if}}
        `);

        const [element, state] = view({
            foo: 1
        });

        root.appendChild(element);

        expectHTML(root, `
            <div>a</div>
        `);

        state.foo = 2;

        requestAnimationFrame(() => {
            expectHTML(root, `
                <div>b</div>
            `);

            state.foo = 3;

            requestAnimationFrame(() => {
                expectHTML(root, `
                    <div>c</div>
                `);

                done();
            });
        });
    }); 












    it('should support event listeners', (done) => {
        const view = viewdoo(`
            <div onclick={{increment}}>{{count}}</div>
        `);

        const [element, state] = view({
            count: 0,
            increment: () => state.count++
        });

        root.appendChild(element);

        expectHTML(root, `
            <div>0</div>
        `);

        const div = root.querySelector('div');

        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
        });

        div.addEventListener('click', (e) => {
            expect(e).to.equal(event);

            requestAnimationFrame(() => {
                expectHTML(root, `
                    <div>1</div>
                `);

                done();
            });
        });

        div.dispatchEvent(event);
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

        const [element] = view();

        root.appendChild(element);

        expect(window.getComputedStyle(root.querySelector('div')).getPropertyValue('padding')).to.equal('3px');
        expect(window.getComputedStyle(root.querySelector('span')).getPropertyValue('padding')).to.equal('7px');
        expect(window.getComputedStyle(root.querySelector('em')).getPropertyValue('padding')).to.equal('16px');

        expect(window.getComputedStyle(neutralDOM.querySelector('div')).getPropertyValue('padding')).to.equal('0px');
        expect(window.getComputedStyle(neutralDOM.querySelector('span')).getPropertyValue('padding')).to.equal('0px');
        expect(window.getComputedStyle(neutralDOM.querySelector('em')).getPropertyValue('padding')).to.equal('0px');
    });

    it('should maintain scoped styles after updates', (done) => {
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

        const [element, state] = view({
            count: 0
        });

        root.appendChild(element);

        let viewEm = root.querySelector('em');
        expectHTML(viewEm, '0');
        expect(window.getComputedStyle(root.querySelector('div')).getPropertyValue('padding')).to.equal('8px');
        expect(window.getComputedStyle(root.querySelector('span')).getPropertyValue('padding')).to.equal('11px');
        expect(window.getComputedStyle(viewEm).getPropertyValue('padding')).to.equal('2px');

        expect(window.getComputedStyle(neutralDOM.querySelector('div')).getPropertyValue('padding')).to.equal('0px');
        expect(window.getComputedStyle(neutralDOM.querySelector('span')).getPropertyValue('padding')).to.equal('0px');
        expect(window.getComputedStyle(neutralDOM.querySelector('em')).getPropertyValue('padding')).to.equal('0px');

        state.count++;

        requestAnimationFrame(() => {
            viewEm = root.querySelector('em');
            expectHTML(viewEm, '1');
            expect(window.getComputedStyle(root.querySelector('div')).getPropertyValue('padding')).to.equal('8px');
            expect(window.getComputedStyle(root.querySelector('span')).getPropertyValue('padding')).to.equal('11px');
            expect(window.getComputedStyle(viewEm).getPropertyValue('padding')).to.equal('2px');

            expect(window.getComputedStyle(neutralDOM.querySelector('div')).getPropertyValue('padding')).to.equal('0px');
            expect(window.getComputedStyle(neutralDOM.querySelector('span')).getPropertyValue('padding')).to.equal('0px');
            expect(window.getComputedStyle(neutralDOM.querySelector('em')).getPropertyValue('padding')).to.equal('0px');    

            done();
        });
    });

    it('should create one stylesheet per view', () => {
        const styleCount = document.querySelectorAll('style').length;
        
        const view = viewdoo(`
            <style>
                div {
                    padding: 5px;
                }
            </style>
    
            <div></div>
        `);

        const root1 = document.createElement('div');
        const [element1] = view();
        root1.appendChild(element1);

        const root2 = document.createElement('div');
        const [element2] = view();
        root2.appendChild(element2);

        const id1 = getCSSAttr(root1.querySelector('div'));
        const id2 = getCSSAttr(root2.querySelector('div'));
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
                const foo = 1, bar = 2, baz = 3;
            </script>

            <div class="container">
                <p>{{foo}} {{bar}} {{baz}}</p>
            </div>
        `);

        const [element, state] = view();

        root.appendChild(element);

        expectHTML(root, `
            <div class="container">
                <p>1 2 3</p>
            </div>
        `);

        expect(state).to.not.have.property('foo');
        expect(state).to.not.have.property('bar');
        expect(state).to.not.have.property('baz');
    });

    it('should automatically update a view when a state variable changes', (done) => {
        const view = viewdoo(`
            <script>
                increment = () => count++;
            </script>

            <div>{{count}}</div>
        `);

        const [element, state] = view({
            count: 0,
            increment: null
        });

        root.appendChild(element);

        expectHTML(root, '<div>0</div>');
        expect(state).to.have.property('count', 0);

        state.increment();
        expect(state).to.have.property('count', 1);

        requestAnimationFrame(() => {
            expectHTML(root, '<div>1</div>');

            state.increment();
            expect(state).to.have.property('count', 2);

            requestAnimationFrame(() => {
                expectHTML(root, '<div>2</div>');

                done();
            });
        });
    });

    it('should support async updates', (done) => {
        const view = viewdoo(`
            <script>
                setTimeout(() => count++, 100);
            </script>
    
            <div>{{count}}</div>
        `);
    
        const [element, state] = view({
            count: 0,
            increment: null
        });

        root.appendChild(element);
    
        expectHTML(root, '<div>0</div>');
        expect(state).to.have.property('count', 0);
    
        setTimeout(() => {
            expectHTML(root, '<div>1</div>');
            expect(state).to.have.property('count', 1);
            done();
        }, 200);
    });

    it('should support multiple instances of the same view', (done) => {
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
    
        const root1 = document.createElement('div');
        document.body.appendChild(root1);
        const [element1, state1] = view({
            count: 3,
            increment: null
        });
        root1.appendChild(element1);
        expect(state1).to.have.property('count', 3);
        let view1Div = root1.querySelector('div');
        expectHTML(view1Div, '3');
        expect(window.getComputedStyle(view1Div).getPropertyValue('padding')).to.equal('4px');
    
        const root2 = document.createElement('div');
        document.body.appendChild(root2);
        const [element2, state2] = view({
            count: 7,
            increment: null
        });
        root2.appendChild(element2);
        expect(state2).to.have.property('count', 7);
        let view2Div = root2.querySelector('div');
        expectHTML(view2Div, '7');
        expect(window.getComputedStyle(view2Div).getPropertyValue('padding')).to.equal('4px');

        const root3 = document.createElement('div');
        document.body.appendChild(root3);
        const [element3, state3] = view({
            count: 20,
            increment: null
        });
        root3.appendChild(element3);
        expect(state3).to.have.property('count', 20);
        let view3Div = root3.querySelector('div');
        expectHTML(view3Div, '20');
        expect(window.getComputedStyle(view3Div).getPropertyValue('padding')).to.equal('4px');

        state1.increment();

        requestAnimationFrame(() => {
            expect(state1).to.have.property('count', 4);
            view1Div = root1.querySelector('div');
            expectHTML(view1Div, '4');
            expect(window.getComputedStyle(view1Div).getPropertyValue('padding')).to.equal('4px');
            expect(state2).to.have.property('count', 7);
            expectHTML(root2.querySelector('div'), '7');
            expect(state3).to.have.property('count', 20);
            expectHTML(root3.querySelector('div'), '20');

            state2.increment();

            requestAnimationFrame(() => {
                expect(state1).to.have.property('count', 4);
                expectHTML(root1.querySelector('div'), '4');
                expect(state2).to.have.property('count', 8);
                view2Div = root2.querySelector('div');
                expectHTML(view2Div, '8');
                expect(window.getComputedStyle(view2Div).getPropertyValue('padding')).to.equal('4px');
                expect(state3).to.have.property('count', 20);
                expectHTML(root3.querySelector('div'), '20');

                state3.increment();

                requestAnimationFrame(() => {
                    expect(state1).to.have.property('count', 4);
                    expectHTML(root1.querySelector('div'), '4');
                    expect(state2).to.have.property('count', 8);
                    expectHTML(root2.querySelector('div'), '8');
                    expect(state3).to.have.property('count', 21);
                    view3Div = root3.querySelector('div');
                    expectHTML(view3Div, '21');
                    expect(window.getComputedStyle(view3Div).getPropertyValue('padding')).to.equal('4px');

                    document.body.removeChild(root1);
                    document.body.removeChild(root2);
                    document.body.removeChild(root3);

                    done();
                });
            });
        });
    });
});
