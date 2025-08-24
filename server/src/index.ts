import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import all schemas
import {
  createBlogPostInputSchema,
  updateBlogPostInputSchema,
  createStaticPageInputSchema,
  updateStaticPageInputSchema,
  createProjectInputSchema,
  updateProjectInputSchema,
  createImageGalleryInputSchema,
  createGalleryImageInputSchema,
  createTimelineEntryInputSchema,
  createMediaInputSchema,
  createMediaFolderInputSchema,
  createSeoMetadataInputSchema,
  updateSeoMetadataInputSchema,
  createSocialSharingSettingsInputSchema
} from './schema';

// Import all handlers
import { createBlogPost } from './handlers/create_blog_post';
import { getBlogPosts, getBlogPost, getBlogPostBySlug } from './handlers/get_blog_posts';
import { updateBlogPost, deleteBlogPost } from './handlers/update_blog_post';

import { createStaticPage } from './handlers/create_static_page';
import { getStaticPages, getStaticPage, getStaticPageBySlug, getHomepage } from './handlers/get_static_pages';
import { updateStaticPage, deleteStaticPage } from './handlers/update_static_page';

import { createProject } from './handlers/create_project';
import { getProjects, getProject, getProjectBySlug } from './handlers/get_projects';
import { updateProject, deleteProject } from './handlers/update_project';

import { createImageGallery } from './handlers/create_image_gallery';
import { getImageGalleries, getImageGallery, getImageGalleryBySlug } from './handlers/get_image_galleries';
import { 
  addImageToGallery, 
  removeImageFromGallery, 
  updateGalleryImageOrder, 
  updateGalleryImageCaption 
} from './handlers/manage_gallery_images';

import { createTimelineEntry } from './handlers/create_timeline_entry';
import { 
  getTimelineEntries, 
  getCareerEntries, 
  getEducationEntries, 
  getTimelineEntry 
} from './handlers/get_timeline_entries';
import { 
  updateTimelineEntry, 
  deleteTimelineEntry, 
  updateTimelineOrder 
} from './handlers/update_timeline_entry';

import { createMedia, uploadImage } from './handlers/create_media';
import { getMedia, getMediaById, getMediaByFolder, searchMedia } from './handlers/get_media';
import { updateMedia, deleteMedia, resizeImage, moveMedia } from './handlers/update_media';

import { 
  createMediaFolder, 
  getMediaFolders, 
  getMediaFolder, 
  updateMediaFolder, 
  deleteMediaFolder 
} from './handlers/manage_media_folders';

import { 
  createSeoMetadata, 
  getSeoMetadata, 
  updateSeoMetadata, 
  deleteSeoMetadata, 
  generateSeoPreview 
} from './handlers/manage_seo_metadata';

