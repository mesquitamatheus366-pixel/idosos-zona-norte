import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.4";
import * as kv from "./kv_store.tsx";
import { detectAchievements } from "./card_detector.tsx";
const app = new Hono();

// Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Supabase client for auth operations (with anon key)
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize storage buckets on startup
async function initStorage() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    
    // Create player photos bucket
    const playerPhotosBucketExists = buckets?.some(b => b.name === 'make-039eccc6-player-photos');
    if (!playerPhotosBucketExists) {
      await supabaseAdmin.storage.createBucket('make-039eccc6-player-photos', { public: false });
      console.log('Created player photos bucket');
    }
    
    // Create team logos bucket
    const teamLogosBucketExists = buckets?.some(b => b.name === 'make-039eccc6-team-logos');
    if (!teamLogosBucketExists) {
      await supabaseAdmin.storage.createBucket('make-039eccc6-team-logos', { public: false });
      console.log('Created team logos bucket');
    }
  } catch (err) {
    console.log('Error initializing storage:', err);
  }
}

// Call init on startup
initStorage();

// Ensure the KV store table exists (PostgREST schema cache error means the table hasn't been created yet)
let kvReady = false;
let kvInitPromise: Promise<void> | null = null;

async function initKvTable() {
  try {
    // First, test if the table already works via Supabase client
    const testClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const { error: testError } = await testClient.from('kv_store_a86804dd').select('key').limit(1);
    if (!testError) {
      console.log('KV store table already exists and is accessible');
      kvReady = true;
      return;
    }
    console.log('KV table not accessible via PostgREST, creating via direct SQL...', testError.message);

    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) {
      console.log('SUPABASE_DB_URL not set, skipping KV table init');
      // Even without DB URL, mark as ready so requests don't hang
      kvReady = true;
      return;
    }
    const sql = postgres(dbUrl);
    await sql`
      CREATE TABLE IF NOT EXISTS public.kv_store_a86804dd (
        key TEXT NOT NULL PRIMARY KEY,
        value JSONB NOT NULL
      );
    `;
    // Grant permissions
    await sql`GRANT ALL ON public.kv_store_a86804dd TO postgres, anon, authenticated, service_role;`;
    // Notify PostgREST to reload schema cache
    await sql`NOTIFY pgrst, 'reload schema';`;
    console.log('KV store table created and schema cache reloaded');
    await sql.end();
    
    // Wait a moment for PostgREST to pick up the change
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (err) {
    console.log('Error initializing KV table:', err);
  } finally {
    kvReady = true;
  }
}

// Start init immediately
kvInitPromise = initKvTable();

// Middleware: wait for KV table to be ready before processing any request
app.use('*', async (c, next) => {
  if (!kvReady && kvInitPromise) {
    await kvInitPromise;
  }
  await next();
});

// Middleware to verify auth
// The user token is sent via X-User-Token header (not Authorization,
// because the Supabase Edge Function gateway validates Authorization and
// rejects expired user JWTs before they reach our code).
async function requireAuth(c: any, next: any) {
  const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !user) {
    console.log('Auth error:', error, 'token prefix:', accessToken?.substring(0, 20));
    return c.json({ error: `Unauthorized - Invalid token: ${error?.message || 'unknown'}` }, 401);
  }
  
  c.set('userId', user.id);
  await next();
}

// Health check endpoint with KV diagnostics
app.get("/make-server-039eccc6/health", async (c) => {
  try {
    // Test KV connectivity
    let kvStatus = "unknown";
    let dataCounts: any = {};
    try {
      const players = await kv.get('players');
      const matches = await kv.get('matches');
      const shop = await kv.get('shop_items');
      const sponsors = await kv.get('sponsors');
      kvStatus = "ok";
      dataCounts = {
        players: Array.isArray(players) ? players.length : 0,
        matches: Array.isArray(matches) ? matches.length : 0,
        shop_items: Array.isArray(shop) ? shop.length : 0,
        sponsors: Array.isArray(sponsors) ? sponsors.length : 0,
      };
    } catch (kvErr) {
      kvStatus = `error: ${String(kvErr)}`;
    }
    return c.json({ status: "ok", kvReady, kvStatus, dataCounts });
  } catch (err) {
    return c.json({ status: "error", error: String(err) }, 500);
  }
});

