import { describe, it, expect } from "vitest";
import { Schema as S, Effect as E } from "effect";
import * as fc from "fast-check";
import { TaskGuards } from "@domain/task/task.guard";
import {
  validTitleArbitrary,
  validDescriptionArbitrary,
  invalidTitleArbitrary,
  invalidDescriptionArbitrary,
} from "../../test.data";

describe("Task Guards", () => {
  describe("TaskGuards.validateTitle", () => {
    it("should accept valid titles (1-255 characters)", async () => {
      // A.repeat(255) = 255 'A' characters (so the name would be 255 'A' characters)
      const validTitles = ["A","AB","Valid Task Title","A".repeat(255), "Task with numbers 123",];

      for (const title of validTitles) {
        const schema = S.String.pipe(TaskGuards.validateTitle);
        const result = await E.runPromise(S.decodeUnknown(schema)(title));
        expect(result).toBe(title);
      }
    });

    it("should reject empty title", async () => {
      const schema = S.String.pipe(TaskGuards.validateTitle);
      await expect(E.runPromise(S.decodeUnknown(schema)(""))).rejects.toThrow();
    });

    it("should reject title longer than 255 characters", async () => {
      const schema = S.String.pipe(TaskGuards.validateTitle);
      const longTitle = "A".repeat(256);
      await expect(E.runPromise(S.decodeUnknown(schema)(longTitle))).rejects.toThrow();
    });

    it("should accept any valid title length (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArbitrary, async (title) => {
          const schema = S.String.pipe(TaskGuards.validateTitle);
          const result = await E.runPromise(S.decodeUnknown(schema)(title));
          expect(result).toBe(title);
          expect(title.length).toBeGreaterThan(0);
          expect(title.length).toBeLessThan(256);
        }),
        { numRuns: 200 }
      );
    });

    it("should reject any invalid title length (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(invalidTitleArbitrary, async (title) => {
          const schema = S.String.pipe(TaskGuards.validateTitle);
          await expect(E.runPromise(S.decodeUnknown(schema)(title))).rejects.toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("TaskGuards.validateDescription", () => {
    it("should accept valid descriptions (50-1000 characters)", async () => {
      const validDescriptions = ["A".repeat(50),"A".repeat(100),"A".repeat(500),"A".repeat(1000),
        "This is a valid description that contains enough characters to meet the minimum requirement of 50 characters.",
      ];

      for (const description of validDescriptions) {
        const schema = S.String.pipe(TaskGuards.validateDescription);
        const result = await E.runPromise(S.decodeUnknown(schema)(description));
        expect(result).toBe(description);
      }
    });

    it("should reject description shorter than 50 characters", async () => {
      const schema = S.String.pipe(TaskGuards.validateDescription);
      const shortDescription = "A".repeat(49);
      await expect(
        E.runPromise(S.decodeUnknown(schema)(shortDescription))
      ).rejects.toThrow();
    });

    it("should reject empty description", async () => {
      const schema = S.String.pipe(TaskGuards.validateDescription);
      await expect(E.runPromise(S.decodeUnknown(schema)(""))).rejects.toThrow();
    });

    it("should reject description longer than 1000 characters", async () => {
      const schema = S.String.pipe(TaskGuards.validateDescription);
      const longDescription = "A".repeat(1001);
      await expect(
        E.runPromise(S.decodeUnknown(schema)(longDescription))
      ).rejects.toThrow();
    });

    it("should accept any valid description length (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(validDescriptionArbitrary, async (description) => {
          const schema = S.String.pipe(TaskGuards.validateDescription);
          const result = await E.runPromise(S.decodeUnknown(schema)(description));
          expect(result).toBe(description);
          expect(description.length).toBeGreaterThanOrEqual(50);
          expect(description.length).toBeLessThanOrEqual(1000);
        }),
        { numRuns: 200 }  // 200 runs = 200 different descriptions to test
      );
    });

    it("should reject any invalid description length (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(invalidDescriptionArbitrary, async (description) => {
          const schema = S.String.pipe(TaskGuards.validateDescription);
          await expect(
            E.runPromise(S.decodeUnknown(schema)(description))
          ).rejects.toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle boundary values correctly for title", async () => {
      const titleSchema = S.String.pipe(TaskGuards.validateTitle);

      // Exactly 1 character - valid
      await expect(E.runPromise(S.decodeUnknown(titleSchema)("A"))).resolves.toBe("A");

      // Exactly 255 characters - valid
      const title255 = "A".repeat(255);
      await expect(
        E.runPromise(S.decodeUnknown(titleSchema)(title255))
      ).resolves.toBe(title255);

      // Exactly 256 characters - invalid
      const title256 = "A".repeat(256);
      await expect(
        E.runPromise(S.decodeUnknown(titleSchema)(title256))
      ).rejects.toThrow();

      // 0 characters - invalid
      await expect(E.runPromise(S.decodeUnknown(titleSchema)(""))).rejects.toThrow();
    });

    it("should handle boundary values correctly for description", async () => {
      const descriptionSchema = S.String.pipe(TaskGuards.validateDescription);

      // Exactly 50 characters - valid
      const desc50 = "A".repeat(50);
      await expect(
        E.runPromise(S.decodeUnknown(descriptionSchema)(desc50))
      ).resolves.toBe(desc50);

      // Exactly 49 characters - invalid
      const desc49 = "A".repeat(49);
      await expect(
        E.runPromise(S.decodeUnknown(descriptionSchema)(desc49))
      ).rejects.toThrow();

      // Exactly 1000 characters - valid
      const desc1000 = "A".repeat(1000);
      await expect(
        E.runPromise(S.decodeUnknown(descriptionSchema)(desc1000))
      ).resolves.toBe(desc1000);

      // Exactly 1001 characters - invalid
      const desc1001 = "A".repeat(1001);
      await expect(
        E.runPromise(S.decodeUnknown(descriptionSchema)(desc1001))
      ).rejects.toThrow();
    });

    it("should handle special characters in titles", async () => {
      const schema = S.String.pipe(TaskGuards.validateTitle);
      const specialTitles = [
        "TODO: Fix bug #123",
        "Task [URGENT] - Important!",
        "Review PR #456 & merge",
        "Update docs @ wiki",
      ];

      for (const title of specialTitles) {
        const result = await E.runPromise(S.decodeUnknown(schema)(title));
        expect(result).toBe(title);
      }
    });

    it("should handle multiline descriptions", async () => {
      const schema = S.String.pipe(TaskGuards.validateDescription);
      const multilineDescription = `This is a multi-line description.
It spans multiple lines and includes:
- Bullet points
- Various formatting
And should be valid as long as it's between 50-1000 chars.`;

      const result = await E.runPromise(S.decodeUnknown(schema)(multilineDescription));
      expect(result).toBe(multilineDescription);
    });

    it("should handle unicode characters in titles", async () => {
      const schema = S.String.pipe(TaskGuards.validateTitle);
      const unicodeTitles = [
        " Complete project milestone",
        "Café setup meeting",
        "Deploy to Zürich server",
        "Review 李明's code",
      ];

      for (const title of unicodeTitles) {
        const result = await E.runPromise(S.decodeUnknown(schema)(title));
        expect(result).toBe(title);
      }
    });

    it("should handle unicode characters in descriptions", async () => {
      const schema = S.String.pipe(TaskGuards.validateDescription);
      const unicodeDescription =
        "This description contains unicode: 🎉 🚀 ✨ and special chars: café, naïve, Zürich. ".repeat(
          2
        );

      if (
        unicodeDescription.length >= 50 &&
        unicodeDescription.length <= 1000
      ) {
        const result = await E.runPromise(S.decodeUnknown(schema)(unicodeDescription));
        expect(result).toBe(unicodeDescription);
      }
    });
  });

  describe("Realistic task scenarios", () => {
    it("should handle realistic task titles", async () => {
      const schema = S.String.pipe(TaskGuards.validateTitle);
      const realisticTitles = [
        "Implement user authentication",
        "Fix bug in payment processing",
        "Write unit tests for API endpoints",
        "Update documentation",
        "Code review for PR #123",
        "Deploy to production",
        "Refactor database queries",
        "Add error handling",
      ];

      for (const title of realisticTitles) {
        const result = await E.runPromise(S.decodeUnknown(schema)(title));
        expect(result).toBe(title);
      }
    });

    it("should handle realistic task descriptions", async () => {
      const schema = S.String.pipe(TaskGuards.validateDescription);
      const realisticDescription = `This task involves implementing user authentication using JWT tokens. 
The implementation should include:
1. User login endpoint
2. Token generation and validation
3. Middleware for protected routes
4. Token refresh mechanism
Expected completion: 2-3 days.`;

      const result = await E.runPromise(S.decodeUnknown(schema)(realisticDescription));
      expect(result).toBe(realisticDescription);
    });
  });
});

