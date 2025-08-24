import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mediaTable, mediaFoldersTable } from '../db/schema';
import { type CreateMediaInput, type CreateMediaFolderInput } from '../schema';
import { 
  getMedia, 
  getMediaById, 
  getMediaByFolder, 
  getMediaInRootFolder,
  searchMedia 
} from '../handlers/get_media';

// Test data
const testMediaInput1: CreateMediaInput = {
  filename: 'test-image-1.jpg',
  original_name: 'My Test Image 1.jpg',
  mime_type: 'image/jpeg',
  size: 1024000,
  width: 1920,
  height: 1080,
  alt_text: 'A test image for unit testing',
  description: 'This is a sample image used in our test suite',
  folder_id: null
};

const testMediaInput2: CreateMediaInput = {
  filename: 'document.pdf',
  original_name: 'Important Document.pdf',
  mime_type: 'application/pdf',
  size: 2048000,
  width: null,
  height: null,
  alt_text: null,
  description: 'A PDF document for testing',
  folder_id: null
};

const testFolderInput: CreateMediaFolderInput = {
  name: 'Test Folder',
  parent_id: null
};

describe('getMedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all media ordered by created_at desc', async () => {
    // Create test media files with different timestamps
    await db.insert(mediaTable).values(testMediaInput1).execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(mediaTable).values(testMediaInput2).execute();

    const results = await getMedia();

    expect(results).toHaveLength(2);
    expect(results[0].filename).toEqual('document.pdf'); // More recent
    expect(results[1].filename).toEqual('test-image-1.jpg');
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no media exists', async () => {
    const results = await getMedia();
    expect(results).toHaveLength(0);
  });

  it('should handle all media fields correctly', async () => {
    await db.insert(mediaTable).values(testMediaInput1).execute();

    const results = await getMedia();
    const media = results[0];

    expect(media.filename).toEqual('test-image-1.jpg');
    expect(media.original_name).toEqual('My Test Image 1.jpg');
    expect(media.mime_type).toEqual('image/jpeg');
    expect(media.size).toEqual(1024000);
    expect(media.width).toEqual(1920);
    expect(media.height).toEqual(1080);
    expect(media.alt_text).toEqual('A test image for unit testing');
    expect(media.description).toEqual('This is a sample image used in our test suite');
    expect(media.folder_id).toBeNull();
    expect(media.id).toBeDefined();
    expect(media.created_at).toBeInstanceOf(Date);
    expect(media.updated_at).toBeInstanceOf(Date);
  });
});

describe('getMediaById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return media by ID', async () => {
    const [inserted] = await db.insert(mediaTable)
      .values(testMediaInput1)
      .returning()
      .execute();

    const result = await getMediaById(inserted.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(inserted.id);
    expect(result!.filename).toEqual('test-image-1.jpg');
    expect(result!.original_name).toEqual('My Test Image 1.jpg');
  });

  it('should return null for non-existent ID', async () => {
    const result = await getMediaById(999);
    expect(result).toBeNull();
  });

  it('should handle media with null values correctly', async () => {
    const [inserted] = await db.insert(mediaTable)
      .values(testMediaInput2)
      .returning()
      .execute();

    const result = await getMediaById(inserted.id);

    expect(result!.width).toBeNull();
    expect(result!.height).toBeNull();
    expect(result!.alt_text).toBeNull();
    expect(result!.description).toEqual('A PDF document for testing');
  });
});

describe('getMediaByFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return media files in specific folder', async () => {
    // Create a test folder
    const [folder] = await db.insert(mediaFoldersTable)
      .values(testFolderInput)
      .returning()
      .execute();

    // Create media in the folder
    const mediaInFolder = {
      ...testMediaInput1,
      folder_id: folder.id
    };

    const mediaInRoot = {
      ...testMediaInput2,
      folder_id: null
    };

    await db.insert(mediaTable).values([mediaInFolder, mediaInRoot]).execute();

    const results = await getMediaByFolder(folder.id);

    expect(results).toHaveLength(1);
    expect(results[0].filename).toEqual('test-image-1.jpg');
    expect(results[0].folder_id).toEqual(folder.id);
  });

  it('should return empty array for folder with no media', async () => {
    // Create a test folder
    const [folder] = await db.insert(mediaFoldersTable)
      .values(testFolderInput)
      .returning()
      .execute();

    const results = await getMediaByFolder(folder.id);
    expect(results).toHaveLength(0);
  });

  it('should return empty array for non-existent folder', async () => {
    const results = await getMediaByFolder(999);
    expect(results).toHaveLength(0);
  });

  it('should order results by created_at desc', async () => {
    // Create a test folder
    const [folder] = await db.insert(mediaFoldersTable)
      .values(testFolderInput)
      .returning()
      .execute();

    // Create multiple media files in the folder with different timestamps
    const media1 = { ...testMediaInput1, folder_id: folder.id };
    await db.insert(mediaTable).values(media1).execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const media2 = { ...testMediaInput2, folder_id: folder.id };
    await db.insert(mediaTable).values(media2).execute();

    const results = await getMediaByFolder(folder.id);

    expect(results).toHaveLength(2);
    expect(results[0].filename).toEqual('document.pdf'); // More recent
    expect(results[1].filename).toEqual('test-image-1.jpg');
  });
});

