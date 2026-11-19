"""Convierte las páginas de /developers/docs del ECF (HTML generado) a Markdown para el repo público.
Uso: python html2md.py <dir_html> <dir_salida>
Solo toma <main class="docs-main">; omite la tabla de contenido y la navegación.
"""
import html, os, re, sys
from html.parser import HTMLParser

SKIP_CLASSES = {'docs-toc', 'docs-sidebar', 'code-tabs-header', 'docs-pager', 'skip-link', 'docs-breadcrumb', 'copy-btn'}
BLOCK = {'p', 'div', 'section', 'article', 'header', 'footer', 'aside', 'figure', 'details', 'summary', 'nav'}


class Conv(HTMLParser):
    def __init__(self, links):
        super().__init__(convert_charrefs=True)
        self.links = links
        self.out = []
        self.in_main = 0
        self.skip = 0
        self.stack = []
        self.pre = None
        self.pre_lang = ''
        self.list_stack = []
        self.table = None
        self.cell = None
        self.href = None
        self.link_text = []
        self.heading = None

    # utilidades
    def w(self, s):
        if self.cell is not None:
            self.cell.append(s)
        elif self.href is not None:
            self.link_text.append(s)
        else:
            self.out.append(s)

    def nl(self, n=2):
        if self.cell is not None:
            self.cell.append(' ')
            return
        txt = ''.join(self.out)
        stripped = txt.rstrip(' ')
        trailing = len(stripped) - len(stripped.rstrip('\n'))
        if trailing < n:
            self.out = [stripped + '\n' * (n - trailing)]
        else:
            self.out = [stripped]

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = set((a.get('class') or '').split())
        if tag == 'main' and 'docs-main' in cls:
            self.in_main += 1
            return
        if not self.in_main:
            return
        if self.skip or (cls & SKIP_CLASSES) or tag in ('script', 'style', 'svg', 'button'):
            self.skip += 1
            self.stack.append(('skip', tag))
            return
        self.stack.append(('tag', tag))
        if self.pre is not None:
            if tag == 'code':
                lang = next((c[9:] for c in cls if c.startswith('language-')), '')
                self.pre_lang = lang or self.pre_lang
            return
        if tag in ('h1', 'h2', 'h3', 'h4', 'h5'):
            self.nl(2)
            self.w('#' * int(tag[1]) + ' ')
        elif tag in BLOCK:
            if 'subtitle' in cls:
                self.nl(2); self.w('_')
                self.stack[-1] = ('subtitle', tag)
            elif cls & {'callout', 'note', 'warning', 'tip', 'alert', 'docs-callout'}:
                self.nl(2); self.w('> ')
            else:
                self.nl(2)
        elif tag == 'br':
            self.w('  \n')
        elif tag in ('ul', 'ol'):
            self.nl(1 if self.list_stack else 2)
            self.list_stack.append([tag, 0])
        elif tag == 'li':
            self.nl(1)
            depth = len(self.list_stack) - 1
            kind = self.list_stack[-1] if self.list_stack else ['ul', 0]
            kind[1] += 1
            self.w('  ' * depth + ('%d. ' % kind[1] if kind[0] == 'ol' else '- '))
        elif tag == 'pre':
            self.nl(2)
            self.pre = []
            self.pre_lang = ''
        elif tag == 'code':
            lang = next((c[9:] for c in cls if c.startswith('language-')), '')
            if self.pre is None:
                self.w('`')
            else:
                self.pre_lang = lang or self.pre_lang
        elif tag in ('strong', 'b'):
            self.w('**')
        elif tag in ('em', 'i'):
            self.w('_')
        elif tag == 'a':
            self.href = a.get('href', '')
            self.link_text = []
        elif tag == 'table':
            self.nl(2)
            self.table = []
        elif tag == 'tr':
            if self.table is not None:
                self.table.append([])
        elif tag in ('td', 'th'):
            self.cell = []
        elif tag == 'hr':
            self.nl(2); self.w('---'); self.nl(2)

    def handle_endtag(self, tag):
        if not self.in_main:
            return
        if tag == 'main' and not self.stack:
            self.in_main -= 1
            return
        if not self.stack:
            return
        kind, t = self.stack.pop()
        if kind == 'skip':
            self.skip -= 1
            return
        if self.pre is not None and tag != 'pre':
            return
        if tag in ('h1', 'h2', 'h3', 'h4', 'h5'):
            self.nl(2)
        elif kind == 'subtitle':
            self.w('_'); self.nl(2)
        elif tag in BLOCK:
            self.nl(2)
        elif tag in ('ul', 'ol'):
            if self.list_stack:
                self.list_stack.pop()
            self.nl(2 if not self.list_stack else 1)
        elif tag == 'pre':
            code = ''.join(self.pre).strip('\n')
            self.pre = None
            self.w('```' + (self.pre_lang or '') + '\n' + code + '\n```')
            self.nl(2)
        elif tag == 'code':
            self.w('`')
        elif tag in ('strong', 'b'):
            self.w('**')
        elif tag in ('em', 'i'):
            self.w('_')
        elif tag == 'a':
            text = ''.join(self.link_text).strip()
            href = self.href or ''
            self.href = None
            href = self.links(href)
            self.w('[%s](%s)' % (text, href) if href and text else text)
        elif tag in ('td', 'th'):
            if self.table is not None and self.table:
                self.table[-1].append(re.sub(r'\s+', ' ', ''.join(self.cell or [])).strip().replace('|', '\\|'))
            self.cell = None
        elif tag == 'table':
            rows = [r for r in (self.table or []) if r]
            self.table = None
            if rows:
                n = max(len(r) for r in rows)
                rows = [r + [''] * (n - len(r)) for r in rows]
                lines = ['| ' + ' | '.join(rows[0]) + ' |', '|' + '---|' * n]
                lines += ['| ' + ' | '.join(r) + ' |' for r in rows[1:]]
                self.w('\n'.join(lines))
                self.nl(2)

    def handle_data(self, data):
        if not self.in_main or self.skip:
            return
        if self.pre is not None:
            self.pre.append(data)
            return
        data = re.sub(r'\s+', ' ', data)
        self.w(data)

    def result(self):
        md = ''.join(self.out)
        md = re.sub(r'[ \t]+\n', '\n', md)
        md = re.sub(r'\n{3,}', '\n\n', md)
        md = re.sub(r'(^|\n)(#+ ) +', r'\1\2', md)
        md = re.sub(r'\b(GET|POST|PUT|DELETE|PATCH)`', r'\1 `', md)
        md = re.sub(r'\nPégalo en tu asistente[^\n]*\n', '\n', md)
        md = re.sub(r'\n> i\n\n([^\n]+)', r'\n> ℹ️ \1', md)
        return md.strip() + '\n'


