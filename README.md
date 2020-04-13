# viewdoo

[![Version Badge][version-image]][project-url]
[![Build Status][build-image]][build-url]
[![License][license-image]][license-url]

> A crude Svelte-inspired UI library just because

## Install

Download the [CJS](https://github.com/ryanmorr/viewdoo/raw/master/dist/viewdoo.cjs.js), [ESM](https://github.com/ryanmorr/viewdoo/raw/master/dist/viewdoo.esm.js), [UMD](https://github.com/ryanmorr/viewdoo/raw/master/dist/viewdoo.umd.js) versions or install via NPM:

```sh
npm install @ryanmorr/viewdoo
```

## Usage

A viewdoo component features similar composition and functionality to a Svelte component; encapsulating scoped styles, reactive scripting, and HTML templating to form reusable, self-contained views.

Define a component by providing the source as a string consisting of HTML markup with optional style and script tags. The script tag contains just regular JavaScript responsible for managing the state and behavior of a component instance in an isolated context. Any variables defined within the script are available to the template. The script is exposed to only one pre-defined function called `set` that can be used to define reactive state variables that will automatically trigger an update of the component when assigned a value. The source is compiled and returns a function for creating instances:

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
        set({count: 0});
                
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

Create an instance of a component with an optional initial state, the properties of which will also become reactive state variables within the inner script of the component. It returns an array with the rendered component inside a document fragment at the first index and an external state object at the second index. The properties of this external state object and the internal reactive state variables of the same name will always remain in sync with one another because they are in fact one and the same. This means that the state of a component instance can be accessed and manipulated both internally and externally, and automatically trigger an update when the state changes:

```javascript
// Create an instance of the counter and override the initial count value
const [fragment, state] = Counter({
    count: 10
});

// Mount the component to the DOM
document.body.appendChild(fragment);

// Change the state and trigger an update
state.count = 20;
```

Styles are automatically scoped to the component, supporting all CSS selectors and at-rules, including keyframes and media queries:

```javascript
const Component = viewdoo(`
    <style>
        .foo {
            background-color: red;
            animation-name: slide-in 1s ease-in;
        }

        @keyframes slide-in {
            from {
                transform: translateX(0%);
            }
            to {
                transform: translateX(100%);
            }
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

## License

This project is dedicated to the public domain as described by the [Unlicense](http://unlicense.org/).

[project-url]: https://github.com/ryanmorr/viewdoo
[version-image]: https://badge.fury.io/gh/ryanmorr%2Fviewdoo.svg
[build-url]: https://travis-ci.org/ryanmorr/viewdoo
[build-image]: https://travis-ci.org/ryanmorr/viewdoo.svg
[license-image]: https://img.shields.io/badge/license-Unlicense-blue.svg
[license-url]: UNLICENSE