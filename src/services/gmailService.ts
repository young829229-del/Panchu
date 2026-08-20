import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { Order } from '../types';

// Declared OAuth scopes for Gmail integration as configured in GCP OAuth
export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing'
];

// In-memory token cache (never stored in localStorage)
let cachedAccessToken: string | null = null;
let connectedUserEmail: string | null = null;

export function getGmailAccessToken(): string | null {
  return cachedAccessToken;
}

export function getConnectedGmailEmail(): string | null {
  return connectedUserEmail;
}

export function setGmailAccessToken(token: string | null, email?: string | null): void {
  cachedAccessToken = token;
  if (email !== undefined) {
    connectedUserEmail = email;
  }
}

export function disconnectGmail(): void {
  cachedAccessToken = null;
  connectedUserEmail = null;
}

/**
 * Initiates Google OAuth Popup with Gmail scopes to acquire access token
 */
export async function connectGmail(): Promise<{ token: string; email: string }> {
  const provider = new GoogleAuthProvider();
  GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({ prompt: 'consent' });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error('Failed to obtain Google access token for Gmail.');
  }

  cachedAccessToken = credential.accessToken;
  connectedUserEmail = result.user.email || null;

  return {
    token: cachedAccessToken,
    email: connectedUserEmail || ''
  };
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
}

/**
 * Base64 URL safe encoding for MIME emails
 */
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send an email directly via Gmail API using authorized Bearer token
 */
export async function sendGmailEmail(options: {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  fromName?: string;
}): Promise<{ id: string; threadId: string }> {
  const token = getGmailAccessToken();
  if (!token) {
    throw new Error('Gmail is not connected. Please connect your Google account with Gmail permissions first.');
  }

  const senderEmail = connectedUserEmail || auth.currentUser?.email || 'panchuknows999@gmail.com';
  const senderDisplayName = options.fromName || 'PANCHU Official';

  const boundary = `__boundary_${Date.now()}__`;
  let rawMessage = '';

  if (options.bodyHtml) {
    rawMessage = [
      `From: "${senderDisplayName}" <${senderEmail}>`,
      `To: <${options.to.trim()}>`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      options.bodyText,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      options.bodyHtml,
      '',
      `--${boundary}--`
    ].join('\r\n');
  } else {
    rawMessage = [
      `From: "${senderDisplayName}" <${senderEmail}>`,
      `To: <${options.to.trim()}>`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      '',
      options.bodyText
    ].join('\r\n');
  }

  const encodedMessage = base64UrlEncode(rawMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedMessage })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || response.statusText;
    if (response.status === 401) {
      cachedAccessToken = null;
      throw new Error('Gmail session expired. Please re-authenticate your Google account.');
    }
    throw new Error(`Gmail API error: ${errorMsg}`);
  }

  return response.json();
}

/**
 * Fetch recent Gmail messages/inbox threads
 */
export async function fetchRecentGmailMessages(query = '', maxResults = 10): Promise<GmailMessageSummary[]> {
  const token = getGmailAccessToken();
  if (!token) {
    throw new Error('Gmail is not connected.');
  }

  const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  listUrl.searchParams.set('maxResults', maxResults.toString());
  if (query) {
    listUrl.searchParams.set('q', query);
  }

  const listRes = await fetch(listUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!listRes.ok) {
    if (listRes.status === 401) {
      cachedAccessToken = null;
      throw new Error('Gmail session expired. Please reconnect.');
    }
    throw new Error(`Failed to list messages: ${listRes.statusText}`);
  }

  const listData = await listRes.json();
  if (!listData.messages || !Array.isArray(listData.messages)) {
    return [];
  }

  const summaries: GmailMessageSummary[] = [];

  for (const msg of listData.messages.slice(0, maxResults)) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!msgRes.ok) continue;
      const data = await msgRes.json();

      const headers = data.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      summaries.push({
        id: data.id,
        threadId: data.threadId,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject') || '(No Subject)',
        snippet: data.snippet || '',
        date: getHeader('Date')
      });
    } catch {
      // Continue next message
    }
  }

  return summaries;
}

/**
 * Generate branded HTML email templates for Panchu store orders
 */
