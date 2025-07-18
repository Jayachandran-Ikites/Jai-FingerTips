from weasyprint import HTML, CSS
import markdown
import re
from html import escape

def conversation_to_pdf_bytes(title, messages):
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{escape(title)}</title>
        <style>
            @page {{
                size: A4;
                margin: 2.5cm 2cm;
                @bottom-center {{
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 10px;
                    color: #666;
                }}
            }}
            
            body {{
                font-family: "Noto Sans Devanagari", "Noto Sans", "DejaVu Sans", Arial, sans-serif;
                background: #ffffff;
                margin: 0;
                padding: 0;
                line-height: 1.6;
                color: #333;
            }}
            
            .title {{
                font-size: 2.2em;
                font-weight: 600;
                text-align: center;
                margin-bottom: 2em;
                color: #2c3e50;
                border-bottom: 3px solid #3498db;
                padding-bottom: 0.5em;
                page-break-after: avoid;
            }}
            
            .msg-container {{
                margin-bottom: 2em;
                border-radius: 8px;
                background: #ffffff;
                border: 2px solid red !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                overflow: hidden;
                margin-top: 0px !important;
            }}
            
            .msg-block {{
                break-inside: avoid;
                page-break-inside: avoid;
                margin-bottom: 1.5em;
            }}
            
            .msg-header {{
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 1em 1.5em;
                border-bottom: 1px solid #dee2e6;
                display: flex;
                justify-content: space-between;
                align-items: center;
                page-break-after: avoid;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }}
            
            .user-header {{
                background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
                border-left: 4px solid #28a745;
            }}
            
            .assistant-header {{
                background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                border-left: 4px solid #2196f3;
            }}
            
            .sender {{
                font-size: 1.1em;
                font-weight: 600;
                color: #495057;
                display: flex;
                align-items: center;
            }}
            
            .sender::before {{
                content: "👤";
                margin-right: 0.5em;
            }}
            
            .user-sender {{
                color: #155724;
            }}
            
            .user-sender::before {{
                content: "🙋‍♂️";
            }}
            
            .assistant-sender {{
                color: #1565c0;
            }}
            
            .assistant-sender::before {{
                content: "🤖";
            }}
            
            .timestamp {{
                color: #6c757d;
                font-size: 0.9em;
                font-weight: 400;
                font-family: "Noto Sans", "Arial", sans-serif; 
                font-feature-settings: "pnum"; 
            }}
            
            .msg-content {{
                border: 1px solid #ccc;
                padding: 1em;
                background: #fff;
                margin-bottom: 1.5em;
                border-bottom-left-radius: 8px;
                border-bottom-right-radius: 8px;
            }}
            
            /* Enhanced Markdown Styling */
            .msg-content h1, .msg-content h2, .msg-content h3, 
            .msg-content h4, .msg-content h5, .msg-content h6 {{
                color: #2c3e50;
                margin-top: 1.5em;
                margin-bottom: 0.8em;
                page-break-after: avoid;
                font-weight: 600;
            }}
            
            .msg-content h1 {{
                font-size: 1.8em;
                border-bottom: 2px solid #3498db;
                padding-bottom: 0.5em;
            }}
            
            .msg-content h2 {{
                font-size: 1.5em;
                border-bottom: 1px solid #bdc3c7;
                padding-bottom: 0.3em;
            }}
            
            .msg-content h3 {{
                font-size: 1.3em;
                color: #34495e;
            }}
            
            .msg-content p {{
                margin-bottom: 1.2em;
                text-align: justify;
                hyphens: auto;
            }}
            
            .msg-content ul, .msg-content ol {{
                margin: 1.2em 0;
                padding-left: 2.5em;
            }}
            
            .msg-content li {{
                margin-bottom: 0.6em;
                line-height: 1.5;
            }}
            
            .msg-content ul li {{
                list-style-type: disc;
            }}
            
            .msg-content ul li::marker {{
                color: #3498db;
            }}
            
            .msg-content table {{
                width: 100%;
                border-collapse: collapse;
                margin: 1.5em 0;
                font-size: 0.95em;
                background: #ffffff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                border-radius: 6px;
                overflow: hidden;
                page-break-inside: avoid;
            }}
            
            .msg-content th, .msg-content td {{
                border: 1px solid #dee2e6;
                padding: 1em;
                text-align: left;
                vertical-align: top;
            }}
            
            .msg-content th {{
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                font-weight: 600;
                color: #495057;
                border-bottom: 2px solid #dee2e6;
            }}
            
            .msg-content tr:nth-child(even) {{
                background-color: #f8f9fa;
            }}
            
            .msg-content tr:hover {{
                background-color: #e3f2fd;
            }}
            
            .msg-content code {{
                background: #f8f9fa;
                padding: 0.2em 0.5em;
                border-radius: 4px;
                font-family: "Courier New", "Monaco", monospace;
                font-size: 0.9em;
                color: #e74c3c;
                border: 1px solid #e9ecef;
            }}
            
            .msg-content pre {{
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-left: 4px solid #3498db;
                border-radius: 6px;
                padding: 1.5em;
                overflow-x: auto;
                margin: 1.5em 0;
                page-break-inside: avoid;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
            }}
            
            .msg-content pre code {{
                background: none;
                border: none;
                padding: 0;
                color: #2c3e50;
                font-size: 0.9em;
            }}
            
            .msg-content blockquote {{
                border-left: 4px solid #3498db;
                margin: 1.5em 0;
                padding: 1em 1.5em;
                background: #f8f9fa;
                font-style: italic;
                border-radius: 0 6px 6px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }}
            
            .msg-content blockquote p {{
                margin: 0;
                color: #5a6c7d;
            }}
            
            .msg-content a {{
                color: #3498db;
                text-decoration: none;
                border-bottom: 1px dotted #3498db;
            }}
            
            .msg-content a:hover {{
                color: #2980b9;
                border-bottom: 1px solid #2980b9;
            }}
            
            .msg-content strong {{
                font-weight: 600;
                color: #2c3e50;
            }}
            
            .msg-content em {{
                font-style: italic;
                color: #5a6c7d;
            }}
            
            .msg-content hr {{
                border: none;
                height: 2px;
                background: linear-gradient(to right, #3498db, #2980b9);
                margin: 2em 0;
                border-radius: 1px;
            }}
            
            /* Special content styling */
            .msg-content .emoji {{
                font-size: 1.2em;
                margin-right: 0.3em;
            }}
            
            /* Responsive table wrapper */
            .table-wrapper {{
                overflow-x: auto;
                margin: 1.5em 0;
            }}
            
            /* Print optimizations */
            @media print {{
                body {{
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }}
                
                .msg-container {{
                    page-break-inside: avoid;
                    box-shadow: none;
                    border: 1px solid #ddd;
                }}
                
                .msg-content table {{
                    page-break-inside: avoid;
                }}
                
                .msg-content pre {{
                    page-break-inside: avoid;
                }}
                
                .msg-content h1, .msg-content h2, .msg-content h3 {{
                    page-break-after: avoid;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="title">{escape(title)}</div>
    """

    count = 0
    for msg in messages:
        sender = "You" if msg.get("sender") == "user" else "Assistant"
        is_user = msg.get("sender") == "user"
        ts = msg.get("timestamp")
        
        try:
            timestamp = ts.strftime('%B %d, %Y at %I:%M %p') if ts else ""
        except Exception:
            timestamp = str(ts) or ""
        
        text = msg.get("text", "")
        
        # Enhanced markdown processing
        if text:
            # Configure markdown with comprehensive extensions
            md = markdown.Markdown(extensions=[
                'tables',
                'fenced_code',
                'codehilite',
                'nl2br',
                'toc',
                'attr_list',
                'def_list',
                'footnotes',
                'md_in_html'
            ], extension_configs={
                'codehilite': {
                    'css_class': 'highlight',
                    'use_pygments': False
                }
            })
            
            # Pre-process text for better formatting
            text = re.sub(r'^\s*([•·▪▫])\s+', r'- ', text, flags=re.MULTILINE)
            text = re.sub(r'^\s*(\d+\.)\s+', r'\1 ', text, flags=re.MULTILINE)
            
            formatted_text = md.convert(text)

            # print("formatted text is :", formatted_text)
            
            # Wrap tables for better responsiveness
            formatted_text = re.sub(
                r'<table>', 
                '<div class="table-wrapper"><table>', 
                formatted_text
            )
            formatted_text = re.sub(
                r'</table>', 
                '</table></div>', 
                formatted_text
            )
        else:
            formatted_text = ""
        
        header_class = "user-header" if is_user else "assistant-header"
        sender_class = "user-sender" if is_user else "assistant-sender"
        
        html += f"""
        <div class="msg-header {header_class}">
            <span class="sender {sender_class}">{escape(sender)}</span>
            <span class="timestamp">{escape(timestamp)}</span>
        </div>
        <div class="msg-content">{formatted_text}</div>
        """

    html += "</body></html>"

    # Enhanced CSS for superior PDF rendering
    pdf_css = CSS(string="""
        
    """)

    pdf_bytes = HTML(string=html).write_pdf(stylesheets=[pdf_css])
    return pdf_bytes
