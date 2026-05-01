/**
 * api.js — Centralized API service layer for GramSphere frontend.
 *
 * All backend calls go through here.
 * The Vite proxy in vite.config.js forwards /api/* to http://127.0.0.1:8000
 */

const API_BASE = '/api';

// ─── Local Mock DB for Frontend Demo ─────────────────────
function getLocalDB() {
  const defaultDB = {
    gigs: [
      { id: 'g1', title: 'Master Weaver', status: 'open', budget: '1500', tokensReward: 3, vendorId: 'Hubli Handlooms', merchant_uid: 'v1', description: 'Need an experienced weaver for traditional silk sarees.' },
      { id: 'g2', title: 'Pottery Apprentice', status: 'open', budget: '800', tokensReward: 1, vendorId: 'Dharwad Pottery', merchant_uid: 'v2', description: 'Looking for someone to help shape clay pots.' },
      { id: 'g3', title: 'Carpenter', status: 'open', budget: '2000', tokensReward: 4, vendorId: 'Shakti Woodworks', merchant_uid: 'v3', description: 'Custom furniture crafting.' },
      { id: 'g4', title: 'Blacksmith', status: 'open', budget: '2500', tokensReward: 5, vendorId: 'Rural Iron Smiths', merchant_uid: 'v4', description: 'Metal forging for agricultural tools.' },
      { id: 'g5', title: 'Organic Farmer', status: 'open', budget: '1200', tokensReward: 2, vendorId: 'Green Acres Co-op', merchant_uid: 'v5', description: 'Assistance needed for harvesting season.' },
      { id: 'g6', title: 'Tailor', status: 'open', budget: '1000', tokensReward: 2, vendorId: 'Mysuru Garments', merchant_uid: 'v6', description: 'Stitching school uniforms in bulk.' },
    ],
    applications: [
      { id: 'app1', gig_id: 'g1', youth_uid: 'y1', status: 'pending', applied_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 'app2', gig_id: 'g2', youth_uid: 'y1', status: 'accepted', applied_at: new Date(Date.now() - 172800000).toISOString() }
    ],
    shops: {},
    users: {},
    workHistory: [
      { entryId: 'w1', user_id: 'y1', submittedAt: new Date(Date.now() - 200000000).toISOString(), aiScore: 92, aiComplexity: 'Advanced', trade: 'Weaving', workDescription: 'Completed a set of 5 traditional sarees for a local wedding.' }
    ]
  };
  try {
    const str = localStorage.getItem('gramsphere_db');
    if (str) return JSON.parse(str);
  } catch (e) {}
  localStorage.setItem('gramsphere_db', JSON.stringify(defaultDB));
  return defaultDB;
}

function saveLocalDB(db) {
  localStorage.setItem('gramsphere_db', JSON.stringify(db));
}

