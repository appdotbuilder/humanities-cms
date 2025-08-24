import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timelineEntriesTable } from '../db/schema';
import { type CreateTimelineEntryInput } from '../schema';
import { updateTimelineEntry, deleteTimelineEntry, updateTimelineOrder } from '../handlers/update_timeline_entry';
import { eq, and } from 'drizzle-orm';

// Test data
const testCareerEntry: CreateTimelineEntryInput = {
  title: 'Senior Developer',
  organization: 'Tech Company',
  description: 'Building amazing software',
  start_date: new Date('2023-01-01'),
  end_date: null,
  is_current: true,
  entry_type: 'career',
  location: 'Remote',
  sort_order: 1
};

const testEducationEntry: CreateTimelineEntryInput = {
  title: 'Computer Science Degree',
  organization: 'University',
  description: 'Studied computer science',
  start_date: new Date('2019-09-01'),
  end_date: new Date('2023-05-15'),
  is_current: false,
  entry_type: 'education',
  location: 'Campus City',
  sort_order: 0
};

describe('updateTimelineEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a timeline entry', async () => {
    // Create test entry
    const created = await db.insert(timelineEntriesTable)
      .values(testCareerEntry)
      .returning()
      .execute();
    
    const entryId = created[0].id;

    // Update the entry
    const result = await updateTimelineEntry({
      id: entryId,
      title: 'Lead Developer',
      organization: 'New Tech Company',
      description: 'Leading development team'
    });

    // Verify updates
    expect(result.id).toBe(entryId);
    expect(result.title).toBe('Lead Developer');
    expect(result.organization).toBe('New Tech Company');
    expect(result.description).toBe('Leading development team');
    expect(result.entry_type).toBe('career'); // Should remain unchanged
    expect(result.is_current).toBe(true); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    // Create test entry
    const created = await db.insert(timelineEntriesTable)
      .values(testCareerEntry)
      .returning()
      .execute();
    
    const entryId = created[0].id;

    // Update the entry
    await updateTimelineEntry({
      id: entryId,
      title: 'Staff Developer',
      location: 'New York'
    });

    // Verify in database
    const entries = await db.select()
      .from(timelineEntriesTable)
      .where(eq(timelineEntriesTable.id, entryId))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Staff Developer');
    expect(entries[0].location).toBe('New York');
    expect(entries[0].organization).toBe('Tech Company'); // Unchanged
  });

  it('should handle partial updates correctly', async () => {
    // Create test entry
    const created = await db.insert(timelineEntriesTable)
      .values(testCareerEntry)
      .returning()
      .execute();
    
    const entryId = created[0].id;

    // Update only sort_order
    const result = await updateTimelineEntry({
      id: entryId,
      sort_order: 5
    });

    expect(result.sort_order).toBe(5);
    expect(result.title).toBe('Senior Developer'); // Unchanged
    expect(result.organization).toBe('Tech Company'); // Unchanged
  });

  it('should enforce only one current entry per type', async () => {
    // Create first current career entry
    const created1 = await db.insert(timelineEntriesTable)
      .values({ ...testCareerEntry, is_current: true })
      .returning()
      .execute();

    // Create second career entry (not current)
    const created2 = await db.insert(timelineEntriesTable)
      .values({
        ...testCareerEntry,
        title: 'Junior Developer',
        organization: 'Other Company',
        is_current: false,
        sort_order: 2
      })
      .returning()
      .execute();

    // Make second entry current
    await updateTimelineEntry({
      id: created2[0].id,
      is_current: true,
      entry_type: 'career'
    });

    // Check that first entry is no longer current
    const entries = await db.select()
      .from(timelineEntriesTable)
      .where(eq(timelineEntriesTable.entry_type, 'career'))
      .execute();

    const currentEntries = entries.filter(e => e.is_current);
    expect(currentEntries).toHaveLength(1);
    expect(currentEntries[0].id).toBe(created2[0].id);
  });

  it('should validate date logic', async () => {
    // Create test entry
    const created = await db.insert(timelineEntriesTable)
      .values({
        ...testEducationEntry,
        start_date: new Date('2020-01-01'),
        end_date: new Date('2023-01-01')
      })
      .returning()
      .execute();
    
    const entryId = created[0].id;

    // Try to set start_date after end_date
    await expect(updateTimelineEntry({
      id: entryId,
      start_date: new Date('2024-01-01') // After current end_date
    })).rejects.toThrow(/Start date cannot be after end date/i);
  });

  it('should validate current position logic', async () => {
    // Create test entry with end_date
    const created = await db.insert(timelineEntriesTable)
      .values(testEducationEntry)
      .returning()
      .execute();
    
    const entryId = created[0].id;

    // Try to set is_current=true when end_date exists
    await expect(updateTimelineEntry({
      id: entryId,
      is_current: true
    })).rejects.toThrow(/Current positions cannot have an end date/i);
  });

  it('should throw error for non-existent entry', async () => {
    await expect(updateTimelineEntry({
      id: 999,
      title: 'Updated Title'
    })).rejects.toThrow(/Timeline entry with id 999 not found/i);
  });
});

