"""
docx2txt.py
WAT:    Zet een Word-document (.docx) om naar platte tekst, in documentvolgorde, inclusief
        tabellen (cellen gescheiden door ' | ', rijen op een eigen regel, <TABLE>-markers) en
        header/footer-tekst (waar de documentcode PGC-HR-... meestal staat).
WAAROM: Pandoc/python-docx zijn niet standaard aanwezig; dit gebruikt alleen de stdlib.
GEBRUIK:  python -I docx2txt.py <bron.docx> <doel.txt>      (doel '-' = stdout)
          python -I docx2txt.py --dir <map met .docx> <doelmap>
Let op:  checkboxes komen als [x] uit het sjabloon (dat is het vakje, niet "aangevinkt").
"""

import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'


def paragraph_text(p):
    out = []
    for n in p.iter():
        if n.tag == W + 't':
            out.append(n.text or '')
        elif n.tag == W + 'tab':
            out.append('\t')
        elif n.tag == W + 'br':
            out.append('\n')
        elif n.tag in (W + 'checkBox', W + 'checked'):
            out.append('[x]' if n.get(W + 'val') in (None, '1', 'true') else '[ ]')
    return ''.join(out)


def walk(body, lines, indent=''):
    for el in body:
        if el.tag == W + 'p':
            text = paragraph_text(el).strip()
            if text:
                lines.append(indent + text)
        elif el.tag == W + 'tbl':
            lines.append(indent + '<TABLE>')
            for tr in el.findall(W + 'tr'):
                cells = []
                for tc in tr.findall(W + 'tc'):
                    sub = []
                    walk(tc, sub)
                    cells.append(' / '.join(sub))
                lines.append(indent + ' | '.join(cells))
            lines.append(indent + '</TABLE>')
        elif el.tag == W + 'sdt':
            content = el.find(W + 'sdtContent')
            if content is not None:
                walk(content, lines, indent)


def parse(raw):
    # Legitieme Word-XML bevat nooit een DTD/entity-declaratie; weiger die (XXE / billion laughs).
    if b'<!DOCTYPE' in raw or b'<!ENTITY' in raw:
        raise ValueError('onverwachte DTD/entity in docx-XML - bestand geweigerd')
    return ET.fromstring(raw)


def convert(path):
    z = zipfile.ZipFile(path)
    root = parse(z.read('word/document.xml'))
    lines = []
    walk(root.find(W + 'body'), lines)
    for name in z.namelist():
        if re.match(r'word/(header|footer)\d*\.xml$', name):
            part = parse(z.read(name))
            part_lines = []
            walk(part, part_lines)
            if part_lines:
                lines.append(f'[{name}] ' + ' || '.join(part_lines))
    return '\n'.join(lines)


def main(argv):
    if len(argv) == 4 and argv[1] == '--dir':
        src_dir, dst_dir = argv[2], argv[3]
        os.makedirs(dst_dir, exist_ok=True)
        for name in sorted(os.listdir(src_dir)):
            if name.lower().endswith('.docx') and not name.startswith('~$'):
                dst = os.path.join(dst_dir, name[:-5] + '.txt')
                with open(dst, 'w', encoding='utf-8') as fh:
                    fh.write(convert(os.path.join(src_dir, name)))
                print(dst)
        return 0
    if len(argv) == 3:
        text = convert(argv[1])
        if argv[2] == '-':
            sys.stdout.reconfigure(encoding='utf-8')
            sys.stdout.write(text + '\n')
        else:
            with open(argv[2], 'w', encoding='utf-8') as fh:
                fh.write(text)
        return 0
    print(__doc__)
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))
