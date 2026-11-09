import { createClient } from '@supabase/supabase-js';
import { Config } from '../constants/Config';

export const supabase = createClient(Config.supabaseUrl, Config.supabaseAnonKey);

export async function fetchRestaurants() {
  try {
    const res = await fetch(`${Config.apiBaseUrl}/merchants`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.log('Backend API fetch error, fallback to Supabase:', e);
  }

  const { data, error } = await supabase.from('merchants').select('*').limit(20);
  if (error) throw error;
  return data;
}

export async function fetchCategories() {
  try {
    const res = await fetch(`${Config.apiBaseUrl}/categories`);
    if (res.ok) return await res.json();
  } catch (e) {}

  const { data } = await supabase.from('categories').select('*').limit(10);
  return data || [];
}

export async function fetchProductsByMerchant(merchantId: string) {
  try {
    const res = await fetch(`${Config.apiBaseUrl}/products?merchantId=${merchantId}`);
    if (res.ok) return await res.json();
  } catch (e) {}

  const { data } = await supabase.from('products').select('*').eq('merchantId', merchantId);
  return data || [];
}
