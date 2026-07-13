import assert from "node:assert/strict";
import test from "node:test";
import { calculatorTool } from "../src/agent/tools/calculator.js";

async function calculate(operation, values) {
  return JSON.parse(await calculatorTool.invoke({ operation, values }));
}

const cases = [
  ["addition", "add", [12, 8, 5], 25],
  ["subtraction", "subtract", [20, 3, 2], 15],
  ["multiplication", "multiply", [4, 5, 2], 40],
  ["division", "divide", [20, 4], 5],
  ["percentage", "percentage", [20, 500], 100],
  ["average", "average", [2, 4, 6], 4],
  ["power", "power", [2, 8], 256],
];

for (const [name, operation, values, expected] of cases) {
  test(name, async () => {
    assert.equal((await calculate(operation, values)).result, expected);
  });
}

test("division by zero returns a controlled tool error", async () => {
  assert.equal(
    (await calculate("divide", [10, 0])).error,
    "Division by zero is not allowed."
  );
});

test("invalid and empty values are rejected by the Zod tool schema", async () => {
  await assert.rejects(() => calculatorTool.invoke({ operation: "add", values: [] }));
  await assert.rejects(() => calculatorTool.invoke({ operation: "add", values: ["2"] }));
});
