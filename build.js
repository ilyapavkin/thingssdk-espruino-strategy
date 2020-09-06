/* Build file */
'use strict';

const path = require('path');
const {rollup} = require('rollup');
const {babel} = require('@rollup/plugin-babel');
const {nodeResolve} = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');
const cleanup = require('rollup-plugin-cleanup');

function transformForEnvironment(env, entry) {
    return {
        transform(code, id) {
            if (entry === id) {
                if (env === "production") {
                    code = `${code};E.on("init", main);save();`;
                } else {
                    code = `${code};main();`;
                }
                return {
                    code,
                    map: { mappings: '' }
                };
            } else {
                return;
            }
        }
    };
}

module.exports = function build(devices, payload, next) {
    console.log("Treeshaking code...");
    rollup({
        input: payload.entry,
        runtimeHelpers: false,
        plugins: [
            transformForEnvironment(payload.env, payload.entry),
            json(),
            cleanup(),
            nodeResolve({
                main: true
            }),
            babel({
                babelHelpers: 'external',
                presets: [
                    [
                        "@babel/preset-env",
                        {
                            "modules": false
                        }
                    ]
                ],
                plugins: [
                    "@babel/external-helpers"
                ]
            })
        ]
    }).then(bundle => {
        console.log('writing file');
        return bundle.write({
            format: 'cjs',
            file: path.join(payload.buildDir, 'espruino-generated.js')
        });
    }).then(() => next())
        .catch(next);
};
