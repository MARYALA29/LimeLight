"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  UpdateProfileInput,
  changePasswordSchema,
  ChangePasswordInput,
} from "@/lib/validations";
import { Avatar, Badge, Button, Input } from "@/components/ui";
import { PersonalAccessTokens } from "@/components/settings/PersonalAccessTokens";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setLoadError("Unable to load profile");
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setUser(data.user);
        reset({ name: data.user.name, avatarUrl: data.user.avatarUrl ?? undefined });
      } catch {
        setLoadError("Unable to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [reset]);

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to update profile");
        return;
      }

      setUser(result.user);
      setSuccess("Profile updated successfully");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitPassword = async (data: ChangePasswordInput) => {
    setIsChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setPasswordError(result.error || "Failed to change password");
        return;
      }

      setPasswordSuccess("Password changed successfully");
      resetPassword({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch {
      setPasswordError("An error occurred. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
          {loadError || "Unable to load profile"}
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm">
        <div className="border-b border-orange-100 px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account information and preferences
          </p>
        </div>

        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <Avatar name={user.name} src={user.avatarUrl} size="lg" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{user.email}</span>
                <Badge
                  variant={isAdmin ? "primary" : "default"}
                  className={
                    isAdmin
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-700"
                  }
                >
                  {isAdmin ? "Admin" : "User"}
                </Badge>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <Input
              id="name"
              label="Name"
              error={errors.name?.message}
              {...register("name")}
            />

            <Input
              id="avatarUrl"
              label="Avatar URL (optional)"
              placeholder="https://example.com/avatar.png"
              error={errors.avatarUrl?.message}
              {...register("avatarUrl")}
            />

            <div className="grid grid-cols-2 gap-4 border-t border-orange-100 pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <p className="text-sm text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Role
                </label>
                <Badge
                  className={
                    isAdmin
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-700"
                  }
                >
                  {isAdmin ? "Admin" : "User"}
                </Badge>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isAdmin
                    ? "Full access to project management"
                    : "Standard user access"}
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Member since
                </label>
                <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm mt-6">
        <div className="border-b border-orange-100 px-8 py-6">
          <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
          <p className="text-sm text-gray-500 mt-1">
            Use a strong password — at least 6 characters and different from your
            current one.
          </p>
        </div>

        <form
          onSubmit={handleSubmitPassword(onSubmitPassword)}
          className="p-8 space-y-4"
        >
          {passwordError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              {passwordSuccess}
            </div>
          )}

          <Input
            id="currentPassword"
            type="password"
            label="Current Password"
            autoComplete="current-password"
            error={passwordErrors.currentPassword?.message}
            {...registerPassword("currentPassword")}
          />
          <Input
            id="newPassword"
            type="password"
            label="New Password"
            autoComplete="new-password"
            error={passwordErrors.newPassword?.message}
            {...registerPassword("newPassword")}
          />
          <Input
            id="confirmNewPassword"
            type="password"
            label="Confirm New Password"
            autoComplete="new-password"
            error={passwordErrors.confirmNewPassword?.message}
            {...registerPassword("confirmNewPassword")}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isChangingPassword}>
              Change Password
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-6">
        <PersonalAccessTokens />
      </div>
    </div>
  );
}
