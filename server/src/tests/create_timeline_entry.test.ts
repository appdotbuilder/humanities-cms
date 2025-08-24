import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timelineEntriesTable } from '../db/schema';
import { type CreateTimelineEntryInput } from '../schema';
import { createTimelineEntry } from '../handlers/create_timeline_entry';
import { eq } from 'drizzle-orm';

// Test input for career entry
const careerTestInput: CreateTimelineEntryInput = {
  title: 'Senior Software Engineer',
  organization: 'Tech Corp',
  description: 'Led development of microservices architecture',
  start_date: new Date('2023-01-01'),
  end_date: null,
  is_current: true,
  entry_type: 'career',
  location: 'San Francisco, CA',
  sort_order: 1
};

// Test input for education entry
const educationTestInput: CreateTimelineEntryInput = {
  title: 'Bachelor of Science in Computer Science',
  organization: 'University of Technology',
  description: 'Graduated with honors, specialized in software engineering',
  start_date: new Date('2018-09-01'),
  end_date: new Date('2022-05-15'),
  is_current: false,
  entry_type: 'education',
  location: 'Boston, MA',
  sort_order: 2
};

describe('createTimelineEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a career timeline entry', async () => {
    const result = await createTimelineEntry(careerTestInput);

    // Basic field validation
    expect(result.title).toEqual('Senior Software Engineer');
    expect(result.organization).toEqual('Tech Corp');
    expect(result.description).toEqual('Led development of microservices architecture');
    expect(result.start_date).toEqual(careerTestInput.start_date);
    expect(result.end_date).toBeNull();
    expect(result.is_current).toBe(true);
    expect(result.entry_type).toEqual('career');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.sort_order).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an education timeline entry', async () => {
    const result = await createTimelineEntry(educationTestInput);

    // Basic field validation
    expect(result.title).toEqual('Bachelor of Science in Computer Science');
    expect(result.organization).toEqual('University of Technology');
    expect(result.description).toEqual('Graduated with honors, specialized in software engineering');
    expect(result.start_date).toEqual(educationTestInput.start_date);
    expect(result.end_date).toEqual(educationTestInput.end_date);
    expect(result.is_current).toBe(false);
    expect(result.entry_type).toEqual('education');
    expect(result.location).toEqual('Boston, MA');
    expect(result.sort_order).toEqual(2);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save timeline entry to database', async () => {
    const result = await createTimelineEntry(careerTestInput);

    const entries = await db.select()
      .from(timelineEntriesTable)
      .where(eq(timelineEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].title).toEqual('Senior Software Engineer');
    expect(entries[0].organization).toEqual('Tech Corp');
    expect(entries[0].description).toEqual('Led development of microservices architecture');
    expect(entries[0].start_date).toEqual(careerTestInput.start_date);
    expect(entries[0].end_date).toBeNull();
    expect(entries[0].is_current).toBe(true);
    expect(entries[0].entry_type).toEqual('career');
    expect(entries[0].location).toEqual('San Francisco, CA');
    expect(entries[0].sort_order).toEqual(1);
    expect(entries[0].created_at).toBeInstanceOf(Date);
    expect(entries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle timeline entry with minimal required fields', async () => {
    const minimalInput: CreateTimelineEntryInput = {
      title: 'Junior Developer',
      organization: 'StartupCo',
      description: null,
      start_date: new Date('2022-01-01'),
      end_date: null,
      is_current: false,
      entry_type: 'career',
      location: null,
      sort_order: 0
    };

    const result = await createTimelineEntry(minimalInput);

    expect(result.title).toEqual('Junior Developer');
    expect(result.organization).toEqual('StartupCo');
    expect(result.description).toBeNull();
    expect(result.start_date).toEqual(minimalInput.start_date);
    expect(result.end_date).toBeNull();
    expect(result.is_current).toBe(false);
    expect(result.entry_type).toEqual('career');
    expect(result.location).toBeNull();
    expect(result.sort_order).toEqual(0);
    expect(result.id).toBeDefined();
  });

  it('should handle timeline entry with both start and end dates', async () => {
    const completedInput: CreateTimelineEntryInput = {
      title: 'Internship',
      organization: 'Summer Tech',
      description: 'Summer internship program',
      start_date: new Date('2021-06-01'),
      end_date: new Date('2021-08-31'),
      is_current: false,
      entry_type: 'career',
      location: 'Remote',
      sort_order: 3
    };

    const result = await createTimelineEntry(completedInput);

    expect(result.start_date).toEqual(completedInput.start_date);
    expect(result.end_date).toEqual(completedInput.end_date);
    expect(result.is_current).toBe(false);
  });

  it('should handle current timeline entry with no end date', async () => {
    const currentInput: CreateTimelineEntryInput = {
      title: 'PhD in Computer Science',
      organization: 'Research University',
      description: 'Doctoral studies in machine learning',
      start_date: new Date('2023-09-01'),
      end_date: null,
      is_current: true,
      entry_type: 'education',
      location: 'Cambridge, MA',
      sort_order: 1
    };

    const result = await createTimelineEntry(currentInput);

    expect(result.end_date).toBeNull();
    expect(result.is_current).toBe(true);
    expect(result.entry_type).toEqual('education');
  });

  it('should handle different sort orders', async () => {
    const entry1 = await createTimelineEntry({
      ...careerTestInput,
      title: 'First Entry',
      sort_order: 5
    });

    const entry2 = await createTimelineEntry({
      ...educationTestInput,
      title: 'Second Entry',
      sort_order: 1
    });

    expect(entry1.sort_order).toEqual(5);
    expect(entry2.sort_order).toEqual(1);
  });
});