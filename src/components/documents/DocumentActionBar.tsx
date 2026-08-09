'use client';

import React from 'react';
import { Printer, Download } from 'lucide-react';

export function DocumentActionBar({ documentId }: { documentId: string }) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const originalStylesheets: { element: Element; parent: Node; nextSibling: Node | null }[] = [];
    const tempStyleElements: HTMLStyleElement[] = [];

    try {
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        const ownerNode = sheet.ownerNode as Element;
        if (ownerNode && (ownerNode.tagName === 'STYLE' || ownerNode.tagName === 'LINK')) {
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) {
              let hasProblematicColors = false;
              let cssText = '';
              for (let j = 0; j < rules.length; j++) {
                const ruleText = rules[j].cssText;
                cssText += ruleText + '\n';
                if (
                  ruleText.includes('oklch(') ||
                  ruleText.includes('lab(') ||
                  ruleText.includes('oklab(') ||
                  ruleText.includes('lch(')
                ) {
                  hasProblematicColors = true;
                }
              }

              if (hasProblematicColors) {
                originalStylesheets.push({
                  element: ownerNode,
                  parent: ownerNode.parentNode!,
                  nextSibling: ownerNode.nextSibling,
                });

                const cleanCss = cssText
                  .replace(/oklch\([^)]+\)/g, 'rgb(0,0,0)')
                  .replace(/lab\([^)]+\)/g, 'rgb(0,0,0)')
                  .replace(/oklab\([^)]+\)/g, 'rgb(0,0,0)')
                  .replace(/lch\([^)]+\)/g, 'rgb(0,0,0)');

                const tempStyle = document.createElement('style');
                tempStyle.textContent = cleanCss;
                tempStyleElements.push(tempStyle);
              }
            }
          } catch (e) {
            // Ignore cross-origin stylesheet errors
          }
        }
      }

      // Swap in DOM
      for (const { element } of originalStylesheets) {
        element.remove();
      }
      for (const tempStyle of tempStyleElements) {
        document.head.appendChild(tempStyle);
      }

      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('document-canvas');
      
      if (element) {
        const opt = {
          margin:       10,
          filename:     `${documentId}.pdf`,
          image:        { type: 'jpeg' as 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };
        
        await html2pdf().set(opt).from(element).save();
      }
    } catch (err) {
      console.error(err);
    } finally {
      // Always restore original stylesheets
      for (const tempStyle of tempStyleElements) {
        tempStyle.remove();
      }
      for (const { element, parent, nextSibling } of originalStylesheets) {
        parent.insertBefore(element, nextSibling);
      }
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-zinc-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-border print:hidden z-50">
      <button 
        onClick={handlePrint}
        className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-white/20 text-foreground rounded-xl text-sm font-medium transition-colors"
      >
        <Printer size={16} />
        Print
      </button>
      <button 
        onClick={handleDownloadPdf}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
      >
        <Download size={16} />
        Download PDF
      </button>
    </div>
  );
}