async function handleLocalMock(url, options) {
  const db = getLocalDB();
  const method = options.method || 'GET';
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};

  console.log(`[Mock API] ${method} ${url}`, body);
  await new Promise(r => setTimeout(r, 300)); // slight delay

  // Set Role
  if (url.startsWith('/auth/set-role') && method === 'POST') {
    const userId = new URLSearchParams(url.split('?')[1]).get('user_id');
    if (userId) {
      if (!db.users[userId]) db.users[userId] = { name: 'Priyanshu', trade: 'General', district: 'Hubli', trustScore: 85, skillTokens: 4, networkSize: 12, bio: 'Ready to work.' };
      db.users[userId].role = body.role;
      saveLocalDB(db);
    }
    return { success: true, token: 'mock-jwt-token' };
  }

  // User
  if (url.startsWith('/user/') && method === 'GET') {
    const id = url.split('/')[2];
    return db.users[id] || { name: 'Priyanshu', trade: 'General', district: 'Hubli', trustScore: 85, skillTokens: 4, networkSize: 12, bio: 'Ready to work.' };
  }

  if (url.startsWith('/user/') && method === 'PUT') {
    const id = url.split('/')[2];
    if (!db.users[id]) db.users[id] = { name: 'Priyanshu', trade: 'General', district: 'Hubli', trustScore: 85, skillTokens: 4, networkSize: 12, bio: 'Ready to work.' };
    db.users[id] = { ...db.users[id], ...body };
    saveLocalDB(db);
    return db.users[id];
  }

  // Gigs
  if (url === '/gigs' && method === 'GET') return { gigs: db.gigs };

  if (url === '/recruitment/post-gig' && method === 'POST') {
    const newGig = { id: 'gig_' + Date.now(), status: 'open', created_at: new Date().toISOString(), ...body };
    db.gigs.push(newGig);
    saveLocalDB(db);
    return { success: true, gig: newGig };
  }

  // Applications
  if (url.match(/^\/gigs\/[^\/]+\/apply/) && method === 'POST') {
    const gigId = url.split('/')[2];
    const newApp = { id: 'app_' + Date.now(), gig_id: gigId, youth_uid: body.youth_uid, status: 'pending', applied_at: new Date().toISOString() };
    db.applications.push(newApp);
    saveLocalDB(db);
    return { success: true, application: newApp };
  }

  if (url.startsWith('/applications/mine') && method === 'GET') {
    const youthId = new URLSearchParams(url.split('?')[1]).get('youth_uid');
    const apps = db.applications.filter(a => a.youth_uid === youthId || !youthId).map(a => ({ ...a, gig: db.gigs.find(g => g.id === a.gig_id) }));
    return { applications: apps };
  }

  if (url.match(/^\/gigs\/[^\/]+\/applications(\?.*)?$/) && method === 'GET') {
    const gigId = url.split('/')[2];
    const apps = db.applications.filter(a => a.gig_id === gigId);
    return { applications: apps };
  }

  if (url.match(/^\/gigs\/[^\/]+\/applications\/[^\/]+\/accept/) && method === 'POST') {
    const appId = url.split('/')[4];
    const app = db.applications.find(a => a.id === appId);
    if (app) app.status = 'accepted';
    saveLocalDB(db);
    return { success: true };
  }

  // Merchant Shop & Inventory
  if (url.startsWith('/merchant/shop') && method === 'GET') {
    const uid = new URLSearchParams(url.split('?')[1]).get('merchant_uid');
    return db.shops[uid] || { name: '', description: '', businessType: '' };
  }

  if (url === '/merchant/shop' && method === 'POST') {
    db.shops[body.merchant_uid] = body;
    saveLocalDB(db);
    return { success: true };
  }

  if (url.startsWith('/inventory') && method === 'GET') {
    const vendorId = new URLSearchParams(url.split('?')[1]).get('vendorId');
    return { inventory: db.inventory && db.inventory[vendorId] ? db.inventory[vendorId] : [
      { id: 1, name: 'Hand-woven Silk Saree', stock: 12, price: 4500, category: 'Apparel' },
      { id: 2, name: 'Terracotta Vase', stock: 5, price: 850, category: 'Home Decor' },
    ]};
  }

  if (url === '/inventory/update' && method === 'POST') {
    if (!db.inventory) db.inventory = {};
    db.inventory[body.vendorId] = body.products;
    saveLocalDB(db);
    return { success: true };
  }

  if (url === '/demand-forecast' && method === 'POST') {
    return {
      forecast_month: 'June',
      market_sentiment_summary: 'Demand for traditional apparel is rising due to upcoming local festivals. Stock up on high-margin items.',
      high_demand_items: ['Silk Saree', 'Cotton Dhoti', 'Festive Decor'],
      recommended_restock_timing: 'Restock before the 15th of the month to meet peak demand.'
    };
  }

  if (url === '/generate-listing' && method === 'POST') {
    return {
      title: 'Premium Handcrafted Item',
      description: `Optimized listing for: ${body.productDescription}. Highlights quality, local craftsmanship, and durability.`,
      tags: ['Handcrafted', 'Local', 'Premium']
    };
  }

  if (url === '/merchant/business-types' && method === 'GET') {
    return ['Retail', 'Manufacturing', 'Services', 'Agriculture'];
  }

  // GramLens Mock
  if (url === '/graph/data' && method === 'GET') {
    return {
      nodes: [
        { id: 'n1', name: 'Vendor A', role: 'merchant', trade: 'weaver', trustScore: 90, district: 'Mysuru', lat: 12.3, lng: 76.6 },
        { id: 'n2', name: 'Youth 1', role: 'worker', trade: 'weaver', trustScore: 75, district: 'Mysuru' },
        { id: 'n3', name: 'Vendor B', role: 'merchant', trade: 'potter', trustScore: 88, district: 'Mysuru', lat: 12.32, lng: 76.62 },
        { id: 'n4', name: 'Youth 2', role: 'worker', trade: 'potter', trustScore: 82, district: 'Mysuru' },
      ],
      edges: [
        { id: 'e1', fromUserId: 'n1', toUserId: 'n2', type: 'employment', weight: 1 },
        { id: 'e2', fromUserId: 'n3', toUserId: 'n4', type: 'employment', weight: 1 },
      ]
    };
  }
  if (url === '/graph/velocity' && method === 'GET') return { score: 8.5 };
  if (url === '/graph/bridge-nodes' && method === 'GET') return { bridgeNodes: [{ userId: 'Youth 1', disconnects: 3 }] };
  if (url.match(/^\/cluster\/.*\/stats$/) && method === 'GET') return { network_density: 0.65 };

  // Verify / Work History (Posts)
  if (url.startsWith('/verify/track-record/') && method === 'GET') {
    const userId = url.split('/')[3];
    return { entries: db.workHistory ? db.workHistory.filter(w => w.user_id === userId || !w.user_id) : [] };
  }

  if (url === '/verify/upload-work' && method === 'POST') {
    if (!db.workHistory) db.workHistory = [];
    const newEntry = {
      entryId: 'w_' + Date.now(),
      user_id: body.user_id,
      submittedAt: new Date().toISOString(),
      aiScore: Math.floor(Math.random() * 20) + 75,
      aiComplexity: body.claimed_level || 'Intermediate',
      trade: body.trade || 'General',
      workDescription: body.work_description || 'New evidence uploaded.',
      file_url: body.file_url
    };
    db.workHistory.unshift(newEntry);
    saveLocalDB(db);
    return { success: true, entry: newEntry };
  }

  return { success: true, message: 'Mock fallback triggered.' };
}

