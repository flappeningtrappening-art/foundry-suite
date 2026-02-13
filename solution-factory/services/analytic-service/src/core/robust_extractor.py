import os
import asyncio
from markitdown import MarkItDown
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import tempfile

class RobustExtractor:
    def __init__(self):
        self.md = MarkItDown()

    def extract_from_pdf(self, pdf_bytes: bytes) -> str:
        """
        Converts PDF bytes to clean Markdown using MarkItDown.
        """
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name
        
        try:
            result = self.md.convert(tmp_path)
            return result.text_content
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    async def extract_from_url(self, url: str) -> str:
        """
        Uses Playwright to render a webpage and extract clean Markdown.
        """
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, wait_until="networkidle")
            
            # Get content and simplify with BeautifulSoup before MD conversion
            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")
            
            # Remove scripts, styles, and nav junk
            for element in soup(["script", "style", "nav", "footer", "header"]):
                element.decompose()
            
            text = soup.get_text(separator="\n")
            await browser.close()
            
            # Use MarkItDown to clean up the resulting text
            with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
                tmp.write(text.encode('utf-8'))
                tmp_path = tmp.name
            
            try:
                result = self.md.convert(tmp_path)
                return result.text_content
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

# Singleton instance
extractor = RobustExtractor()
