import { Controller, Get, Post, Put, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async create(@Request() req: any, @Body() data: CreateCustomerDto) {
    return this.customersService.create(req.user.userId, data);
  }

  @Get()
  async findAll(@Request() req: any, @Query('search') search?: string) {
    return this.customersService.findAll(req.user.userId, search);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.customersService.findOne(req.user.userId, id);
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() data: UpdateCustomerDto) {
    return this.customersService.update(req.user.userId, id, data);
  }
}
