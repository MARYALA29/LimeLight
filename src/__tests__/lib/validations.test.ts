import { updateProfileSchema } from "@/lib/validations";

describe("updateProfileSchema", () => {
  it("accepts a valid name", () => {
    const result = updateProfileSchema.safeParse({ name: "Jane Doe" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = updateProfileSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = updateProfileSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 100 characters", () => {
    const result = updateProfileSchema.safeParse({ name: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts an optional avatarUrl", () => {
    const result = updateProfileSchema.safeParse({
      name: "Jane",
      avatarUrl: "https://example.com/avatar.png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid avatarUrl", () => {
    const result = updateProfileSchema.safeParse({
      name: "Jane",
      avatarUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("does not strip role from input but role is not in schema", () => {
    // Role should never be settable via profile update
    const result = updateProfileSchema.safeParse({
      name: "Jane",
      role: "ADMIN",
    });
    expect(result.success).toBe(true);
    // Schema parses successfully but role is dropped
    if (result.success) {
      expect("role" in result.data).toBe(false);
    }
  });
});