describe('getMediaInRootFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return media files with null folder_id', async () => {
    // Create a test folder
    const [folder] = await db.insert(mediaFoldersTable)
      .values(testFolderInput)
      .returning()
      .execute();

    const mediaInFolder = {
      ...testMediaInput1,
      folder_id: folder.id
    };

    const mediaInRoot = {
      ...testMediaInput2,
      folder_id: null
    };

    await db.insert(mediaTable).values([mediaInFolder, mediaInRoot]).execute();

    const results = await getMediaInRootFolder();

    expect(results).toHaveLength(1);
    expect(results[0].filename).toEqual('document.pdf');
    expect(results[0].folder_id).toBeNull();
  });

  it('should return empty array when no root media exists', async () => {
    // Create a test folder
    const [folder] = await db.insert(mediaFoldersTable)
      .values(testFolderInput)
      .returning()
      .execute();

    // Create media only in folders
    const mediaInFolder = {
      ...testMediaInput1,
      folder_id: folder.id
    };

    await db.insert(mediaTable).values(mediaInFolder).execute();

    const results = await getMediaInRootFolder();
    expect(results).toHaveLength(0);
  });

  it('should order root media by created_at desc', async () => {
    const media1 = { ...testMediaInput1, folder_id: null };
    await db.insert(mediaTable).values(media1).execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const media2 = { ...testMediaInput2, folder_id: null };
    await db.insert(mediaTable).values(media2).execute();

    const results = await getMediaInRootFolder();

    expect(results).toHaveLength(2);
    expect(results[0].filename).toEqual('document.pdf'); // More recent
    expect(results[1].filename).toEqual('test-image-1.jpg');
  });
});

describe('searchMedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create test media for search with staggered timestamps
    const media1 = {
      filename: 'vacation-photo.jpg',
      original_name: 'Summer Vacation 2023.jpg',
      mime_type: 'image/jpeg',
      size: 1500000,
      width: 2048,
      height: 1536,
      alt_text: 'Beautiful beach sunset during vacation',
      description: 'Photo taken at the beach during our family vacation',
      folder_id: null
    };
    
    const media2 = {
      filename: 'work-presentation.pdf',
      original_name: 'Q4 Business Report.pdf',
      mime_type: 'application/pdf',
      size: 3000000,
      width: null,
      height: null,
      alt_text: null,
      description: 'Quarterly business metrics and analysis',
      folder_id: null
    };
    
    const media3 = {
      filename: 'logo-design.png',
      original_name: 'Company Logo Final.png',
      mime_type: 'image/png',
      size: 500000,
      width: 512,
      height: 512,
      alt_text: 'Company logo with transparent background',
      description: null,
      folder_id: null
    };

    // Insert with delays to ensure different timestamps
    await db.insert(mediaTable).values(media1).execute();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(mediaTable).values(media2).execute();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(mediaTable).values(media3).execute();
  });

  it('should search by filename', async () => {
    const results = await searchMedia('vacation');

    expect(results).toHaveLength(1);
    expect(results[0].filename).toEqual('vacation-photo.jpg');
  });

  it('should search by original_name', async () => {
    const results = await searchMedia('Summer');

    expect(results).toHaveLength(1);
    expect(results[0].original_name).toEqual('Summer Vacation 2023.jpg');
  });

  it('should search by alt_text', async () => {
    const results = await searchMedia('sunset');

    expect(results).toHaveLength(1);
    expect(results[0].alt_text).toContain('sunset');
  });

  it('should search by description', async () => {
    const results = await searchMedia('business');

    expect(results).toHaveLength(1);
    expect(results[0].description).toContain('business');
  });

  it('should be case insensitive', async () => {
    const results = await searchMedia('VACATION');

    expect(results).toHaveLength(1);
    expect(results[0].filename).toEqual('vacation-photo.jpg');
  });

  it('should search across multiple fields', async () => {
    const results = await searchMedia('logo');

    expect(results).toHaveLength(1);
    expect(results[0].filename).toEqual('logo-design.png');
  });

  it('should support partial matches', async () => {
    const results = await searchMedia('comp');

    expect(results).toHaveLength(1);
    expect(results[0].original_name).toEqual('Company Logo Final.png');
  });

  it('should return multiple matches', async () => {
    const results = await searchMedia('.jpg');

    expect(results).toHaveLength(1);
    expect(results[0].mime_type).toEqual('image/jpeg');
  });

  it('should return empty array for no matches', async () => {
    const results = await searchMedia('nonexistent');
    expect(results).toHaveLength(0);
  });

  it('should handle empty search query', async () => {
    const results = await searchMedia('');

    expect(results).toHaveLength(3);
  });

  it('should order results by created_at desc', async () => {
    const results = await searchMedia('.');

    expect(results).toHaveLength(3);
    expect(results[0].filename).toEqual('logo-design.png'); // Most recent
    expect(results[2].filename).toEqual('vacation-photo.jpg'); // Oldest
  });

  it('should handle special characters in search', async () => {
    const results = await searchMedia('Q4');

    expect(results).toHaveLength(1);
    expect(results[0].original_name).toContain('Q4');
  });
});