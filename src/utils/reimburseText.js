export function toThaiShortDate(isoString) {
  const d = new Date(isoString);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const yearBE = (d.getFullYear() + 543) % 100; // last 2 digits of BE year
  return `${day}/${month}/${yearBE}`;
}

export function generateReimburseText(transactions) {
  const lines = transactions.map((t) => {
    const label = t.note || t.recipient || t.category || "-";
    const date = toThaiShortDate(t.date);
    const amount = Math.round(Number(t.amount));
    return `${label} ${date} ${amount}`;
  });

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  lines.push("");
  lines.push(`รวม ${Math.round(total)}`);

  return lines.join("\n");
}
