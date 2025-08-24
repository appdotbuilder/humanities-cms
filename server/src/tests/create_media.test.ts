import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mediaTable, mediaFoldersTable } from '../db/schema';
import { type CreateMediaInput } from '../schema';
import { createMedia } from '../handlers/create_media';
import { eq } from 'drizzle-orm';

// Test input for basic media creation
const testInput: CreateMediaInput = {
  filename: 'test-image.jpg',
  original_name: 'Test Image.jpg',
  mime_type: 'image/jpeg',
  size: 1024000,
  width: 1920,
  height: 1080,
  alt_text: 'A test image',
  description: 'This is a test image for testing purposes',
  folder_id: null
};

describe('createMedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create media without folder', async () => {
    const result = await createMedia(testInput);

    // Basic field validation
    expect(result.filename).toEqual('test-image.jpg');
    expect(result.original_name).toEqual('Test Image.jpg');
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.size).toEqual(1024000);
    expect(result.width).toEqual(1920);
    expect(result.height).toEqual(1080);
    expect(result.alt_text).toEqual('A test image');
    expect(result.description).toEqual('This is a test image for testing purposes');
    expect(result.folder_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save media to database', async () => {
    const result = await createMedia(testInput);

    // Query database to verify record was saved
    const media = await db.select()
      .from(mediaTable)
      .where(eq(mediaTable.id, result.id))
      .execute();

    expect(media).toHaveLength(1);
    expect(media[0].filename).toEqual('test-image.jpg');
    expect(media[0].original_name).toEqual('Test Image.jpg');
    expect(media[0].mime_type).toEqual('image/jpeg');
    expect(media[0].size).toEqual(1024000);
    expect(media[0].width).toEqual(1920);
    expect(media[0].height).toEqual(1080);
    expect(media[0].alt_text).toEqual('A test image');
    expect(media[0].description).toEqual('This is a test image for testing purposes');
    expect(media[0].folder_id).toBeNull();
    expect(media[0].created_at).toBeInstanceOf(Date);
    expect(media[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create media with folder assignment', async () => {
    // First create a media folder
    const folderResult = await db.insert(mediaFoldersTable)
      .values({
        name: 'Test Folder',
        parent_id: null
      })
      .returning()
      .execute();

    const folderId = folderResult[0].id;

    // Create media with folder assignment
    const inputWithFolder: CreateMediaInput = {
      ...testInput,
      folder_id: folderId
    };

    const result = await createMedia(inputWithFolder);

    expect(result.folder_id).toEqual(folderId);

    // Verify in database
    const media = await db.select()
      .from(mediaTable)
      .where(eq(mediaTable.id, result.id))
      .execute();

    expect(media[0].folder_id).toEqual(folderId);
  });

  it('should handle media with null optional fields', async () => {
    const minimalInput: CreateMediaInput = {
      filename: 'minimal.pdf',
      original_name: 'Minimal Document.pdf',
      mime_type: 'application/pdf',
      size: 512000,
      width: null,
      height: null,
      alt_text: null,
      description: null,
      folder_id: null
    };

    const result = await createMedia(minimalInput);

    expect(result.filename).toEqual('minimal.pdf');
    expect(result.original_name).toEqual('Minimal Document.pdf');
    expect(result.mime_type).toEqual('application/pdf');
    expect(result.size).toEqual(512000);
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
    expect(result.alt_text).toBeNull();
    expect(result.description).toBeNull();
    expect(result.folder_id).toBeNull();
  });

  it('should throw error when folder does not exist', async () => {
    const inputWithInvalidFolder: CreateMediaInput = {
      ...testInput,
      folder_id: 999 // Non-existent folder ID
    };

    await expect(createMedia(inputWithInvalidFolder))
      .rejects
      .toThrow(/Media folder with id 999 not found/i);
  });

  it('should handle different media types correctly', async () => {
    const videoInput: CreateMediaInput = {
      filename: 'test-video.mp4',
      original_name: 'Test Video.mp4',
      mime_type: 'video/mp4',
      size: 50000000,
      width: 1280,
      height: 720,
      alt_text: null,
      description: 'Test video file',
      folder_id: null
    };

    const result = await createMedia(videoInput);

    expect(result.mime_type).toEqual('video/mp4');
    expect(result.filename).toEqual('test-video.mp4');
    expect(result.size).toEqual(50000000);
    expect(result.width).toEqual(1280);
    expect(result.height).toEqual(720);
  });

  it('should handle large file sizes', async () => {
    const largeFileInput: CreateMediaInput = {
      filename: 'large-file.zip',
      original_name: 'Large Archive.zip',
      mime_type: 'application/zip',
      size: 999999999, // ~1GB
      width: null,
      height: null,
      alt_text: null,
      description: 'Large archive file',
      folder_id: null
    };

    const result = await createMedia(largeFileInput);

    expect(result.size).toEqual(999999999);
    expect(result.mime_type).toEqual('application/zip');
  });

  it('should preserve exact timestamps', async () => {
    const beforeCreate = new Date();
    const result = await createMedia(testInput);
    const afterCreate = new Date();

    // Timestamps should be between before and after creation
    expect(result.created_at >= beforeCreate).toBe(true);
    expect(result.created_at <= afterCreate).toBe(true);
    expect(result.updated_at >= beforeCreate).toBe(true);
    expect(result.updated_at <= afterCreate).toBe(true);

    // created_at and updated_at should be very close (within same second)
    const timeDifference = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
  });
});