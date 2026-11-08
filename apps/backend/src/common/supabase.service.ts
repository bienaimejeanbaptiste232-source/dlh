import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      this.logger.warn('⚠️ SUPABASE_URL non configuré');
      return;
    }

    if (anonKey) {
      this.client = createClient(supabaseUrl, anonKey);
    }

    if (serviceRoleKey) {
      this.adminClient = createClient(supabaseUrl, serviceRoleKey);
      this.logger.log('✅ Supabase Admin Client initialisé avec succès');
    }
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient || this.client;
  }
}
