import * as R from "../lib/data/repository.ts";
const sm = (f: any) => ({ name: f.name, first: f.firstName, last: f.lastName, nick: f.nickname, slug: f.slug, country: f.country, div: f.division, org: f.org, rec: `${f.record.w}-${f.record.l}-${f.record.d}`, rating: +f.rating.toFixed(1), rank: f.rank, champ: f.champion, photo: f.photo?.src ?? null, form: f.form, age: f.age });
const fv = (x: any) => ({ date: x.fight.date, event: x.event.name, org: x.eventOrg, div: x.division.name, title: x.fight.titleFight, method: x.fight.method, round: x.fight.round, time: x.fight.time, winner: x.fight.winnerId === x.red.id ? "red" : x.fight.winnerId ? "blue" : null, red: sm(x.red), blue: sm(x.blue) });
const out = {
  featured: R.featuredFight() && fv(R.featuredFight()),
  upcoming: R.upcomingEvents(6).map((e: any) => ({ name: e.event.name, date: e.event.date, org: e.org.short, city: e.event.city, country: e.countryName, venue: e.event.venue, n: e.fights.length, main: e.fights[0] && fv(e.fights[0]) })),
  results: R.recentResults(8).map(fv),
  p4p: R.poundForPound("M", 10).map((r: any) => ({ rank: r.rank, mv: r.movement, d: r.delta, rating: +r.rating.toFixed(1), f: sm(r.fighter) })),
  champs: R.currentChampions().slice(0, 14).map((c: any) => ({ org: c.org, div: c.division?.name, f: c.fighter && sm(c.fighter), since: c.from, def: c.defenses })),
  trending: R.trending(5),
};
console.log(JSON.stringify(out, null, 1));
