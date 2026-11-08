const fs = require('fs');
const path = require('path');

// Paths
const bulletinPath = path.resolve(__dirname, '../src/data/liveBulletin.json');

function loadBulletin() {
  const raw = fs.readFileSync(bulletinPath, 'utf-8');
  return JSON.parse(raw);
}

function saveBulletin(data) {
  fs.writeFileSync(bulletinPath, JSON.stringify(data, null, 2), 'utf-8');
}

function isSelfMatch(match) {
  return match.homeTeam && match.awayTeam && match.homeTeam.name === match.awayTeam.name;
}

function isCrossLeague(match) {
  const superLig = [
    'Galatasaray','Fenerbahçe','Beşiktaş','Trabzonspor','İstanbul Başakşehir','Göztepe','Samsunspor','Kasımpaşa','Konyaspor','Alanyaspor','Çaykur Rizespor','Gaziantep FK','Gençlerbirliği','Eyüpspor','Netglobal Sivasspor','Bodrum FK','Kayserispor','Antalyaspor','Adana Demirspor'
  ];
  const home = match.homeTeam?.name || '';
  const away = match.awayTeam?.name || '';
  const league = match.league || '';
  if (league.includes('Süper Lig')) {
    return !(superLig.includes(home) && superLig.includes(away));
  }
  return false;
}

function findFaulty(bulletin) {
  const faulty = [];
  for (const m of bulletin.matches) {
    if (m.status === 'finished') continue;
    if (isSelfMatch(m) || isCrossLeague(m)) {
      faulty.push({id: m.id, home: m.homeTeam?.name, away: m.awayTeam?.name, reason: isSelfMatch(m) ? 'self' : 'cross'});
    }
  }
  return faulty;
}

function fixBulletin() {
  const bulletin = loadBulletin();
  const faulty = findFaulty(bulletin);
  console.log('Faulty matches detected:', faulty.length);
  bulletin.matches = bulletin.matches.filter(m => !faulty.find(f => f.id === m.id));
  bulletin.totalMatches = bulletin.matches.length;
  saveBulletin(bulletin);
  console.log('Removed faulty matches and updated file.');
}

fixBulletin();

