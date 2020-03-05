import viewdoo from '../../src/viewdoo';

describe('viewdoo', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    afterEach(() => {
        root.innerHTML = '';
        root._prevVNode = null;
    });

    after(() => {
        document.body.removeChild(root);
    });

    function compactHTML(html) {
        return html.replace(/\s{2,}/g, '');
    }

    function expectHTML(element, html) {
        expect(compactHTML(element.innerHTML)).to.equal(compactHTML(html));
    }

    it('should render a view', () => {
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

    it('should automatically update a view when the state changes', () => {
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
});