import { 
  createSocialSharingSettings, 
  getSocialSharingSettings, 
  updateSocialSharingSettings, 
  generateSharingUrls 
} from './handlers/manage_social_sharing';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Blog Posts
  createBlogPost: publicProcedure
    .input(createBlogPostInputSchema)
    .mutation(({ input }) => createBlogPost(input)),
  
  getBlogPosts: publicProcedure
    .query(() => getBlogPosts()),
  
  getBlogPost: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getBlogPost(input.id)),
  
  getBlogPostBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getBlogPostBySlug(input.slug)),
  
  updateBlogPost: publicProcedure
    .input(updateBlogPostInputSchema)
    .mutation(({ input }) => updateBlogPost(input)),
  
  deleteBlogPost: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBlogPost(input.id)),

  // Static Pages
  createStaticPage: publicProcedure
    .input(createStaticPageInputSchema)
    .mutation(({ input }) => createStaticPage(input)),
  
  getStaticPages: publicProcedure
    .query(() => getStaticPages()),
  
  getStaticPage: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getStaticPage(input.id)),
  
  getStaticPageBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getStaticPageBySlug(input.slug)),
  
  getHomepage: publicProcedure
    .query(() => getHomepage()),
  
  updateStaticPage: publicProcedure
    .input(updateStaticPageInputSchema)
    .mutation(({ input }) => updateStaticPage(input)),
  
  deleteStaticPage: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteStaticPage(input.id)),

  // Projects
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),
  
  getProjects: publicProcedure
    .query(() => getProjects()),
  
  getProject: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProject(input.id)),
  
  getProjectBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getProjectBySlug(input.slug)),
  
  updateProject: publicProcedure
    .input(updateProjectInputSchema)
    .mutation(({ input }) => updateProject(input)),
  
  deleteProject: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteProject(input.id)),

  // Image Galleries
  createImageGallery: publicProcedure
    .input(createImageGalleryInputSchema)
    .mutation(({ input }) => createImageGallery(input)),
  
  getImageGalleries: publicProcedure
    .query(() => getImageGalleries()),
  
  getImageGallery: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getImageGallery(input.id)),
  
  getImageGalleryBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getImageGalleryBySlug(input.slug)),
  
  addImageToGallery: publicProcedure
    .input(createGalleryImageInputSchema)
    .mutation(({ input }) => addImageToGallery(input)),
  
  removeImageFromGallery: publicProcedure
    .input(z.object({ galleryImageId: z.number() }))
    .mutation(({ input }) => removeImageFromGallery(input.galleryImageId)),
  
  updateGalleryImageOrder: publicProcedure
    .input(z.object({ 
      galleryId: z.number(),
      imageOrders: z.array(z.object({ id: z.number(), sort_order: z.number() }))
    }))
    .mutation(({ input }) => updateGalleryImageOrder(input.galleryId, input.imageOrders)),
  
  updateGalleryImageCaption: publicProcedure
    .input(z.object({ 
      galleryImageId: z.number(),
      caption: z.string().nullable()
    }))
    .mutation(({ input }) => updateGalleryImageCaption(input.galleryImageId, input.caption)),

  // Timeline Entries
  createTimelineEntry: publicProcedure
    .input(createTimelineEntryInputSchema)
    .mutation(({ input }) => createTimelineEntry(input)),
  
  getTimelineEntries: publicProcedure
    .query(() => getTimelineEntries()),
  
  getCareerEntries: publicProcedure
    .query(() => getCareerEntries()),
  
  getEducationEntries: publicProcedure
    .query(() => getEducationEntries()),
  
  getTimelineEntry: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getTimelineEntry(input.id)),
  
  updateTimelineEntry: publicProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      organization: z.string().optional(),
      description: z.string().nullable().optional(),
      start_date: z.coerce.date().optional(),
      end_date: z.coerce.date().nullable().optional(),
      is_current: z.boolean().optional(),
      entry_type: z.enum(['career', 'education']).optional(),
      location: z.string().nullable().optional(),
      sort_order: z.number().int().optional()
    }))
    .mutation(({ input }) => updateTimelineEntry(input)),
  
  deleteTimelineEntry: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTimelineEntry(input.id)),
  
  updateTimelineOrder: publicProcedure
    .input(z.object({
      entryOrders: z.array(z.object({ id: z.number(), sort_order: z.number() }))
    }))
    .mutation(({ input }) => updateTimelineOrder(input.entryOrders)),

  // Media Management
  createMedia: publicProcedure
    .input(createMediaInputSchema)
    .mutation(({ input }) => createMedia(input)),
  
  getMedia: publicProcedure
    .query(() => getMedia()),
  
  getMediaById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getMediaById(input.id)),
  
  getMediaByFolder: publicProcedure
    .input(z.object({ folderId: z.number() }))
    .query(({ input }) => getMediaByFolder(input.folderId)),
  
  searchMedia: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => searchMedia(input.query)),
  
  updateMedia: publicProcedure
    .input(z.object({
      id: z.number(),
      alt_text: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      folder_id: z.number().nullable().optional()
    }))
    .mutation(({ input }) => updateMedia(input)),
  
  deleteMedia: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMedia(input.id)),
  
  resizeImage: publicProcedure
    .input(z.object({
      id: z.number(),
      width: z.number(),
      height: z.number(),
      crop: z.boolean().optional()
    }))
    .mutation(({ input }) => resizeImage(input)),
  
  moveMedia: publicProcedure
    .input(z.object({
      mediaIds: z.array(z.number()),
      targetFolderId: z.number().nullable()
    }))
    .mutation(({ input }) => moveMedia(input.mediaIds, input.targetFolderId)),

  // Media Folders
  createMediaFolder: publicProcedure
    .input(createMediaFolderInputSchema)
    .mutation(({ input }) => createMediaFolder(input)),
  
  getMediaFolders: publicProcedure
    .query(() => getMediaFolders()),
  
  getMediaFolder: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getMediaFolder(input.id)),
  
  updateMediaFolder: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      parent_id: z.number().nullable().optional()
    }))
    .mutation(({ input }) => updateMediaFolder(input)),
  
  deleteMediaFolder: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMediaFolder(input.id)),

  // SEO Metadata
  createSeoMetadata: publicProcedure
    .input(createSeoMetadataInputSchema)
    .mutation(({ input }) => createSeoMetadata(input)),
  
  getSeoMetadata: publicProcedure
    .input(z.object({
      contentType: z.enum(['blog_post', 'static_page', 'project']),
      contentId: z.number()
    }))
    .query(({ input }) => getSeoMetadata(input.contentType, input.contentId)),
  
  updateSeoMetadata: publicProcedure
    .input(updateSeoMetadataInputSchema)
    .mutation(({ input }) => updateSeoMetadata(input)),
  
  deleteSeoMetadata: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteSeoMetadata(input.id)),
  
  generateSeoPreview: publicProcedure
    .input(z.object({
      contentType: z.enum(['blog_post', 'static_page', 'project']),
      contentId: z.number()
    }))
    .query(({ input }) => generateSeoPreview(input.contentType, input.contentId)),

  // Social Sharing
  createSocialSharingSettings: publicProcedure
    .input(createSocialSharingSettingsInputSchema)
    .mutation(({ input }) => createSocialSharingSettings(input)),
  
  getSocialSharingSettings: publicProcedure
    .input(z.object({
      contentType: z.enum(['blog_post', 'static_page', 'project']),
      contentId: z.number()
    }))
    .query(({ input }) => getSocialSharingSettings(input.contentType, input.contentId)),
  
  updateSocialSharingSettings: publicProcedure
    .input(z.object({
      id: z.number(),
      enable_twitter: z.boolean().optional(),
      enable_facebook: z.boolean().optional(),
      enable_linkedin: z.boolean().optional(),
      enable_copy_link: z.boolean().optional(),
      custom_message: z.string().nullable().optional()
    }))
    .mutation(({ input }) => updateSocialSharingSettings(input)),
  
  generateSharingUrls: publicProcedure
    .input(z.object({
      contentType: z.enum(['blog_post', 'static_page', 'project']),
      contentId: z.number(),
      baseUrl: z.string()
    }))
    .query(({ input }) => generateSharingUrls(input.contentType, input.contentId, input.baseUrl)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();