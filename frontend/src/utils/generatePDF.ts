import { jsPDF } from 'jspdf';

export const generateFIR = (caseData: any) => {
  const doc = new jsPDF();

  // --- STYLING CONSTANTS ---
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // 1. ADD WATERMARK (Optional simple text in background)
  doc.setTextColor(240, 240, 240);
  doc.setFontSize(60);
  doc.text("OFFICIAL COPY", pageWidth / 2, pageHeight / 2, { 
    align: 'center', 
    angle: 45 
  });
  doc.setTextColor(0, 0, 0); // Reset color to black

  // 2. OUTER BORDER (The "File" look)
  doc.setLineWidth(0.5);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10); // Outer border
  doc.setLineWidth(0.2);

  // 3. HEADER SECTION
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text("FIRST INFORMATION REPORT", pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont("times", "italic");
  doc.text("(Under Section 154 Cr.P.C.)", pageWidth / 2, 26, { align: 'center' });

  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("GOVERNMENT OF INDIA - DIGITAL JUSTICE PORTAL", pageWidth / 2, 36, { align: 'center' });

  // Divider Line
  doc.setLineWidth(1.5);
  doc.line(margin, 42, pageWidth - margin, 42);
  doc.setLineWidth(0.2);

  // 4. FORM GRID (Top Section)
  let yPos = 55;
  
  // Row 1: Case Number & Date
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text(`1. District: ${caseData.location || 'Central'}`, margin, yPos);
  doc.text(`P.S.: Digital Cyber Cell`, 80, yPos);
  doc.text(`Year: ${new Date().getFullYear()}`, 150, yPos);
  
  yPos += 10;
  doc.text(`2. FIR No.:`, margin, yPos);
  doc.setFont("times", "normal");
  doc.text(caseData.caseNumber || 'PENDING', margin + 25, yPos);
  
  doc.setFont("times", "bold");
  doc.text(`Date Filed:`, 120, yPos);
  doc.setFont("times", "normal");
  doc.text(new Date(caseData.createdAt || Date.now()).toLocaleDateString(), 150, yPos);

  // 5. INCIDENT BOX
  yPos += 15;
  doc.setFillColor(230, 230, 230); // Gray header background
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  doc.rect(margin, yPos, contentWidth, 8); // Border
  
  doc.setFont("times", "bold");
  doc.text("3. OCCURRENCE OF OFFENCE:", margin + 2, yPos + 6);
  
  yPos += 8;
  // Box content
  doc.rect(margin, yPos, contentWidth, 20);
  doc.setFont("times", "normal");
  doc.text(`(a) Type of Offence: ${caseData.type}`, margin + 5, yPos + 7);
  doc.text(`(b) Date of Incident: ${new Date(caseData.incidentDate).toLocaleDateString()}`, margin + 5, yPos + 15);
  doc.text(`(c) Place of Occurrence: ${caseData.location || 'N/A'}`, 110, yPos + 15);

  // 6. DESCRIPTION SECTION
  yPos += 30;
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  doc.rect(margin, yPos, contentWidth, 8);
  doc.setFont("times", "bold");
  doc.text("4. CONTENTS OF THE F.I.R. (Statement of Facts):", margin + 2, yPos + 6);

  yPos += 8;
  const descHeight = 120;
  doc.rect(margin, yPos, contentWidth, descHeight); // Large text box
  
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  const descText = caseData.description || 'No details provided.';
  // Wrap text to fit width
  const splitText = doc.splitTextToSize(descText, contentWidth - 10);
  doc.text(splitText, margin + 5, yPos + 7);

  // 7. FOOTER / SIGNATURES
  const footerY = 250;
  doc.line(margin, footerY, pageWidth - margin, footerY); // Bottom line

  doc.setFontSize(10);
  doc.setFont("times", "bold");
  
  // Left Signature
  doc.text("Signature / Thumb Impression", margin, footerY + 10);
  doc.text("of the Complainant", margin, footerY + 15);
  
  // Right Signature
  doc.text("Signature of the Officer-in-Charge", 130, footerY + 10);
  doc.text("Police Station", 130, footerY + 15);

  // 8. DISCLAIMER
  doc.setFontSize(8);
  doc.setFont("times", "italic");
  doc.text(
    "* This is a computer-generated document. To verify the authenticity, please visit the Digital Justice Portal.", 
    pageWidth / 2, 
    pageHeight - 15, 
    { align: 'center' }
  );

  // Save
  doc.save(`FIR-${caseData.caseNumber || 'draft'}.pdf`);
};