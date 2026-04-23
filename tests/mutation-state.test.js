import test from "node:test";
import assert from "node:assert/strict";
import {
  clearMutationFlag,
  setMutationFlag,
} from "../lib/inventory/mutation-state.js";

test("setMutationFlag adds and updates mutation entries", () => {
  const nextState = setMutationFlag({}, "milk", "quantity", true);
  assert.deepEqual(nextState, {
    milk: {
      quantity: true,
    },
  });
});

test("clearMutationFlag removes item entry when no active mutations remain", () => {
  const nextState = clearMutationFlag(
    {
      milk: {
        quantity: true,
      },
    },
    "milk",
    "quantity"
  );

  assert.deepEqual(nextState, {});
});

test("clearMutationFlag preserves sibling mutation flags", () => {
  const nextState = clearMutationFlag(
    {
      milk: {
        quantity: true,
        delete: true,
      },
    },
    "milk",
    "quantity"
  );

  assert.deepEqual(nextState, {
    milk: {
      quantity: false,
      delete: true,
    },
  });
});
