import { z } from 'zod';

// Media schema
export const mediaSchema = z.object({
  id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  mime_type: z.string(),
  size: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  alt_text: z.string().nullable(),
  description: z.string().nullable(),
  folder_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Media = z.infer<typeof mediaSchema>;

// Media folder schema
export const mediaFolderSchema = z.object({
  id: z.number(),
  name: z.string(),
  parent_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type MediaFolder = z.infer<typeof mediaFolderSchema>;

// SEO metadata schema
export const seoMetadataSchema = z.object({
  id: z.number(),
  content_type: z.enum(['blog_post', 'static_page', 'project']),
  content_id: z.number(),
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  social_image_id: z.number().nullable(),
  og_title: z.string().nullable(),
  og_description: z.string().nullable(),
  twitter_title: z.string().nullable(),
  twitter_description: z.string().nullable(),
  canonical_url: z.string().nullable(),
  robots: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type SeoMetadata = z.infer<typeof seoMetadataSchema>;

// Blog post schema
export const blogPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().nullable(),
  featured_image_id: z.number().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  published_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BlogPost = z.infer<typeof blogPostSchema>;

// Static page schema
export const staticPageSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  featured_image_id: z.number().nullable(),
  is_homepage: z.boolean(),
  status: z.enum(['draft', 'published', 'archived']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StaticPage = z.infer<typeof staticPageSchema>;

// Image gallery schema
export const imageGallerySchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ImageGallery = z.infer<typeof imageGallerySchema>;

// Gallery images schema
export const galleryImageSchema = z.object({
  id: z.number(),
  gallery_id: z.number(),
  media_id: z.number(),
  caption: z.string().nullable(),
  sort_order: z.number().int(),
  created_at: z.coerce.date()
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;

// Timeline entry schema (for career/education)
export const timelineEntrySchema = z.object({
  id: z.number(),
  title: z.string(),
  organization: z.string(),
  description: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  is_current: z.boolean(),
  entry_type: z.enum(['career', 'education']),
  location: z.string().nullable(),
  sort_order: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TimelineEntry = z.infer<typeof timelineEntrySchema>;

// Project schema
export const projectSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  content: z.string().nullable(),
  featured_image_id: z.number().nullable(),
  project_url: z.string().nullable(),
  github_url: z.string().nullable(),
  technologies: z.array(z.string()),
  status: z.enum(['draft', 'published', 'archived']),
  start_date: z.coerce.date().nullable(),
  end_date: z.coerce.date().nullable(),
  sort_order: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

// Social sharing settings schema
export const socialSharingSettingsSchema = z.object({
  id: z.number(),
  content_type: z.enum(['blog_post', 'static_page', 'project']),
  content_id: z.number(),
  enable_twitter: z.boolean(),
  enable_facebook: z.boolean(),
  enable_linkedin: z.boolean(),
  enable_copy_link: z.boolean(),
  custom_message: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type SocialSharingSettings = z.infer<typeof socialSharingSettingsSchema>;

// Input schemas for creating content
export const createMediaInputSchema = z.object({
  filename: z.string(),
  original_name: z.string(),
  mime_type: z.string(),
  size: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  alt_text: z.string().nullable(),
  description: z.string().nullable(),
  folder_id: z.number().nullable()
});

export type CreateMediaInput = z.infer<typeof createMediaInputSchema>;

export const createMediaFolderInputSchema = z.object({
  name: z.string(),
  parent_id: z.number().nullable()
});

export type CreateMediaFolderInput = z.infer<typeof createMediaFolderInputSchema>;

export const createBlogPostInputSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().nullable(),
  featured_image_id: z.number().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  published_at: z.coerce.date().nullable()
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;

export const createStaticPageInputSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  featured_image_id: z.number().nullable(),
  is_homepage: z.boolean(),
  status: z.enum(['draft', 'published', 'archived'])
});

export type CreateStaticPageInput = z.infer<typeof createStaticPageInputSchema>;

export const createImageGalleryInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: z.enum(['draft', 'published', 'archived'])
});

export type CreateImageGalleryInput = z.infer<typeof createImageGalleryInputSchema>;

export const createGalleryImageInputSchema = z.object({
  gallery_id: z.number(),
  media_id: z.number(),
  caption: z.string().nullable(),
  sort_order: z.number().int()
});

export type CreateGalleryImageInput = z.infer<typeof createGalleryImageInputSchema>;

export const createTimelineEntryInputSchema = z.object({
  title: z.string(),
  organization: z.string(),
  description: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  is_current: z.boolean(),
  entry_type: z.enum(['career', 'education']),
  location: z.string().nullable(),
  sort_order: z.number().int()
});

export type CreateTimelineEntryInput = z.infer<typeof createTimelineEntryInputSchema>;

export const createProjectInputSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  content: z.string().nullable(),
  featured_image_id: z.number().nullable(),
  project_url: z.string().nullable(),
  github_url: z.string().nullable(),
  technologies: z.array(z.string()),
  status: z.enum(['draft', 'published', 'archived']),
  start_date: z.coerce.date().nullable(),
  end_date: z.coerce.date().nullable(),
  sort_order: z.number().int()
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const createSeoMetadataInputSchema = z.object({
  content_type: z.enum(['blog_post', 'static_page', 'project']),
  content_id: z.number(),
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  social_image_id: z.number().nullable(),
  og_title: z.string().nullable(),
  og_description: z.string().nullable(),
  twitter_title: z.string().nullable(),
  twitter_description: z.string().nullable(),
  canonical_url: z.string().nullable(),
  robots: z.string().nullable()
});

export type CreateSeoMetadataInput = z.infer<typeof createSeoMetadataInputSchema>;

export const createSocialSharingSettingsInputSchema = z.object({
  content_type: z.enum(['blog_post', 'static_page', 'project']),
  content_id: z.number(),
  enable_twitter: z.boolean(),
  enable_facebook: z.boolean(),
  enable_linkedin: z.boolean(),
  enable_copy_link: z.boolean(),
  custom_message: z.string().nullable()
});

export type CreateSocialSharingSettingsInput = z.infer<typeof createSocialSharingSettingsInputSchema>;

// Update input schemas
export const updateBlogPostInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  featured_image_id: z.number().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  published_at: z.coerce.date().nullable().optional()
});

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostInputSchema>;

export const updateStaticPageInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  featured_image_id: z.number().nullable().optional(),
  is_homepage: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional()
});

export type UpdateStaticPageInput = z.infer<typeof updateStaticPageInputSchema>;

export const updateProjectInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  content: z.string().nullable().optional(),
  featured_image_id: z.number().nullable().optional(),
  project_url: z.string().nullable().optional(),
  github_url: z.string().nullable().optional(),
  technologies: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  start_date: z.coerce.date().nullable().optional(),
  end_date: z.coerce.date().nullable().optional(),
  sort_order: z.number().int().optional()
});

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export const updateSeoMetadataInputSchema = z.object({
  id: z.number(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  social_image_id: z.number().nullable().optional(),
  og_title: z.string().nullable().optional(),
  og_description: z.string().nullable().optional(),
  twitter_title: z.string().nullable().optional(),
  twitter_description: z.string().nullable().optional(),
  canonical_url: z.string().nullable().optional(),
  robots: z.string().nullable().optional()
});

export type UpdateSeoMetadataInput = z.infer<typeof updateSeoMetadataInputSchema>;