// --- SEED DATA ---
// Bulk seed endpoint: accepts all data at once and stores directly (preserving IDs and structure)
app.post("/make-server-039eccc6/seed", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const results: any = {};

    if (body.players && Array.isArray(body.players)) {
      console.log(`Seeding ${body.players.length} players...`);
      await kv.set('players', body.players);
      results.players = body.players.length;
      console.log('Players seeded successfully');
    }

    if (body.matches && Array.isArray(body.matches)) {
      console.log(`Seeding ${body.matches.length} matches...`);
      await kv.set('matches', body.matches);
      results.matches = body.matches.length;
      console.log('Matches seeded successfully');
    }

    if (body.shop_items && Array.isArray(body.shop_items)) {
      console.log(`Seeding ${body.shop_items.length} shop items...`);
      await kv.set('shop_items', body.shop_items);
      results.shop_items = body.shop_items.length;
      console.log('Shop items seeded successfully');
    }

    if (body.sponsors && Array.isArray(body.sponsors)) {
      console.log(`Seeding ${body.sponsors.length} sponsors...`);
      await kv.set('sponsors', body.sponsors);
      results.sponsors = body.sponsors.length;
      console.log('Sponsors seeded successfully');
    }

    console.log('Seed completed:', results);
    return c.json({ success: true, seeded: results });
  } catch (err) {
    console.log('Seed error details:', String(err), JSON.stringify(err));
    return c.json({ error: `Seed failed: ${String(err)}` }, 500);
  }
});

// --- AUTH ---

// Sign up
app.post("/make-server-039eccc6/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: `Signup failed: ${error.message}` }, 400);
    }
    
    return c.json({ user: data.user });
  } catch (err) {
    console.log('Signup error:', err);
    return c.json({ error: `Signup failed: ${err}` }, 500);
  }
});

// --- REACTIONS ---

// GET reactions for a player
app.get("/make-server-039eccc6/reactions/:playerId", async (c) => {
  try {
    const playerId = c.req.param("playerId");
    const counts = await kv.get(`reactions_${playerId}`);
    return c.json({ counts: counts || { "👍": 0, "🔥": 0, "💪": 0, "⚽": 0 } });
  } catch (err) {
    console.log("Error fetching reactions:", err);
    return c.json({ error: `Failed to fetch reactions: ${err}` }, 500);
  }
});

// POST a reaction for a player
// Body: { emoji: string, previousEmoji: string | null }
app.post("/make-server-039eccc6/reactions/:playerId", async (c) => {
  try {
    const playerId = c.req.param("playerId");
    const { emoji, previousEmoji } = await c.req.json();

    // Fetch current counts
    const current = (await kv.get(`reactions_${playerId}`)) || { "👍": 0, "🔥": 0, "💪": 0, "⚽": 0 };

    // Remove previous vote if it exists
    if (previousEmoji && current[previousEmoji] !== undefined) {
      current[previousEmoji] = Math.max((current[previousEmoji] || 0) - 1, 0);
    }

    // Add new vote (emoji is null when toggling off)
    if (emoji && current[emoji] !== undefined) {
      current[emoji] = (current[emoji] || 0) + 1;
    }

    await kv.set(`reactions_${playerId}`, current);

    return c.json({ counts: current });
  } catch (err) {
    console.log("Error saving reaction:", err);
    return c.json({ error: `Failed to save reaction: ${err}` }, 500);
  }
});

// --- TREINADORES ---

// Helper: migrate old single-coach format to coaches array
async function getCoaches(): Promise<any[]> {
  let coaches = await kv.get('coaches');
  if (Array.isArray(coaches) && coaches.length > 0) return coaches;
  
  // Migrate from old single 'coach' key
  const oldCoach = await kv.get('coach');
  if (oldCoach && oldCoach.nome) {
    const migrated = [{ id: 'coach_1', ...oldCoach, atual: true, periodoInicio: '2025', periodoFim: null }];
    await kv.set('coaches', migrated);
    return migrated;
  }
  
  // Default
  const defaults = [
    { id: 'coach_1', nome: 'Lucas Rocha', foto: null, atual: true, periodoInicio: '2025', periodoFim: null },
  ];
  await kv.set('coaches', defaults);
  return defaults;
}

// GET all coaches
app.get("/make-server-039eccc6/coaches", async (c) => {
  try {
    const coaches = await getCoaches();
    return c.json({ coaches });
  } catch (err) {
    console.log('Error fetching coaches:', err);
    return c.json({ error: `Error fetching coaches: ${err}` }, 500);
  }
});

// Backward-compat: GET /coach returns current coach
app.get("/make-server-039eccc6/coach", async (c) => {
  try {
    const coaches = await getCoaches();
    const current = coaches.find((co: any) => co.atual) || coaches[0] || { nome: 'Lucas Rocha', foto: null };
    return c.json({ coach: current });
  } catch (err) {
    console.log('Error fetching coach:', err);
    return c.json({ error: `Error fetching coach: ${err}` }, 500);
  }
});

// POST add new coach (requires auth)
app.post("/make-server-039eccc6/coaches", requireAuth, async (c) => {
  try {
    const data = await c.req.json();
    const coaches = await getCoaches();
    const newId = `coach_${Date.now()}`;
    const newCoach = { id: newId, nome: data.nome || '', foto: data.foto || null, atual: !!data.atual, periodoInicio: data.periodoInicio || '', periodoFim: data.periodoFim || null, aniversario: data.aniversario || null, cargo: data.cargo || 'Treinador' };

    coaches.push(newCoach);
    await kv.set('coaches', coaches);
    return c.json({ coach: newCoach });
  } catch (err) {
    console.log('Error creating coach:', err);
    return c.json({ error: `Error creating coach: ${err}` }, 500);
  }
});

