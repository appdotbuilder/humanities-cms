import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timelineEntriesTable } from '../db/schema';
import { type CreateTimelineEntryInput } from '../schema';
import { 
  getTimelineEntries, 
  getCareerEntries, 
  getEducationEntries, 
  getTimelineEntry 
} from '../handlers/get_timeline_entries';

// Test data
const careerEntry1: CreateTimelineEntryInput = {
  title: 'Senior Software Engineer',
  organization: 'Tech Corp',
  description: 'Led development of web applications',
  start_date: new Date('2022-01-01'),
  end_date: null,
  is_current: true,
  entry_type: 'career',
  location: 'San Francisco, CA',
  sort_order: 1
};

const careerEntry2: CreateTimelineEntryInput = {
  title: 'Software Developer',
  organization: 'StartupCo',
  description: 'Full-stack development',
  start_date: new Date('2020-06-01'),
  end_date: new Date('2021-12-31'),
  is_current: false,
  entry_type: 'career',
  location: 'Remote',
  sort_order: 2
};

const educationEntry1: CreateTimelineEntryInput = {
  title: 'Bachelor of Computer Science',
  organization: 'State University',
  description: 'Focus on software engineering and algorithms',
  start_date: new Date('2016-09-01'),
  end_date: new Date('2020-05-15'),
  is_current: false,
  entry_type: 'education',
  location: 'College Town, CA',
  sort_order: 1
};

const educationEntry2: CreateTimelineEntryInput = {
  title: 'Master of Computer Science',
  organization: 'Tech University',
  description: 'Specialization in machine learning',
  start_date: new Date('2020-09-01'),
  end_date: new Date('2022-05-15'),
  is_current: false,
  entry_type: 'education',
  location: 'Boston, MA',
  sort_order: 0
};

describe('getTimelineEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no entries exist', async () => {
    const result = await getTimelineEntries();

    expect(result).toEqual([]);
  });

  it('should fetch all timeline entries ordered by sort_order and start_date', async () => {
    // Insert test entries
    await db.insert(timelineEntriesTable).values([
      careerEntry1,
      careerEntry2,
      educationEntry1,
      educationEntry2
    ]).execute();

    const result = await getTimelineEntries();

    expect(result).toHaveLength(4);

    // Should be ordered by sort_order first (0, 1, 1, 2), then by start_date desc within same sort_order
    expect(result[0].title).toEqual('Master of Computer Science'); // sort_order: 0
    expect(result[1].title).toEqual('Senior Software Engineer'); // sort_order: 1, newer date
    expect(result[2].title).toEqual('Bachelor of Computer Science'); // sort_order: 1, older date
    expect(result[3].title).toEqual('Software Developer'); // sort_order: 2

    // Verify all fields are present
    expect(result[0].organization).toEqual('Tech University');
    expect(result[0].entry_type).toEqual('education');
    expect(result[0].is_current).toEqual(false);
    expect(result[0].location).toEqual('Boston, MA');
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should include both career and education entries', async () => {
    await db.insert(timelineEntriesTable).values([
      careerEntry1,
      educationEntry1
    ]).execute();

    const result = await getTimelineEntries();

    expect(result).toHaveLength(2);
    expect(result.some(entry => entry.entry_type === 'career')).toBe(true);
    expect(result.some(entry => entry.entry_type === 'education')).toBe(true);
  });
});

describe('getCareerEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no career entries exist', async () => {
    const result = await getCareerEntries();

    expect(result).toEqual([]);
  });

  it('should fetch only career entries', async () => {
    await db.insert(timelineEntriesTable).values([
      careerEntry1,
      careerEntry2,
      educationEntry1
    ]).execute();

    const result = await getCareerEntries();

    expect(result).toHaveLength(2);
    result.forEach(entry => {
      expect(entry.entry_type).toEqual('career');
    });

    // Should be ordered by sort_order, then start_date desc
    expect(result[0].title).toEqual('Senior Software Engineer'); // sort_order: 1
    expect(result[1].title).toEqual('Software Developer'); // sort_order: 2
  });

  it('should not include education entries', async () => {
    await db.insert(timelineEntriesTable).values([
      careerEntry1,
      educationEntry1,
      educationEntry2
    ]).execute();

    const result = await getCareerEntries();

    expect(result).toHaveLength(1);
    expect(result[0].entry_type).toEqual('career');
    expect(result[0].title).toEqual('Senior Software Engineer');
  });

  it('should handle current and past career entries', async () => {
    await db.insert(timelineEntriesTable).values([
      careerEntry1, // is_current: true
      careerEntry2  // is_current: false
    ]).execute();

    const result = await getCareerEntries();

    expect(result).toHaveLength(2);
    expect(result.some(entry => entry.is_current === true)).toBe(true);
    expect(result.some(entry => entry.is_current === false)).toBe(true);
  });
});

