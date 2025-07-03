import { format } from "date-fns";

interface TaxSettings {
  gst: {
    enabled: boolean;
    taxRate: number;
  };
  pst?: {
    enabled: boolean;
    taxRate: number;
  };
  hst?: {
    enabled: boolean;
    taxRate: number;
  };
}

interface PickupOrderReceiptProps {
  order: {
    orderNumber: string;
    customerDetails: {
      name: string;
      phone: string;
      email: string;
    };
    items: Array<{
      name: string;
      price: number;
      quantity: number;
      selectedAddons?: Array<{
        name: string;
        price: number;
      }>;
    }>;
    totalAmount: string;
    paymentStatus: string;
    pickupTime: string;
    orderType: string;
    dineInCustomer: any;
    status: string;
    otp: string;
    qrCode: string;
  };
  currency: [string, string, string] | null;
  company: any;
  taxSettings: TaxSettings;
}

export const generateReceiptHTML = (order: PickupOrderReceiptProps['order'], currency: [string, string, string] | null, company: any, taxSettings: TaxSettings) => {
  const currencySymbol = currency?.[1] || currency?.symbol || '$';
  const formatMoney = (amount: number) => `${currencySymbol}${amount.toFixed(2)}`;

  const calculateTax = (amount: number) => {
    const gst = taxSettings?.gst.enabled ? amount * (taxSettings.gst.taxRate / 100) : 0;
    const pst = taxSettings?.pst?.enabled ? amount * (taxSettings.pst.taxRate / 100) : 0;
    const hst = taxSettings?.hst?.enabled ? amount * (taxSettings.hst.taxRate / 100) : 0;
    const totalTax = gst + pst + hst;
    return { gst, pst, hst, totalTax, totalAmount: amount + totalTax };
  };

  const discountData = order.discountUsed ? JSON.parse(order.discountUsed) : null;
  const discountHTML = discountData && discountData.amount > 0 ? `
  <div class="flex-between">
    <span>
      ${discountData.type === "loyalty" ? "Discount (loyalty)" :
        discountData.type === "flat" ? "Discount (flat)" :
        discountData.type === "free" ? "Discount (bulk)" : ""}
    </span>
    <span>${formatMoney(discountData.amount)}</span>
  </div>
` : '';


const plusSubtotal = discountData ? Number(order.totalAmount) + Number(discountData.amount) : Number(order.totalAmount);


  function ensureParsedJSON(input) {
    if (typeof input !== 'string') return input;
  
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (e) {
      // Not a valid JSON, return as-is
    }
  
    return input;
  }

  const tax = calculateTax(Number(order.totalAmount));

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt</title>
        <style>
          @media print {
            @page {
              margin: 0;
              size: 80mm 297mm;
            }
            body {
              margin: 0;
              padding: 10px;
              font-family: monospace;
              font-size: 12px;
              width: 80mm;
            }
          }
          body {
            margin: 0;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            width: 80mm;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .header h1 {
            font-size: 14px;
            margin: 0;
            padding: 0;
          }
          .header p {
            margin: 2px 0;
            font-size: 10px;
          }
          .section {
            margin-bottom: 15px;
          }
          .section h2 {
            font-size: 12px;
            margin: 0 0 5px 0;
            padding: 0;
          }
          .section p {
            margin: 2px 0;
            font-size: 10px;
          }
          .items {
            margin-bottom: 15px;
          }
          .item {
            margin-bottom: 5px;
          }
          .item-addon {
            padding-left: 10px;
            font-size: 10px;
          }
          .total {
            border-top: 1px dashed #000;
            padding-top: 5px;
            margin-top: 5px;
            font-weight: bold;
          }
          .qr-code {
            text-align: center;
            margin: 15px 0;
          }
          .qr-code img {
            width: 100px;
            height: 100px;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            margin-top: 15px;
          }
          .flex-between {
            display: flex;
            justify-content: space-between;
          }
        </style>
        <script>
          // Function to close the window
          function closeWindow() {
            window.close();
          }
          
          // Add event listener for afterprint
          window.addEventListener('afterprint', closeWindow);
          
          // Add event listener for beforeunload (in case user cancels print)
          window.addEventListener('beforeunload', closeWindow);
          
          // Set timeout to close window after 5 seconds (in case print dialog is not shown)
          setTimeout(closeWindow, 5000);
        </script>
      </head>
        <body>
          <div class="header">
            <h1>${company ? JSON.parse(company.value).name : 'PICKUP ORDER RECEIPT'}</h1>
            <p>Order #${order.orderNumber}</p>
          </div>

          <div class="section">
            <h2>Customer Details</h2>
            <p>${order.orderType === 'dine-in' ? ensureParsedJSON(order.dineInCustomer)?.name : ensureParsedJSON(order.customerDetails)?.name}</p>
            <p>${order.orderType === 'dine-in' ? ensureParsedJSON(order.dineInCustomer)?.phone : ensureParsedJSON(order.customerDetails)?.phone}</p>
            <p>${order.orderType === 'dine-in' ? ensureParsedJSON(order.dineInCustomer)?.email : ensureParsedJSON(order.customerDetails)?.email}</p>
          
          </div>

          <div class="section">
            <h2>Pickup Details</h2>
            <p>Time: ${order.pickupTime}</p>
            <p>Status: ${order.status.toUpperCase()}</p>
            <p>Payment: ${order.paymentStatus.toUpperCase()}</p>
          </div>

          <div class="section">
            <h2>Order Items</h2>
            <div class="items">
              ${ensureParsedJSON(order.items).map(item => `
                <div class="item">
                  <div class="flex-between">
                    <span>${item.name} x${item.quantity}</span>
                    <span>${formatMoney(item.price * item.quantity)}</span>
                  </div>
                  ${ensureParsedJSON(item.selectedAddons)?.map(addon => `
                    <div class="item-addon flex-between">
                      <span>+ ${addon.name}</span>
                      <span>${formatMoney(addon.price)}</span>
                    </div>
                  `).join('') || ''}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="total">
            <div class="flex-between">
              <span>Subtotal</span>
              <span>${formatMoney(Number(plusSubtotal))}</span>
            </div>
            ${discountHTML}
            ${taxSettings?.gst.enabled ? `
              <div class="flex-between text-sm">
                <span>GST (${taxSettings.gst.taxRate}%)</span>
                <span>${formatMoney(tax.gst)}</span>
              </div>
            ` : ''}
            ${taxSettings?.pst?.enabled ? `
              <div class="flex-between text-sm">
                <span>PST (${taxSettings.pst.taxRate}%)</span>
                <span>${formatMoney(tax.pst)}</span>
              </div>
            ` : ''}
            ${taxSettings?.hst?.enabled ? `
              <div class="flex-between text-sm">
                <span>HST (${taxSettings.hst.taxRate}%)</span>
                <span>${formatMoney(tax.hst)}</span>
              </div>
            ` : ''}
            <div class="flex-between font-bold mt-1">
              <span>Total</span>
              <span>${formatMoney(tax.totalAmount)}</span>
            </div>
          </div>
          ${order.orderType === 'dine-in' ? '' : `
          <div class="qr-code">
            <h2>Verification QR Code</h2>
            <img 
              src="${order.qrCode}" 
              alt="Order QR Code" 
              style="width: 100px; height: 100px; object-fit: contain;"
              onerror="this.style.display='none'"
            />
            <p>OTP: ${order.otp}</p>
          </div>
          `}
          <div class="footer">
            <p>Thank you for your order!</p>
            <p>Please show this receipt when picking up your order.</p>
          </div>
        </body>
      </html>
    `;
  };

  export default function PickupOrderReceipt({ order, currency, company, taxSettings }: PickupOrderReceiptProps) {
    return generateReceiptHTML(order, currency, company, taxSettings);
  } 