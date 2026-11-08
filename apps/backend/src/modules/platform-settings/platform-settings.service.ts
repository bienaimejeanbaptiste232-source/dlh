import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSetting } from '../../database/entities/platform-setting.entity';

@Injectable()
export class PlatformSettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(PlatformSetting)
    private readonly settingsRepo: Repository<PlatformSetting>,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  async getAll() {
    const list = await this.settingsRepo.find();
    const map: Record<string, any> = {};
    for (const item of list) {
      map[item.key] = item.value;
    }
    return {
      settings: map,
      raw: list,
    };
  }

  async getByCategory(category: string) {
    const list = await this.settingsRepo.find({ where: { category } });
    const map: Record<string, any> = {};
    for (const item of list) {
      map[item.key] = item.value;
    }
    return map;
  }

  async updateBulk(updates: Record<string, any>) {
    for (const [key, value] of Object.entries(updates)) {
      let existing = await this.settingsRepo.findOne({ where: { key } });
      if (existing) {
        existing.value = value;
        await this.settingsRepo.save(existing);
      } else {
        existing = this.settingsRepo.create({
          key,
          value,
          category: this.inferCategory(key),
          description: `Paramètre système pour ${key}`,
        });
        await this.settingsRepo.save(existing);
      }
    }
    return this.getAll();
  }

  private inferCategory(key: string): string {
    if (key.startsWith('web_')) return 'web_client';
    if (key.startsWith('mobile_client_')) return 'mobile_client';
    if (key.startsWith('merchant_')) return 'mobile_merchant';
    if (key.startsWith('driver_')) return 'mobile_driver';
    return 'general';
  }

  private async seedDefaults() {
    const defaults: Array<{ key: string; value: any; category: string; description: string }> = [
      // ── GENERAL & SYSTEM ──
      {
        key: 'system_phone',
        value: '+509 40 55 36 36',
        category: 'general',
        description: 'Nimewo telefòn ofisyèl sistèm nan pou tout apèl kliyan ak dispatch',
      },
      {
        key: 'system_whatsapp',
        value: '50940553636',
        category: 'general',
        description: 'Nimewo WhatsApp sipò ak dispatch',
      },
      {
        key: 'operating_hours',
        value: 'Lendi – Dimanch : 08:00 – 22:00',
        category: 'general',
        description: 'Orè fonksyonman platfòm lan nan Cap-Haïtien',
      },
      {
        key: 'city_coverage',
        value: 'Cap-Haïtien & Grand Nò',
        category: 'general',
        description: 'Zòn kouvèti jeneral platfòm lan',
      },

      // ── WEB CLIENT ──
      // Slide 1 - Restoran
      {
        key: 'web_hero_title',
        value: 'Pi bon manje Okap, livre nan adrès ou',
        category: 'web_client',
        description: 'Banyè 1: Gwo tit prensipal (Slide 1 - Restoran)',
      },
      {
        key: 'web_hero_subtitle',
        value: 'Griyad, diri ak djon-djon, pitza ak espesyalite lokal.',
        category: 'web_client',
        description: 'Banyè 1: Sou-tit (Slide 1 - Restoran)',
      },
      {
        key: 'web_hero_tag',
        value: 'Restoran • Cap-Haïtien',
        category: 'web_client',
        description: 'Banyè 1: Ti badj anlè tit la (Slide 1)',
      },
      {
        key: 'web_hero_image',
        value: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=85',
        category: 'web_client',
        description: 'Banyè 1: Foto fon (Slide 1 - Restoran)',
      },
      {
        key: 'web_hero_cta',
        value: 'Wè Meni Restoran Yo',
        category: 'web_client',
        description: 'Banyè 1: Tèks bouton (Slide 1)',
      },

      // Slide 2 - Famasi
      {
        key: 'web_hero_slide2_title',
        value: 'Medikaman ijans ak preskripsyon livrezon rapid',
        category: 'web_client',
        description: 'Banyè 2: Gwo tit (Slide 2 - Famasi)',
      },
      {
        key: 'web_hero_slide2_subtitle',
        value: 'Koneksyon dirèk ak famasi verifye — konfidansyèl, san deplase.',
        category: 'web_client',
        description: 'Banyè 2: Sou-tit (Slide 2 - Famasi)',
      },
      {
        key: 'web_hero_slide2_tag',
        value: 'Famasi • Cap-Haïtien',
        category: 'web_client',
        description: 'Banyè 2: Ti badj anlè tit la (Slide 2)',
      },
      {
        key: 'web_hero_slide2_image',
        value: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1400&q=85',
        category: 'web_client',
        description: 'Banyè 2: Foto fon (Slide 2 - Famasi)',
      },
      {
        key: 'web_hero_slide2_cta',
        value: 'Eksplore Famasi Yo',
        category: 'web_client',
        description: 'Banyè 2: Tèks bouton (Slide 2)',
      },

      // Slide 3 - Makèt & Pwovizyon
      {
        key: 'web_hero_slide3_title',
        value: 'Tout pwovizyon lakay ou an yon sèl kòmand',
        category: 'web_client',
        description: 'Banyè 3: Gwo tit (Slide 3 - Makèt & Episri)',
      },
      {
        key: 'web_hero_slide3_subtitle',
        value: 'Episri, bwason, dlo trete ak tout nesesite kay la san deplase.',
        category: 'web_client',
        description: 'Banyè 3: Sou-tit (Slide 3 - Makèt & Episri)',
      },
      {
        key: 'web_hero_slide3_tag',
        value: 'Makèt • Cap-Haïtien',
        category: 'web_client',
        description: 'Banyè 3: Ti badj anlè tit la (Slide 3)',
      },
      {
        key: 'web_hero_slide3_image',
        value: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=85',
        category: 'web_client',
        description: 'Banyè 3: Foto fon (Slide 3 - Makèt & Episri)',
      },
      {
        key: 'web_hero_slide3_cta',
        value: 'Kòmanse Pwovizyon',
        category: 'web_client',
        description: 'Banyè 3: Tèks bouton (Slide 3)',
      },
      {
        key: 'web_promo_banner_text',
        value: 'Livrezon Express 25–35 Min nan tout Cap-Haïtien • MonCash & Natcash Aksepte',
        category: 'web_client',
        description: 'Tèks bandwòl anons anlè web la',
      },
      {
        key: 'web_delivery_eta',
        value: '25–35 Min',
        category: 'web_client',
        description: 'Tan estimasyon livrezon ki afiche sou web la',
      },

      // ── MOBILE CLIENT APP ──
      {
        key: 'mobile_client_welcome_title',
        value: 'Byenvini sou Delivery Lakay Haiti',
        category: 'mobile_client',
        description: 'Mesaj akèy sou aplikasyon mobil kliyan an',
      },
      {
        key: 'mobile_client_announcement',
        value: 'Kòmand manje cho, medikaman ak pwovizyon fasil nan Okap.',
        category: 'mobile_client',
        description: 'Anons espesyal ki parèt nan tèt aplikasyon kliyan an',
      },
      {
        key: 'mobile_client_support_message',
        value: 'Èske w bezwen èd ak yon kòmand? Rele oswa ekri nou sou WhatsApp nan 40 55 36 36.',
        category: 'mobile_client',
        description: 'Mesaj gid sipò pou kliyan yo',
      },

      // ── MOBILE MERCHANT (MACHANN) ──
      {
        key: 'merchant_portal_notice',
        value: 'Resevwa kòmand an tan reyèl, prepare manje rapid epi kousye ap pase pran yo.',
        category: 'mobile_merchant',
        description: 'Konsiy ak gid pou restoran ak komèsan yo nan aplikasyon yo a',
      },
      {
        key: 'merchant_support_phone',
        value: '+509 40 55 36 36',
        category: 'mobile_merchant',
        description: 'Liy sipò dirèk dedye pou machann yo',
      },
      {
        key: 'merchant_payout_schedule',
        value: 'Règleman otomatik chak Lendi via MonCash, Natcash oswa Vireman',
        category: 'mobile_merchant',
        description: 'Orè ak fason machann yo resevwa peman yo',
      },

      // ── MOBILE DRIVER (LIVRÈ) ──
      {
        key: 'driver_portal_announcement',
        value: 'Kous aktif nan Cap-Haïtien. Respekte sekirite w ak kòd wout la.',
        category: 'mobile_driver',
        description: 'Anons ak konsèy sekirite pou livrè yo',
      },
      {
        key: 'driver_commission_note',
        value: 'Touche komisyon w sou chak kous livre + tip kliyan an 100% pou ou.',
        category: 'mobile_driver',
        description: 'Gid komisyon ak benefis pou kousye yo',
      },
      {
        key: 'driver_dispatch_hotline',
        value: '+509 40 55 36 36',
        category: 'mobile_driver',
        description: 'Liy ijans dispatch pou kousye sou wout',
      },
    ];

    for (const d of defaults) {
      const exists = await this.settingsRepo.findOne({ where: { key: d.key } });
      if (!exists) {
        await this.settingsRepo.save(this.settingsRepo.create(d));
      }
    }
  }
}