// PUT update coach by ID (requires auth)
app.put("/make-server-039eccc6/coaches/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const coaches = await getCoaches();
    const idx = coaches.findIndex((co: any) => co.id === id);
    if (idx === -1) return c.json({ error: 'Coach not found' }, 404);

    coaches[idx] = { ...coaches[idx], ...data };
    await kv.set('coaches', coaches);
    return c.json({ coach: coaches[idx] });
  } catch (err) {
    console.log('Error updating coach:', err);
    return c.json({ error: `Error updating coach: ${err}` }, 500);
  }
});

// DELETE coach (requires auth)
app.delete("/make-server-039eccc6/coaches/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const coaches = await getCoaches();
    const filtered = coaches.filter((co: any) => co.id !== id);
    if (filtered.length === coaches.length) return c.json({ error: 'Coach not found' }, 404);
    await kv.set('coaches', filtered);
    return c.json({ success: true });
  } catch (err) {
    console.log('Error deleting coach:', err);
    return c.json({ error: `Error deleting coach: ${err}` }, 500);
  }
});

// Backward-compat: PUT /coach updates current coach
app.put("/make-server-039eccc6/coach", requireAuth, async (c) => {
  try {
    const data = await c.req.json();
    const coaches = await getCoaches();
    const idx = coaches.findIndex((co: any) => co.atual);
    if (idx !== -1) {
      coaches[idx] = { ...coaches[idx], ...data };
    } else {
      coaches.push({ id: `coach_${Date.now()}`, ...data, atual: true });
    }
    await kv.set('coaches', coaches);
    return c.json({ coach: coaches[idx !== -1 ? idx : coaches.length - 1] });
  } catch (err) {
    console.log('Error updating coach:', err);
    return c.json({ error: `Error updating coach: ${err}` }, 500);
  }
});

// --- TEMPORADAS ---

const DEFAULT_TEMPORADAS = ['2024', '2025', '2026'];

// GET all temporadas
app.get("/make-server-039eccc6/temporadas", async (c) => {
  try {
    const temporadas = await kv.get('temporadas');
    return c.json({ temporadas: temporadas || DEFAULT_TEMPORADAS });
  } catch (err) {
    console.log('Error fetching temporadas:', err);
    return c.json({ temporadas: DEFAULT_TEMPORADAS });
  }
});

// POST add new temporada (requires auth)
app.post("/make-server-039eccc6/temporadas", requireAuth, async (c) => {
  try {
    const { temporada } = await c.req.json();
    if (!temporada || typeof temporada !== 'string' || !/^\d{4}$/.test(temporada.trim())) {
      return c.json({ error: 'Temporada inválida. Use formato YYYY (ex: 2027)' }, 400);
    }
    const year = temporada.trim();
    const existing = (await kv.get('temporadas')) || [...DEFAULT_TEMPORADAS];
    if (existing.includes(year)) {
      return c.json({ error: `Temporada ${year} já existe` }, 400);
    }
    existing.push(year);
    existing.sort();
    await kv.set('temporadas', existing);
    console.log(`Temporada ${year} added. Current: ${existing.join(', ')}`);
    return c.json({ temporadas: existing });
  } catch (err) {
    console.log('Error adding temporada:', err);
    return c.json({ error: 'Erro ao adicionar temporada: ' + String(err) }, 500);
  }
});

// DELETE temporada (requires auth)
app.delete("/make-server-039eccc6/temporadas/:year", requireAuth, async (c) => {
  try {
    const year = c.req.param('year');
    const existing = (await kv.get('temporadas')) || [...DEFAULT_TEMPORADAS];
    const filtered = existing.filter((t: string) => t !== year);
    if (filtered.length === existing.length) {
      return c.json({ error: `Temporada ${year} não encontrada` }, 404);
    }
    await kv.set('temporadas', filtered);
    console.log(`Temporada ${year} removed. Current: ${filtered.join(', ')}`);
    return c.json({ temporadas: filtered });
  } catch (err) {
    console.log('Error deleting temporada:', err);
    return c.json({ error: 'Erro ao remover temporada: ' + String(err) }, 500);
  }
});

// --- PLAYERS ---

// GET all players
app.get("/make-server-039eccc6/players", async (c) => {
  try {
    const players = await kv.get('players') || [];
    return c.json({ players });
  } catch (err) {
    console.log('Error fetching players:', err);
    return c.json({ error: `Failed to fetch players: ${err}` }, 500);
  }
});

// POST new player (requires auth)
app.post("/make-server-039eccc6/players", requireAuth, async (c) => {
  try {
    const newPlayer = await c.req.json();
    const players = await kv.get('players') || [];
    
    // Generate new ID
    const maxId = players.reduce((max: number, p: any) => Math.max(max, parseInt(p.id)), 0);
    newPlayer.id = String(maxId + 1);
    
    players.push(newPlayer);
    await kv.set('players', players);
    
    return c.json({ player: newPlayer });
  } catch (err) {
    console.log('Error creating player:', err);
    return c.json({ error: `Failed to create player: ${err}` }, 500);
  }
});

