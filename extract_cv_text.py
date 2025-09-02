#!/usr/bin/env python3
"""
PDF Text Extractor for CV
Extracts text content from PDF files for further processing
"""

import sys
import PyPDF2
import pdfplumber

def extract_text_pypdf2(pdf_path):
    """Extract text using PyPDF2"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n\n"
        return text.strip()
    except Exception as e:
        print(f"PyPDF2 extraction failed: {e}")
        return None

def extract_text_pdfplumber(pdf_path):
    """Extract text using pdfplumber (usually better for complex layouts)"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
        return text.strip()
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}")
        return None

def main():
    pdf_path = "222Frank_Digital_AB_Niklas_Andervang_CV_2025.pdf"
    
    print("=" * 60)
    print("EXTRACTING TEXT FROM CV PDF")
    print("=" * 60)
    print(f"Target file: {pdf_path}")
    
    # Check if file exists
    import os
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        print("Available files in current directory:")
        for f in os.listdir("."):
            if f.endswith(".pdf"):
                print(f"  - {f}")
        return 1
    
    print(f"✅ File found: {pdf_path}")
    print(f"File size: {os.path.getsize(pdf_path)} bytes")
    
    # Try pdfplumber first (usually better for formatting)
    print("\n1. Trying pdfplumber extraction...")
    text_plumber = extract_text_pdfplumber(pdf_path)
    
    if text_plumber:
        print("✅ pdfplumber extraction successful!")
        print(f"Extracted {len(text_plumber)} characters")
        
        # Save to file
        with open("cv_extracted_text.txt", "w", encoding="utf-8") as f:
            f.write("=== CV TEXT EXTRACTED WITH PDFPLUMBER ===\n\n")
            f.write(text_plumber)
        
        print("✅ Text saved to cv_extracted_text.txt")
        print("\n" + "="*60)
        print("PREVIEW (first 500 characters):")
        print("="*60)
        print(text_plumber[:500])
        if len(text_plumber) > 500:
            print("\n... (truncated, see cv_extracted_text.txt for full content)")
        
    else:
        print("❌ pdfplumber failed, trying PyPDF2...")
        
        # Fallback to PyPDF2
        text_pypdf2 = extract_text_pypdf2(pdf_path)
        
        if text_pypdf2:
            print("✅ PyPDF2 extraction successful!")
            print(f"Extracted {len(text_pypdf2)} characters")
            
            # Save to file
            with open("cv_extracted_text.txt", "w", encoding="utf-8") as f:
                f.write("=== CV TEXT EXTRACTED WITH PYPDF2 ===\n\n")
                f.write(text_pypdf2)
            
            print("✅ Text saved to cv_extracted_text.txt")
            print("\n" + "="*60)
            print("PREVIEW (first 500 characters):")
            print("="*60)
            print(text_pypdf2[:500])
            if len(text_pypdf2) > 500:
                print("\n... (truncated, see cv_extracted_text.txt for full content)")
        else:
            print("❌ Both extraction methods failed!")
            return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
