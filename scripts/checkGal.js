const data = require('../src/data/liveBulletin.json');
const upcoming = data.matches.filter(m => m.status !== 'finished');
const galMatches = data.matches.filter(m => m.homeTeam.name === 'Galatasaray' || m.awayTeam.name === 'Galatasaray');
console.log('Upcoming count', upcoming.length);
console.log('Galatasaray matches count', galMatches.length);
console.log('Gal matches details:', galMatches.map(m => ({id: m.id, home: m.homeTeam.name, away: m.awayTeam.name, status: m.status})));

