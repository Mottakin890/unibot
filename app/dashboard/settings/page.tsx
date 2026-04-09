'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Shield, Loader2, CheckCircle2, AlertCircle, LogOut } from 'lucide-react'

export default function AccountSettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email ?? '')
        setFullName(user.user_metadata?.full_name ?? '')
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSaveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    })
    if (error) showToast('error', error.message)
    else {
      // Also update profiles table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
      }
      showToast('success', 'Profile updated')
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords do not match')
      return
    }
    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) showToast('error', error.message)
    else {
      showToast('success', 'Password updated')
      setNewPassword('')
      setConfirmPassword('')
    }
    setChangingPassword(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl p-6 md:p-8 lg:p-10">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate-fade-in ${
          toast.type === 'success' ? 'border-border bg-card text-foreground' : 'border-destructive/30 bg-destructive/10 text-destructive'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">Account Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your profile and security settings.</p>
      </div>

      {/* Profile section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
            <User className="w-4 h-4 text-background" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Profile</h3>
            <p className="text-xs text-muted-foreground">Your personal information</p>
          </div>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground">Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="bg-background border-border"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Email
            </Label>
            <Input value={email} disabled className="bg-muted/30 border-border text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="w-fit bg-foreground text-background hover:bg-foreground/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Security section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
            <Shield className="w-4 h-4 text-background" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Security</h3>
            <p className="text-xs text-muted-foreground">Update your password</p>
          </div>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="bg-background border-border"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground">Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="bg-background border-border"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} className="w-fit bg-foreground text-background hover:bg-foreground/90">
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
            Update Password
          </Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/30 bg-card">
        <div className="px-6 py-4 border-b border-destructive/20">
          <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Sign Out</p>
            <p className="text-xs text-muted-foreground mt-0.5">You will be redirected to the homepage.</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="border-destructive/30 text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
