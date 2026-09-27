import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export let supabase = null;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('<your-project')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Database] Connected to Supabase:', supabaseUrl);
  } catch (err) {
    console.warn('[Database] Supabase initialization failed, using local store:', err.message);
  }
} else {
  console.log('[Database] No Supabase credentials found, running in local fallback mode.');
}

const LOCAL_DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function getLocalData() {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const dir = path.dirname(LOCAL_DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const initial = { tracked_products: [], scrape_history: [] };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
  } catch (err) {
    console.error('[Database] Local read error:', err.message);
    return { tracked_products: [], scrape_history: [] };
  }
}

function saveLocalData(data) {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Database] Local write error:', err.message);
  }
}

export async function getTrackedProducts() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tracked_products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
      console.warn('[Database] Supabase query failed, falling back to local:', error?.message);
    } catch (err) {
      console.warn('[Database] Supabase query exception:', err.message);
    }
  }
  const local = getLocalData();
  return (local.tracked_products || []).filter(p => p.is_active !== false);
}

export async function getTrackedProductById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tracked_products')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('[Database] Supabase get error:', err.message);
    }
  }
  const local = getLocalData();
  return (local.tracked_products || []).find(p => p.id === id) || null;
}

export async function addTrackedProduct(product) {
  const item = {
    id: product.id || crypto.randomUUID(),
    store_product_id: String(product.store_product_id),
    product_name: product.product_name,
    selected_option_id: String(product.selected_option_id),
    selected_option_label: product.selected_option_label,
    option_axis: product.option_axis || 'Option',
    product_url: product.product_url || `https://demo.inelabteamdev.com/item/${product.store_product_id}`,
    target_price_threshold: product.target_price_threshold ? Number(product.target_price_threshold) : null,
    is_active: true,
    last_scraped_at: product.last_scraped_at || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tracked_products')
        .upsert(item, { onConflict: 'store_product_id,selected_option_id' })
        .select()
        .single();
      if (!error && data) return data;
      console.warn('[Database] Supabase upsert error:', error?.message);
    } catch (err) {
      console.warn('[Database] Supabase upsert exception:', err.message);
    }
  }

  const local = getLocalData();
  local.tracked_products = local.tracked_products || [];
  const existingIdx = local.tracked_products.findIndex(
    p => p.store_product_id === item.store_product_id && p.selected_option_id === item.selected_option_id
  );
  if (existingIdx >= 0) {
    local.tracked_products[existingIdx] = { ...local.tracked_products[existingIdx], ...item, is_active: true };
  } else {
    local.tracked_products.unshift(item);
  }
  saveLocalData(local);
  return item;
}

export async function removeTrackedProduct(id) {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('tracked_products')
        .update({ is_active: false })
        .eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('[Database] Supabase update error:', err.message);
    }
  }
  const local = getLocalData();
  local.tracked_products = (local.tracked_products || []).map(p => {
    if (p.id === id) return { ...p, is_active: false };
    return p;
  });
  saveLocalData(local);
  return true;
}

export async function recordScrapeAttempt(log) {
  const attempt = {
    id: log.id || crypto.randomUUID(),
    tracked_product_id: log.tracked_product_id || null,
    store_product_id: String(log.store_product_id),
    product_name: log.product_name,
    selected_option: log.selected_option,
    timestamp: log.timestamp || new Date().toISOString(),
    price: (log.outcome === 'failed' || log.price === null || log.price === undefined) ? null : Number(log.price),
    stock: (log.outcome === 'failed' || log.stock === null || log.stock === undefined) ? null : Number(log.stock),
    outcome: log.outcome || 'success',
    retry_count: Number(log.retry_count || 0),
    error_message: log.error_message || null,
    duration_ms: log.duration_ms ? Number(log.duration_ms) : 0,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { error } = await supabase.from('scrape_history').insert(attempt);
      if (error) console.warn('[Database] Scrape history insert error:', error.message);
      if (attempt.tracked_product_id && attempt.outcome !== 'failed') {
        await supabase.from('tracked_products')
          .update({ last_scraped_at: attempt.timestamp })
          .eq('id', attempt.tracked_product_id);
      }
    } catch (err) {
      console.warn('[Database] Supabase insert exception:', err.message);
    }
  }

  const local = getLocalData();
  local.scrape_history = local.scrape_history || [];
  local.scrape_history.unshift(attempt);
  if (attempt.tracked_product_id && attempt.outcome !== 'failed') {
    const prod = (local.tracked_products || []).find(p => p.id === attempt.tracked_product_id);
    if (prod) prod.last_scraped_at = attempt.timestamp;
  }
  saveLocalData(local);
  return attempt;
}

export async function getProductHistory(trackedProductId) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('scrape_history')
        .select('*')
        .eq('tracked_product_id', trackedProductId)
        .order('timestamp', { ascending: false });
      if (!error && data) return data;
    } catch (err) {
      console.warn('[Database] Supabase history query error:', err.message);
    }
  }
  const local = getLocalData();
  return (local.scrape_history || [])
    .filter(h => h.tracked_product_id === trackedProductId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function getAllScrapeHistory() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('scrape_history')
        .select('*')
        .order('timestamp', { ascending: false });
      if (!error && data) return data;
    } catch (err) {
      console.warn('[Database] Supabase all history query error:', err.message);
    }
  }
  const local = getLocalData();
  return (local.scrape_history || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