describe('deleteTimelineEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a timeline entry', async () => {
    // Create test entry
    const created = await db.insert(timelineEntriesTable)
      .values(testCareerEntry)
      .returning()
      .execute();
    
    const entryId = created[0].id;

    // Delete the entry
    await deleteTimelineEntry(entryId);

    // Verify deletion
    const entries = await db.select()
      .from(timelineEntriesTable)
      .where(eq(timelineEntriesTable.id, entryId))
      .execute();

    expect(entries).toHaveLength(0);
  });

  it('should throw error for non-existent entry', async () => {
    await expect(deleteTimelineEntry(999))
      .rejects.toThrow(/Timeline entry with id 999 not found/i);
  });

  it('should not affect other entries', async () => {
    // Create multiple entries
    const created1 = await db.insert(timelineEntriesTable)
      .values(testCareerEntry)
      .returning()
      .execute();

    const created2 = await db.insert(timelineEntriesTable)
      .values(testEducationEntry)
      .returning()
      .execute();

    // Delete first entry
    await deleteTimelineEntry(created1[0].id);

    // Verify second entry still exists
    const remainingEntries = await db.select()
      .from(timelineEntriesTable)
      .execute();

    expect(remainingEntries).toHaveLength(1);
    expect(remainingEntries[0].id).toBe(created2[0].id);
  });
});

describe('updateTimelineOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update sort order for multiple entries', async () => {
    // Create test entries
    const created1 = await db.insert(timelineEntriesTable)
      .values({ ...testCareerEntry, sort_order: 1 })
      .returning()
      .execute();

    const created2 = await db.insert(timelineEntriesTable)
      .values({ ...testEducationEntry, sort_order: 2 })
      .returning()
      .execute();

    const created3 = await db.insert(timelineEntriesTable)
      .values({
        ...testCareerEntry,
        title: 'Junior Developer',
        organization: 'First Company',
        sort_order: 3,
        is_current: false
      })
      .returning()
      .execute();

    // Update order
    await updateTimelineOrder([
      { id: created1[0].id, sort_order: 3 },
      { id: created2[0].id, sort_order: 1 },
      { id: created3[0].id, sort_order: 2 }
    ]);

    // Verify new order
    const entries = await db.select()
      .from(timelineEntriesTable)
      .execute();

    const entry1 = entries.find(e => e.id === created1[0].id);
    const entry2 = entries.find(e => e.id === created2[0].id);
    const entry3 = entries.find(e => e.id === created3[0].id);

    expect(entry1?.sort_order).toBe(3);
    expect(entry2?.sort_order).toBe(1);
    expect(entry3?.sort_order).toBe(2);
    expect(entry1?.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent entry', async () => {
    // Create one valid entry
    const created = await db.insert(timelineEntriesTable)
      .values(testCareerEntry)
      .returning()
      .execute();

    // Try to update with mix of valid and invalid IDs
    await expect(updateTimelineOrder([
      { id: created[0].id, sort_order: 1 },
      { id: 999, sort_order: 2 }
    ])).rejects.toThrow(/Timeline entry with id 999 not found/i);
  });

  it('should handle empty array', async () => {
    // Should not throw error with empty array
    await expect(updateTimelineOrder([])).resolves.toBeUndefined();
  });

  it('should handle single entry update', async () => {
    // Create test entry
    const created = await db.insert(timelineEntriesTable)
      .values(testCareerEntry)
      .returning()
      .execute();

    // Update single entry
    await updateTimelineOrder([
      { id: created[0].id, sort_order: 10 }
    ]);

    // Verify update
    const entries = await db.select()
      .from(timelineEntriesTable)
      .where(eq(timelineEntriesTable.id, created[0].id))
      .execute();

    expect(entries[0].sort_order).toBe(10);
  });
});