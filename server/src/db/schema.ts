import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  integer, 
  boolean, 
  pgEnum,
  json,
  varchar
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published', 'archived']);
export const contentTypeEnum = pgEnum('content_type', ['blog_post', 'static_page', 'project']);
export const timelineTypeEnum = pgEnum('timeline_type', ['career', 'education']);

// Media folders table
export const mediaFoldersTable = pgTable('media_folders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  parent_id: integer('parent_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Media table
export const mediaTable = pgTable('media', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  original_name: text('original_name').notNull(),
  mime_type: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt_text: text('alt_text'),
  description: text('description'),
  folder_id: integer('folder_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Blog posts table
export const blogPostsTable = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  featured_image_id: integer('featured_image_id'),
  status: contentStatusEnum('status').notNull().default('draft'),
  published_at: timestamp('published_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Static pages table
export const staticPagesTable = pgTable('static_pages', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  featured_image_id: integer('featured_image_id'),
  is_homepage: boolean('is_homepage').notNull().default(false),
  status: contentStatusEnum('status').notNull().default('draft'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Image galleries table
export const imageGalleriesTable = pgTable('image_galleries', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  status: contentStatusEnum('status').notNull().default('draft'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Gallery images junction table
export const galleryImagesTable = pgTable('gallery_images', {
  id: serial('id').primaryKey(),
  gallery_id: integer('gallery_id').notNull(),
  media_id: integer('media_id').notNull(),
  caption: text('caption'),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Timeline entries table (for career/education)
export const timelineEntriesTable = pgTable('timeline_entries', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  organization: text('organization').notNull(),
  description: text('description'),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date'),
  is_current: boolean('is_current').notNull().default(false),
  entry_type: timelineTypeEnum('entry_type').notNull(),
  location: text('location'),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Projects table
export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description').notNull(),
  content: text('content'),
  featured_image_id: integer('featured_image_id'),
  project_url: text('project_url'),
  github_url: text('github_url'),
  technologies: json('technologies').$type<string[]>().notNull().default([]),
  status: contentStatusEnum('status').notNull().default('draft'),
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// SEO metadata table
export const seoMetadataTable = pgTable('seo_metadata', {
  id: serial('id').primaryKey(),
  content_type: contentTypeEnum('content_type').notNull(),
  content_id: integer('content_id').notNull(),
  meta_title: text('meta_title'),
  meta_description: text('meta_description'),
  social_image_id: integer('social_image_id'),
  og_title: text('og_title'),
  og_description: text('og_description'),
  twitter_title: text('twitter_title'),
  twitter_description: text('twitter_description'),
  canonical_url: text('canonical_url'),
  robots: text('robots'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Social sharing settings table
export const socialSharingSettingsTable = pgTable('social_sharing_settings', {
  id: serial('id').primaryKey(),
  content_type: contentTypeEnum('content_type').notNull(),
  content_id: integer('content_id').notNull(),
  enable_twitter: boolean('enable_twitter').notNull().default(true),
  enable_facebook: boolean('enable_facebook').notNull().default(true),
  enable_linkedin: boolean('enable_linkedin').notNull().default(true),
  enable_copy_link: boolean('enable_copy_link').notNull().default(true),
  custom_message: text('custom_message'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const mediaFoldersRelations = relations(mediaFoldersTable, ({ one, many }) => ({
  parent: one(mediaFoldersTable, {
    fields: [mediaFoldersTable.parent_id],
    references: [mediaFoldersTable.id],
  }),
  children: many(mediaFoldersTable),
  media: many(mediaTable),
}));

export const mediaRelations = relations(mediaTable, ({ one }) => ({
  folder: one(mediaFoldersTable, {
    fields: [mediaTable.folder_id],
    references: [mediaFoldersTable.id],
  }),
}));

export const blogPostsRelations = relations(blogPostsTable, ({ one }) => ({
  featuredImage: one(mediaTable, {
    fields: [blogPostsTable.featured_image_id],
    references: [mediaTable.id],
  }),
}));

export const staticPagesRelations = relations(staticPagesTable, ({ one }) => ({
  featuredImage: one(mediaTable, {
    fields: [staticPagesTable.featured_image_id],
    references: [mediaTable.id],
  }),
}));

export const imageGalleriesRelations = relations(imageGalleriesTable, ({ many }) => ({
  images: many(galleryImagesTable),
}));

export const galleryImagesRelations = relations(galleryImagesTable, ({ one }) => ({
  gallery: one(imageGalleriesTable, {
    fields: [galleryImagesTable.gallery_id],
    references: [imageGalleriesTable.id],
  }),
  media: one(mediaTable, {
    fields: [galleryImagesTable.media_id],
    references: [mediaTable.id],
  }),
}));

export const projectsRelations = relations(projectsTable, ({ one }) => ({
  featuredImage: one(mediaTable, {
    fields: [projectsTable.featured_image_id],
    references: [mediaTable.id],
  }),
}));

export const seoMetadataRelations = relations(seoMetadataTable, ({ one }) => ({
  socialImage: one(mediaTable, {
    fields: [seoMetadataTable.social_image_id],
    references: [mediaTable.id],
  }),
}));

// Export all tables for drizzle
export const tables = {
  mediaFolders: mediaFoldersTable,
  media: mediaTable,
  blogPosts: blogPostsTable,
  staticPages: staticPagesTable,
  imageGalleries: imageGalleriesTable,
  galleryImages: galleryImagesTable,
  timelineEntries: timelineEntriesTable,
  projects: projectsTable,
  seoMetadata: seoMetadataTable,
  socialSharingSettings: socialSharingSettingsTable,
};

// TypeScript types for the table schemas
export type Media = typeof mediaTable.$inferSelect;
export type NewMedia = typeof mediaTable.$inferInsert;

export type MediaFolder = typeof mediaFoldersTable.$inferSelect;
export type NewMediaFolder = typeof mediaFoldersTable.$inferInsert;

export type BlogPost = typeof blogPostsTable.$inferSelect;
export type NewBlogPost = typeof blogPostsTable.$inferInsert;

export type StaticPage = typeof staticPagesTable.$inferSelect;
export type NewStaticPage = typeof staticPagesTable.$inferInsert;

export type ImageGallery = typeof imageGalleriesTable.$inferSelect;
export type NewImageGallery = typeof imageGalleriesTable.$inferInsert;

export type GalleryImage = typeof galleryImagesTable.$inferSelect;
export type NewGalleryImage = typeof galleryImagesTable.$inferInsert;

export type TimelineEntry = typeof timelineEntriesTable.$inferSelect;
export type NewTimelineEntry = typeof timelineEntriesTable.$inferInsert;

export type Project = typeof projectsTable.$inferSelect;
export type NewProject = typeof projectsTable.$inferInsert;

export type SeoMetadata = typeof seoMetadataTable.$inferSelect;
export type NewSeoMetadata = typeof seoMetadataTable.$inferInsert;

export type SocialSharingSettings = typeof socialSharingSettingsTable.$inferSelect;
export type NewSocialSharingSettings = typeof socialSharingSettingsTable.$inferInsert;