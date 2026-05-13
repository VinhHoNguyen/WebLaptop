require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const pool = require('../config/db_conn');

const imageUpdates = [
  { id: '7473d2aeff68755df2527e60', image: 'https://cdnv2.tgdd.vn/mwg-static/dmx/Products/Images/44/321468/asus-zenbook-14-oled-ux3405ma-ultra-7-pp152w-thumb-638763543290373422-600x600.jpg' },
  { id: '7473e569ff68755df2527e62', image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/333095/asus-rog-strix-g16-g614jv-i7-n3515w-170225-114616-616-600x600.jpg' },
  { id: '7473e585ff68755df2527e63', image: 'https://cdn.tgdd.vn/Products/Images/44/255615/asus-vivobook-pro-15-oled-k3500pc-i7-l1046t-021121-035044-600x600.jpg' },
  { id: '7473e5a7ff68755df2527e64', image: 'https://cdn.tgdd.vn/Products/Images/44/236960/lenovo-thinkbook-14-g2-itl-i5-20vd003kvn-600x600.jpg' },
  { id: '7473e65bff68755df2527e65', image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/338208/hp-envy-x360-14-fa0047au-r7-a19bppa-thumb-638833332894402249-600x600.jpg' },
  { id: '7473e662ff68755df2527e66', image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/304543/acer-aspire-3-a315-59-5283-i5-nxk6tsv00b-thumb-638754896181678129-600x600.jpg' },
  { id: '7473e66dff68755df2527e67', image: 'https://cdn.tgdd.vn/Products/Images/44/305663/asus-gaming-rog-strix-g16-g614ji-i7-n4084w-thumb-1-600x600.jpg' },
  { id: '7473e6a1ff68755df2527e68', image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/338279/lenovo-ideapad-slim-5-oled-15arp10-r7-83j3002svn-thumb-638851465607267025-600x600.jpg' },
  { id: '7474b123956ae27b049d64d0', image: 'https://cdn.tgdd.vn/Products/Images/44/264438/hp-zbook-firefly-14-g8-i5-275v5av-141221-042207-600x600.jpg' },
  { id: '7474b15c956ae27b049d64d1', image: 'https://cdn.tgdd.vn/Products/Images/44/232192/lenovo-ideapad-slim-5-15itl05-i5-82fg001pvn-144320-064322-600x600.jpg' },
  { id: '7474b1a4956ae27b049d64d2', image: 'https://cdn.tgdd.vn/Products/Images/44/264943/asus-vivobook-pro-14x-oled-m7400qc-r5-m01810-thumb-600x600.jpg' },
  { id: '7474b1b3956ae27b049d64d3', image: 'https://cdn.tgdd.vn/Products/Images/44/291154/hp-probook-450-g9-i5-6m0y9pa-thumb-1-600x600.jpg' },
  { id: '7474b217956ae27b049d64d4', image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/338279/lenovo-ideapad-slim-5-oled-15arp10-r7-83j3002svn-thumb-638851465607267025-600x600.jpg' },
  { id: '7474b22b956ae27b049d64d5', image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/326497/lenovo-legion-pro-5-16irx9-i9-83df0047vn-070525-115201-217-600x600.jpg' },
  { id: '7474b2c6956ae27b049d64d6', image: 'https://cdn.tgdd.vn/Products/Images/44/274243/asus-vivobook-pro-16x-oled-m7600qc-r5-l2077w-110322-113431-600x600.jpg' },
  { id: '7474b2e8956ae27b049d64d7', image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/338208/hp-envy-x360-14-fa0047au-r7-a19bppa-thumb-638833332894402249-600x600.jpg' },
];

(async () => {
  let updated = 0;
  for (const { id, image } of imageUpdates) {
    const [result] = await pool.query(
      'UPDATE products SET image = ? WHERE id = ?',
      [image, id]
    );
    if (result.affectedRows > 0) {
      updated++;
      console.log(`✓ Updated: ${id}`);
    } else {
      console.warn(`⚠ Not found: ${id}`);
    }
  }
  console.log(`\nDone — ${updated}/${imageUpdates.length} products updated.`);
  process.exit(0);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
