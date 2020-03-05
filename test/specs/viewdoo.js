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

        view(root, {
            foo: 1,
            bar: 2
        });

        expectHTML(root, `
            <div class="container">
                <p>1 2 3</p>
            </div>
        `);
    });
});
