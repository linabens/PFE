const PDFDocument = require('pdfkit');

/**
 * PdfService
 * Generates a printable invoice for an order and streams it to an HTTP response.
 *
 * Usage:
 *   await PdfService.streamInvoice(order, res);
 */
class PdfService {
  /**
   * Stream a PDF invoice directly to the Express response object.
   * @param {Object} order - Full order object with items (from OrderModel.findById)
   * @param {Object} res   - Express response
   */
  streamInvoice(order, res) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // ── HTTP Headers ──────────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="facture-commande-${order.id}.pdf"`
    );
    doc.pipe(res);

    // ── Helper ────────────────────────────────────────────────────────────────
    const formatPrice = (n) => `${parseFloat(n).toFixed(2)} TND`;

    // ── HEADER ────────────────────────────────────────────────────────────────
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#3B1F08')
      .text(' Coffee Time', { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Votre moment de détente', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#DDDDDD')
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.5);

    // ── ORDER META ────────────────────────────────────────────────────────────
    const metaTop = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('FACTURE / REÇU', 50, metaTop);

    doc
      .font('Helvetica')
      .fillColor('#555555')
      .text(`N° Commande : #${order.id}`, 50)
      .text(`Table : ${order.table_number || order.table_id}`)
      .text(`Date : ${new Date(order.created_at).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })}`)
      .text(`Statut : ${this._translateStatus(order.status)}`);

    doc.moveDown(1);

    // ── ITEMS TABLE HEADER ────────────────────────────────────────────────────
    const tableTop = doc.y;
    const col = { item: 50, qty: 330, unit: 390, subtotal: 480 };

    doc.rect(50, tableTop, 495, 20).fill('#3B1F08');
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .text('ARTICLE', col.item, tableTop + 5)
      .text('QTÉ', col.qty, tableTop + 5, { width: 50, align: 'center' })
      .text('PRIX UNIT', col.unit, tableTop + 5, { width: 80, align: 'right' })
      .text('SOUS-TOTAL', col.subtotal, tableTop + 5, { width: 65, align: 'right' });

    // ── ITEMS ROWS ────────────────────────────────────────────────────────────
    let rowY = tableTop + 22;
    const items = order.items || [];

    items.forEach((item, i) => {
      const bg = i % 2 === 0 ? '#F9F5F0' : '#FFFFFF';
      const rowHeight = 18;

      doc.rect(50, rowY, 495, rowHeight).fill(bg);
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#333333')
        .text(item.product_name || `Produit #${item.product_id}`, col.item, rowY + 4, { width: 270 })
        .text(String(item.quantity), col.qty, rowY + 4, { width: 50, align: 'center' })
        .text(formatPrice(item.unit_price), col.unit, rowY + 4, { width: 80, align: 'right' })
        .text(formatPrice(item.subtotal), col.subtotal, rowY + 4, { width: 65, align: 'right' });

      // Options sub-row
      if (item.options && item.options.length > 0) {
        rowY += rowHeight;
        const optLabels = item.options.map(o => o.option_name).join(', ');
        doc.rect(50, rowY, 495, 14).fill(bg);
        doc
          .fontSize(7.5)
          .fillColor('#888888')
          .text(`  ↳ Options : ${optLabels}`, col.item + 10, rowY + 3, { width: 280 });
      }

      rowY += rowHeight;
    });

    // ── TOTAL ─────────────────────────────────────────────────────────────────
    doc.moveDown(0.5);

    const totalY = rowY + 8;
    doc
      .moveTo(50, totalY)
      .lineTo(545, totalY)
      .strokeColor('#CCCCCC')
      .stroke();

    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#3B1F08')
      .text('TOTAL', col.unit, totalY + 6, { width: 80, align: 'right' })
      .text(formatPrice(order.total_price), col.subtotal, totalY + 6, { width: 65, align: 'right' });

    // ── FOOTER ────────────────────────────────────────────────────────────────
    doc
      .moveDown(3)
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#888888')
      .text('Merci de votre visite ! Revenez nous voir bientôt. ☕', { align: 'center' })
      .moveDown(0.3)
      .text('Coffee Time — Savourez chaque instant.', { align: 'center' });

    doc.end();
  }

  _translateStatus(status) {
    const map = {
      new: 'Nouvelle',
      brewing: 'En préparation (café)',
      preparing: 'En préparation',
      ready: 'Prête',
      completed: 'Complétée',
    };
    return map[status] || status;
  }
}

module.exports = new PdfService();
