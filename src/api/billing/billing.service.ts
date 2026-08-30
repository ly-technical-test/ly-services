import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Charge } from './schemas/charge.schema.js';
import { Customer } from '../customers/schemas/customer.schema.js';
import { IssueChargeDto } from './dto/issue-charge.dto.js';
import { PayCardDto } from './dto/pay-card.dto.js';
import { UsersService } from '../users/users.service.js';
import { LytexApiService } from './services/lytex-api.service.js';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Charge.name) private readonly chargeModel: Model<Charge>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    private readonly usersService: UsersService,
    private readonly lytexApiService: LytexApiService,
  ) {}

  async issueCharge(userId: string, data: IssueChargeDto) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('user_not_found');

    const isObjId = Types.ObjectId.isValid(data.customerId);
    const customer = await this.customerModel.findOne({
      $or: [
        ...(isObjId ? [{ _id: data.customerId }] : []),
        { lytexClientId: data.customerId }
      ],
      user: userId
    }).exec();
    if (!customer) throw new NotFoundException('customer_not_found');

    if (!customer.lytexClientId) {
      throw new BadRequestException('missing_lytex_client_id');
    }

    const dueDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const invoicePayload = {
      _clientId: customer.lytexClientId,
      items: [
        {
          name: data.description,
          quantity: 1,
          value: data.amount,
        },
      ],
      totalValue: data.amount,
      dueDate,
      paymentMethods: {
        pix: { enable: data.payment_method === 'pix' || data.payment_method === 'all' },
        boleto: { enable: data.payment_method === 'boleto' || data.payment_method === 'all' },
        creditCard: { enable: data.payment_method === 'cartao' || data.payment_method === 'all' },
      },
    };

    const resData = await this.lytexApiService.createInvoice(invoicePayload);
    const lytexHashId = resData._hashId;
    const lytexId = resData._id;
    if (!lytexId || !lytexHashId) throw new InternalServerErrorException('lytex_invalid_response');

    return this.chargeModel.create({
      user: new Types.ObjectId(userId),
      customer: customer._id,
      amount: data.amount,
      description: data.description,
      paymentMethod: data.payment_method,
      status: 'PENDING',
      lytexId,
      lytexHashId,
      linkCheckout: resData.linkCheckout,
      linkBoleto: resData.linkBoleto ?? null,
    });
  }

  async simulatePayment(userId: string, chargeId: string, paymentMethod: string) {
    const charge = await this.chargeModel.findOne({ _id: chargeId, user: userId }).exec();
    if (!charge) throw new NotFoundException('charge_not_found');
    if (!paymentMethod) throw new BadRequestException('invalid_payment_method');

    const allowed = charge.paymentMethod === 'all' || charge.paymentMethod === paymentMethod;
    if (!allowed) {
      throw new BadRequestException('payment_method_not_allowed');
    }

    await this.lytexApiService.simulatePayment(charge.lytexId, paymentMethod, charge.amount);

    charge.status = 'PAID';
    return charge.save();
  }

  async payWithCreditCard(userId: string, data: PayCardDto) {
    const charge = await this.chargeModel.findOne({ _id: data.chargeId, user: userId }).populate('customer').exec();
    if (!charge) throw new NotFoundException('charge_not_found');

    const customer = charge.customer as any;
    if (!customer || !customer.lytexClientId) {
      throw new BadRequestException('missing_lytex_client_id');
    }

    const allowedMethods = ['all', 'cartao', 'creditCard'];
    if (!allowedMethods.includes(charge.paymentMethod)) {
      throw new BadRequestException('payment_method_not_allowed');
    }

    const tokenPayload = {
      _clientId: customer.lytexClientId,
      cpfCnpj: customer.cpfCnpj,
      number: data.cardNumber,
      holder: data.holder,
      expiry: data.expiry,
      cvc: data.cvc,
    };

    const tokenData = await this.lytexApiService.tokenizeCard(tokenPayload);
    const cardTokenId = tokenData._id;
    if (!cardTokenId) throw new InternalServerErrorException('card_tokenization_failed');

    const payPayload = {
      _invoiceId: charge.lytexId,
      _cardTokenId: cardTokenId,
      parcels: 1,
      marketTransaction: true,
    };

    await this.lytexApiService.payWithCard(payPayload);

    charge.cardToken = tokenData.cardToken;
    charge.cardValidUntil = tokenData.validUntil;
    charge.cardStatus = tokenData.status;
    charge.cardMethod = data.method || tokenData.type || 'creditCard';
    charge.status = 'PAID';
    return charge.save();
  }

  async listCharges(userId: string, search?: string, status?: string, page?: string, limit?: string) {
    const filter: any = { user: userId };

    if (status) {
      filter.status = status;
    }

    if (search) {
      const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const customers = await this.customerModel.find({ 
        user: userId, 
        name: { $regex: sanitized, $options: 'i' } 
      }, '_id').exec();
      const customerIds = customers.map(c => c._id);

      filter.$or = [
        { description: { $regex: sanitized, $options: 'i' } },
        { customer: { $in: customerIds } },
      ];
    }

    let query = this.chargeModel.find(filter).sort({ createdAt: -1 });

    if (page && limit) {
      let pageNum = parseInt(page, 10) || 1;
      let limitNum = parseInt(limit, 10) || 10;
      
      if (limitNum > 100) limitNum = 100;
      if (limitNum < 1) limitNum = 1;
      if (pageNum < 1) pageNum = 1;
      
      const skip = (pageNum - 1) * limitNum;
      
      const [data, total] = await Promise.all([
        query.skip(skip).limit(limitNum).exec(),
        this.chargeModel.countDocuments(filter).exec()
      ]);
      
      const totalPages = Math.max(1, Math.ceil(total / limitNum));
      return { data, total, totalPages, page: pageNum, limit: limitNum };
    }

    return query.exec();
  }

  async getCharge(chargeId: string) {
    const charge = await this.chargeModel.findById(chargeId).exec();
    if (!charge) throw new NotFoundException('charge_not_found');

    let response: any = { ...charge.toObject() };
    delete response.linkCheckout;
    delete response.user;
    delete response.customer;
    delete response.lytexId;
    delete response.lytexHashId;

    try {
      const invoice = await this.lytexApiService.getInvoice(charge.lytexId);
      const transactions = invoice?.transactions || [];

      const pixTransaction = transactions.find((item: any) => item.pix?.qrcode);
      if (pixTransaction) {
        response.pix = { qrcode: pixTransaction.pix.qrcode };
      }

      const boletoTransaction = transactions.find((item: any) => item.boleto?.barcode);
      if (boletoTransaction?.boleto) {
        response.boleto = {
          barcode: boletoTransaction.boleto.barcode,
          digitableLine: boletoTransaction.boleto.digitableLine,
        };
      }
    } catch (error) {
    }

    if (response.status === 'PAID') {
      delete response.cardToken;
      delete response.cardValidUntil;
      delete response.pix;
      delete response.boleto;
    }

    return response;
  }
}
