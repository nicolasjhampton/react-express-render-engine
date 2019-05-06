const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');

const reactInputOptions = {
    input: [`./node_modules/react`],
    plugins: [
        resolve(),
        commonjs(),
        babel({
            babelrc: false,
            presets: [
                ["@babel/env", {"modules": false}], "@babel/preset-react"
            ]
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify( 'development' )
        }),
    ]
}

const reactOutputOptions = {
    file: './react.js',
    format: 'iife',
    name: 'React'
}

async function createReact() {
    let reactString;
    try {
        reactString = await readFile('./react.js', 'utf8');
    } catch (e) {
        try {
            const bundle = await rollup.rollup(reactInputOptions);
            const [ { output: [ { code } ] } ] = await Promise.all([
                bundle.generate(reactOutputOptions),
                bundle.write(reactOutputOptions)
            ]);
            reactString = code;
        } catch (e) {
            console.log(e);
        }
    }
    return reactString;
}

module.exports = createReact();


// let reactString;

// fs.readFile('./react.js', 'utf8', function(err, data) {
//     if(err) {
        
        
        
        
//         rollup.rollup(reactInputOptions)
//             .then(bundle => {
//                 return Promise.all([
//                     bundle.generate(reactOutputOptions),
//                     bundle.write(reactOutputOptions),
//                 ])
//             })
//             .then( ([ { output: [ { code } ] } ]) => {
//                 reactString = code;
//             })
//             .catch(err => console.log(err));
        
//     }
//     reactString = data;
// });