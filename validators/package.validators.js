const { z } = require("zod");

const addPackageSchema = z.object({
  country: z.string(),
  description: z.string(),
  price: z.number(),
  heading: z.string(),
  documents: z.string().array(),
});

module.exports = {
  addPackageSchema,
};
