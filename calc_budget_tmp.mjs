import fs from "fs";
import { computeBudget } from "./shared/budget-core.js";
const input = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const r = computeBudget(input);
console.log(
  JSON.stringify(
    {
      count: input.items.length,
      base: Math.round(r.base),
      reserve: r.reserve,
      total: Math.round(r.total),
      perPerson: Math.round(r.perPerson),
      perDay: Math.round(r.perDay),
      cats: Object.fromEntries(r.categories.map((c) => [c.name, Math.round(c.subtotal)])),
    },
    null,
    1,
  ),
);
