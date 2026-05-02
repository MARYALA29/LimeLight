import {
  updateProfileSchema,
  addMemberSchema,
  updateMemberSchema,
  changePasswordSchema,
} from "@/lib/validations";

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

describe("addMemberSchema", () => {
  it("accepts a valid email", () => {
    expect(addMemberSchema.safeParse({ email: "user@test.com" }).success).toBe(true);
  });

  it("accepts a valid email with role", () => {
    expect(
      addMemberSchema.safeParse({ email: "user@test.com", role: "ADMIN" }).success
    ).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(addMemberSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an invalid role", () => {
    expect(
      addMemberSchema.safeParse({ email: "user@test.com", role: "OWNER" }).success
    ).toBe(false);
  });
});

describe("updateMemberSchema", () => {
  it("accepts ADMIN role", () => {
    expect(updateMemberSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
  });

  it("accepts MEMBER role", () => {
    expect(updateMemberSchema.safeParse({ role: "MEMBER" }).success).toBe(true);
  });

  it("rejects invalid role", () => {
    expect(updateMemberSchema.safeParse({ role: "OWNER" }).success).toBe(false);
  });

  it("rejects missing role", () => {
    expect(updateMemberSchema.safeParse({}).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const validInput = {
    currentPassword: "oldpassword",
    newPassword: "newpassword123",
    confirmNewPassword: "newpassword123",
  };

  it("accepts valid input where new password matches confirmation", () => {
    expect(changePasswordSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects when new password is shorter than 6 characters", () => {
    expect(
      changePasswordSchema.safeParse({
        ...validInput,
        newPassword: "short",
        confirmNewPassword: "short",
      }).success
    ).toBe(false);
  });

  it("rejects when confirmation does not match new password", () => {
    expect(
      changePasswordSchema.safeParse({
        ...validInput,
        confirmNewPassword: "different-password",
      }).success
    ).toBe(false);
  });

  it("rejects when new password equals current password", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "samepassword",
        newPassword: "samepassword",
        confirmNewPassword: "samepassword",
      }).success
    ).toBe(false);
  });

  it("rejects empty current password", () => {
    expect(
      changePasswordSchema.safeParse({ ...validInput, currentPassword: "" }).success
    ).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(changePasswordSchema.safeParse({}).success).toBe(false);
  });
});