// PUT update player (requires auth)
app.put("/make-server-039eccc6/players/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const updatedData = await c.req.json();
    const players = await kv.get('players') || [];
    
    const index = players.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return c.json({ error: 'Player not found' }, 404);
    }
    
    players[index] = { ...players[index], ...updatedData };
    await kv.set('players', players);
    
    return c.json({ player: players[index] });
  } catch (err) {
    console.log('Error updating player:', err);
    return c.json({ error: `Failed to update player: ${err}` }, 500);
  }
});

// DELETE player (requires auth)
app.delete("/make-server-039eccc6/players/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const players = await kv.get('players') || [];
    
    const filtered = players.filter((p: any) => p.id !== id);
    if (filtered.length === players.length) {
      return c.json({ error: 'Player not found' }, 404);
    }
    
    await kv.set('players', filtered);
    
    return c.json({ success: true });
  } catch (err) {
    console.log('Error deleting player:', err);
    return c.json({ error: `Failed to delete player: ${err}` }, 500);
  }
});

// POST reset all player stats to zero (requires auth)
app.post("/make-server-039eccc6/players/reset-stats", requireAuth, async (c) => {
  try {
    const players = await kv.get('players') || [];
    const zeroed = players.map((p: any) => {
      const zeroStats: any = { jogos: 0, gols: 0, assistencias: 0, mvp: 0 };
      if (p.posicao === 'Goleiro') zeroStats.defesas = 0;
      return {
        ...p,
        stats: {
          "2024": { ...zeroStats },
          "2025": { ...zeroStats },
          "2026": { ...zeroStats },
        }
      };
    });
    await kv.set('players', zeroed);
    return c.json({ success: true, count: zeroed.length });
  } catch (err) {
    console.log('Error resetting player stats:', err);
    return c.json({ error: `Failed to reset player stats: ${err}` }, 500);
  }
});

// Upload player photo (requires auth)
app.post("/make-server-039eccc6/upload/player-photo", requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    const playerId = formData.get('playerId');
    
    if (!file || !playerId) {
      return c.json({ error: 'Missing file or playerId' }, 400);
    }
    
    // @ts-ignore
    const buffer = await file.arrayBuffer();
    const fileName = `${playerId}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabaseAdmin.storage
      .from('make-039eccc6-player-photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) {
      console.log('Upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }
    
    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabaseAdmin.storage
      .from('make-039eccc6-player-photos')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);
    
    return c.json({ url: urlData?.signedUrl });
  } catch (err) {
    console.log('Upload error:', err);
    return c.json({ error: `Upload failed: ${err}` }, 500);
  }
});

// Upload coach photo (requires auth)
app.post("/make-server-039eccc6/upload/coach-photo", requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    const coachId = formData.get('coachId');
    
    if (!file || !coachId) {
      return c.json({ error: 'Missing file or coachId' }, 400);
    }
    
    // @ts-ignore
    const buffer = await file.arrayBuffer();
    const fileName = `coach_${coachId}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabaseAdmin.storage
      .from('make-039eccc6-player-photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) {
      console.log('Coach photo upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }
    
    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabaseAdmin.storage
      .from('make-039eccc6-player-photos')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);
    
    return c.json({ url: urlData?.signedUrl });
  } catch (err) {
    console.log('Coach photo upload error:', err);
    return c.json({ error: `Upload failed: ${err}` }, 500);
  }
});

// --- MATCHES ---

// Name → player ID mapping for auto-generating sumula from text fields
const NAME_TO_ID: Record<string, string> = {
  'erik mello': '1',
  'jhon marques': '3',
  'yuri de paula': '4',
  'matheus rego': '5',
  'matheus mesquita': '6',
  'lucas aurnheimer': '7',
  'leandro oscar': '8',
  'hugo dortas': '9',
  'dayvid coelho': '10',
  'henrique lima': '13',
  'edgar marins': '14',
  'jonathan lima': '15',
  'fabricio vieira': '16',
  'andrey gomes': '17',
  'joao pedro': '18',
  'arthur petrone': '19',
  'ramon tertuliano': '20',
  'coutinho': '21',
  'rodrigo diguin': '2',
  'yuri cursino': '11',
  'jorge ribeiro': '12',
  'luiz davi': '22',
};

