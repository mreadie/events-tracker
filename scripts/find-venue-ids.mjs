#!/usr/bin/env node
// Script to find Ticketmaster venue IDs for Denver venues

const API_KEY = 'LYy3j0H0UEjNz18YzTqcTDETOR9IB2z6';

const VENUES_TO_FIND = [
  'Ball Arena',
  'Empower Field at Mile High',
  "Fiddler's Green Amphitheatre",
  'Mission Ballroom',
];

async function searchVenue(keyword) {
  const url = `https://app.ticketmaster.com/discovery/v2/venues.json?apikey=${API_KEY}&keyword=${encodeURIComponent(keyword)}&city=Denver&stateCode=CO&countryCode=US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data._embedded?.venues ?? [];
}

for (const name of VENUES_TO_FIND) {
  console.log(`\n=== Searching: "${name}" ===`);
  try {
    const venues = await searchVenue(name);
    if (venues.length === 0) {
      // Try broader search without city restriction
      const url2 = `https://app.ticketmaster.com/discovery/v2/venues.json?apikey=${API_KEY}&keyword=${encodeURIComponent(name)}&stateCode=CO&countryCode=US`;
      const res2 = await fetch(url2);
      const data2 = await res2.json();
      const venues2 = data2._embedded?.venues ?? [];
      if (venues2.length === 0) {
        console.log('  No results found.');
      } else {
        for (const v of venues2.slice(0, 3)) {
          console.log(`  ID: ${v.id} | Name: ${v.name} | City: ${v.city?.name}, ${v.state?.stateCode}`);
        }
      }
    } else {
      for (const v of venues.slice(0, 5)) {
        console.log(`  ID: ${v.id} | Name: ${v.name} | City: ${v.city?.name}, ${v.state?.stateCode}`);
      }
    }
  } catch (err) {
    console.error(`  Error: ${err.message}`);
  }
}
