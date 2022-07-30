const fs = require('fs');
var path = require('path');
const jsYaml = require('js-yaml');
const mustache = require('mustache');

const tokenType = 'yaml';

const plugin = (md, options) => {
    const defaultOptions = {
        templateDir: '.',
        markerStart: '```yaml',
        markerEnd: '```',
        typeKey: 'type',
        templateExtension: '.html',
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

        const templatePath = options.templateDir + path.delimiter + data[options.typeKey] + options.templateExtension;
        const template = fs.readFileSync(templatePath, 'utf8');
        const html = mustache.render(template, data);
        log('html:', html);

        state.line = nextLine + 1;
        const token = state.push(tokenType, 'div', 0);
        token.content = html;
        token.markup = options.markerStart;
        token.map = [startLine, state.line];
        token.block = true;

        return true;
    };

    md.block.ruler.before('fence', tokenType, rule, { alt: [] });

    md.renderer.rules[tokenType] = (tokens, idx, options, env, slf) => {
        const token = tokens[idx];
        return token.content;
    };

}

module.exports = plugin;
