# viewdoo

[![Version Badge][version-image]][project-url]
[![License][license-image]][license-url]
[![Build Status][build-image]][build-url]

> A crude Svelte-inspired UI library just because

## Install

Download the [CJS](https://github.com/ryanmorr/viewdoo/raw/master/dist/viewdoo.cjs.js), [ESM](https://github.com/ryanmorr/viewdoo/raw/master/dist/viewdoo.esm.js), [UMD](https://github.com/ryanmorr/viewdoo/raw/master/dist/viewdoo.umd.js) versions or install via NPM:

```sh
npm install @ryanmorr/viewdoo
```

## Usage

A viewdoo component features similar composition and functionality to a Svelte component; encapsulating scoped styles, reactive scripting, and HTML templating to form reusable, self-contained views:

```javascript
import viewdoo from '@ryanmorr/viewdoo';

const Counter = viewdoo(`
    <style>
        .counter {
            padding: 1em;
            border: 1px solid black;
        }
    </style>

    <script>
        this.count = 0;
                
        function increment() {
            count += 1;
        }
    </script>

    <div class="counter">
        <p>Count: {{count}}</p>
        <button onclick={{increment}}>Increment</button>
    </div>
`);
```

Components are defined by providing the source as a string consisting of HTML markup with optional style and script tags. The script tag contains just regular JavaScript responsible for managing the state and behavior of a component instance in an isolated context. Any variables defined within the script are available to the template:

```javascript
const HelloWorld = viewdoo(`
    <script>
        const message = 'World';
    </script>

    <h1>Hello {{message}}</h1>
`);
```

A state variable can be defined by assigning properties to `this` within the script. These variables are reactive by nature, meaning they will automatically trigger an update of the component when the value is changed:

```javascript
const Clock = viewdoo(`
    <script>
        const getTime = () => new Date().toLocaleTimeString();

        this.time = getTime();
        
        setInterval(() => (time = getTime()), 1000);
    </script>

    <div>Time: {{time}}</div>
`);
```

The HTML structure is formulated using mustache-style templating that supports simple value interpolation, expressions, loops, and if statements:

```javascript
const Users = viewdoo(`
    <script>
        set({
            users: [
                {name: 'Joe', isLoggedIn: true},
                {name: 'John', isLoggedIn: false},
                {name: 'Jane', isLoggedIn: true},
                {name: 'Jim', isLoggedIn: true},
                {name: 'Jen', isLoggedIn: false}
            ]
        });
    </script>

    <ul>
        {{each users as {name, isLoggedIn}, i}}
            {{if isLoggedIn}}
                <li class="logged-in">{{i + 1}}: {{name}}</li>
            {{else}}
                <li class="logged-out">{{i + 1}}: {{name}}</li>
            {{/if}}
        {{/each}}
    </ul>
`);
```

Including a style tag allows you to declare CSS styles that are automatically scoped to the component, supporting all CSS selectors and media queries:

```javascript
const Foo = viewdoo(`
    <style>
        .foo {
            background-color: red;
        }

        @media screen and (max-width: 600px) {
            .foo {
                background-color: blue;
            }
        }
    </style>

    <div class="foo"></div>
`);
```

The source string of the component is compiled and returns a constructor function for creating instances. You can than create instances of the component with an optional initial state, the properties of which will become reactive state variables within the inner script of the component. It returns an array with the rendered component inside a document fragment at the first index and an external state object at the second index. The properties of this external state object and the internal reactive state variables of the same name will always remain in sync with one another because they are in fact one and the same:

```javascript
// Create an instance of a component
const [fragment, state] = Component({
    foo: 1,
    bar: 2,
    baz: 3
});

// Mount the component instance to the DOM
document.body.appendChild(fragment);

// Changing the component instance state externally will trigger an update
state.foo = 20;
```

## License

This project is dedicated to the public domain as described by the [Unlicense](http://unlicense.org/).

[project-url]: https://github.com/ryanmorr/viewdoo
[version-image]: https://img.shields.io/github/package-json/v/ryanmorr/viewdoo?color=blue&style=flat-square
[build-url]: https://travis-ci.com/github/ryanmorr/viewdoo
[build-image]: https://img.shields.io/travis/com/ryanmorr/viewdoo?style=flat-square
[license-image]: https://img.shields.io/github/license/ryanmorr/viewdoo?color=blue&style=flat-square
[license-url]: UNLICENSE