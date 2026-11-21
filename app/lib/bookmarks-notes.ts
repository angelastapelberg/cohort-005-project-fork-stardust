import { z } from "zod";

/** The cap on a Note's length, in characters. Shared by the form and the server. */
export const MAX_NOTE_LENGTH = 2000;

/**
 * A Note body as it arrives from the form: plain text, trimmed, and refused
 * (not truncated) when it is over the cap.
 */
export const noteBodySchema = z
  .string()
  .trim()
  .max(
    MAX_NOTE_LENGTH,
    `Your note must be ${MAX_NOTE_LENGTH.toLocaleString("en-US")} characters or fewer.`
  );
