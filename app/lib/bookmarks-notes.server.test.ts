import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";
import { UserRole } from "~/db/schema";
import { MAX_NOTE_LENGTH, noteBodySchema } from "./bookmarks-notes";
import {
  getNote,
  isBookmarked,
  listBookmarks,
  listNotes,
  saveNote,
  toggleBookmark,
} from "./bookmarks-notes.server";
import { approveRefundRequest, raiseRefundRequest } from "./refunds.server";
import { fakeNotifications } from "./notifications.fake.server";

type TestDb = ReturnType<typeof createTestDb>;

let db: TestDb;
let base: ReturnType<typeof seedBaseData>;
let lesson: typeof schema.lessons.$inferSelect;
let otherLesson: typeof schema.lessons.$inferSelect;

beforeEach(() => {
  db = createTestDb();
  base = seedBaseData(db);
  const mod = db
    .insert(schema.modules)
    .values({ courseId: base.course.id, title: "Module 1", position: 1 })
    .returning()
    .get();
  lesson = db
    .insert(schema.lessons)
    .values({ moduleId: mod.id, title: "Lesson 1", position: 1 })
    .returning()
    .get();
  otherLesson = db
    .insert(schema.lessons)
    .values({ moduleId: mod.id, title: "Lesson 2", position: 2 })
    .returning()
    .get();
});

function noteCreatedAt(userId: number) {
  return db
    .select({ createdAt: schema.notes.createdAt })
    .from(schema.notes)
    .where(eq(schema.notes.userId, userId))
    .get()?.createdAt;
}

describe("bookmarks", () => {
  it("toggling adds a Bookmark, toggling again removes it", () => {
    expect(isBookmarked(db, base.user.id, lesson.id)).toBe(false);

    expect(toggleBookmark(db, base.user.id, lesson.id, new Date())).toBe(true);
    expect(isBookmarked(db, base.user.id, lesson.id)).toBe(true);

    expect(toggleBookmark(db, base.user.id, lesson.id, new Date())).toBe(false);
    expect(isBookmarked(db, base.user.id, lesson.id)).toBe(false);
  });

  it("never leaves a Student with two Bookmarks on one Lesson", () => {
    toggleBookmark(db, base.user.id, lesson.id, new Date());
    // A racing second insert hits the unique index and is absorbed.
    expect(() =>
      db
        .insert(schema.bookmarks)
        .values({ userId: base.user.id, lessonId: lesson.id })
        .run()
    ).toThrow();

    expect(listBookmarks(db, base.user.id)).toHaveLength(1);
  });

  it("lists a Student's Bookmarks newest first, with the Lesson and Course", () => {
    toggleBookmark(db, base.user.id, lesson.id, new Date("2026-01-01"));
    toggleBookmark(db, base.user.id, otherLesson.id, new Date("2026-01-02"));

    expect(listBookmarks(db, base.user.id)).toEqual([
      expect.objectContaining({
        lessonId: otherLesson.id,
        lessonTitle: "Lesson 2",
        courseTitle: "Test Course",
        courseSlug: "test-course",
      }),
      expect.objectContaining({
        lessonId: lesson.id,
        lessonTitle: "Lesson 1",
        courseTitle: "Test Course",
        courseSlug: "test-course",
      }),
    ]);
  });

  it("does not show one Student's Bookmarks to another", () => {
    toggleBookmark(db, base.user.id, lesson.id, new Date());

    expect(isBookmarked(db, base.instructor.id, lesson.id)).toBe(false);
    expect(listBookmarks(db, base.instructor.id)).toEqual([]);
  });
});

describe("notes", () => {
  it("saves a Note, then replaces its body and moves the last-edited time on", () => {
    saveNote(db, base.user.id, lesson.id, "first", new Date("2026-01-01"));
    saveNote(db, base.user.id, lesson.id, "second", new Date("2026-01-02"));

    expect(getNote(db, base.user.id, lesson.id)).toEqual({
      body: "second",
      updatedAt: new Date("2026-01-02").toISOString(),
    });
    expect(noteCreatedAt(base.user.id)).toBe(
      new Date("2026-01-01").toISOString()
    );
    expect(listNotes(db, base.user.id)).toHaveLength(1);
  });

  it("deletes the Note when saved empty", () => {
    saveNote(db, base.user.id, lesson.id, "something", new Date());
    saveNote(db, base.user.id, lesson.id, "", new Date());

    expect(getNote(db, base.user.id, lesson.id)).toBeUndefined();
  });

  it("lists a Student's Notes most recently edited first, with the Lesson and Course", () => {
    saveNote(db, base.user.id, lesson.id, "one", new Date("2026-01-01"));
    saveNote(db, base.user.id, otherLesson.id, "two", new Date("2026-01-02"));
    saveNote(db, base.user.id, lesson.id, "one again", new Date("2026-01-03"));

    expect(listNotes(db, base.user.id)).toEqual([
      expect.objectContaining({
        body: "one again",
        lessonTitle: "Lesson 1",
        courseTitle: "Test Course",
      }),
      expect.objectContaining({
        body: "two",
        lessonTitle: "Lesson 2",
        courseTitle: "Test Course",
      }),
    ]);
  });

  it("does not show one Student's Notes to another", () => {
    saveNote(db, base.user.id, lesson.id, "mine", new Date());

    expect(getNote(db, base.instructor.id, lesson.id)).toBeUndefined();
    expect(listNotes(db, base.instructor.id)).toEqual([]);
  });
});

describe("the Note body rule", () => {
  it("accepts a Note of exactly 2,000 characters", () => {
    const parsed = noteBodySchema.safeParse("a".repeat(MAX_NOTE_LENGTH));
    expect(parsed.success).toBe(true);
  });

  it("refuses a Note over 2,000 characters with a clear message", () => {
    const parsed = noteBodySchema.safeParse("a".repeat(MAX_NOTE_LENGTH + 1));
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0].message).toBe(
      "Your note must be 2,000 characters or fewer."
    );
  });

  it("trims the body and keeps Markdown characters as typed", () => {
    expect(noteBodySchema.parse("  # not a *heading*  ")).toBe(
      "# not a *heading*"
    );
  });
});

describe("approving a Refund", () => {
  it("keeps the Student's Bookmarks and Notes", async () => {
    const now = new Date();
    const notifications = fakeNotifications();
    const platformAdmin = db
      .insert(schema.users)
      .values({
        name: "Pat Admin",
        email: "pat@example.com",
        role: UserRole.Admin,
      })
      .returning()
      .get();
    const purchase = db
      .insert(schema.purchases)
      .values({
        userId: base.user.id,
        courseId: base.course.id,
        amountPaid: 7900,
        createdAt: now.toISOString(),
      })
      .returning()
      .get();
    db.insert(schema.enrollments)
      .values({ userId: base.user.id, courseId: base.course.id })
      .run();

    toggleBookmark(db, base.user.id, lesson.id, now);
    saveNote(db, base.user.id, lesson.id, "keep me", now);

    const raised = await raiseRefundRequest(
      db,
      purchase.id,
      base.user.id,
      "Not for me.",
      now,
      notifications
    );
    if (!raised.ok) throw new Error(raised.error);
    const approved = await approveRefundRequest(
      db,
      raised.refundRequestId,
      platformAdmin.id,
      null,
      now,
      notifications
    );
    expect(approved.ok).toBe(true);

    expect(isBookmarked(db, base.user.id, lesson.id)).toBe(true);
    expect(getNote(db, base.user.id, lesson.id)?.body).toBe("keep me");
  });
});