function parseStatText(text: string): { playerId: string; count: number }[] {
  if (!text || !text.trim()) return [];
  const results: { playerId: string; count: number }[] = [];
  const regex = /([^,()]+?)\s*\((\d+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const name = m[1].trim().toLowerCase();
    const count = parseInt(m[2], 10);
    const playerId = NAME_TO_ID[name];
    if (playerId) {
      results.push({ playerId, count });
    }
  }
  return results;
}

function generateSumulaFromMatch(match: any): any[] | null {
  const golsText = match.golsSadock || '';
  const assistText = match.assistenciasSadock || '';
  if (!golsText.trim() && !assistText.trim()) return null;

  const golsParsed = parseStatText(golsText);
  const assistParsed = parseStatText(assistText);

  const playerMap = new Map<string, any>();

  for (const { playerId, count } of golsParsed) {
    if (!playerMap.has(playerId)) {
      playerMap.set(playerId, { playerId, presente: true, gols: 0, assistencias: 0, defesas: 0, mvp: false });
    }
    playerMap.get(playerId)!.gols += count;
  }

  for (const { playerId, count } of assistParsed) {
    if (!playerMap.has(playerId)) {
      playerMap.set(playerId, { playerId, presente: true, gols: 0, assistencias: 0, defesas: 0, mvp: false });
    }
    playerMap.get(playerId)!.assistencias += count;
  }

  const entries = Array.from(playerMap.values());
  return entries.length > 0 ? entries : null;
}

// POST reset all match stats (sumulas + text fields) (requires auth)
app.post("/make-server-039eccc6/matches/reset-stats", requireAuth, async (c) => {
  try {
    const matches = await kv.get('matches') || [];
    const zeroed = matches.map((m: any) => ({
      ...m,
      sumula: [],
      golsSadock: '',
      assistenciasSadock: '',
      coachPresente: false,
    }));
    await kv.set('matches', zeroed);
    return c.json({ success: true, count: zeroed.length });
  } catch (err) {
    console.log('Error resetting match stats:', err);
    return c.json({ error: `Failed to reset match stats: ${err}` }, 500);
  }
});

// POST generate sumulas for all matches from text fields (requires auth)
app.post("/make-server-039eccc6/matches/generate-sumulas", requireAuth, async (c) => {
  try {
    const matches = await kv.get('matches') || [];
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      // Skip if match already has manually-entered sumula
      if (match.sumula && Array.isArray(match.sumula) && match.sumula.length > 0) {
        skipped++;
        continue;
      }
      const generated = generateSumulaFromMatch(match);
      if (generated) {
        matches[i] = { ...match, sumula: generated };
        updated++;
      }
    }

    await kv.set('matches', matches);
    console.log(`Generated sumulas: ${updated} updated, ${skipped} skipped (already had sumula)`);
    return c.json({ success: true, updated, skipped, total: matches.length });
  } catch (err) {
    console.log('Error generating sumulas:', err);
    return c.json({ error: `Failed to generate sumulas: ${String(err)}` }, 500);
  }
});

// GET all matches
app.get("/make-server-039eccc6/matches", async (c) => {
  try {
    const matches = await kv.get('matches') || [];
    return c.json({ matches });
  } catch (err) {
    console.log('Error fetching matches:', err);
    return c.json({ error: `Failed to fetch matches: ${err}` }, 500);
  }
});

// POST new match (requires auth)
app.post("/make-server-039eccc6/matches", requireAuth, async (c) => {
  try {
    const newMatch = await c.req.json();
    const matches = await kv.get('matches') || [];
    
    // Generate new ID — existing IDs may be "m1", "m2", etc. or plain numbers
    const maxNum = matches.reduce((max: number, m: any) => {
      const num = parseInt(String(m.id).replace(/\D/g, '') || '0');
      return Math.max(max, num);
    }, 0);
    newMatch.id = `m${maxNum + 1}`;
    
    matches.push(newMatch);
    await kv.set('matches', matches);
    
    return c.json({ match: newMatch });
  } catch (err) {
    console.log('Error creating match:', err);
    return c.json({ error: `Failed to create match: ${err}` }, 500);
  }
});

// PUT update match (requires auth)
app.put("/make-server-039eccc6/matches/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const updatedData = await c.req.json();
    const matches = await kv.get('matches') || [];

    const index = matches.findIndex((m: any) => m.id === id);
    if (index === -1) {
      return c.json({ error: 'Match not found' }, 404);
    }

    matches[index] = { ...matches[index], ...updatedData };
    await kv.set('matches', matches);

    // Detect achievements after saving match
    try {
      const players = await kv.get('players') || [];
      const achievements = detectAchievements(matches[index], matches, players);

      if (achievements.length > 0) {
        // Get existing achievements
        const existingAchievements = await kv.get('achievements') || [];

        // Only add new achievements (avoid duplicates for same match)
        const newAchievements = achievements.filter((newAch: any) => {
          return !existingAchievements.some((existing: any) =>
            existing.matchId === newAch.matchId &&
            existing.type === newAch.type &&
            existing.playerId === newAch.playerId
          );
        });

        if (newAchievements.length > 0) {
          await kv.set('achievements', [...existingAchievements, ...newAchievements]);
          console.log(`Detected ${newAchievements.length} new achievements for match ${id}`);
        }
      }
    } catch (achErr) {
      console.log('Error detecting achievements:', achErr);
      // Don't fail the match update if achievement detection fails
    }

    return c.json({ match: matches[index] });
  } catch (err) {
    console.log('Error updating match:', err);
    return c.json({ error: `Failed to update match: ${err}` }, 500);
  }
});

