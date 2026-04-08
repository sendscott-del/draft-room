import type { AppData } from '../types'
import { OUL } from './constants'

function makeOU(): AppData['ou'] {
  const o: AppData['ou'] = { Scott: {}, Ty: {} }
  OUL.forEach(t => {
    o.Scott[t.a] = { pick: '', actual: '' }
    o.Ty[t.a] = { pick: '', actual: '' }
  })
  return o
}

function makeTD(): AppData['td'] {
  const a: AppData['td'] = []
  for (let i = 0; i < 32; i++) {
    a.push({ round: i + 1, player: '', team: '', traded: false, asg: false, award: false, owner: i % 2 === 0 ? 'Scott' : 'Ty' })
  }
  return a
}

export const DEFAULT_DATA: AppData = {
  fa: [
    { round: 1,  owner: "Scott", player: "Kyle Tucker",       team: "LAD", years: "10", newTeam: true,  award: true,  asg: false, actual: "4yr LAD" },
    { round: 2,  owner: "Ty",    player: "Kyle Schwarber",    team: "PHI", years: "5",  newTeam: false, award: true,  asg: false, actual: "5yr PHI" },
    { round: 3,  owner: "Scott", player: "Cody Bellinger",    team: "NYY", years: "6",  newTeam: true,  award: true,  asg: false, actual: "5yr NYY" },
    { round: 4,  owner: "Ty",    player: "Pete Alonso",       team: "NYM", years: "6",  newTeam: false, award: false, asg: true,  actual: "5yr BAL" },
    { round: 5,  owner: "Scott", player: "Alex Bregman",      team: "PHI", years: "5",  newTeam: true,  award: true,  asg: false, actual: "5yr CHC" },
    { round: 6,  owner: "Ty",    player: "Dylan Cease",       team: "SFG", years: "8",  newTeam: true,  award: false, asg: false, actual: "7yr TOR" },
    { round: 7,  owner: "Scott", player: "Edwin Diaz",        team: "LAD", years: "5",  newTeam: true,  award: false, asg: true,  actual: "3yr LAD" },
    { round: 8,  owner: "Ty",    player: "Framber Valdez",    team: "TOR", years: "5",  newTeam: true,  award: false, asg: false, actual: "3yr DET" },
    { round: 9,  owner: "Scott", player: "Justin Verlander",  team: "HOU", years: "1",  newTeam: false, award: true,  asg: false, actual: "1yr DET" },
    { round: 10, owner: "Ty",    player: "Zac Gallen",        team: "ATL", years: "2",  newTeam: true,  award: false, asg: false, actual: "1yr ARZ" },
    { round: 11, owner: "Scott", player: "Ryan O'Hearn",      team: "LAA", years: "4",  newTeam: true,  award: false, asg: true,  actual: "2yr PIT" },
    { round: 12, owner: "Ty",    player: "Devin Williams",    team: "LAA", years: "",   newTeam: true,  award: false, asg: true,  actual: "3yr NYM" },
    { round: 13, owner: "Scott", player: "Robert Suarez",     team: "NYM", years: "2",  newTeam: true,  award: false, asg: true,  actual: "3yr ATL" },
    { round: 14, owner: "Ty",    player: "Bo Bichette",       team: "TBR", years: "8",  newTeam: true,  award: false, asg: false, actual: "3yr NYM" },
    { round: 15, owner: "Scott", player: "Munetaka Murakami", team: "BOS", years: "5",  newTeam: true,  award: false, asg: false, actual: "2yr CWS" },
    { round: 16, owner: "Ty",    player: "Ranger Suarez",     team: "BOS", years: "6",  newTeam: true,  award: false, asg: false, actual: "5yr BOS" },
    { round: 17, owner: "Scott", player: "Eugenio Suarez",    team: "ARI", years: "2",  newTeam: true,  award: false, asg: false, actual: "1yr CIN" },
    { round: 18, owner: "Ty",    player: "JT Realmuto",       team: "BOS", years: "2",  newTeam: true,  award: false, asg: false, actual: "3yr PHI" },
    { round: 19, owner: "Scott", player: "Chris Bassitt",     team: "TOR", years: "1",  newTeam: false, award: false, asg: false, actual: "1yr BAL" },
    { round: 20, owner: "Ty",    player: "Tatsuya Imai",      team: "CHC", years: "5",  newTeam: true,  award: false, asg: false, actual: "3yr HOU" },
    { round: 21, owner: "Scott", player: "Lucas Giolito",     team: "BOS", years: "3",  newTeam: false, award: false, asg: false, actual: "" },
    { round: 22, owner: "Ty",    player: "Merrill Kelly",     team: "DET", years: "1",  newTeam: true,  award: false, asg: false, actual: "2yr ARZ" },
    { round: 23, owner: "Scott", player: "Jorge Polanco",     team: "SEA", years: "3",  newTeam: false, award: false, asg: false, actual: "2yr NYM" },
    { round: 24, owner: "Ty",    player: "Kazuma Okamoto",    team: "SEA", years: "4",  newTeam: true,  award: false, asg: false, actual: "" },
    { round: 25, owner: "Scott", player: "Harrison Bader",    team: "PHI", years: "2",  newTeam: false, award: false, asg: false, actual: "2yr SFG" },
    { round: 26, owner: "Ty",    player: "",                  team: "",    years: "",   newTeam: false, award: false, asg: false, actual: "" },
    { round: 27, owner: "Scott", player: "Michael Soroka",    team: "KCR", years: "2",  newTeam: true,  award: false, asg: false, actual: "1yr ARZ" },
    { round: 28, owner: "Ty",    player: "Emilio Pagan",      team: "CIN", years: "2",  newTeam: false, award: false, asg: false, actual: "2yr CIN" },
    { round: 29, owner: "Scott", player: "Luis Arraez",       team: "MIA", years: "3",  newTeam: false, award: false, asg: false, actual: "1yr SFG" },
    { round: 30, owner: "Ty",    player: "Ha-Seong Kim",      team: "PIT", years: "3",  newTeam: true,  award: false, asg: false, actual: "1yr ATL" },
    { round: 31, owner: "Scott", player: "Marcell Ozuna",     team: "TEX", years: "2",  newTeam: true,  award: false, asg: false, actual: "1yr PIT" },
    { round: 32, owner: "Ty",    player: "Tyler Rogers",      team: "OAK", years: "1",  newTeam: true,  award: false, asg: false, actual: "3yr TOR" },
  ],
  cy: {
    Scott: [
      { round: 2,  pitcher: "Tarik Skubal",     lg: "AL", odds: "+380",  rookie: false, votes: 0 },
      { round: 3,  pitcher: "Garrett Crochet",   lg: "AL", odds: "+400",  rookie: false, votes: 0 },
      { round: 7,  pitcher: "Hunter Greene",     lg: "NL", odds: "+1400", rookie: false, votes: 0 },
      { round: 9,  pitcher: "Jacob DeGrom",      lg: "AL", odds: "+850",  rookie: false, votes: 0 },
      { round: 11, pitcher: "Max Fried",         lg: "AL", odds: "+1500", rookie: false, votes: 0 },
      { round: 13, pitcher: "Freddy Peralta",    lg: "NL", odds: "+1500", rookie: false, votes: 0 },
      { round: 15, pitcher: "Cole Ragans",       lg: "AL", odds: "+900",  rookie: false, votes: 0 },
      { round: 17, pitcher: "Nolan McLean",      lg: "NL", odds: "+2200", rookie: true,  votes: 0 },
      { round: 18, pitcher: "Jesus Luzardo",     lg: "NL", odds: "+2500", rookie: false, votes: 0 },
      { round: 19, pitcher: "Nathan Eovaldi",    lg: "AL", odds: "+1600", rookie: false, votes: 0 },
    ],
    Ty: [
      { round: 1,  pitcher: "Paul Skenes",          lg: "NL", odds: "+350",  rookie: false, votes: 0 },
      { round: 4,  pitcher: "Yoshinobu Yamamoto",   lg: "NL", odds: "+475",  rookie: false, votes: 0 },
      { round: 5,  pitcher: "Hunter Brown",          lg: "AL", odds: "+1100", rookie: false, votes: 0 },
      { round: 6,  pitcher: "Logan Webb",            lg: "NL", odds: "+1200", rookie: false, votes: 0 },
      { round: 8,  pitcher: "Bryan Woo",             lg: "AL", odds: "+1300", rookie: true,  votes: 0 },
      { round: 10, pitcher: "Christopher Sanchez",   lg: "NL", odds: "+900",  rookie: false, votes: 0 },
      { round: 12, pitcher: "Chris Sale",            lg: "NL", odds: "+1300", rookie: false, votes: 0 },
      { round: 14, pitcher: "Shohei Ohtani",         lg: "NL", odds: "+1500", rookie: false, votes: 0 },
      { round: 16, pitcher: "MacKenzie Gore",        lg: "NL", odds: "+1900", rookie: false, votes: 0 },
      { round: 20, pitcher: "Kyle Bradish",          lg: "AL", odds: "+3500", rookie: false, votes: 0 },
    ],
  },
  pu: {
    Ty: [
      { r: 1,  team: "Orioles",       unit: "INF+C", war: 0 },
      { r: 2,  team: "Yankees",       unit: "OF",    war: 0 },
      { r: 3,  team: "Red Sox",       unit: "SP",    war: 0 },
      { r: 4,  team: "Padres",        unit: "RP",    war: 0 },
      { r: 5,  team: "Blue Jays",     unit: "INF+C", war: 0 },
      { r: 6,  team: "Braves",        unit: "OF",    war: 0 },
      { r: 7,  team: "Mariners",      unit: "SP",    war: 0 },
      { r: 8,  team: "Brewers",       unit: "RP",    war: 0 },
      { r: 9,  team: "Royals",        unit: "INF+C", war: 0 },
      { r: 10, team: "Marlins",       unit: "OF",    war: 0 },
      { r: 11, team: "Reds",          unit: "SP",    war: 0 },
      { r: 12, team: "Rays",          unit: "RP",    war: 0 },
    ],
    Scott: [
      { r: 1,  team: "Mets",          unit: "INF+C", war: 0 },
      { r: 2,  team: "Dodgers",       unit: "OF",    war: 0 },
      { r: 3,  team: "Tigers",        unit: "SP",    war: 0 },
      { r: 4,  team: "Phillies",      unit: "RP",    war: 0 },
      { r: 5,  team: "Giants",        unit: "INF+C", war: 0 },
      { r: 6,  team: "Athletics",     unit: "OF",    war: 0 },
      { r: 7,  team: "Rangers",       unit: "SP",    war: 0 },
      { r: 8,  team: "Guardians",     unit: "RP",    war: 0 },
      { r: 9,  team: "Cubs",          unit: "INF+C", war: 0 },
      { r: 10, team: "Diamondbacks",  unit: "OF",    war: 0 },
      { r: 11, team: "Pirates",       unit: "SP",    war: 0 },
      { r: 12, team: "White Sox",     unit: "RP",    war: 0 },
    ],
  },
  hr: {
    Ty: {
      C:  { p: "Hunter Goodman",   t: "COL", hr: 0 },
      "1B": { p: "Nick Kurtz",     t: "OAK", hr: 0 },
      "2B": { p: "Brandon Lowe",   t: "TBR", hr: 0 },
      "3B": { p: "Eugenio Suarez", t: "SEA", hr: 0 },
      SS: { p: "Gunnar Henderson", t: "BAL", hr: 0 },
      RF: { p: "Aaron Judge",      t: "NYY", hr: 0 },
      CF: { p: "Byron Buxton",     t: "MIN", hr: 0 },
      LF: { p: "James Wood",       t: "WSN", hr: 0 },
      DH: { p: "Kyle Schwarber",   t: "PHI", hr: 0 },
    },
    Scott: {
      C:  { p: "Cal Raleigh",       t: "SEA", hr: 0 },
      "1B": { p: "Vladdy Jr",       t: "TOR", hr: 0 },
      "2B": { p: "Ketel Marte",     t: "ARI", hr: 0 },
      "3B": { p: "Junior Caminero", t: "TBR", hr: 0 },
      SS: { p: "Bobby Witt Jr",     t: "KCR", hr: 0 },
      RF: { p: "Juan Soto",         t: "NYM", hr: 0 },
      CF: { p: "Jo Adell",          t: "LAA", hr: 0 },
      LF: { p: "Riley Greene",      t: "DET", hr: 0 },
      DH: { p: "Shohei Ohtani",     t: "LAD", hr: 0 },
    },
  },
  td: makeTD(),
  aw: {
    Scott: { alMVP: "", nlMVP: "", alROY: "", nlROY: "", alCY: "", nlCY: "", alMGR: "", nlMGR: "", alMVPR: "none", nlMVPR: "none", alROYR: "none", nlROYR: "none", alCYR: "none", nlCYR: "none", alMGRR: "none", nlMGRR: "none" },
    Ty:    { alMVP: "", nlMVP: "", alROY: "", nlROY: "", alCY: "", nlCY: "", alMGR: "", nlMGR: "", alMVPR: "none", nlMVPR: "none", alROYR: "none", nlROYR: "none", alCYR: "none", nlCYR: "none", alMGRR: "none", nlMGRR: "none" },
  },
  ou: makeOU(),
}
