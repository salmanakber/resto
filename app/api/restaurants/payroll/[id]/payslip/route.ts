// app/api/restaurants/payroll/[id]/payslip/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsPDF } from 'jspdf';
import { mkdirSync, existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import path from 'path';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1) AUTHENTICATE
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    });
    if (
      !user ||
      !['Admin', 'Restaurant_supervisor', 'Restaurant_manager', 'Restaurant'].includes(
        user.role.name
      )
    ) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2) FETCH PAYROLL + EMPLOYEE
    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            department: true,
          },
        },
        overtimeRecords: true,
        tipRecords: true,
        deductionRecords: true,
      },
    });

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    const companySettings = await prisma.setting.findUnique({
        where: { key: 'company' },
      });
      if (!companySettings) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      const company = JSON.parse(companySettings.value);



    const currency = await prisma.setting.findUnique({
      where: { key: 'currency' },
    });
    if (!currency) {
      return NextResponse.json({ error: 'Currency not found' }, { status: 404 });
    }

    const currentCurrencySettings = JSON.parse(currency.value);
    const defaultCurrency = (
      Object.entries(currentCurrencySettings).find(
        ([_, value]) => (value as any).default
      )?.[0] || 'USD'
    ) as string;
    const currencySymbol = (currentCurrencySettings[defaultCurrency] as any).symbol || '$';

    const netSalary = Number(payroll.baseSalary) + Number(payroll.overtimeRecords.reduce((sum: number, p: any) => Number(sum) + Number(p.amount), 0)) + Number(payroll.tipRecords.reduce((sum: number, p: any) => Number(sum) + Number(p.amount), 0)) - Number(payroll.deductionRecords.reduce((sum: number, p: any) => Number(sum) + Number(p.amount), 0));

    console.log('netSalary', netSalary)

    // 3) SET UP jsPDF + CUSTOM FONT
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40; // left/right margin in points
    let y = 40;       // starting Y position in points

    // Load Roboto-Regular.ttf from /public/fonts
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
    const fontData = readFileSync(fontPath);
    doc.addFileToVFS('Roboto-Regular.ttf', fontData.toString('base64'));
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');

    // 4) HEADER (Logo placeholder / Title / Period)
    doc.setFillColor('#e0e0e0');
    doc.rect(margin, y - 10, 80, 40, 'F'); // 80×40pt placeholder for logo
    doc.setFontSize(10);
    doc.setTextColor('#666');
    doc.text(company.name, margin + 40, y + 10, { align: 'center' });

    // “Payslip” centered
    doc.setFontSize(24);
    doc.setTextColor('#222');
    doc.text('Payslip', pageWidth / 2, y + 10, { align: 'center' });
    // Period (Month Year) on the right
    const monthName = new Date(payroll.year, payroll.month - 1).toLocaleString('default', {
      month: 'long',
    });
    const periodText = `${monthName} ${payroll.year}`;
    doc.setFontSize(12);
    doc.setTextColor('#555');
    doc.text(periodText, pageWidth - margin, y + 15, { align: 'right' });

    y += 60; // move down for next section

    // 5) EMPLOYEE INFORMATION SECTION
    doc.setFillColor('#f0f0f0');
    doc.rect(margin, y - 20, pageWidth - 2 * margin, 30, 'F');
    doc.setFontSize(14);
    doc.setTextColor('#333');
    doc.text('Employee Information', margin + 5, y);
    y += 25;
    

    const infoTableX = margin;
    const infoTableWidth = pageWidth - 2 * margin;
    const infoRowHeight = 18;
    const labelCellWidth = infoTableWidth * 0.3; // 30% for label, 70% for value

    // Only include exactly as many values as labels
    const infoLabels = ['Name', 'Email', 'Phone', 'Department'];
    const infoValues = [
      `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      payroll.employee.email,
      payroll.employee.phone || 'N/A',
      payroll.employee.department || 'N/A',
    ];

    doc.setFontSize(12);
    doc.setTextColor('#000');
    for (let i = 0; i < infoLabels.length; i++) {
      doc.setDrawColor('#ccc');
      doc.rect(infoTableX, y - infoRowHeight + 4, infoTableWidth, infoRowHeight, 'S');
      doc.text(infoLabels[i], infoTableX + 5, y);
      doc.text(infoValues[i], infoTableX + labelCellWidth + 5, y);
      y += infoRowHeight;
    }

    y += 25; // gap before next section

    // 6) SALARY DETAILS SECTION
    doc.setFillColor('#f0f0f0');
    doc.rect(margin, y - 20, pageWidth - 2 * margin, 30, 'F');
    doc.setFontSize(14);
    doc.setTextColor('#333');
    doc.text('Salary Details', margin + 5, y);
    y += 25;

    const salaryTableX = margin;
    const salaryTableWidth = pageWidth - 2 * margin;
    const descColX = salaryTableX + 5;
    const amtColX = salaryTableX + salaryTableWidth - 80;
    const rowHeight = 18;

    doc.setFillColor('#e8e8e8');
    doc.rect(salaryTableX, y - rowHeight + 4, salaryTableWidth, rowHeight, 'F');
    doc.setFontSize(12);
    doc.setTextColor('#000');
    doc.text('Description', descColX, y);
    doc.text('Amount', amtColX + 60, y, { align: 'right' });
    y += rowHeight;

    // Reset to normal weight
    doc.setFont('Roboto');

    const formatCurrency = (amt: number) => {
      const sign = amt < 0 ? '- ' : '';
      return sign + currencySymbol + Math.abs(amt)
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const salaryItems = [
      { label: 'Basic Salary', amount: payroll.baseSalary },
      { label: 'Overtime Pay', amount: payroll.overtimeRecords.reduce((sum: number, p: any) => Number(sum) + Number(p.amount), 0) },
      { label: 'Tips', amount: payroll.tipRecords.reduce((sum: number, p: any) => Number(sum) + Number(p.amount), 0) },
      { label: 'Deductions', amount: payroll.deductionRecords.reduce((sum: number, p: any) => Number(sum) + Number(p.amount), 0) },
    ];
    doc.setFontSize(12);
    doc.setTextColor('#000');
    for (const { label, amount } of salaryItems) {
      doc.setDrawColor('#ccc');
      doc.rect(salaryTableX, y - rowHeight + 4, salaryTableWidth, rowHeight, 'S');
      doc.text(label, descColX, y);
      doc.text(formatCurrency(amount), amtColX + 60, y, { align: 'right' });
      y += rowHeight;
    }

    // Net Salary row (highlighted)
    doc.setFont('Roboto');
    doc.setFillColor('#e8e8e8');
    doc.rect(salaryTableX, y - rowHeight + 4, salaryTableWidth, rowHeight, 'F');
    doc.setDrawColor('#ccc');
    doc.rect(salaryTableX, y - rowHeight + 4, salaryTableWidth, rowHeight, 'S');
    doc.text('Net Salary', descColX, y);
    const netAmt = currencySymbol + netSalary
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    doc.text(netAmt, amtColX + 60, y, { align: 'right' });
    y += rowHeight;

    y += 25; // gap before next section

    // 7) PAYMENT INFORMATION SECTION
    doc.setFillColor('#f0f0f0');
    doc.rect(margin, y - 20, pageWidth - 2 * margin, 30, 'F');
    doc.setFontSize(14);
    doc.setTextColor('#333');
    doc.text('Payment Information', margin + 5, y);
    y += 25;

    const payInfoLabels = ['Status', 'Payment Date'];
    const payInfoValues = [
      payroll.status,
      payroll.paymentDate
        ? new Date(payroll.paymentDate).toLocaleDateString()
        : 'Pending',
    ];
    doc.setFontSize(12);
    doc.setTextColor('#000');
    for (let i = 0; i < payInfoLabels.length; i++) {
      doc.setDrawColor('#ccc');
      doc.rect(infoTableX, y - infoRowHeight + 4, infoTableWidth, infoRowHeight, 'S');
      doc.text(payInfoLabels[i], infoTableX + 5, y);
      doc.text(payInfoValues[i], infoTableX + labelCellWidth + 5, y);
      y += infoRowHeight;
    }

    y += 30; // gap before footer

    // 8) FOOTER NOTE
    doc.setFontSize(10);
    doc.setTextColor('#666');
    doc.text(
      'This is a computer-generated document and does not require a signature.',
      pageWidth / 2,
      y,
      { align: 'center' }
    );

    // 9) OUTPUT PDF AS RAW BINARY AND RETURN IT
    const pdfArrayBuffer = doc.output('arraybuffer');
    // Convert that ArrayBuffer into a Node Buffer:
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // 10) SAVE PDF TO DISK under /public/payslips/…
    const payslipDir = path.join(process.cwd(), 'public', 'payslips');
    if (!existsSync(payslipDir)) {
      mkdirSync(payslipDir, { recursive: true });
    }
    const fileName = `payslip-${payroll.employee.firstName}-${payroll.employee.lastName}-${payroll.month}-${payroll.year}.pdf`;
    const filePath = path.join(payslipDir, fileName);

    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    writeFileSync(filePath, pdfBuffer);

    const payslipUrl = `/payslips/${fileName}`;
    await prisma.payroll.update({
      where: { id },
      data: { payslipUrl },
    });

    return NextResponse.json(payslipUrl);
  } catch (error) {
    console.error('Payslip generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate payslip' },
      { status: 500 }
    );
  }
}
