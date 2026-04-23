import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInventoryAlerts,
  buildInventorySummary,
  buildMovementCounts,
  buildSearchFeedback,
} from "../lib/inventory/dashboard.js";

test("buildSearchFeedback uses natural singular and plural copy", () => {
  assert.equal(buildSearchFeedback([{ id: 1 }], "milk"), '1 result for "milk"');
  assert.equal(buildSearchFeedback([{ id: 1 }, { id: 2 }], ""), "2 products in view");
});

test("buildMovementCounts aggregates by normalized name", () => {
  const counts = buildMovementCounts([
    { normalizedName: "milk" },
    { normalizedName: "milk" },
    { normalizedName: "eggs" },
  ]);

  assert.deepEqual(counts, { milk: 2, eggs: 1 });
});

test("buildInventoryAlerts prioritizes low stock and frequent movement", () => {
  const alerts = buildInventoryAlerts(
    [
      { name: "Milk", normalizedName: "milk", quantity: 1 },
      { name: "Eggs", normalizedName: "eggs", quantity: 6 },
    ],
    { eggs: 4 }
  );

  assert.equal(alerts.length, 2);
  assert.equal(alerts[0].title, "Milk is running low");
  assert.equal(alerts[1].title, "Eggs moves quickly");
});

test("buildInventorySummary returns expected dashboard values", () => {
  const summary = buildInventorySummary(
    [
      { name: "Milk", normalizedName: "milk", quantity: 1, category: "Dairy" },
      { name: "Tomatoes", normalizedName: "tomatoes", quantity: 5, category: "Produce" },
    ],
    { tomatoes: 3 }
  );

  assert.equal(summary[0].value, 2);
  assert.equal(summary[1].value, 6);
  assert.equal(summary[2].value, 2);
  assert.equal(summary[3].value, 1);
  assert.equal(summary[4].value, "Tomatoes");
});
