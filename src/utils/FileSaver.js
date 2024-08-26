const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { logEvent } = require('../ui/EventLogger');

async function saveAsPDF(data) {
    try {
        const doc = new PDFDocument();
        const filePath = path.resolve(__dirname,        '../data/visualization.pdf');
        doc.pipe(fs.createWriteStream(filePath));

        doc.fontSize(12).text(JSON.stringify(data, null, 2), { align: 'left' });
        doc.end();

        logEvent(`Data visualization saved as PDF to ${filePath}`);
    } catch (error) {
        logEvent(`Error saving as PDF: ${error.message}`, 'error');
    }
}

async function saveAsWord(data) {
    try {
        const doc = new Document();
        const filePath = path.resolve(__dirname, '../data/visualization.docx');

        doc.addSection({
            children: [
                new Paragraph({
                    children: [
                        new TextRun(JSON.stringify(data, null, 2))
                    ]
                })
            ]
        });

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(filePath, buffer);

        logEvent(`Data visualization saved as Word document to ${filePath}`);
    } catch (error) {
        logEvent(`Error saving as Word document: ${error.message}`, 'error');
    }
}

module.exports = { saveAsPDF, saveAsWord };
