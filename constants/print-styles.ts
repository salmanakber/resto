export const printStyles = `
  @media print {
    @page {
      size: 80mm 297mm;
      margin: 0;
    }

    body * {
      visibility: hidden;
    }

    .print-section, .print-section * {
      visibility: visible;
    }

    .print-section {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 80mm;
      background-color: white;
      padding: 20px;
      font-size: 12px;
      line-height: 1.4;
    }

    .print-section h2 {
      font-size: 16px;
      margin-bottom: 4px;
    }

    .print-section h3 {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .print-section .text-sm {
      font-size: 10px;
    }

    .print-section .border-t,
    .print-section .border-b {
      border-color: #000;
      border-width: 1px;
    }

    .print-section .mb-4 {
      margin-bottom: 12px;
    }

    .print-section .pt-4 {
      padding-top: 12px;
    }

    .print-section .py-4 {
      padding-top: 12px;
      padding-bottom: 12px;
    }

    .print-section .pl-4 {
      padding-left: 12px;
    }

    .no-print {
      display: none !important;
    }

    .print-divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }

    .print-section .receipt-header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
    }

    .print-section .receipt-footer {
      text-align: center;
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px dashed #000;
    }
  }
`
