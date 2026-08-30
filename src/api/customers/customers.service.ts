import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from './schemas/customer.schema.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { LytexApiService } from '../billing/services/lytex-api.service.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    private readonly lytexApiService: LytexApiService,
  ) {}

  private validateIdentity(raw: string): string {
    if (!raw || typeof raw !== 'string') throw new BadRequestException('invalid_cpf_cnpj');
    const cleaned = raw.replace(/[\.\-\/\s]/g, '');
    const isValid = /^\d{11}$/.test(cleaned) || /^[a-zA-Z0-9]{14}$/.test(cleaned);
    if (!isValid) throw new BadRequestException('invalid_cpf_cnpj');
    return cleaned;
  }

  private buildClient(data: any) {
    return {
      type: data.cpfCnpj.length > 11 ? 'pj' : 'pf',
      name: data.name,
      cpfCnpj: data.cpfCnpj,
      email: data.email,
      address: data.address,
      isPortalEnabled: false,
    };
  }

  async create(userId: string, data: CreateCustomerDto) {
    const cleanedIdentity = this.validateIdentity(data.cpfCnpj);
    const cleanedData = { ...data, cpfCnpj: cleanedIdentity };

    const lytexPayload = this.buildClient(cleanedData);
    const lytexClient = await this.lytexApiService.createClient(lytexPayload);
    
    if (!lytexClient || !lytexClient._id) {
      throw new InternalServerErrorException('lytex_client_creation_failed');
    }

    const customer = new this.customerModel({
      user: userId,
      ...cleanedData,
      lytexClientId: lytexClient._id,
    });

    return customer.save();
  }

  async findAll(userId: string, search?: string, page?: string, limit?: string) {
    const filter: any = { user: userId };
    
    if (search) {
      const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { email: { $regex: sanitized, $options: 'i' } },
        { cpfCnpj: { $regex: sanitized, $options: 'i' } },
      ];
    }
    
    let query = this.customerModel.find(filter).sort({ createdAt: -1 });

    if (page && limit) {
      let pageNum = parseInt(page, 10) || 1;
      let limitNum = parseInt(limit, 10) || 10;
      
      if (limitNum > 100) limitNum = 100;
      if (limitNum < 1) limitNum = 1;
      if (pageNum < 1) pageNum = 1;
      
      const skip = (pageNum - 1) * limitNum;
      
      const [data, total] = await Promise.all([
        query.skip(skip).limit(limitNum).exec(),
        this.customerModel.countDocuments(filter).exec()
      ]);
      
      const totalPages = Math.max(1, Math.ceil(total / limitNum));
      return { data, total, totalPages, page: pageNum, limit: limitNum };
    }

    return query.exec();
  }

  async findOne(userId: string, id: string) {
    const customer = await this.customerModel.findOne({ _id: id, user: userId }).exec();
    if (!customer) throw new NotFoundException('customer_not_found');
    return customer;
  }

  async update(userId: string, id: string, data: UpdateCustomerDto) {
    const customer = await this.findOne(userId, id);
    
    const updateData = { ...data };
    if (updateData.cpfCnpj) {
      updateData.cpfCnpj = this.validateIdentity(updateData.cpfCnpj);
    }

    const mergedData = { ...customer.toObject(), ...updateData };
    const lytexPayload = this.buildClient(mergedData);
    
    await this.lytexApiService.updateClient(customer.lytexClientId, lytexPayload);

    Object.assign(customer, updateData);
    return customer.save();
  }
}
