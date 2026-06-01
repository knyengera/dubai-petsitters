"use client";

import React from 'react';
import { jsPDF } from 'jspdf';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function HealthPDFExport({ pet, vaccinations, medicalRecords }) {
  const generatePDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;

      // Header with pet name
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(24);
      doc.text(`${pet.name}'s Health Report`, margin, yPosition);
      yPosition += 10;

      // Pet info
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'normal');
      const petInfo = [
        `Species: ${pet.species}`,
        `Breed: ${pet.breed || 'Mixed'}`,
        `Weight: ${pet.weight_kg ? `${pet.weight_kg} kg` : 'Not recorded'}`,
        `Generated: ${format(new Date(), 'MMMM dd, yyyy')}`,
      ];

      petInfo.forEach((info) => {
        doc.text(info, margin, yPosition);
        yPosition += 6;
      });

      // Allergies section
      if (pet.allergies && pet.allergies.length > 0) {
        yPosition += 4;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('🚨 Allergies', margin, yPosition);
        yPosition += 8;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        pet.allergies.forEach((allergy) => {
          doc.text(`• ${allergy}`, margin + 3, yPosition);
          yPosition += 5;
        });
      }

      // Medications section
      if (pet.medications && pet.medications.length > 0) {
        yPosition += 4;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('💊 Current Medications', margin, yPosition);
        yPosition += 8;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        pet.medications.forEach((med) => {
          doc.text(`• ${med}`, margin + 3, yPosition);
          yPosition += 5;
        });
      }

      // Vaccinations section
      if (vaccinations.length > 0) {
        yPosition += 4;

        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('💉 Vaccination History', margin, yPosition);
        yPosition += 8;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        vaccinations.slice(0, 10).forEach((vac) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }

          doc.text(`${vac.vaccine_name} - ${format(new Date(vac.date_given), 'MMM dd, yyyy')}`, margin + 3, yPosition);
          yPosition += 4;

          if (vac.next_due_date) {
            doc.setTextColor(200, 100, 100);
            doc.text(`Next Due: ${format(new Date(vac.next_due_date), 'MMM dd, yyyy')}`, margin + 5, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 4;
          }

          if (vac.clinic_name) {
            doc.text(`Clinic: ${vac.clinic_name}`, margin + 5, yPosition);
            yPosition += 4;
          }

          yPosition += 2;
        });

        if (vaccinations.length > 10) {
          doc.text(`... and ${vaccinations.length - 10} more`, margin + 3, yPosition);
          yPosition += 6;
        }
      }

      // Medical Records section
      if (medicalRecords.length > 0) {
        yPosition += 4;

        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('📋 Medical Records', margin, yPosition);
        yPosition += 8;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        medicalRecords.slice(0, 15).forEach((record) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont('Helvetica', 'bold');
          doc.text(`${record.title} (${record.type})`, margin + 3, yPosition);
          yPosition += 4;

          doc.setFont('Helvetica', 'normal');
          doc.text(`Date: ${format(new Date(record.date), 'MMM dd, yyyy')}`, margin + 5, yPosition);
          yPosition += 3;

          if (record.description) {
            const wrappedText = doc.splitTextToSize(record.description, maxWidth - 6);
            doc.text(wrappedText, margin + 5, yPosition);
            yPosition += wrappedText.length * 3 + 2;
          }

          if (record.vet_name) {
            doc.text(`Vet: ${record.vet_name}`, margin + 5, yPosition);
            yPosition += 3;
          }

          yPosition += 3;
        });

        if (medicalRecords.length > 15) {
          doc.text(`... and ${medicalRecords.length - 15} more records`, margin + 3, yPosition);
        }
      }

      // Footer
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Please share this report with your veterinarian during appointments.', margin, pageHeight - 10);

      // Save the PDF
      doc.save(`${pet.name}-health-report.pdf`);
      toast.success('Health report downloaded');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <Button onClick={generatePDF} variant="outline" className="gap-2 rounded-xl">
      <Download className="w-4 h-4" />
      <FileText className="w-4 h-4" />
      Export PDF for Vet
    </Button>
  );
}