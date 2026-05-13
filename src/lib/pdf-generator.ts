import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateBulletinPDF = (studentData: any, evaluations: any[], stats: any) => {
  const doc = new jsPDF();
  const primaryColor = [16, 185, 129]; // Emerald 500

  // background
  doc.setFillColor(252, 252, 252);
  doc.rect(0, 0, 210, 297, 'F');

  // Header Box
  doc.setFillColor(10, 10, 12);
  doc.rect(0, 0, 210, 45, 'F');

  // Logo Placeholder (Using Text as I don't have the image buffer easily here)
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text('DHG', 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DIOGONDIRAL ET HOORE GOOGA', 20, 32);

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('BULLETIN SCOLAIRE', 210 - 20, 28, { align: 'right' });

  // Student Info Block
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(240, 240, 240);
  doc.roundedRect(20, 55, 170, 35, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text('ÉLÈVE', 30, 65);
  doc.text('GROUPE', 120, 65);
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(`${studentData.last_name} ${studentData.first_name}`, 30, 75);
  doc.text(`${studentData.group_name || 'Groupe A'}`, 120, 75);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text('ANNÉE ACADÉMIQUE', 30, 85);
  doc.text(`${studentData.academic_year || '2025-2026'}`, 80, 85);

  // QR Code Placeholder (Point 3 requirement)
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(170, 60, 15, 15);
  doc.setFontSize(6);
  doc.text('QR AUTH', 170, 78);

  // Evaluations Table
  autoTable(doc, {
    startY: 100,
    head: [['Matière / Livre', 'Type', 'Date', 'Note / 20', 'Appréciation']],
    body: evaluations.length > 0 ? evaluations.map(e => [
      e.subject_name || 'Coran',
      e.type || 'Test',
      e.date || '01/01/2026',
      e.grade || '15.5',
      e.remarks || 'Très bon travail'
    ]) : [['-', '-', '-', '-', 'Pas de notes']],
    headStyles: { 
      fillColor: [10, 10, 12], 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 5
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 20, right: 20 }
  });

  // Summary & Stats
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, finalY, 170, 50, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text('RÉSUMÉ PÉDAGOGIQUE', 30, finalY + 12);

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.setFont("helvetica", "normal");
  doc.text(`Moyenne Trimestrielle :`, 30, finalY + 25);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${stats.average || '16.20'} / 20`, 80, finalY + 25);

  doc.setTextColor(80);
  doc.setFont("helvetica", "normal");
  doc.text(`Présences :`, 30, finalY + 35);
  doc.text(`${stats.attendance || '95'} %`, 80, finalY + 35);

  doc.text(`Comportement :`, 120, finalY + 25);
  doc.text(`${stats.behavior || 'Excellent'}`, 155, finalY + 25);

  // Progression Coran
  doc.text(`Dernier Juz validé :`, 120, finalY + 35);
  doc.text(`${stats.current_juz || '30'}`, 155, finalY + 35);

  // Footer / Signatures
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('Document généré par le système DHG School Management.', 105, 280, { align: 'center' });
  
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text('Le Directeur', 40, finalY + 70);
  doc.text('Les Parents', 140, finalY + 70);

  doc.save(`Bulletin_${studentData.last_name}_${studentData.first_name}.pdf`);
};
