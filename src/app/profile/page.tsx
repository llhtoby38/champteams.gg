'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthSession, setAuthSession } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Shield, Link2, Unlink, Check, AlertCircle } from 'lucide-react';

interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  hasGoogle: boolean;
  hasPassword: boolean;
  createdAt: string;
}

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function ProfilePageWrapper() {
  return <Suspense><ProfilePage /></Suspense>;
}

function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<{ userId: string; username: string } | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Username form
  const [newUsername, setNewUsername] = useState('');
  const [usernameMsg, setUsernameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Google link status
  const [googleMsg, setGoogleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    const s = getAuthSession();
    if (!s) {
      router.push('/builder');
      return;
    }
    setSession(s);
    loadProfile(s.userId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle query params from Google OAuth
  useEffect(() => {
    if (searchParams.get('google_linked') === 'true') {
      setGoogleMsg({ type: 'success', text: 'Google account linked successfully!' });
      loadProfile(session?.userId || getAuthSession()?.userId || '');
    }
    const error = searchParams.get('error');
    if (error) {
      setGoogleMsg({ type: 'error', text: error });
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async (userId: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', { headers: { 'x-user-id': userId } });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setNewUsername(data.displayName || '');
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newUsername.trim()) return;
    setUsernameSaving(true);
    setUsernameMsg(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameMsg({ type: 'error', text: data.error });
      } else {
        setUsernameMsg({ type: 'success', text: 'Username updated!' });
        const newSession = { ...session, username: data.username };
        setAuthSession(newSession);
        setSession(newSession);
        loadProfile(session.userId);
      }
    } catch {
      setUsernameMsg({ type: 'error', text: 'Network error' });
    }
    setUsernameSaving(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setPasswordSaving(true);
    try {
      const body: Record<string, string> = { password: newPassword };
      if (profile?.hasPassword) body.currentPassword = currentPassword;

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMsg({ type: 'error', text: data.error });
      } else {
        setPasswordMsg({ type: 'success', text: 'Password updated!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        loadProfile(session.userId);
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Network error' });
    }
    setPasswordSaving(false);
  };

  const handleLinkGoogle = () => {
    if (!session) return;
    window.location.href = `/api/auth/google?mode=link&userId=${session.userId}`;
  };

  const handleUnlinkGoogle = async () => {
    if (!session) return;
    setUnlinking(true);
    setGoogleMsg(null);
    try {
      const res = await fetch('/api/auth/google/unlink', {
        method: 'POST',
        headers: { 'x-user-id': session.userId },
      });
      const data = await res.json();
      if (!res.ok) {
        setGoogleMsg({ type: 'error', text: data.error });
      } else {
        setGoogleMsg({ type: 'success', text: 'Google account unlinked.' });
        loadProfile(session.userId);
      }
    } catch {
      setGoogleMsg({ type: 'error', text: 'Network error' });
    }
    setUnlinking(false);
  };

  if (!session || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <User className="h-5 w-5 text-[#d4a017]" />
        Profile Settings
      </h1>

      {/* Username Section */}
      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4" /> Username
        </h2>
        <form onSubmit={handleUpdateUsername} className="space-y-2">
          <Input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Username"
            minLength={3}
            maxLength={30}
            required
          />
          {usernameMsg && (
            <p className={`text-xs flex items-center gap-1 ${usernameMsg.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
              {usernameMsg.type === 'error' ? <AlertCircle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              {usernameMsg.text}
            </p>
          )}
          <Button type="submit" size="sm" disabled={usernameSaving}>
            {usernameSaving ? 'Saving...' : 'Update Username'}
          </Button>
        </form>
      </section>

      {/* Password Section */}
      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" /> {profile?.hasPassword ? 'Change Password' : 'Set Password'}
        </h2>
        <form onSubmit={handleUpdatePassword} className="space-y-2">
          {profile?.hasPassword && (
            <div>
              <label className="text-xs text-muted-foreground">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="mt-1"
                required
              />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="mt-1"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="mt-1"
              minLength={6}
              required
            />
          </div>
          {passwordMsg && (
            <p className={`text-xs flex items-center gap-1 ${passwordMsg.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
              {passwordMsg.type === 'error' ? <AlertCircle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              {passwordMsg.text}
            </p>
          )}
          <Button type="submit" size="sm" disabled={passwordSaving}>
            {passwordSaving ? 'Saving...' : profile?.hasPassword ? 'Change Password' : 'Set Password'}
          </Button>
        </form>
      </section>

      {/* Google Link Section — hidden until OAuth is configured */}
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <section className="border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <GoogleIcon size={16} /> Google Account
          </h2>
          {profile?.hasGoogle ? (
            <div className="space-y-2">
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> Google account linked
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlinkGoogle}
                disabled={unlinking || !profile.hasPassword}
                className="text-red-600 hover:text-red-700"
              >
                <Unlink className="h-3.5 w-3.5 mr-1.5" />
                {unlinking ? 'Unlinking...' : 'Unlink Google'}
              </Button>
              {!profile.hasPassword && (
                <p className="text-[10px] text-muted-foreground">Set a password first before unlinking Google.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Link your Google account for easy sign-in.</p>
              <Button variant="outline" size="sm" onClick={handleLinkGoogle}>
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
                Link Google Account
              </Button>
            </div>
          )}
          {googleMsg && (
            <p className={`text-xs flex items-center gap-1 ${googleMsg.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
              {googleMsg.type === 'error' ? <AlertCircle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              {googleMsg.text}
            </p>
          )}
        </section>
      )}

      {/* Account Info */}
      <section className="text-xs text-muted-foreground space-y-1 px-1">
        <p>Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</p>
      </section>
    </div>
  );
}
