// Reusable payment UI elements that can be used independently

export interface QRCodeOptions {
  value: string;
  size?: number;
  theme?: 'light' | 'dark';
  includeText?: boolean;
}

export class QRCodeElement {
  private container: HTMLElement;
  private options: Required<QRCodeOptions>;

  constructor(container: HTMLElement, options: QRCodeOptions) {
    this.container = container;
    this.options = {
      size: 200,
      theme: 'light',
      includeText: true,
      ...options,
    };
    this.render();
  }

  private render() {
    const isDark = this.options.theme === 'dark';
    const bgColor = isDark ? '#2a2a2a' : '#ffffff';
    const borderColor = isDark ? '#404040' : '#e5e5e5';
    const textColor = isDark ? '#ffffff' : '#000000';

    this.container.innerHTML = `
      <div style="
        background: ${bgColor};
        border: 1px solid ${borderColor};
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        max-width: ${this.options.size + 32}px;
        margin: 0 auto;
      ">
        <div style="
          width: ${this.options.size}px;
          height: ${this.options.size}px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          position: relative;
        ">
          ${this.generateQRCode()}
        </div>
        ${this.options.includeText ? `
          <div style="
            font-family: monospace;
            font-size: 12px;
            color: ${textColor};
            word-break: break-all;
            background: ${isDark ? '#1a1a1a' : '#f8f9fa'};
            padding: 8px;
            border-radius: 6px;
            margin-top: 8px;
          ">
            ${this.options.value}
          </div>
          <button onclick="navigator.clipboard.writeText('${this.options.value}')" style="
            background: #FF6B35;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            margin-top: 8px;
          ">
            Copy Address
          </button>
        ` : ''}
      </div>
    `;
  }

  private generateQRCode(): string {
    // This is a placeholder. In production, you'd use a proper QR code library like qrcode.js
    return `
      <div style="
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        color: #666;
        font-size: 14px;
        font-weight: 600;
      ">
        <div style="margin-bottom: 4px;">📱</div>
        <div>QR Code</div>
        <div style="font-size: 10px; margin-top: 4px;">Scan to pay</div>
      </div>
    `;
  }

  public update(options: Partial<QRCodeOptions>) {
    this.options = { ...this.options, ...options };
    this.render();
  }
}

export interface StatusBadgeOptions {
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'expired';
  theme?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
}

export class StatusBadge {
  private container: HTMLElement;
  private options: Required<StatusBadgeOptions>;

  constructor(container: HTMLElement, options: StatusBadgeOptions) {
    this.container = container;
    this.options = {
      theme: 'light',
      size: 'medium',
      ...options,
    };
    this.render();
  }

  private render() {
    const config = this.getStatusConfig();
    const size = this.getSizeConfig();

    this.container.innerHTML = `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: ${config.bg};
        color: ${config.color};
        padding: ${size.padding};
        border-radius: ${size.borderRadius};
        font-size: ${size.fontSize};
        font-weight: 600;
        border: 1px solid ${config.borderColor};
      ">
        <div style="
          width: ${size.iconSize}px;
          height: ${size.iconSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${config.icon}
        </div>
        ${config.text}
      </div>
    `;
  }

  private getStatusConfig() {
    const configs = {
      pending: {
        text: 'Awaiting Payment',
        color: '#D97706',
        bg: '#FEF3C7',
        borderColor: '#FCD34D',
        icon: '⏳'
      },
      processing: {
        text: 'Processing...',
        color: '#2563EB',
        bg: '#DBEAFE',
        borderColor: '#93C5FD',
        icon: '🔄'
      },
      confirmed: {
        text: 'Payment Confirmed',
        color: '#059669',
        bg: '#D1FAE5',
        borderColor: '#6EE7B7',
        icon: '✅'
      },
      failed: {
        text: 'Payment Failed',
        color: '#DC2626',
        bg: '#FEE2E2',
        borderColor: '#FCA5A5',
        icon: '❌'
      },
      expired: {
        text: 'Payment Expired',
        color: '#6B7280',
        bg: '#F3F4F6',
        borderColor: '#D1D5DB',
        icon: '⏰'
      }
    };

    return configs[this.options.status];
  }

  private getSizeConfig() {
    const configs = {
      small: {
        padding: '4px 8px',
        fontSize: '12px',
        borderRadius: '4px',
        iconSize: 12
      },
      medium: {
        padding: '6px 12px',
        fontSize: '14px',
        borderRadius: '6px',
        iconSize: 14
      },
      large: {
        padding: '8px 16px',
        fontSize: '16px',
        borderRadius: '8px',
        iconSize: 16
      }
    };

    return configs[this.options.size];
  }

  public update(options: Partial<StatusBadgeOptions>) {
    this.options = { ...this.options, ...options };
    this.render();
  }
}

export interface AmountDisplayOptions {
  amount_sats: number;
  showUSD?: boolean;
  theme?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
}

export class AmountDisplay {
  private container: HTMLElement;
  private options: Required<AmountDisplayOptions>;

  constructor(container: HTMLElement, options: AmountDisplayOptions) {
    this.container = container;
    this.options = {
      showUSD: true,
      theme: 'light',
      size: 'medium',
      ...options,
    };
    this.render();
  }

  private render() {
    const isDark = this.options.theme === 'dark';
    const textColor = isDark ? '#ffffff' : '#000000';
    const secondaryColor = isDark ? '#cccccc' : '#666666';
    const size = this.getSizeConfig();

    // Simple USD conversion (you'd want to fetch real exchange rates)
    const usdAmount = this.satsToUSD(this.options.amount_sats);

    this.container.innerHTML = `
      <div style="text-align: center;">
        <div style="
          font-size: ${size.primarySize};
          font-weight: bold;
          color: ${textColor};
          margin-bottom: 4px;
        ">
          ${this.formatSats(this.options.amount_sats)} sats
        </div>
        ${this.options.showUSD ? `
          <div style="
            font-size: ${size.secondarySize};
            color: ${secondaryColor};
          ">
            ≈ $${usdAmount.toFixed(2)} USD
          </div>
        ` : ''}
      </div>
    `;
  }

  private getSizeConfig() {
    const configs = {
      small: {
        primarySize: '18px',
        secondarySize: '14px'
      },
      medium: {
        primarySize: '24px',
        secondarySize: '16px'
      },
      large: {
        primarySize: '32px',
        secondarySize: '20px'
      }
    };

    return configs[this.options.size];
  }

  private formatSats(sats: number): string {
    return sats.toLocaleString();
  }

  private satsToUSD(sats: number): number {
    // Simplified conversion: assuming 1 BTC = $45,000 and 1 BTC = 100,000,000 sats
    const btcPrice = 45000;
    const satsPerBTC = 100000000;
    return (sats / satsPerBTC) * btcPrice;
  }

  public update(options: Partial<AmountDisplayOptions>) {
    this.options = { ...this.options, ...options };
    this.render();
  }
}

// Utility functions for creating elements
export const Elements = {
  QRCode: (container: HTMLElement, options: QRCodeOptions) => 
    new QRCodeElement(container, options),
  
  StatusBadge: (container: HTMLElement, options: StatusBadgeOptions) => 
    new StatusBadge(container, options),
  
  AmountDisplay: (container: HTMLElement, options: AmountDisplayOptions) => 
    new AmountDisplay(container, options),
};