import {
  pgTable,
  text,
  integer,
  jsonb,
  timestamp,
  serial,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  closingMessage: text("closing_message"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  formId: integer("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  minimumScore: integer("minimum_score"),
  terminationMessage: text("termination_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id")
    .notNull()
    .references(() => sections.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  textEn: text("text_en"),
  type: varchar("type", { length: 50 }).notNull().default("multiple_choice"),
  order: integer("order").notNull(),
  required: boolean("required").notNull().default(true),
  // options: [{ label: string, score: number }]
  options: jsonb("options").notNull().$type<Array<{ label: string; score: number }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  formId: integer("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  // answers: { [questionId]: { optionIndex: number, score: number } }
  answers: jsonb("answers").notNull().$type<Record<string, { optionIndex: number; score: number }>>(),
  // sectionScores: { [sectionId]: number }
  sectionScores: jsonb("section_scores").notNull().$type<Record<string, number>>(),
  totalScore: integer("total_score").notNull().default(0),
  status: varchar("status", { length: 50 }).notNull().default("completed"),
  terminatedAtSection: integer("terminated_at_section"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Relations
export const formsRelations = relations(forms, ({ many }) => ({
  sections: many(sections),
  responses: many(responses),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  form: one(forms, { fields: [sections.formId], references: [forms.id] }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  section: one(sections, { fields: [questions.sectionId], references: [sections.id] }),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  form: one(forms, { fields: [responses.formId], references: [forms.id] }),
}));

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;