def main():
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    pages = sorted(f for f in os.listdir(src) if f.endswith('.html'))
    slugs = {p[:-5] for p in pages}

    def links(href):
        m = re.match(r'^(?:https://ecf\.frandeone\.com)?/developers/docs/([a-z0-9-]*)(?:\.html)?(#.*)?$', href)
        if m:
            slug = m.group(1) or 'index'
            if slug in slugs:
                return ('README.md' if slug == 'index' else slug + '.md') + (m.group(2) or '')
        m = re.match(r'^([a-z0-9-]+)(?:\.html)?(#.*)?$', href)
        if m and m.group(1) in slugs:
            return ('README.md' if m.group(1) == 'index' else m.group(1) + '.md') + (m.group(2) or '')
        if href.startswith('/'):
            return 'https://ecf.frandeone.com' + href
        return href

    for p in pages:
        c = Conv(links)
        c.feed(open(os.path.join(src, p), encoding='utf-8').read())
        name = 'README.md' if p == 'index.html' else p[:-5] + '.md'
        body = c.result()
        head = ('<!-- Generado desde https://ecf.frandeone.com/developers/docs/%s · no editar a mano: se regenera desde el ECF -->\n\n'
                % ('' if p == 'index.html' else p))
        open(os.path.join(dst, name), 'w', encoding='utf-8', newline='\n').write(head + body)
        print(name, len(body))


if __name__ == '__main__':
    main()
