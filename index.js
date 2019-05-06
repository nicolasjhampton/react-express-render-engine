const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const ReactDOMServer = require('react-dom/server');
const uuid = require('uuid/v4');

let reactString;

require('./create-react.js')
    .then(text => reactString = text)
    .catch(console.log);

const inputOptions = {
    plugins: [
        babel({
            babelrc: false,
            exclude: 'node_modules/**',
            presets: [
                ["@babel/env", {"modules": false}], "@babel/preset-react"
            ]
        }),
        resolve(),
        commonjs()
    ]
};

const outputOptions = { name: 'App', format: 'iife' };


const defaultTemplate = (initialHtml, codeId) => {
    return `
    <!DOCTYPE html>
    <html>
        <head>
            <script defer crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
            <script defer crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
            <title>title</title>
        </head>
        <body>
            <div id="app">${initialHtml}</div>
            <script defer src="/static/react/${codeId}"></script>
        </body>
    </html>
    `;
}


function rendererFactory(templateFunc = defaultTemplate) {
    let staticFile = {};

    const renderInitial = (code, context) =>  {
        return ReactDOMServer.renderToString(
            new Function(reactString + code + `return App`)()(context)
        )
    }

    const Html = (code, context, codeId, templateFunc) => {
        const initialHtml = renderInitial(code, context);
        return templateFunc(initialHtml, codeId);
    }

    return {
        static: (req, res, next) => {
            res.set('Content-Type', 'text/javascript');
            res.send(staticFile[req.params.codeId]);
        },
        engine: async (filePath, context, callback) => {
            try {
                const bundle = await rollup.rollup({
                    ...inputOptions,
                    input: [filePath]
                });
            
                const {
                    output: [
                        { code }
                    ]
                } = await bundle.generate(outputOptions);

                const codeId = uuid();

                staticFile[codeId] = `
                    window.addEventListener('DOMContentLoaded', function() {
                        ${code}
                        ReactDOM.hydrate(App(${JSON.stringify(context)}), document.getElementById("app"));
                    });
                `

                return callback(null, Html(code, context, codeId, templateFunc)); 
            } catch (e) {
                return callback(e);
            }
            
        }
    } 
}


module.exports = rendererFactory;