// ─── Helper ────────────────────────────────────────────
async function request(url, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using Local Mock API for:', url);
    return handleLocalMock(url, options);
  }
}

// ─── Auth ──────────────────────────────────────────────
export function setRole(userId, role) {
  return request(`/auth/set-role?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ role })
  });
}

// ─── User / Profile ────────────────────────────────────
export function getUser(userId) {
  return request(`/user/${userId}`);
}

export function updateUser(userId, data) {
  return request(`/user/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function getInventory(vendorId) {
  return request(`/inventory?vendorId=${vendorId}`);
}

// ─── SkillFlow ─────────────────────────────────────────
export function completeGig(gigId, youthId, vendorId) {
  return request('/complete-gig', {
    method: 'POST',
    body: JSON.stringify({ gigId, youthId, vendorId }),
  });
}

export function getSkillGap(trade, currentSkills, district, goal) {
  return request('/skill-gap', {
    method: 'POST',
    body: JSON.stringify({ trade, currentSkills, district, goal }),
  });
}

export function uploadProof(userId, skill, file) {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('skill', skill);
  formData.append('file', file);

  return fetch('/api/upload-proof', {
    method: 'POST',
    body: formData,
  }).then(res => res.json());
}

export function matchSchemes(userId) {
  return request(`/match-schemes/${userId}`);
}

// ─── Verification & Track Record ───────────────────────
export function getWorkHistory(userId) {
  return request(`/verify/track-record/${userId}`);
}

export function uploadWorkEvidence(userId, trade, claimedLevel, workDescription, file) {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('trade', trade);
  formData.append('claimed_level', claimedLevel);
  formData.append('work_description', workDescription);
  formData.append('file', file);

  return fetch(`${API_BASE}/verify/upload-work`, {
    method: 'POST',
    body: formData,
  }).then(async res => {
    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }
    return res.json();
  }).catch(err => {
    console.warn('Backend unavailable, using Local Mock API for upload-work');
    return new Promise((resolve) => {
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(handleLocalMock('/verify/upload-work', {
            method: 'POST',
            body: {
              user_id: userId,
              trade,
              claimed_level: claimedLevel,
              work_description: workDescription,
              file_url: reader.result
            }
          }));
        };
        reader.readAsDataURL(file);
      } else {
        resolve(handleLocalMock('/verify/upload-work', {
          method: 'POST',
          body: {
            user_id: userId,
            trade,
            claimed_level: claimedLevel,
            work_description: workDescription,
            file_url: ''
          }
        }));
      }
    });
  });
}

