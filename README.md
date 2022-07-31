# markdown-it-yaml

Insert YAML documents inside Markdown and have them render to HTML using Mustache templates.

This is useful when you need structured data in your Markdown documents. You get a very easy syntax to write the data (YAML) and total control on HTML output. Objects can be anything: images, galleries, polls, family trees, whatever.

## Example
Example input:

    # Title

    Some content.

    ```yaml
    type: image
    src: cat.jpg
    alt: A cat
    caption: The cat is on the table
    credit: Flavio
    ```

    More Markdown content.

Since `type` is `image`, a mustache template named `image.html` must be created in your template directory.

The template directory defaults to the current working directory. You should set it in the options.

A Mustache template would look like:

```handlebars
<figure>
    <img src="{{{src}}}" alt="{{#alt}}{{alt}}{{/alt}}" />
    {{#caption}}<figcaption>{{caption}}</figcaption>{{/caption}}
    {{#credit}}<div class="credit">{{credit}}</div>{{/credit}}
</figure>
```

Output:
```html
<h1>Title</h1>

<p>Some content.

<figure>
    <img src="cat.jpg" alt="A cat" />
    <figcaption>The cat is on the table</figcaption>
    <div class="credit">Flavio</div>
</figure>

<p>More Markdown content.
```

## Syntax

I chose the standard code block marker <code>```yaml</code> as the default marker in order to get nice editing and preview for authors and not introduce a new Markdown syntax. It can be changed in the options.

By appending some other word after <code>```yaml</code> you can disable this plugin for a specific YAML code block:

    ```yaml norender
    this: won't get mustached
    ```

## Object list

An array of the parsed YAML blocks can be accessed at `env.objects` after the Markdown document has been processed. This can be useful to generate table of contents, statistics, export data, etc. See the Usage example below.

## Install

Coming soon

```bash
$ npm install markdown-it-yaml
```

## Usage

```js
const md = require('markdown-it')();

md.use(require('markdown-it-yaml'), {
  // optional, these are the defaults
  templateDir: '.',
  markerStart: '```yaml',
  markerEnd: '```',
  typeKey: 'type',
  templateExtension: '.html',
  autoNumbering: false,
  numberKey: 'number',
  renderFunction: (template, data) => {
    return myFavoriteTemplateEngine(template, data);
  },
  debug: false
});

const markdown = 'Load your Markdown from somewhere...';

const env = {
  someExtraTemplateData: 'foo'
};
const html = md.render(markdown, env);

// Access the parsed YAML objects
for (const obj of env.objects) {
  console.log(obj);
}
```

## Support

I'll approve pull requests that are easy to understand. Feel free to open and I'll give my feedback.

If you need extra features, I'm available for hire.

## License

MIT © [Flavio Tordini](https://flavio.tordini.org/)
