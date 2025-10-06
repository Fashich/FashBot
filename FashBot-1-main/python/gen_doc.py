#!/usr/bin/env python3
import sys, json, base64, re

def to_doc_html(text: str):
    html = f"<!doctype html><html><head><meta charset='utf-8'></head><body>{text.replace('\n','<br/>')}</body></html>"
    data = base64.b64encode(html.encode('utf-8')).decode('ascii')
    return {
        "dataUri": f"data:application/msword;base64,{data}",
        "filename": "document.doc",
        "mime": "application/msword",
    }

def to_csv(text: str):
    csv = re.sub(r"\t", ",", text)
    data = base64.b64encode(csv.encode('utf-8')).decode('ascii')
    return {
        "dataUri": f"data:text/csv;base64,{data}",
        "filename": "spreadsheet.csv",
        "mime": "text/csv",
    }

def to_txt(text: str):
    data = base64.b64encode(text.encode('utf-8')).decode('ascii')
    return {
        "dataUri": f"data:text/plain;base64,{data}",
        "filename": "document.txt",
        "mime": "text/plain",
    }

def main():
    try:
        payload = json.loads(sys.stdin.read() or '{}')
        text = str(payload.get('text') or '')
        fmt = (payload.get('format') or '').lower()
        if fmt in ('doc', 'docx', 'word'):
            out = to_doc_html(text)
        elif fmt in ('csv', 'excel', 'xlsx'):
            out = to_csv(text)
        else:
            out = to_txt(text)
        sys.stdout.write(json.dumps(out))
    except Exception as e:
        sys.stdout.write(json.dumps({"error": str(e)}))

if __name__ == '__main__':
    main()
