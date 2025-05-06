import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull().unique(),
  content: text("content").default(""),
  isFolder: boolean("is_folder").default(false),
  parentId: integer("parent_id").references(() => files.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  version: varchar("version", { length: 50 }).notNull(),
  author: varchar("author", { length: 255 }),
  content: text("content").notNull(),
  downloads: integer("downloads").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const documentation = pgTable("documentation", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  content: text("content").notNull(),
  code_example: text("code_example"),
  order: integer("order").default(0)
});

// Relations
export const filesRelations = relations(files, ({ one, many }) => ({
  parent: one(files, {
    fields: [files.parentId],
    references: [files.id]
  }),
  children: many(files)
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFileSchema = createInsertSchema(files, {
  name: (schema) => schema.min(1, "Le nom du fichier est requis"),
  path: (schema) => schema.min(1, "Le chemin du fichier est requis")
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPackageSchema = createInsertSchema(packages, {
  name: (schema) => schema.min(1, "Le nom du package est requis"),
  version: (schema) => schema.min(1, "La version du package est requise"),
  content: (schema) => schema.min(1, "Le contenu du package est requis")
}).omit({ 
  id: true, 
  downloads: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertDocumentationSchema = createInsertSchema(documentation, {
  title: (schema) => schema.min(1, "Le titre est requis"),
  category: (schema) => schema.min(1, "La catégorie est requise"),
  content: (schema) => schema.min(1, "Le contenu est requis")
}).omit({ 
  id: true 
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packages.$inferSelect;

export type InsertDocumentation = z.infer<typeof insertDocumentationSchema>;
export type Documentation = typeof documentation.$inferSelect;
