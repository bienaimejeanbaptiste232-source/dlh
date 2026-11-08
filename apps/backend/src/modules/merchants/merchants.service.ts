import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../database/entities/merchant.entity';
import { Product } from '../../database/entities/product.entity';
import { Category } from '../../database/entities/category.entity';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(query?: { search?: string; type?: string; zoneId?: string }) {
    const qb = this.merchantRepo.createQueryBuilder('m');

    if (query?.type) {
      qb.andWhere('m.type = :type', { type: query.type });
    }

    if (query?.zoneId) {
      qb.andWhere('m.zoneId = :zoneId', { zoneId: query.zoneId });
    }

    if (query?.search) {
      qb.andWhere('LOWER(m.name) LIKE LOWER(:search) OR LOWER(m.address) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    return await qb.orderBy('m.isOpen', 'DESC').addOrderBy('m.createdAt', 'DESC').getMany();
  }

  async findOne(id: string) {
    const merchant = await this.merchantRepo.findOne({
      where: { id },
      relations: ['zone'],
    });

    if (!merchant) {
      throw new NotFoundException('Restaurant ou boutique introuvable.');
    }

    const categories = await this.categoryRepo.find({
      where: { merchantId: id, isActive: true },
      order: { sortOrder: 'ASC' },
    });

    const products = await this.productRepo.find({
      where: { merchantId: id, isAvailable: true },
      order: { createdAt: 'ASC' },
    });

    return {
      merchant,
      categories,
      products,
    };
  }

  async toggleStatus(id: string, isOpen: boolean) {
    const merchant = await this.merchantRepo.findOne({ where: { id } });
    if (!merchant) throw new NotFoundException('Établissement introuvable');
    merchant.isOpen = isOpen;
    return await this.merchantRepo.save(merchant);
  }
}
