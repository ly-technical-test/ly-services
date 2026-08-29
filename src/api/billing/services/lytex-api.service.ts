import { Injectable, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LytexApiService {
  private get lytexBaseUrl(): string {
    return this.configService.getOrThrow<string>('LYTEX_BASE_URL');
  }

  constructor(private readonly configService: ConfigService) {}

  private async getLytexToken(): Promise<string> {
    const clientId = this.configService.getOrThrow<string>('LYTEX_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>('LYTEX_CLIENT_SECRET');

    const response = await fetch(`${this.lytexBaseUrl}/auth/obtain_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grantType: 'clientCredentials', clientId, clientSecret }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new InternalServerErrorException(`lytex_auth_failed: ${err}`);
    }
    const data = (await response.json()) as any;
    return data.accessToken;
  }

  async createClient(clientPayload: any): Promise<any> {
    const token = await this.getLytexToken();
    const response = await fetch(`${this.lytexBaseUrl}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(clientPayload),
    });

    if (response.status === 409) throw new ConflictException('lytex_client_already_exists');

    if (!response.ok) {
      const err = await response.text();
      throw new InternalServerErrorException(`lytex_client_creation_failed: ${err}`);
    }
    return response.json();
  }

  async updateClient(clientId: string, clientPayload: any): Promise<any> {
    const token = await this.getLytexToken();
    const response = await fetch(`${this.lytexBaseUrl}/clients/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(clientPayload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new InternalServerErrorException(`lytex_client_update_failed: ${err}`);
    }
    return response.json();
  }

  async createInvoice(invoicePayload: any): Promise<any> {
    const token = await this.getLytexToken();
    const response = await fetch(`${this.lytexBaseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new InternalServerErrorException(`lytex_invoice_failed: ${err}`);
    }
    return response.json();
  }

  async simulatePayment(invoiceId: string, paymentMethod: string, paidValue: number): Promise<any> {
    const token = await this.getLytexToken();
    const response = await fetch(`${this.lytexBaseUrl}/invoices/${invoiceId}/manual-liquidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        paymentMethod, 
        paidValue, 
        paidDate: new Date(Date.now() + 86400000).toISOString() 
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new InternalServerErrorException(`lytex_simulation_failed: ${err}`);
    }
    return response.json();
  }

  async tokenizeCard(tokenPayload: any): Promise<any> {
    const token = await this.getLytexToken();
    const response = await fetch(`${this.lytexBaseUrl}/invoices/card_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(tokenPayload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new InternalServerErrorException(`card_tokenization_failed: ${err}`);
    }
    return response.json();
  }

  async payWithCard(payPayload: any): Promise<any> {
    const token = await this.getLytexToken();
    const response = await fetch(`${this.lytexBaseUrl}/invoices/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payPayload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new InternalServerErrorException(`card_payment_failed: ${err}`);
    }
    return response.json();
  }
}
