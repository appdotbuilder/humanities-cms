import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mediaTable, mediaFoldersTable } from '../db/schema';
import { updateMedia } from '../handlers/update_media';
import { eq } from 'drizzle-orm';

// Test data for media
const testMediaInput = {
  filename: 'test-image.jpg',
  original_name: 'Test Image.jpg',
  mime_type: 'image/jpeg',
  size: 1024000,
  width: 1920,
  height: 1080,
  alt_text: 'Original alt text',
  description: 'Original description',
  folder_id: null
};

// Test data for media folder
const testFolderInput = {
  name: 'Test Folder',
  parent_id: null
};

describe('updateMedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update media alt text', async () => {
    // Create a media record first
    const [media] = await db.insert(mediaTable)
      .values(testMediaInput)
      .returning()
      .execute();

    const updateInput = {
      id: media.id,
      alt_text: 'Updated alt text'
    };

    const result = await updateMedia(updateInput);

    // Verify the result
    expect(result.id).toBe(media.id);
    expect(result.alt_text).toBe('Updated alt text');
    expect(result.description).toBe('Original description'); // Should remain unchanged
    expect(result.filename).toBe('test-image.jpg');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > media.updated_at).toBe(true);
  });

  it('should update media description', async () => {
    // Create a media record first
    const [media] = await db.insert(mediaTable)
      .values(testMediaInput)
      .returning()
      .execute();

    const updateInput = {
      id: media.id,
      description: 'Updated description'
    };

    const result = await updateMedia(updateInput);

    // Verify the result
    expect(result.id).toBe(media.id);
    expect(result.description).toBe('Updated description');
    expect(result.alt_text).toBe('Original alt text'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update media folder_id', async () => {
    // Create a media folder first
    const [folder] = await db.insert(mediaFoldersTable)
      .values(testFolderInput)
      .returning()
      .execute();

    // Create a media record
    const [media] = await db.insert(mediaTable)
      .values(testMediaInput)
      .returning()
      .execute();

    const updateInput = {
      id: media.id,
      folder_id: folder.id
    };

    const result = await updateMedia(updateInput);

    // Verify the result
    expect(result.id).toBe(media.id);
    expect(result.folder_id).toBe(folder.id);
    expect(result.alt_text).toBe('Original alt text'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    // Create a media folder first
    const [folder] = await db.insert(mediaFoldersTable)
      .values(testFolderInput)
      .returning()
      .execute();

    // Create a media record
    const [media] = await db.insert(mediaTable)
      .values(testMediaInput)
      .returning()
      .execute();

    const updateInput = {
      id: media.id,
      alt_text: 'New alt text',
      description: 'New description',
      folder_id: folder.id
    };

    const result = await updateMedia(updateInput);

    // Verify all fields were updated
    expect(result.id).toBe(media.id);
    expect(result.alt_text).toBe('New alt text');
    expect(result.description).toBe('New description');
    expect(result.folder_id).toBe(folder.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > media.updated_at).toBe(true);
  });

  it('should set alt_text to null', async () => {
    // Create a media record with alt text
    const [media] = await db.insert(mediaTable)
      .values(testMediaInput)
      .returning()
      .execute();

    const updateInput = {
      id: media.id,
      alt_text: null
    };

    const result = await updateMedia(updateInput);

    // Verify alt_text was set to null
    expect(result.id).toBe(media.id);
    expect(result.alt_text).toBe(null);
    expect(result.description).toBe('Original description'); // Should remain unchanged
  });

  it('should set folder_id to null', async () => {
    // Create a media folder and media record with folder assigned
    const [folder] = await db.insert(mediaFoldersTable)
      .values(testFolderInput)
      .returning()
      .execute();

    const [media] = await db.insert(mediaTable)
      .values({ ...testMediaInput, folder_id: folder.id })
      .returning()
      .execute();

    const updateInput = {
      id: media.id,
      folder_id: null
    };

    const result = await updateMedia(updateInput);

    // Verify folder_id was set to null
    expect(result.id).toBe(media.id);
    expect(result.folder_id).toBe(null);
  });

  it('should persist changes to database', async () => {
    // Create a media record
    const [media] = await db.insert(mediaTable)
      .values(testMediaInput)
      .returning()
      .execute();

    const updateInput = {
      id: media.id,
      alt_text: 'Persisted alt text',
      description: 'Persisted description'
    };

    await updateMedia(updateInput);

    // Query the database directly to verify persistence
    const [persistedMedia] = await db.select()
      .from(mediaTable)
      .where(eq(mediaTable.id, media.id))
      .execute();

    expect(persistedMedia.alt_text).toBe('Persisted alt text');
    expect(persistedMedia.description).toBe('Persisted description');
    expect(persistedMedia.updated_at).toBeInstanceOf(Date);
    expect(persistedMedia.updated_at > media.updated_at).toBe(true);
  });

  it('should throw error when media does not exist', async () => {
    const updateInput = {
      id: 999, // Non-existent ID
      alt_text: 'Updated alt text'
    };

    await expect(updateMedia(updateInput)).rejects.toThrow(/Media with id 999 not found/i);
  });

  it('should throw error when folder_id does not exist', async () => {
    // Create a media record
    const [media] = await db.insert(mediaTable)
      .values(testMediaInput)
      .returning()
      .execute();

    const updateInput = {
      id: media.id,
      folder_id: 999 // Non-existent folder ID
    };

    await expect(updateMedia(updateInput)).rejects.toThrow(/Media folder with id 999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    // Create a media record
    const [media] = await db.insert(mediaTable)
      .values(testMediaInput)
      .returning()
      .execute();

    const updateInput = {
      id: media.id
      // No fields to update
    };

    const result = await updateMedia(updateInput);

    // Should still update the updated_at timestamp
    expect(result.id).toBe(media.id);
    expect(result.alt_text).toBe(testMediaInput.alt_text);
    expect(result.description).toBe(testMediaInput.description);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > media.updated_at).toBe(true);
  });
});