export function buildOrderEmailHtml(order: Order, type: 'confirmation' | 'shipped' | 'delivered' | 'cancelled'): { subject: string; html: string; text: string } {
  const titles = {
    confirmation: 'Order Confirmation — Panchu',
    shipped: 'Your Panchu Order is on the Way!',
    delivered: 'Your Panchu Order Has Been Delivered',
    cancelled: 'Update regarding your Panchu Order'
  };

  const statusHeadlines = {
    confirmation: 'Thank you for your order.',
    shipped: 'Good news! Your order has been dispatched and is on its way.',
    delivered: 'Your package has arrived! We hope you love your pieces.',
    cancelled: 'Your order status has been updated.'
  };

  const subject = `${titles[type]} (Order #${order.orderId})`;

  const itemsRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
          <div style="font-weight: 600; color: #18181b; font-size: 14px;">${item.productName}</div>
          <div style="color: #71717a; font-size: 12px; margin-top: 2px;">Size: ${item.selectedSize} &nbsp;|&nbsp; Qty: ${item.quantity}</div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600; color: #18181b; font-size: 14px;">
          ₹${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${subject}</title>
      </head>
      <body style="margin:0; padding:24px 0; background-color:#f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #f4f4f5;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.15em; color: #18181b; text-transform: uppercase;">PANCHU</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; letter-spacing: 0.2em; color: #a1a1aa; text-transform: uppercase;">EST. 2024</p>
            </td>
          </tr>

          <!-- Hero Message -->
          <tr>
            <td style="padding: 32px 32px 16px 32px;">
              <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #18181b;">${statusHeadlines[type]}</h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #52525b;">
                Hi <strong>${order.customerName}</strong>, here is the summary for your recent order <strong>#${order.orderId}</strong>.
              </p>
            </td>
          </tr>

          <!-- Order Summary Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                <thead>
                  <tr>
                    <th align="left" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #a1a1aa; padding-bottom: 8px; border-bottom: 2px solid #18181b;">Items</th>
                    <th align="right" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #a1a1aa; padding-bottom: 8px; border-bottom: 2px solid #18181b;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                <tr>
                  <td style="font-size: 13px; color: #71717a; padding: 4px 0;">Subtotal</td>
                  <td style="font-size: 13px; color: #18181b; text-align: right; padding: 4px 0;">₹${order.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #71717a; padding: 4px 0;">Delivery</td>
                  <td style="font-size: 13px; color: #18181b; text-align: right; padding: 4px 0;">${order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</td>
                </tr>
                <tr>
                  <td style="font-size: 16px; font-weight: 700; color: #18181b; padding-top: 12px; border-top: 1px solid #e4e4e7;">Total Amount</td>
                  <td style="font-size: 16px; font-weight: 700; color: #18181b; text-align: right; padding-top: 12px; border-top: 1px solid #e4e4e7;">₹${order.total.toLocaleString()}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 16px 20px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; font-weight: 700; margin-bottom: 6px;">Shipping Details</div>
                <div style="font-size: 13px; color: #18181b; line-height: 1.5;">
                  <strong>${order.customerName}</strong><br />
                  ${order.address}<br />
                  ${order.location ? `${order.location}<br />` : ''}
                  Phone: ${order.phone}
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #18181b; text-align: center; color: #a1a1aa; font-size: 12px;">
              <p style="margin: 0 0 6px 0; color: #ffffff; font-weight: 600;">PANCHU CLOTHING</p>
              <p style="margin: 0; line-height: 1.5;">For questions regarding your order, reply directly to this email or contact support at panchuknows999@gmail.com.</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
PANCHU CLOTHING
${titles[type]}
Order #${order.orderId}

Hi ${order.customerName},
${statusHeadlines[type]}

ORDER SUMMARY:
${order.items.map((i) => `- ${i.productName} (Size: ${i.selectedSize}, Qty: ${i.quantity}) - ₹${i.price * i.quantity}`).join('\n')}

Subtotal: ₹${order.subtotal}
Delivery: ${order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
Total: ₹${order.total}

DELIVERY ADDRESS:
${order.customerName}
${order.address}
${order.location || ''}
Phone: ${order.phone}

If you have any questions, reply to this email.
Thank you for shopping with PANCHU!
  `.trim();

  return { subject, html, text };
}
