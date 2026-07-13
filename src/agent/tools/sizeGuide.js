import { tool } from "langchain";
import { z } from "zod";

export const SIZE_CHART = [
  { size: "S", chestInches: "34–36", bodyChestMax: 36 },
  { size: "M", chestInches: "37–39", bodyChestMax: 39 },
  { size: "L", chestInches: "40–42", bodyChestMax: 42 },
  { size: "XL", chestInches: "43–45", bodyChestMax: 45 },
  { size: "XXL", chestInches: "46–48", bodyChestMax: 48 },
];

export function getSizeGuide({ chestInches, category }) {
  const parsedChest = Number(chestInches);
  const measurement = parsedChest > 0 ? parsedChest : undefined;
  const recommended = measurement
    ? SIZE_CHART.find((row) => measurement <= row.bodyChestMax)?.size || "XXL"
    : undefined;
  return {
    category: category || "general clothing",
    measurementUnit: "inches",
    chart: SIZE_CHART.map(({ bodyChestMax, ...row }) => row),
    recommended,
    guidance: recommended
      ? `Based on a ${measurement}-inch body chest, start with size ${recommended}.`
      : "Compare your body chest measurement with the chart.",
    disclaimer: "This is a demo guide. Product cuts vary, so confirm the individual garment measurement with a human seller before ordering.",
  };
}

export const sizeGuideTool = tool(
  async (input) => JSON.stringify(getSizeGuide(input)),
  {
    name: "size_guide",
    description: "Show the StyleFlow BD demo size chart and optionally recommend a starting size from a body chest measurement in inches.",
    schema: z.object({
      chestInches: z.union([z.number().nonnegative(), z.string().trim().regex(/^\d+(\.\d+)?$/)]).optional(),
      category: z.string().trim().optional(),
    }),
  }
);
