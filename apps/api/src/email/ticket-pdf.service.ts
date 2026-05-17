import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

export interface TicketPdfData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  phoneNumber?: string | null;
}

const FONT_PATHS = [
  path.join(process.cwd(), 'assets', 'fonts', 'Roboto-Regular.ttf'),
  path.join(__dirname, 'fonts', 'Roboto-Regular.ttf'),
];

function findFontPath(): string | null {
  for (const fontPath of FONT_PATHS) {
    if (fs.existsSync(fontPath)) return fontPath;
  }
  return null;
}

@Injectable()
export class TicketPdfService {
  async generate(data: TicketPdfData): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const fontPath = findFontPath();
    if (fontPath) {
      doc.registerFont('TicketFont', fontPath);
      doc.font('TicketFont');
    }

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    await new Promise<void>((resolve, reject) => {
      doc.on('end', () => resolve());
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100;
      const margin = 50;
      const headerHeight = 70;

      doc.rect(margin, 50, pageWidth, headerHeight).fill('#FA4616');
      doc
        .fillColor('#ffffff')
        .fontSize(22)
        .text('БІЛЕТ', margin, 58, { width: pageWidth, align: 'center' });
      doc.fontSize(12).text(data.eventName, margin, 88, {
        width: pageWidth,
        align: 'center',
      });
      doc.fillColor('#000000').fontSize(11);

      doc.y = 50 + headerHeight + 24;

      doc.text('Дата та час: ', { continued: true });
      doc.text(`${data.eventDate} о ${data.eventTime}`);
      doc.moveDown(0.6);
      doc.text('Місце: ', { continued: true });
      doc.text(data.location);
      if (data.phoneNumber) {
        doc.moveDown(0.6);
        doc.text('Контактний номер: ', { continued: true });
        doc.text(data.phoneNumber);
      }
      doc.moveDown(1.5);
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Білет можна показати з екрану або роздрукувати.', {
          align: 'center',
          width: pageWidth,
        });

      doc.end();
    });

    return Buffer.concat(chunks);
  }
}
