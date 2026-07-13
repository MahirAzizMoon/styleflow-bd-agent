import { tool } from "langchain";
import { z } from "zod";

const calculatorSchema = z.object({
  operation: z
    .enum([
      "add",
      "subtract",
      "multiply",
      "divide",
      "percentage",
      "power",
      "average",
    ])
    .describe("The mathematical operation to perform."),
  values: z
    .array(z.number().finite())
    .min(1)
    .describe("Numbers used in the calculation, in the required order."),
});

export const calculatorTool = tool(
  async ({ operation, values }) => {
    const numbers = values;
    let result;
    let formula;

    switch (operation) {
      case "add":
        result = numbers.reduce((total, value) => total + value, 0);
        formula = numbers.join(" + ");
        break;

      case "subtract":
        if (numbers.length < 2) {
          return JSON.stringify({
            error: "Subtraction requires at least two numbers.",
          });
        }
        result = numbers.slice(1).reduce((total, value) => total - value, numbers[0]);
        formula = numbers.join(" - ");
        break;

      case "multiply":
        result = numbers.reduce((total, value) => total * value, 1);
        formula = numbers.join(" × ");
        break;

      case "divide":
        if (numbers.length !== 2) {
          return JSON.stringify({
            error: "Division requires exactly two numbers.",
          });
        }
        if (numbers[1] === 0) {
          return JSON.stringify({ error: "Division by zero is not allowed." });
        }
        result = numbers[0] / numbers[1];
        formula = `${numbers[0]} ÷ ${numbers[1]}`;
        break;

      case "percentage":
        if (numbers.length !== 2) {
          return JSON.stringify({
            error: "Percentage requires exactly two numbers: percentage and base value.",
          });
        }
        result = (numbers[0] / 100) * numbers[1];
        formula = `${numbers[0]}% of ${numbers[1]}`;
        break;

      case "power":
        if (numbers.length !== 2) {
          return JSON.stringify({
            error: "Power requires exactly two numbers: base and exponent.",
          });
        }
        result = numbers[0] ** numbers[1];
        formula = `${numbers[0]} ^ ${numbers[1]}`;
        break;

      case "average":
        result = numbers.reduce((total, value) => total + value, 0) / numbers.length;
        formula = `(${numbers.join(" + ")}) ÷ ${numbers.length}`;
        break;

      default:
        return JSON.stringify({ error: "Unsupported operation." });
    }

    return JSON.stringify({
      operation,
      formula,
      result: Number(result.toFixed(10)),
    });
  },
  {
    name: "calculator",
    description:
      "Perform exact arithmetic. Use this tool whenever the user asks for a calculation rather than calculating mentally.",
    schema: calculatorSchema,
  }
);
