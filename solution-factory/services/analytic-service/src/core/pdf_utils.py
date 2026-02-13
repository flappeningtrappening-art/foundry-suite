import fitz  # PyMuPDF
import io

def extract_text_from_pdf(pdf_bytes: bytes):
    """
    Extracts text from PDF bytes with page-level grounding.
    Returns a list of dictionaries: [{"page": 1, "text": "..."}, ...]
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    
    for page_num, page in enumerate(doc):
        text = page.get_text("text")
        pages.append({
            "page": page_num + 1,
            "text": text
        })
        
    doc.close()
    return pages
