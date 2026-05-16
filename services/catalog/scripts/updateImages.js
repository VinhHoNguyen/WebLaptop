require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const pool = require('../config/db_conn');

const updates = [
  {
    id: '7473d2aeff68755df2527e60',
    name: 'ASUS ZenBook 14 OLED UX3405MA',
    image: 'https://dlcdnwebimgs.asus.com/gain/caf912a5-5bc2-4a81-ac8f-6339e488f549/w800',
    description: '14-inch ultrabook with stunning 2.8K OLED display, Intel Core Ultra 7, and all-day battery life in a featherlight aluminum chassis.',
    specs: JSON.stringify({ brand: 'ASUS', cpu: 'Intel Core Ultra 7 155H', gpu: 'Intel Arc Graphics', ramGb: 16, storageGb: 512, display: '14" 2880x1800 OLED 120Hz' }),
  },
  {
    id: '7473e569ff68755df2527e62',
    name: 'ASUS ROG Strix G16 G614JV',
    image: 'https://dlcdnwebimgs.asus.com/gain/399F81FC-CECA-4774-A85C-87EDAEBAB31D/w800',
    description: '16-inch gaming powerhouse with RTX 4060, 165Hz QHD display, and ROG\'s advanced MUX Switch for maximum frame rates.',
    specs: JSON.stringify({ brand: 'ASUS', cpu: 'Intel Core i7-13650HX', gpu: 'NVIDIA GeForce RTX 4060 8GB', ramGb: 16, storageGb: 512, display: '16" 2560x1600 IPS 165Hz' }),
  },
  {
    id: '7473e585ff68755df2527e63',
    name: 'ASUS Vivobook Pro 15 OLED K6502VV',
    image: 'https://cdn.mos.cms.futurecdn.net/QXXWK59qvPKparPGk8pR84.jpg',
    description: 'Creator laptop with 2.8K OLED display covering 100% DCI-P3, Core i9-13900H, and RTX 4060 for demanding video editing and 3D workflows.',
    specs: JSON.stringify({ brand: 'ASUS', cpu: 'Intel Core i9-13900H', gpu: 'NVIDIA GeForce RTX 4060 8GB', ramGb: 16, storageGb: 1024, display: '15.6" 2880x1620 OLED 120Hz' }),
  },
  {
    id: '7473e5a7ff68755df2527e64',
    name: 'Lenovo ThinkBook 14 G4 IAP',
    image: 'https://cdn.mos.cms.futurecdn.net/aLuoXA7wKjMs7GXgEqYEA4.jpg',
    description: 'Business-class 14-inch laptop with Rapid Charge, robust MIL-SPEC durability, and a precision touchpad for enterprise productivity.',
    specs: JSON.stringify({ brand: 'Lenovo', cpu: 'Intel Core i5-1235U', gpu: 'Intel Iris Xe', ramGb: 16, storageGb: 512, display: '14" 1920x1200 IPS' }),
  },
  {
    id: '7473e65bff68755df2527e65',
    name: 'HP Envy x360 13.3" 2-in-1',
    image: 'https://cdn.mos.cms.futurecdn.net/RruGNsC2gGYEvuV7Tohnhf.jpg',
    description: 'Compact 360-degree convertible with OLED touchscreen, AMD Ryzen 7, and HP\'s Tilt Pen support in a sleek aluminum design.',
    specs: JSON.stringify({ brand: 'HP', cpu: 'AMD Ryzen 7 7730U', gpu: 'AMD Radeon Graphics', ramGb: 16, storageGb: 512, display: '13.3" 1920x1200 OLED Touch' }),
  },
  {
    id: '7473e662ff68755df2527e66',
    name: 'Acer Aspire 3 A315-59',
    image: 'https://cdn.mos.cms.futurecdn.net/Bf4HYF7M8oKuEgW3bibUUT.jpg',
    description: 'Reliable budget laptop for students with a bright 15.6" display, fast SSD, and comfortable keyboard for everyday study and browsing.',
    specs: JSON.stringify({ brand: 'Acer', cpu: 'Intel Core i5-1235U', gpu: 'Intel Iris Xe', ramGb: 8, storageGb: 512, display: '15.6" 1920x1080 IPS' }),
  },
  {
    id: '7473e66dff68755df2527e67',
    name: 'MSI Raider GE78 HX',
    image: 'https://cdn.mos.cms.futurecdn.net/Jo3oJJHze9CLLwJBRgBK9C.jpg',
    description: '17-inch flagship gaming laptop with RTX 4090, Intel Core i9-14900HX, and a 240Hz QHD display for the ultimate gaming experience.',
    specs: JSON.stringify({ brand: 'MSI', cpu: 'Intel Core i9-14900HX', gpu: 'NVIDIA GeForce RTX 4090 16GB', ramGb: 32, storageGb: 2048, display: '17" 2560x1600 IPS 240Hz' }),
  },
  {
    id: '7473e6a1ff68755df2527e68',
    name: 'ASUS ZenBook S 13 OLED UX5304VA',
    image: 'https://dlcdnwebimgs.asus.com/gain/7497bea2-66ac-4731-bfe6-67209316b60f/w800',
    description: "World's slimmest 13.3-inch OLED laptop at just 1cm thick, Intel Evo certified with Wi-Fi 6E and Thunderbolt 4 for professional mobility.",
    specs: JSON.stringify({ brand: 'ASUS', cpu: 'Intel Core i7-1355U', gpu: 'Intel Iris Xe', ramGb: 16, storageGb: 512, display: '13.3" 2880x1800 OLED 60Hz' }),
  },
  {
    id: '7474b123956ae27b049d64d0',
    name: 'HP ZBook Firefly 16 G10',
    image: 'https://cdn.mos.cms.futurecdn.net/EcieHkzEQLL6cNPsmMLWjh.jpg',
    description: 'Professional 16-inch mobile workstation with ISV-certified NVIDIA RTX A500, ECC memory support, and enterprise security features.',
    specs: JSON.stringify({ brand: 'HP', cpu: 'Intel Core i7-1355U', gpu: 'NVIDIA RTX A500 4GB', ramGb: 32, storageGb: 1024, display: '16" 2560x1600 IPS' }),
  },
  {
    id: '7474b15c956ae27b049d64d1',
    name: 'Lenovo IdeaPad Slim 5 14" Gen 9',
    image: 'https://cdn.mos.cms.futurecdn.net/oaKLfmbjEJxthT2E7EW5wk.jpg',
    description: 'Everyday 14-inch laptop with AMD Ryzen 5, quiet fan, solid battery life, and a vivid display for work, streaming, and light tasks.',
    specs: JSON.stringify({ brand: 'Lenovo', cpu: 'AMD Ryzen 5 7530U', gpu: 'AMD Radeon Graphics', ramGb: 16, storageGb: 512, display: '14" 1920x1080 IPS' }),
  },
  {
    id: '7474b1a4956ae27b049d64d2',
    name: 'ASUS Vivobook Pro 14 OLED M3401QA',
    image: 'https://cdn.mos.cms.futurecdn.net/x8wmNXyYrt2Ybz8FH8vVy9.jpg',
    description: '14-inch creator laptop with 2.8K OLED Pantone validated display, Ryzen 9, and RTX 3050 Ti for portable creative work.',
    specs: JSON.stringify({ brand: 'ASUS', cpu: 'AMD Ryzen 9 5900HX', gpu: 'NVIDIA GeForce RTX 3050 Ti 4GB', ramGb: 16, storageGb: 512, display: '14" 2880x1800 OLED 90Hz' }),
  },
  {
    id: '7474b1b3956ae27b049d64d3',
    name: 'HP ProBook 450 G10',
    image: 'https://cdn.mos.cms.futurecdn.net/ZMBpUct8zu2pKxSESUt3eS.jpg',
    description: '15-inch business laptop with HP Wolf Security, a numeric keypad, and MIL-SPEC tested durability for office and field use.',
    specs: JSON.stringify({ brand: 'HP', cpu: 'Intel Core i5-1335U', gpu: 'Intel Iris Xe', ramGb: 8, storageGb: 256, display: '15.6" 1920x1080 IPS' }),
  },
  {
    id: '7474b217956ae27b049d64d4',
    name: 'Lenovo IdeaPad Slim 5 OLED 16ARP8',
    image: 'https://cdn.mos.cms.futurecdn.net/jcPRzubvsQxtrPBoEnAw99.jpg',
    description: 'Thin 16-inch ultrabook with a vibrant 3.2K OLED display, Ryzen 7, Wi-Fi 6E, and a compact build for on-the-go productivity.',
    specs: JSON.stringify({ brand: 'Lenovo', cpu: 'AMD Ryzen 7 7730U', gpu: 'AMD Radeon Graphics', ramGb: 16, storageGb: 512, display: '16" 3200x2000 OLED 60Hz' }),
  },
  {
    id: '7474b22b956ae27b049d64d5',
    name: 'Lenovo Legion Pro 5 16IRX9',
    image: 'https://cdn.mos.cms.futurecdn.net/RFXJoJaU87GYDmaXqNatC7.jpg',
    description: 'High-performance 16-inch gaming laptop with RTX 4070, per-key RGB, 240Hz QHD display, and Legion ColdFront 5.0 cooling.',
    specs: JSON.stringify({ brand: 'Lenovo', cpu: 'Intel Core i9-14900HX', gpu: 'NVIDIA GeForce RTX 4070 8GB', ramGb: 32, storageGb: 1024, display: '16" 2560x1600 IPS 240Hz' }),
  },
  {
    id: '7474b2c6956ae27b049d64d6',
    name: 'ASUS Vivobook Pro 16X OLED N7600QC',
    image: 'https://cdn.mos.cms.futurecdn.net/onDd8iLB58HSXMpcUumpon.jpg',
    description: '16-inch flagship creator laptop with 3.2K OLED display, Ryzen 9, RTX 3050 Ti, and a large multi-touch trackpad for professionals.',
    specs: JSON.stringify({ brand: 'ASUS', cpu: 'AMD Ryzen 9 5900HX', gpu: 'NVIDIA GeForce RTX 3050 Ti 4GB', ramGb: 32, storageGb: 1024, display: '16" 3200x2000 OLED 60Hz' }),
  },
  {
    id: '7474b2e8956ae27b049d64d7',
    name: 'Lenovo Yoga 7 2-in-1 14IML9',
    image: 'https://cdn.mos.cms.futurecdn.net/vwj365syCb9cG2NWLszXF9.jpg',
    description: 'Premium 14-inch convertible with OLED touchscreen, Intel Core Ultra 7, integrated stylus pen, and a 360-degree hinge for any mode.',
    specs: JSON.stringify({ brand: 'Lenovo', cpu: 'Intel Core Ultra 7 155U', gpu: 'Intel Arc Graphics', ramGb: 16, storageGb: 512, display: '14" 1920x1200 OLED Touch' }),
  },
];

(async () => {
  let updated = 0;
  for (const { id, name, image, description, specs } of updates) {
    const [result] = await pool.query(
      'UPDATE products SET name = ?, image = ?, description = ?, specs = ? WHERE id = ?',
      [name, image, description, specs, id]
    );
    if (result.affectedRows > 0) {
      updated++;
      console.log(`✓ Updated: ${name}`);
    } else {
      console.warn(`⚠ Not found: ${id}`);
    }
  }
  console.log(`\nDone — ${updated}/${updates.length} products updated.`);
  process.exit(0);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
