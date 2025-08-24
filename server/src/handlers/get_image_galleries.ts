import { type ImageGallery } from '../schema';

export async function getImageGalleries(): Promise<ImageGallery[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is fetching all image galleries with their
  // associated images for management and display.
  return [];
}

export async function getImageGallery(id: number): Promise<ImageGallery | null> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is fetching a single gallery by ID
  // with all its images ordered by sort_order.
  return null;
}

export async function getImageGalleryBySlug(slug: string): Promise<ImageGallery | null> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is fetching a single gallery by slug
  // for public viewing with all associated images.
  return null;
}