// DELETE match (requires auth)
app.delete("/make-server-039eccc6/matches/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const matches = await kv.get('matches') || [];

    const filtered = matches.filter((m: any) => m.id !== id);
    await kv.set('matches', filtered);

    return c.json({ success: true });
  } catch (err) {
    console.log('Error deleting match:', err);
    return c.json({ error: `Failed to delete match: ${err}` }, 500);
  }
});

// --- MATCH VOTING ---

// POST vote for craque da partida (public, no auth required)
// Body: { playerId: string }
// Uses IP-based rate limiting via votes object structure: { playerId: { total: number, voters: Set<string> } }
app.post("/make-server-039eccc6/matches/:id/vote", async (c) => {
  try {
    const id = c.req.param('id');
    const { playerId } = await c.req.json();

    if (!playerId) {
      return c.json({ error: 'playerId is required' }, 400);
    }

    const matches = await kv.get('matches') || [];
    const index = matches.findIndex((m: any) => m.id === id);

    if (index === -1) {
      return c.json({ error: 'Match not found' }, 404);
    }

    const match = matches[index];

    // Check if voting is open
    if (!match.votingOpen) {
      return c.json({ error: 'Voting is not open for this match' }, 400);
    }

    // Check if player is in the list of candidatos
    const candidatos = match.candidatos || [];
    if (!candidatos.includes(playerId)) {
      return c.json({ error: 'Este jogador não está entre os candidatos' }, 400);
    }

    // Check if player was present in the match
    const playerInSumula = (match.sumula || []).find((s: any) => s.playerId === playerId && s.presente);
    if (!playerInSumula) {
      return c.json({ error: 'Player was not present in this match' }, 400);
    }

    // Get client IP for simple rate limiting (one vote per IP)
    const voterIp = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';

    // Initialize votes structure if needed
    if (!match.votes) {
      match.votes = {};
    }

    // Check if this IP already voted (limit to 1 vote per IP)
    const existingVote = Object.keys(match.votes).find((pid) => {
      const voters = match.votes[pid]?.voters || [];
      return voters.includes(voterIp);
    });

    if (existingVote) {
      // IP already voted, don't allow voting again
      return c.json({ error: 'Você já votou nesta partida' }, 400);
    }

    // Add new vote
    if (!match.votes[playerId]) {
      match.votes[playerId] = { total: 0, voters: [] };
    }
    match.votes[playerId].total += 1;
    match.votes[playerId].voters.push(voterIp);

    matches[index] = match;
    await kv.set('matches', matches);

    return c.json({ success: true, votes: match.votes });
  } catch (err) {
    console.log('Error voting:', err);
    return c.json({ error: `Failed to vote: ${err}` }, 500);
  }
});

// POST open voting for a match (requires auth)
app.post("/make-server-039eccc6/matches/:id/open-voting", requireAuth, async (c) => {
  const id = c.req.param('id');

  // Parse body
  let candidatos: string[] = [];
  try {
    const body = await c.req.json();
    candidatos = body.candidatos || [];
  } catch (e) {
    console.log('Error parsing JSON body for open-voting:', e);
    return c.json({ error: 'Você deve selecionar exatamente 3 candidatos' }, 400);
  }

  if (!Array.isArray(candidatos) || candidatos.length !== 3) {
    return c.json({ error: 'Você deve selecionar exatamente 3 candidatos' }, 400);
  }

  try {
    const matches = await kv.get('matches') || [];
    const index = matches.findIndex((m: any) => m.id === id);

    if (index === -1) {
      return c.json({ error: 'Match not found' }, 404);
    }

    // Verify all candidatos were present in the match
    const match = matches[index];
    const presentPlayerIds = (match.sumula || [])
      .filter((s: any) => s.presente)
      .map((s: any) => s.playerId);

    const allCandidatosPresent = candidatos.every((id: string) => presentPlayerIds.includes(id));
    if (!allCandidatosPresent) {
      return c.json({ error: 'Todos os candidatos devem ter jogado na partida' }, 400);
    }

    matches[index].votingOpen = true;
    matches[index].votes = {};
    matches[index].craqueId = null;
    matches[index].candidatos = candidatos;

    await kv.set('matches', matches);

    return c.json({ success: true, match: matches[index] });
  } catch (err) {
    console.log('Error opening voting:', err);
    return c.json({ error: `Failed to open voting: ${err}` }, 500);
  }
});

