import { OrganizerRequestPanel } from "../features/administration/AdminPages";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../features/auth/AuthProvider";
import { profileSchema, type ProfileValues } from "../features/auth/validation";
import { updateOwnProfile } from "../features/profiles/repository";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Field, fieldA11y } from "../components/ui/field";
import {
  ErrorMessage,
  SuccessMessage,
  errorMessage,
} from "../components/ui/status";
export function ProfilePage() {
  const auth = useAuth();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: auth.profile?.full_name ?? "",
      department: auth.profile?.department ?? "",
      study_year: auth.profile?.study_year ?? 1,
    },
  });
  const submit = handleSubmit(async (values) => {
    try {
      setError("");
      setSaved(false);
      if (!auth.user) throw new Error("Sign in again.");
      await updateOwnProfile(auth.user.id, values);
      await auth.refresh();
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <>
      <p className="eyebrow">Your account</p>
      <h1>Profile</h1>
      <p className="page-lead">
        Update your permitted details. Your email, register number and approved
        roles are protected.
      </p>
      <section className="card" style={{ maxWidth: 640 }}>
        {error && <ErrorMessage message={error} />}{" "}
        {saved && <SuccessMessage message="Profile updated." />}
        <form className="form" noValidate onSubmit={submit}>
          <Field id="email" label="College email">
            <Input id="email" value={auth.profile?.email ?? ""} readOnly />
          </Field>
          <Field id="rrn" label="Register number">
            <Input id="rrn" value={auth.profile?.rrn ?? ""} readOnly />
          </Field>
          <Field
            id="full_name"
            label="Full name"
            error={errors.full_name?.message}
          >
            <Input
              id="full_name"
              autoComplete="name"
              {...register("full_name")}
              {...fieldA11y("full_name", errors.full_name?.message)}
            />
          </Field>
          <Field
            id="department"
            label="Department"
            error={errors.department?.message}
          >
            <Input
              id="department"
              {...register("department")}
              {...fieldA11y("department", errors.department?.message)}
            />
          </Field>
          <Field
            id="study_year"
            label="Year of study"
            error={errors.study_year?.message}
          >
            <select
              id="study_year"
              className="input"
              {...register("study_year", { valueAsNumber: true })}
              {...fieldA11y("study_year", errors.study_year?.message)}
            >
              {[1, 2, 3, 4, 5, 6].map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </section>
      <OrganizerRequestPanel />
    </>
  );
}
