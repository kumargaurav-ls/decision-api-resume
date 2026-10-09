import { z } from "zod";

export const LEVEL_LABELS = ["None", "Basic", "Working", "Strong", "Expert"] as const;
export const FIT_VALUES = ["strong_fit", "possible_fit", "weak_fit"] as const;

export const RUBRIC_LIMITS = {
  minDimensions: 3,
  maxDimensions: 8,
  maxMustHaves: 8,
  maxRedFlags: 6,
} as const;

const Key = z
  .string()
  .regex(/^[a-z0-9_]+$/, "Use lowercase letters, digits and underscores");

export const Level = z.object({
  label: z.enum(LEVEL_LABELS),
  description: z.string().trim().min(1, "Describe this level"),
});

export const Dimension = z.object({
  key: Key,
  name: z.string().trim().min(1, "Name the dimension"),
  instructions: z.string().trim().min(1, "Say what to judge"),
  levels: z
    .array(Level)
    .length(5)
    .refine((levels) => levels.every((level, i) => level.label === LEVEL_LABELS[i]), {
      message: "Levels must be None, Basic, Working, Strong, Expert in order",
    }),
});

export const Statement = z.object({
  key: Key,
  statement: z.string().trim().min(1, "Write the statement"),
});

export const FitOption = z.object({
  value: z.enum(FIT_VALUES),
  description: z.string().trim().min(1, "Describe this option"),
});

const uniqueKeys = (items: { key: string }[]) =>
  new Set(items.map((item) => item.key)).size === items.length;

/** The editable rubric body — what the generator produces and the editor saves. */
export const RubricBody = z.object({
  roleSummary: z.string().trim().min(1, "Write a role summary"),
  dimensions: z
    .array(Dimension)
    .min(RUBRIC_LIMITS.minDimensions)
    .max(RUBRIC_LIMITS.maxDimensions)
    .refine(uniqueKeys, { message: "Dimension keys must be unique" }),
  mustHaves: z
    .array(Statement)
    .max(RUBRIC_LIMITS.maxMustHaves)
    .refine(uniqueKeys, { message: "Must-have keys must be unique" }),
  redFlags: z
    .array(Statement)
    .max(RUBRIC_LIMITS.maxRedFlags)
    .refine(uniqueKeys, { message: "Red flag keys must be unique" }),
  fit: z.object({
    instructions: z.string().trim().min(1, "Say how to judge overall fit"),
    options: z
      .array(FitOption)
      .length(3)
      .refine((options) => options.every((option, i) => option.value === FIT_VALUES[i]), {
        message: "Fit options must be strong_fit, possible_fit, weak_fit in order",
      }),
  }),
});

export const Rubric = RubricBody.extend({
  version: z.number().int().positive(),
  createdAt: z.string(),
  source: z.enum(["generated", "edited"]),
});

export type RubricBody = z.infer<typeof RubricBody>;
export type Rubric = z.infer<typeof Rubric>;
export type Dimension = z.infer<typeof Dimension>;
export type Statement = z.infer<typeof Statement>;
export type FitValue = (typeof FIT_VALUES)[number];