// POST close voting and determine craque (requires auth)
app.post("/make-server-039eccc6/matches/:id/close-voting", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const matches = await kv.get('matches') || [];
    const index = matches.findIndex((m: any) => m.id === id);

    if (index === -1) {
      return c.json({ error: 'Match not found' }, 404);
    }

    const match = matches[index];

    // Find player with most votes
    let craqueId = null;
    let maxVotes = 0;

    if (match.votes && Object.keys(match.votes).length > 0) {
      Object.entries(match.votes).forEach(([playerId, voteData]: [string, any]) => {
        if (voteData.total > maxVotes) {
          maxVotes = voteData.total;
          craqueId = playerId;
        }
      });
    }

    match.votingOpen = false;
    match.craqueId = craqueId;

    // If there's a craque, increment their MVP count in the sumula
    if (craqueId && match.sumula) {
      const sumulaIndex = match.sumula.findIndex((s: any) => s.playerId === craqueId);
      if (sumulaIndex !== -1) {
        if (!match.sumula[sumulaIndex].mvp) {
          match.sumula[sumulaIndex].mvp = 0;
        }
        match.sumula[sumulaIndex].mvp += 1;
      }
    }

    matches[index] = match;
    await kv.set('matches', matches);

    return c.json({ success: true, match: matches[index], craqueId, totalVotes: maxVotes });
  } catch (err) {
    console.log('Error closing voting:', err);
    return c.json({ error: `Failed to close voting: ${err}` }, 500);
  }
});

// Upload team logo (requires auth)
app.post("/make-server-039eccc6/upload/team-logo", requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    const teamName = formData.get('teamName');
    
    if (!file || !teamName) {
      return c.json({ error: 'Missing file or teamName' }, 400);
    }
    
    // @ts-ignore
    const buffer = await file.arrayBuffer();
    const fileName = `${teamName}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabaseAdmin.storage
      .from('make-039eccc6-team-logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) {
      console.log('Upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }
    
    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabaseAdmin.storage
      .from('make-039eccc6-team-logos')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);
    
    return c.json({ url: urlData?.signedUrl });
  } catch (err) {
    console.log('Upload error:', err);
    return c.json({ error: `Upload failed: ${err}` }, 500);
  }
});

// Generic image upload (for shop, news, sponsors)
app.post("/make-server-039eccc6/upload/image", requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'general'; // shop, news, sponsor, general
    
    if (!file) {
      return c.json({ error: 'Missing file' }, 400);
    }
    
    // @ts-ignore
    const buffer = await file.arrayBuffer();
    const fileName = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${file.name.split('.').pop()}`;
    
    const bucketName = 'make-039eccc6-uploads';
    
    // Ensure bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((bucket: any) => bucket.name === bucketName);
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(bucketName, { public: false });
    }
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) {
      console.log('Generic image upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }
    
    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);
    
    return c.json({ url: urlData?.signedUrl });
  } catch (err) {
    console.log('Generic image upload error:', err);
    return c.json({ error: `Upload failed: ${err}` }, 500);
  }
});

// --- SHOP ---

// GET shop items
app.get("/make-server-039eccc6/shop", async (c) => {
  try {
    const items = await kv.get('shop_items') || [];
    return c.json({ items });
  } catch (err) {
    console.log('Error fetching shop items:', err);
    return c.json({ error: `Failed to fetch shop items: ${err}` }, 500);
  }
});

// POST shop item (requires auth)
app.post("/make-server-039eccc6/shop", requireAuth, async (c) => {
  try {
    const newItem = await c.req.json();
    const items = await kv.get('shop_items') || [];
    
    const maxId = items.reduce((max: number, i: any) => Math.max(max, parseInt(i.id || '0')), 0);
    newItem.id = String(maxId + 1);
    
    items.push(newItem);
    await kv.set('shop_items', items);
    
    return c.json({ item: newItem });
  } catch (err) {
    console.log('Error creating shop item:', err);
    return c.json({ error: `Failed to create shop item: ${err}` }, 500);
  }
});

// PUT update shop item (requires auth)
app.put("/make-server-039eccc6/shop/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const updatedData = await c.req.json();
    const items = await kv.get('shop_items') || [];
    
    const index = items.findIndex((i: any) => i.id === id);
    if (index === -1) {
      return c.json({ error: 'Item not found' }, 404);
    }
    
    items[index] = { ...items[index], ...updatedData };
    await kv.set('shop_items', items);
    
    return c.json({ item: items[index] });
  } catch (err) {
    console.log('Error updating shop item:', err);
    return c.json({ error: `Failed to update shop item: ${err}` }, 500);
  }
});

// DELETE shop item (requires auth)
app.delete("/make-server-039eccc6/shop/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const items = await kv.get('shop_items') || [];
    
    const filtered = items.filter((i: any) => i.id !== id);
    await kv.set('shop_items', filtered);
    
    return c.json({ success: true });
  } catch (err) {
    console.log('Error deleting shop item:', err);
    return c.json({ error: `Failed to delete shop item: ${err}` }, 500);
  }
});

// --- SPONSORS ---

// GET sponsors
app.get("/make-server-039eccc6/sponsors", async (c) => {
  try {
    const sponsors = await kv.get('sponsors') || [];
    return c.json({ sponsors });
  } catch (err) {
    console.log('Error fetching sponsors:', err);
    return c.json({ error: `Failed to fetch sponsors: ${err}` }, 500);
  }
});

