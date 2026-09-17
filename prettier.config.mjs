export default {
    tabWidth: 4,
    useTabs: false,
    singleQuote: true,
    jsxSingleQuote: false,
    semi: true,
    printWidth: 120,
    trailingComma: 'all',
    arrowParens: 'always',
    bracketSpacing: true,
    singleAttributePerLine: false,
    bracketSameLine: false,
    endOfLine: 'lf',
    quoteProps: 'as-needed',
    proseWrap: 'preserve',
    overrides: [
        {
            files: ['*.json', '*.jsonc', '*.md', '*.yml', '*.yaml'],
            options: {
                tabWidth: 2,
            },
        },
    ],
};