export function verifySkillLive(userId, gigId, requiredSkill, frames) {
  return request('/verify-skill-live', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      gig_id: gigId,
      required_skill: requiredSkill,
      frames,
    }),
  });
}

// ─── BazaarPulse ───────────────────────────────────────
export function updateInventory(vendorId, products) {
  return request('/inventory/update', {
    method: 'POST',
    body: JSON.stringify({ vendorId, products }),
  });
}

export function getDemandForecast(trade, district, month, products) {
  return request('/demand-forecast', {
    method: 'POST',
    body: JSON.stringify({ trade, district, month, products }),
  });
}

export function generateListing(vendorId, productDescription, trade, district) {
  return request('/generate-listing', {
    method: 'POST',
    body: JSON.stringify({ vendorId, productDescription, trade, district }),
  });
}

export function recordSale(vendorId, buyerId, amount, productId) {
  return request('/sale', {
    method: 'POST',
    body: JSON.stringify({ vendorId, buyerId, amount, productId }),
  });
}

// ─── GramLens ──────────────────────────────────────────
export function getGraphData() {
  return request('/graph/data');
}

export function getClusterVelocity() {
  return request('/graph/velocity');
}

export function getBridgeNodes() {
  return request('/graph/bridge-nodes');
}

export function getClusterStats(district) {
  return request(`/cluster/${district}/stats`);
}

// ─── Gigs ──────────────────────────────────────────────
export function getGigs() {
  return request('/gigs');
}

export function applyForGig(gigId, youthUid) {
  return request(`/gigs/${gigId}/apply`, {
    method: 'POST',
    body: JSON.stringify({ youth_uid: youthUid })
  });
}

export function getGigApplications(gigId) {
  return request(`/gigs/${gigId}/applications`);
}

export function acceptApplication(gigId, appId, merchantUid) {
  return request(`/gigs/${gigId}/applications/${appId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ merchant_uid: merchantUid })
  });
}

export function getMyApplications(youthUid) {
  return request(`/applications/mine?youth_uid=${youthUid}`);
}

// ─── Merchant Shop ──────────────────────────────────────────────────────────
export function getMerchantShop(merchantUid) {
  return request(`/merchant/shop?merchant_uid=${merchantUid}`);
}

export function saveMerchantShop(data) {
  return request('/merchant/shop', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getBusinessTypes() {
  return request('/merchant/business-types');
}

// ─── Recruitment Chatbot ──────────────────────────────────────────────────
export function parseGig(merchantUid, text) {
  return request('/recruitment/parse-gig', {
    method: 'POST',
    body: JSON.stringify({ merchant_uid: merchantUid, text }),
  });
}

export function postGig(data) {
  return request('/recruitment/post-gig', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Chatbot ───────────────────────────────────────────
export function sendChatMessage(message, language = 'en') {
  return request('/chatbot', {
    method: 'POST',
    body: JSON.stringify({ message, language }),
  });
}
