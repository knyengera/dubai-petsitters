"use client";

import { base44 } from "@/lib/data";

import React, { useState } from 'react';
import { entities } from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, LogOut, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await base44.auth.deleteUser();
  };

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
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
                  Permanently deletes your account and all associated data including bookings, adoption requests, and profile information. <strong>This action cannot be undone.</strong>
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
                        This will permanently delete your account and all your data — including bookings, adoption requests, and profile information. This action <strong>cannot be undone</strong>.
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