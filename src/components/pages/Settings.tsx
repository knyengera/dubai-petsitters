"use client";

import { base44 } from "@/lib/data";

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, LogOut, AlertTriangle, User, Bell, PauseCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getProfile } from "@/lib/profile/actions";
import { deactivateAccount, softDeleteAccount } from "@/lib/account/actions";
import { maskIdNumber } from "@/lib/auth/onboarding";
import { useAuth } from "@/lib/auth-context";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "@/lib/notifications/actions";
import type { NotificationPreferences } from "@/lib/notifications/types";

export default function SettingsPage() {
  const [deleting, setDeleting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const { isEmailVerified, isPhoneVerified } = useAuth();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getProfile>>>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => setProfile(null));
    getNotificationPreferences().then(setPrefs).catch(() => setPrefs(null));
  }, []);

  const updatePref = async (
    key: keyof Omit<NotificationPreferences, "user_id">,
    value: boolean
  ) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSavingPrefs(true);
    await saveNotificationPreferences({ [key]: value });
    setSavingPrefs(false);
  };

  const handleDeactivateAccount = async () => {
    setDeactivating(true);
    const result = await deactivateAccount();
    if (result.success) {
      window.location.href = "/login";
    } else {
      setDeactivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const result = await softDeleteAccount();
    if (result.success) {
      window.location.href = "/login?reason=deleted";
    } else {
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Account profile</h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.full_name ?? "Profile not completed"}
                </p>
              </div>
            </div>
            {profile && (
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">City</dt>
                <dd>{profile.city ?? "—"}</dd>
                <dt className="text-muted-foreground">ID</dt>
                <dd>{maskIdNumber(profile.id_number) || "—"}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{isEmailVerified ? "Verified" : "Not verified"}</dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{isPhoneVerified ? (profile.phone ?? "Verified") : "Not verified"}</dd>
              </dl>
            )}
            <Button variant="outline" className="rounded-xl" asChild>
              <Link href="/profile/complete">Update profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Email and SMS alerts {savingPrefs ? "(saving…)" : ""}
                </p>
              </div>
            </div>
            {prefs && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_enabled">Email notifications</Label>
                  <Switch
                    id="email_enabled"
                    checked={prefs.email_enabled}
                    onCheckedChange={(v) => updatePref("email_enabled", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms_enabled">SMS notifications</Label>
                  <Switch
                    id="sms_enabled"
                    checked={prefs.sms_enabled}
                    onCheckedChange={(v) => updatePref("sms_enabled", v)}
                  />
                </div>
                <div className="border-t border-border pt-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categories</p>
                  {(
                    [
                      ["booking", "Bookings"],
                      ["payment", "Payments"],
                      ["message", "Messages"],
                      ["appointment", "Appointments"],
                      ["reminder", "Reminders"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="grid grid-cols-2 gap-3 text-sm">
                      <span className="text-foreground">{label}</span>
                      <div className="flex items-center justify-end gap-4">
                        <label className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">Email</span>
                          <Switch
                            checked={prefs[`${key}_email`]}
                            onCheckedChange={(v) => updatePref(`${key}_email`, v)}
                            disabled={!prefs.email_enabled}
                          />
                        </label>
                        <label className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">SMS</span>
                          <Switch
                            checked={prefs[`${key}_sms`]}
                            onCheckedChange={(v) => updatePref(`${key}_sms`, v)}
                            disabled={!prefs.sms_enabled}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Log Out</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Sign out of your account on this device.</p>
            </div>
            <Button variant="outline" className="rounded-xl select-none min-h-[44px]" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Log Out
            </Button>
          </CardContent>
        </Card>

        {/* Deactivate Account */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <PauseCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Deactivate Account</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Temporarily pauses your account. Your profile and any host listings are hidden, and you'll be signed out. <strong>Logging back in reactivates everything.</strong>
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="mt-4 rounded-xl select-none min-h-[44px]" disabled={deactivating}>
                      <PauseCircle className="w-4 h-4 mr-2" />
                      Deactivate My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your profile and host listings will be hidden and you'll be signed out. You can restore everything at any time by simply logging back in.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl select-none">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeactivateAccount}
                        className="rounded-xl select-none"
                        disabled={deactivating}
                      >
                        {deactivating ? 'Deactivating...' : 'Deactivate'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="rounded-2xl border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Delete Account</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Closes your account and hides your profile and listings. You won't be able to log back in. Your records are retained, and account removal can be requested through support.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="mt-4 rounded-xl select-none min-h-[44px]" disabled={deleting}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This closes your account and hides your profile and listings. You <strong>won't be able to log back in</strong>. Your records are retained, and full removal can be requested through support.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl select-none">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="rounded-xl bg-destructive hover:bg-destructive/90 select-none"
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting...' : 'Yes, delete my account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}