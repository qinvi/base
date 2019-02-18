// http://eslint.org/docs/user-guide/configuring

module.exports = {
    root: true,
    parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module'
    },
    env: {
        browser: true,
        node: true,
        es6: true
    },
    // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
    extends: 'standard',
    // required to lint *.vue files
    plugins: ['html'],
    // add your custom rules here
    rules: {
        'no-undef': 2,
        'no-extra-boolean-cast': 0,
        'semi': [0, 'always'],
        'indent': [2, 4, { 'SwitchCase': 1 }],
        'space-before-function-paren': 0,
        'arrow-parens': 0,
        'generator-star-spacing': 0,
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
        'no-unused-expressions': 2,
        'padded-blocks': 0
    },
    globals: {
        ol: true,
        lmap: true,
        sysconfig: true,
        utils: true,
        TU: true,
        WD: true
    }
}
