const fs = require('fs');
var path = require('path');
const jsYaml = require('js-yaml');
const mustache = require('mustache');

const tokenType = 'yaml';

function plugin(md, options) {
    const defaultOptions = {
        templateDir: '.',
        markerStart: '```yaml',
        markerEnd: '```',
        typeKey: 'type',
        templateExtension: '.html',
        autoNumbering: false,
        numberKey: 'number',
        renderFunction: mustacheRender,
        debug: false
    };

    if (typeof options === 'string') {
        options = {
            ...defaultOptions,
            templateDir: options
        };
    } else {
        options = {
            ...defaultOptions,
            ...options
        };
    }
    this.options = options;

    function log(...args) {
        if (options.debug) console.log('[markdown-it-yaml]', ...args);
    }

    function getLine(state, line) {
        const pos = state.bMarks[line];
        const max = state.eMarks[line];
        return state.src.substring(pos, max);
    }

    function rule(state, startLine, endLine, silent) {
        if (state.blkIndent !== 0 || state.tShift[startLine] < 0) {
            return false;
        }
        if (getLine(state, startLine) !== options.markerStart) {
            return false;
        }

        if (silent) return true;

        let nextLine = startLine + 1;
        const dataStart = nextLine;
        let dataEnd = dataStart;
        while (nextLine < endLine) {
            if (state.tShift[nextLine] < 0) {
                break;
            }
            if (getLine(state, nextLine) === options.markerEnd) {
                break;
            }
            dataEnd = nextLine;
            nextLine++;
        }

        const dataStartPos = state.bMarks[dataStart];
        const dataEndPos = state.eMarks[dataEnd];
        const yaml = state.src.substring(dataStartPos, dataEndPos);
        log('yaml:', yaml);

        const data = jsYaml.load(yaml, 'utf8');
        log('data:', data);

        const typeName = data[options.typeKey];
        if (typeof typeName === 'undefined') {
            return false;
        }

        if (typeof state.env.objects === 'undefined') state.env.objects = [];
        state.env.objects.push(data);

        if (options.autoNumbering) {
            if (typeof state.env._autoNumbers === 'undefined') state.env._autoNumbers = new Map();
            const number = state.env._autoNumbers.get(typeName) + 1 || 1;
            data[options.numberKey] = number;
            state.env._autoNumbers.set(typeName, number);
        }

        state.line = nextLine + 1;
        const token = state.push(tokenType, 'div', 0);
        token.content = data;
        token.markup = options.markerStart;
        token.map = [startLine, state.line];
        token.block = true;

        return true;
    };

    md.block.ruler.before('fence', tokenType, rule, { alt: [] });

    function mustacheRender(template, data) {
        return mustache.render(template, data);
    }

    function render(tokens, idx, options, env, slf) {
        const token = tokens[idx];
        const data = token.content;
        data.env = env;
        const pluginOptions = plugin.options;
        const typeName = data[pluginOptions.typeKey];
        const templatePath = pluginOptions.templateDir + path.sep + typeName + pluginOptions.templateExtension;
        const template = fs.readFileSync(templatePath, 'utf8');
        return pluginOptions.renderFunction(template, data);
    }

    md.renderer.rules[tokenType] = render;

}

module.exports = plugin;
