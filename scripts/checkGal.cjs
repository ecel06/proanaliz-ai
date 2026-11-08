const data = require('../src/data/liveBulletin.json');
const galMatches = data.matches.filter(m => m.homeTeam.name === 'Galatasaray' || m.awayTeam.name === 'Galatasaray');
console.log('Galatasaray matches count:', galMatches.length);
console.log(galMatches.map(m=>({id:m.id, home:m.homeTeam.name, away:m.awayTeam.name, status:m.status})));

