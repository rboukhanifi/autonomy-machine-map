import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      website TEXT,
      hq_city TEXT,
      hq_country TEXT,
      regions TEXT DEFAULT '[]',
      category TEXT,
      one_liner TEXT,
      description TEXT,
      sensors TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      scale_hours INTEGER,
      collectors INTEGER,
      verification_status TEXT DEFAULT 'Unverified',
      proof_links TEXT DEFAULT '[]',
      contact_email TEXT,
      lat REAL,
      lng REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_email TEXT NOT NULL,
      sensors TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      region TEXT,
      environment TEXT,
      hours INTEGER,
      timeline TEXT,
      budget TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed data if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM companies').get() as { c: number };
  if (count.c === 0) {
    seedData(db);
  }
}

function seedData(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO companies (name, website, hq_city, hq_country, regions, category, one_liner, description, sensors, tags, scale_hours, collectors, verification_status, lat, lng, contact_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const companies = [
    {
      name: 'Aria Research',
      website: 'https://aria.meta.com',
      hq_city: 'Menlo Park',
      hq_country: 'USA',
      regions: JSON.stringify(['North America', 'Global']),
      category: 'Lab',
      one_liner: 'Egocentric multi-modal AI research glasses by Meta',
      description: 'Project Aria develops always-on egocentric sensing glasses for AR/AI research. Captures multi-modal data including RGB, eye tracking, IMU, spatial audio, and more.',
      sensors: JSON.stringify(['RGB', 'IMU', 'Gaze', 'Audio', 'Depth']),
      tags: JSON.stringify(['Multi-modal', 'Robotics', 'VLA']),
      scale_hours: 10000,
      collectors: 500,
      verification_status: 'Verified',
      lat: 37.45,
      lng: -122.18,
      contact_email: 'aria@meta.com',
    },
    {
      name: 'Ego4D Consortium',
      website: 'https://ego4d-data.org',
      hq_city: 'Pittsburgh',
      hq_country: 'USA',
      regions: JSON.stringify(['Global']),
      category: 'Lab',
      one_liner: 'Massive-scale egocentric video dataset from 13 universities',
      description: 'Ego4D is a large-scale egocentric video dataset and benchmark suite collected by a consortium of 13 universities worldwide. Over 3,670 hours of daily-life activity video.',
      sensors: JSON.stringify(['RGB', 'Audio', 'IMU', 'Gaze']),
      tags: JSON.stringify(['Multi-modal', 'Home', 'Industrial']),
      scale_hours: 3670,
      collectors: 930,
      verification_status: 'Verified',
      lat: 40.44,
      lng: -79.99,
      contact_email: 'ego4d@fb.com',
    },
    {
      name: 'EgoExo4D',
      website: 'https://ego-exo4d-data.org',
      hq_city: 'Pittsburgh',
      hq_country: 'USA',
      regions: JSON.stringify(['Global']),
      category: 'Lab',
      one_liner: 'Simultaneous egocentric and exocentric activity capture',
      description: 'EgoExo4D captures paired ego and exo video of skilled activities. Enables research in procedure understanding, body pose, and hand-object interaction.',
      sensors: JSON.stringify(['RGB', 'Audio', 'IMU', 'Hands']),
      tags: JSON.stringify(['Multi-modal', 'Industrial']),
      scale_hours: 1400,
      collectors: 740,
      verification_status: 'Verified',
      lat: 40.46,
      lng: -79.95,
      contact_email: 'egoexo@meta.com',
    },
    {
      name: 'TeleMoMa Lab',
      website: 'https://telemoma.github.io',
      hq_city: 'Stanford',
      hq_country: 'USA',
      regions: JSON.stringify(['North America']),
      category: 'Lab',
      one_liner: 'Teleoperation data collection for mobile manipulation',
      description: 'TeleMoMa is a modular teleoperation framework for collecting demonstration data for mobile manipulation robots using multi-modal human interfaces.',
      sensors: JSON.stringify(['RGB', 'Depth', 'IMU', 'Hands']),
      tags: JSON.stringify(['Robotics', 'Teleop', 'VLA']),
      scale_hours: 200,
      collectors: 30,
      verification_status: 'Verified',
      lat: 37.43,
      lng: -122.17,
      contact_email: 'telemoma@stanford.edu',
    },
    {
      name: 'EPIC Kitchens',
      website: 'https://epic-kitchens.github.io',
      hq_city: 'Bristol',
      hq_country: 'UK',
      regions: JSON.stringify(['Europe']),
      category: 'Lab',
      one_liner: 'Largest egocentric cooking activity dataset',
      description: 'EPIC-KITCHENS is the largest dataset in first-person vision, featuring unscripted cooking activities recorded in native kitchen environments across multiple countries.',
      sensors: JSON.stringify(['RGB', 'Audio', 'Hands']),
      tags: JSON.stringify(['Home', 'Multi-modal']),
      scale_hours: 100,
      collectors: 45,
      verification_status: 'Verified',
      lat: 51.45,
      lng: -2.59,
      contact_email: 'epic@bristol.ac.uk',
    },
    {
      name: 'Assembly101',
      website: 'https://assembly-101.github.io',
      hq_city: 'Munich',
      hq_country: 'Germany',
      regions: JSON.stringify(['Europe']),
      category: 'Lab',
      one_liner: 'Procedural assembly understanding from ego+exo views',
      description: 'Assembly101 provides multi-view egocentric and fixed-camera recordings of people assembling and disassembling take-apart toys, with fine-grained temporal annotations.',
      sensors: JSON.stringify(['RGB', 'Depth', 'Hands']),
      tags: JSON.stringify(['Industrial', 'Multi-modal']),
      scale_hours: 513,
      collectors: 53,
      verification_status: 'Verified',
      lat: 48.14,
      lng: 11.58,
      contact_email: 'assembly101@tum.de',
    },
    {
      name: 'SenseTime Ego',
      website: 'https://sensetime.com',
      hq_city: 'Shanghai',
      hq_country: 'China',
      regions: JSON.stringify(['Asia', 'Global']),
      category: 'Platform',
      one_liner: 'Large-scale egocentric data platform for embodied AI',
      description: 'SenseTime operates large-scale egocentric data collection infrastructure supporting embodied AI training across industrial and home environments in Asia.',
      sensors: JSON.stringify(['RGB', 'Depth', 'IMU', 'Hands', 'Audio']),
      tags: JSON.stringify(['Industrial', 'Home', 'Robotics', 'VLA']),
      scale_hours: 50000,
      collectors: 2000,
      verification_status: 'Verified',
      lat: 31.23,
      lng: 121.47,
      contact_email: 'ego@sensetime.com',
    },
    {
      name: 'Surreal Robotics',
      website: 'https://surreal.stanford.edu',
      hq_city: 'Stanford',
      hq_country: 'USA',
      regions: JSON.stringify(['North America']),
      category: 'Lab',
      one_liner: 'Scalable robot learning from human demonstrations',
      description: 'SURREAL lab develops frameworks for scalable robot learning through large-scale human demonstration collection using VR teleoperation and egocentric recording.',
      sensors: JSON.stringify(['RGB', 'Depth', 'Hands', 'IMU']),
      tags: JSON.stringify(['Robotics', 'Teleop', 'VLA']),
      scale_hours: 800,
      collectors: 50,
      verification_status: 'Verified',
      lat: 37.42,
      lng: -122.16,
      contact_email: 'surreal@stanford.edu',
    },
    {
      name: 'HOI4D',
      website: 'https://hoi4d.github.io',
      hq_city: 'Beijing',
      hq_country: 'China',
      regions: JSON.stringify(['Asia']),
      category: 'Lab',
      one_liner: '4D egocentric hand-object interaction dataset',
      description: 'HOI4D is a large-scale 4D egocentric dataset with rich annotations for category-level human-object interaction, including 2.4M RGB-D frames.',
      sensors: JSON.stringify(['RGB', 'Depth', 'Hands']),
      tags: JSON.stringify(['Robotics', 'Multi-modal']),
      scale_hours: 300,
      collectors: 80,
      verification_status: 'Verified',
      lat: 39.91,
      lng: 116.39,
      contact_email: 'hoi4d@tsinghua.edu.cn',
    },
    {
      name: 'EgoBody',
      website: 'https://sanweiliti.github.io/egobody',
      hq_city: 'Zurich',
      hq_country: 'Switzerland',
      regions: JSON.stringify(['Europe']),
      category: 'Lab',
      one_liner: 'Egocentric 3D body capture in social interactions',
      description: 'EgoBody captures egocentric views of 3D human body poses and shapes during social interactions, enabling research in body pose estimation from head-mounted cameras.',
      sensors: JSON.stringify(['RGB', 'Depth', 'IMU', 'Gaze']),
      tags: JSON.stringify(['Multi-modal', 'Home']),
      scale_hours: 68,
      collectors: 36,
      verification_status: 'Verified',
      lat: 47.37,
      lng: 8.55,
      contact_email: 'egobody@ethz.ch',
    },
    {
      name: 'IIITH EgoProceL',
      website: 'https://iiith.ac.in',
      hq_city: 'Hyderabad',
      hq_country: 'India',
      regions: JSON.stringify(['India', 'Asia']),
      category: 'Lab',
      one_liner: 'Egocentric procedural learning dataset from India',
      description: 'EgoProceL from IIIT Hyderabad captures egocentric procedural activity videos across various tasks, enabling key-step recognition and procedure learning research.',
      sensors: JSON.stringify(['RGB', 'Audio']),
      tags: JSON.stringify(['Industrial', 'Home']),
      scale_hours: 150,
      collectors: 60,
      verification_status: 'Verified',
      lat: 17.39,
      lng: 78.49,
      contact_email: 'egoprocel@iiith.ac.in',
    },
    {
      name: 'Nymeria (Meta)',
      website: 'https://nymeria.frl',
      hq_city: 'Menlo Park',
      hq_country: 'USA',
      regions: JSON.stringify(['North America', 'Global']),
      category: 'Lab',
      one_liner: 'Multi-modal ego body motion dataset with language',
      description: 'Nymeria captures synchronized egocentric and body-worn sensor data with natural language descriptions for full-body motion understanding and generation.',
      sensors: JSON.stringify(['RGB', 'IMU', 'Audio', 'Depth']),
      tags: JSON.stringify(['Multi-modal', 'VLA']),
      scale_hours: 300,
      collectors: 264,
      verification_status: 'Verified',
      lat: 37.47,
      lng: -122.15,
      contact_email: 'nymeria@meta.com',
    },
    {
      name: 'IndustReal',
      website: 'https://industreal.github.io',
      hq_city: 'Seattle',
      hq_country: 'USA',
      regions: JSON.stringify(['North America']),
      category: 'Lab',
      one_liner: 'Industrial robot assembly from human demonstrations',
      description: 'IndustReal captures industrial assembly demonstrations using egocentric and external cameras, training robots to perform real-world manufacturing tasks.',
      sensors: JSON.stringify(['RGB', 'Depth', 'Hands']),
      tags: JSON.stringify(['Industrial', 'Robotics', 'Teleop']),
      scale_hours: 100,
      collectors: 20,
      verification_status: 'Verified',
      lat: 47.61,
      lng: -122.33,
      contact_email: 'industreal@nvidia.com',
    },
    {
      name: 'Tokyo EgoDex',
      website: 'https://egodex.ai',
      hq_city: 'Tokyo',
      hq_country: 'Japan',
      regions: JSON.stringify(['Asia']),
      category: 'Platform',
      one_liner: 'Dexterous hand manipulation egocentric capture',
      description: 'EgoDex specializes in capturing fine-grained dexterous hand manipulation from egocentric perspectives for robotic hand training and teleoperation research.',
      sensors: JSON.stringify(['RGB', 'Depth', 'Hands', 'IMU']),
      tags: JSON.stringify(['Robotics', 'Teleop', 'Industrial']),
      scale_hours: 500,
      collectors: 40,
      verification_status: 'Verified',
      lat: 35.68,
      lng: 139.69,
      contact_email: 'info@egodex.ai',
    },
    {
      name: 'CaptureNet India',
      website: 'https://capturenet.in',
      hq_city: 'Bangalore',
      hq_country: 'India',
      regions: JSON.stringify(['India', 'SEA']),
      category: 'Capture network',
      one_liner: 'Distributed egocentric data collection network across India',
      description: 'CaptureNet India operates a distributed network of data collectors equipped with egocentric capture devices across major Indian cities, providing scalable data collection as a service.',
      sensors: JSON.stringify(['RGB', 'Audio', 'IMU']),
      tags: JSON.stringify(['Contributor network', 'Home', 'Industrial']),
      scale_hours: 15000,
      collectors: 800,
      verification_status: 'Verified',
      lat: 12.97,
      lng: 77.59,
      contact_email: 'hello@capturenet.in',
    },
    {
      name: 'SEA Robotics Hub',
      website: 'https://searobotics.sg',
      hq_city: 'Singapore',
      hq_country: 'Singapore',
      regions: JSON.stringify(['SEA', 'Asia']),
      category: 'Platform',
      one_liner: 'SE Asian egocentric robotics data marketplace',
      description: 'SEA Robotics Hub aggregates egocentric robot operation data from factories and warehouses across Southeast Asia for manipulation policy training.',
      sensors: JSON.stringify(['RGB', 'Depth', 'IMU', 'Hands']),
      tags: JSON.stringify(['Robotics', 'Industrial', 'VLA']),
      scale_hours: 8000,
      collectors: 350,
      verification_status: 'Verified',
      lat: 1.35,
      lng: 103.82,
      contact_email: 'data@searobotics.sg',
    },
    {
      name: 'EgoVista Lab',
      website: 'https://egovista.kaist.ac.kr',
      hq_city: 'Daejeon',
      hq_country: 'South Korea',
      regions: JSON.stringify(['Asia']),
      category: 'Lab',
      one_liner: 'Egocentric gaze-guided activity recognition',
      description: 'EgoVista at KAIST develops gaze-conditioned egocentric activity recognition systems, combining eye tracking with first-person video for human intention understanding.',
      sensors: JSON.stringify(['RGB', 'Gaze', 'IMU']),
      tags: JSON.stringify(['Multi-modal', 'Home']),
      scale_hours: 250,
      collectors: 70,
      verification_status: 'Verified',
      lat: 36.37,
      lng: 127.36,
      contact_email: 'egovista@kaist.ac.kr',
    },
    {
      name: 'Berlin Embodied AI',
      website: 'https://embodied-ai.tu-berlin.de',
      hq_city: 'Berlin',
      hq_country: 'Germany',
      regions: JSON.stringify(['Europe']),
      category: 'Lab',
      one_liner: 'Embodied AI with egocentric industrial training data',
      description: 'TU Berlin Embodied AI lab captures egocentric demonstrations in factory and workshop settings for learning manipulation policies and task planning.',
      sensors: JSON.stringify(['RGB', 'Depth', 'Hands', 'Audio']),
      tags: JSON.stringify(['Industrial', 'Robotics', 'VLA']),
      scale_hours: 400,
      collectors: 35,
      verification_status: 'Verified',
      lat: 52.51,
      lng: 13.33,
      contact_email: 'embodied@tu-berlin.de',
    },
  ];

  const insertMany = db.transaction(() => {
    for (const c of companies) {
      insert.run(
        c.name, c.website, c.hq_city, c.hq_country, c.regions, c.category,
        c.one_liner, c.description, c.sensors, c.tags, c.scale_hours,
        c.collectors, c.verification_status, c.lat, c.lng, c.contact_email
      );
    }
  });

  insertMany();
}

export interface Company {
  id: number;
  name: string;
  website: string;
  hq_city: string;
  hq_country: string;
  regions: string[];
  category: string;
  one_liner: string;
  description: string;
  sensors: string[];
  tags: string[];
  scale_hours: number | null;
  collectors: number | null;
  verification_status: string;
  proof_links: string[];
  contact_email: string;
  lat: number;
  lng: number;
  created_at: string;
}

function parseCompany(row: Record<string, unknown>): Company {
  return {
    ...row,
    regions: JSON.parse((row.regions as string) || '[]'),
    sensors: JSON.parse((row.sensors as string) || '[]'),
    tags: JSON.parse((row.tags as string) || '[]'),
    proof_links: JSON.parse((row.proof_links as string) || '[]'),
  } as Company;
}

export function getAllCompanies(): Company[] {
  const rows = getDb().prepare('SELECT * FROM companies ORDER BY name').all() as Record<string, unknown>[];
  return rows.map(parseCompany);
}

export function getCompanyById(id: number): Company | null {
  const row = getDb().prepare('SELECT * FROM companies WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? parseCompany(row) : null;
}

export function createCompany(data: Partial<Company>): number {
  const result = getDb().prepare(`
    INSERT INTO companies (name, website, hq_city, hq_country, regions, category, one_liner, description, sensors, tags, scale_hours, collectors, contact_email, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.name, data.website, data.hq_city, data.hq_country,
    JSON.stringify(data.regions || []), data.category, data.one_liner, data.description,
    JSON.stringify(data.sensors || []), JSON.stringify(data.tags || []),
    data.scale_hours || null, data.collectors || null, data.contact_email,
    data.lat || 0, data.lng || 0
  );
  return result.lastInsertRowid as number;
}

