import { db } from '../db';
import { timelineEntriesTable } from '../db/schema';
import { type TimelineEntry } from '../schema';
import { eq, and } from 'drizzle-orm';

interface UpdateTimelineEntryInput {
  id: number;
  title?: string;
  organization?: string;
  description?: string | null;
  start_date?: Date;
  end_date?: Date | null;
  is_current?: boolean;
  entry_type?: 'career' | 'education';
  location?: string | null;
  sort_order?: number;
}

export async function updateTimelineEntry(input: UpdateTimelineEntryInput): Promise<TimelineEntry> {
  try {
    // Validate that the entry exists
    const existingEntry = await db.select()
      .from(timelineEntriesTable)
      .where(eq(timelineEntriesTable.id, input.id))
      .execute();

    if (existingEntry.length === 0) {
      throw new Error(`Timeline entry with id ${input.id} not found`);
    }

    // If setting is_current to true, ensure only one entry per type can be current
    if (input.is_current === true && input.entry_type) {
      await db.update(timelineEntriesTable)
        .set({ is_current: false })
        .where(and(
          eq(timelineEntriesTable.entry_type, input.entry_type),
          eq(timelineEntriesTable.is_current, true)
        ))
        .execute();
    }

    // Validate date logic: start_date should be before end_date
    const currentEntry = existingEntry[0];
    const startDate = input.start_date || currentEntry.start_date;
    const endDate = input.end_date !== undefined ? input.end_date : currentEntry.end_date;
    
    if (endDate && startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    // If is_current is true, end_date should be null
    const isCurrent = input.is_current !== undefined ? input.is_current : currentEntry.is_current;
    if (isCurrent && endDate !== null) {
      throw new Error('Current positions cannot have an end date');
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    // Only include fields that are being updated
    if (input.title !== undefined) updateData.title = input.title;
    if (input.organization !== undefined) updateData.organization = input.organization;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.start_date !== undefined) updateData.start_date = input.start_date;
    if (input.end_date !== undefined) updateData.end_date = input.end_date;
    if (input.is_current !== undefined) updateData.is_current = input.is_current;
    if (input.entry_type !== undefined) updateData.entry_type = input.entry_type;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

    // Update the timeline entry
    const result = await db.update(timelineEntriesTable)
      .set(updateData)
      .where(eq(timelineEntriesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Timeline entry update failed:', error);
    throw error;
  }
}

export async function deleteTimelineEntry(id: number): Promise<void> {
  try {
    // Check if entry exists
    const existingEntry = await db.select()
      .from(timelineEntriesTable)
      .where(eq(timelineEntriesTable.id, id))
      .execute();

    if (existingEntry.length === 0) {
      throw new Error(`Timeline entry with id ${id} not found`);
    }

    // Delete the entry
    await db.delete(timelineEntriesTable)
      .where(eq(timelineEntriesTable.id, id))
      .execute();
  } catch (error) {
    console.error('Timeline entry deletion failed:', error);
    throw error;
  }
}

export async function updateTimelineOrder(entryOrders: { id: number; sort_order: number }[]): Promise<void> {
  try {
    // Validate that all entries exist
    for (const entry of entryOrders) {
      const existingEntry = await db.select()
        .from(timelineEntriesTable)
        .where(eq(timelineEntriesTable.id, entry.id))
        .execute();

      if (existingEntry.length === 0) {
        throw new Error(`Timeline entry with id ${entry.id} not found`);
      }
    }

    // Update each entry's sort order
    for (const entry of entryOrders) {
      await db.update(timelineEntriesTable)
        .set({ 
          sort_order: entry.sort_order,
          updated_at: new Date()
        })
        .where(eq(timelineEntriesTable.id, entry.id))
        .execute();
    }
  } catch (error) {
    console.error('Timeline order update failed:', error);
    throw error;
  }
}