// POST sponsor (requires auth)
app.post("/make-server-039eccc6/sponsors", requireAuth, async (c) => {
  try {
    const newSponsor = await c.req.json();
    const sponsors = await kv.get('sponsors') || [];
    
    const maxId = sponsors.reduce((max: number, s: any) => Math.max(max, parseInt(s.id || '0')), 0);
    newSponsor.id = String(maxId + 1);
    
    sponsors.push(newSponsor);
    await kv.set('sponsors', sponsors);
    
    return c.json({ sponsor: newSponsor });
  } catch (err) {
    console.log('Error creating sponsor:', err);
    return c.json({ error: `Failed to create sponsor: ${err}` }, 500);
  }
});

// PUT update sponsor (requires auth)
app.put("/make-server-039eccc6/sponsors/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const updatedData = await c.req.json();
    const sponsors = await kv.get('sponsors') || [];
    
    const index = sponsors.findIndex((s: any) => s.id === id);
    if (index === -1) {
      return c.json({ error: 'Sponsor not found' }, 404);
    }
    
    sponsors[index] = { ...sponsors[index], ...updatedData };
    await kv.set('sponsors', sponsors);
    
    return c.json({ sponsor: sponsors[index] });
  } catch (err) {
    console.log('Error updating sponsor:', err);
    return c.json({ error: `Failed to update sponsor: ${err}` }, 500);
  }
});

// DELETE sponsor (requires auth)
app.delete("/make-server-039eccc6/sponsors/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const sponsors = await kv.get('sponsors') || [];
    
    const filtered = sponsors.filter((s: any) => s.id !== id);
    await kv.set('sponsors', filtered);
    
    return c.json({ success: true });
  } catch (err) {
    console.log('Error deleting sponsor:', err);
    return c.json({ error: `Failed to delete sponsor: ${err}` }, 500);
  }
});

// --- ACHIEVEMENTS ---

// GET all achievements
app.get("/make-server-039eccc6/achievements", async (c) => {
  try {
    const achievements = await kv.get('achievements') || [];
    return c.json({ achievements });
  } catch (err) {
    console.log('Error fetching achievements:', err);
    return c.json({ error: `Failed to fetch achievements: ${err}` }, 500);
  }
});

// GET achievements for a specific player
app.get("/make-server-039eccc6/achievements/:playerId", async (c) => {
  try {
    const playerId = c.req.param('playerId');
    const achievements = await kv.get('achievements') || [];
    const playerAchievements = achievements.filter((ach: any) => ach.playerId === playerId);
    return c.json({ achievements: playerAchievements });
  } catch (err) {
    console.log('Error fetching player achievements:', err);
    return c.json({ error: `Failed to fetch achievements: ${err}` }, 500);
  }
});

// DELETE achievement (requires auth)
app.delete("/make-server-039eccc6/achievements/:matchId/:type/:playerId", requireAuth, async (c) => {
  try {
    const matchId = c.req.param('matchId');
    const type = c.req.param('type');
    const playerId = c.req.param('playerId');

    const achievements = await kv.get('achievements') || [];
    const filtered = achievements.filter((ach: any) =>
      !(ach.matchId === matchId && ach.type === type && ach.playerId === playerId)
    );

    await kv.set('achievements', filtered);
    return c.json({ success: true });
  } catch (err) {
    console.log('Error deleting achievement:', err);
    return c.json({ error: `Failed to delete achievement: ${err}` }, 500);
  }
});

// --- NEWS ---

// GET news
app.get("/make-server-039eccc6/news", async (c) => {
  try {
    const news = await kv.get('news') || [];
    return c.json({ news });
  } catch (err) {
    console.log('Error fetching news:', err);
    return c.json({ error: `Failed to fetch news: ${err}` }, 500);
  }
});

// POST news (requires auth)
app.post("/make-server-039eccc6/news", requireAuth, async (c) => {
  try {
    const newItem = await c.req.json();
    const news = await kv.get('news') || [];
    
    const maxId = news.reduce((max: number, n: any) => Math.max(max, parseInt(n.id || '0')), 0);
    newItem.id = String(maxId + 1);
    newItem.createdAt = new Date().toISOString();
    
    news.push(newItem);
    await kv.set('news', news);
    
    return c.json({ item: newItem });
  } catch (err) {
    console.log('Error creating news:', err);
    return c.json({ error: `Failed to create news: ${err}` }, 500);
  }
});

// PUT update news (requires auth)
app.put("/make-server-039eccc6/news/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const updatedData = await c.req.json();
    const news = await kv.get('news') || [];
    
    const index = news.findIndex((n: any) => n.id === id);
    if (index === -1) {
      return c.json({ error: 'News item not found' }, 404);
    }
    
    news[index] = { ...news[index], ...updatedData };
    await kv.set('news', news);
    
    return c.json({ item: news[index] });
  } catch (err) {
    console.log('Error updating news:', err);
    return c.json({ error: `Failed to update news: ${err}` }, 500);
  }
});

// DELETE news (requires auth)
app.delete("/make-server-039eccc6/news/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const news = await kv.get('news') || [];
    
    const filtered = news.filter((n: any) => n.id !== id);
    await kv.set('news', filtered);
    
    return c.json({ success: true });
  } catch (err) {
    console.log('Error deleting news:', err);
    return c.json({ error: `Failed to delete news: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);