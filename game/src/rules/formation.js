// Physical starting posts are independent of the captain-first party order.
// Runs saved before posts existed retain their former starting positions.
function seatsFor(run) {
  const members = run.next;
  const seats = Array(5).fill(null);
  const placed = new Set();
  (Array.isArray(run.posts) ? run.posts : []).slice(0, 5).forEach((id, i) => {
    if (members.includes(id) && !placed.has(id)) {
      seats[i] = id;
      placed.add(id);
    }
  });
  for (const id of members) {
    if (!placed.has(id)) seats[seats.indexOf(null)] = id;
  }
  return seats;
}

export { seatsFor };