describe('getEducationEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no education entries exist', async () => {
    const result = await getEducationEntries();

    expect(result).toEqual([]);
  });

  it('should fetch only education entries', async () => {
    await db.insert(timelineEntriesTable).values([
      educationEntry1,
      educationEntry2,
      careerEntry1
    ]).execute();

    const result = await getEducationEntries();

    expect(result).toHaveLength(2);
    result.forEach(entry => {
      expect(entry.entry_type).toEqual('education');
    });

    // Should be ordered by sort_order, then start_date desc
    expect(result[0].title).toEqual('Master of Computer Science'); // sort_order: 0
    expect(result[1].title).toEqual('Bachelor of Computer Science'); // sort_order: 1
  });

  it('should not include career entries', async () => {
    await db.insert(timelineEntriesTable).values([
      educationEntry1,
      careerEntry1,
      careerEntry2
    ]).execute();

    const result = await getEducationEntries();

    expect(result).toHaveLength(1);
    expect(result[0].entry_type).toEqual('education');
    expect(result[0].title).toEqual('Bachelor of Computer Science');
  });

  it('should handle entries with null end_date', async () => {
    const ongoingEducation: CreateTimelineEntryInput = {
      ...educationEntry1,
      title: 'PhD in Computer Science',
      end_date: null,
      is_current: true
    };

    await db.insert(timelineEntriesTable).values([
      ongoingEducation,
      educationEntry2
    ]).execute();

    const result = await getEducationEntries();

    expect(result).toHaveLength(2);
    const phdEntry = result.find(entry => entry.title === 'PhD in Computer Science');
    expect(phdEntry?.end_date).toBeNull();
    expect(phdEntry?.is_current).toBe(true);
  });
});

describe('getTimelineEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when entry does not exist', async () => {
    const result = await getTimelineEntry(999);

    expect(result).toBeNull();
  });

  it('should fetch a single timeline entry by id', async () => {
    const insertResult = await db.insert(timelineEntriesTable)
      .values([careerEntry1, educationEntry1])
      .returning()
      .execute();

    const createdEntry = insertResult[0];
    const result = await getTimelineEntry(createdEntry.id);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(createdEntry.id);
    expect(result?.title).toEqual('Senior Software Engineer');
    expect(result?.organization).toEqual('Tech Corp');
    expect(result?.entry_type).toEqual('career');
    expect(result?.is_current).toBe(true);
    expect(result?.location).toEqual('San Francisco, CA');
    expect(result?.start_date).toBeInstanceOf(Date);
    expect(result?.end_date).toBeNull();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should fetch correct entry when multiple exist', async () => {
    const insertResult = await db.insert(timelineEntriesTable)
      .values([careerEntry1, educationEntry1, careerEntry2])
      .returning()
      .execute();

    const educationEntryId = insertResult.find(entry => entry.entry_type === 'education')!.id;
    const result = await getTimelineEntry(educationEntryId);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(educationEntryId);
    expect(result?.title).toEqual('Bachelor of Computer Science');
    expect(result?.entry_type).toEqual('education');
  });

  it('should handle entries with all nullable fields', async () => {
    const minimalEntry: CreateTimelineEntryInput = {
      title: 'Minimal Entry',
      organization: 'Test Org',
      description: null,
      start_date: new Date('2021-01-01'),
      end_date: null,
      is_current: false,
      entry_type: 'career',
      location: null,
      sort_order: 0
    };

    const insertResult = await db.insert(timelineEntriesTable)
      .values(minimalEntry)
      .returning()
      .execute();

    const result = await getTimelineEntry(insertResult[0].id);

    expect(result).not.toBeNull();
    expect(result?.description).toBeNull();
    expect(result?.end_date).toBeNull();
    expect(result?.location).toBeNull();
    expect(result?.title).toEqual('Minimal Entry');
  });
});