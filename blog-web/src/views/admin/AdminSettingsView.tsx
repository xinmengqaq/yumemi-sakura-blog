import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AdminAvatar } from '@/components/admin'
import {
  Alert,
  Button,
  DataSection,
  ErrorState,
  FormField,
  Input,
  LoadingState,
  PageHeader,
} from '@/components/ui'
import {
  useAdminProfileQuery,
  useChangeAdminPasswordMutation,
  useRefreshAdminTokenMutation,
  useUpdateAdminProfileMutation,
  useValidateAdminTokenMutation,
} from '@/queries/admin'
import { useAuthStore } from '@/store/auth'
import { toApiError } from '@/utils/request'

import './adminPages.css'

type ProfileForm = {
  username: string
  role: string
  name: string
  avatar: string
}

type PasswordForm = {
  oldPassword: string
  newPassword: string
}

type TokenStatus = 'unchecked' | 'valid' | 'refreshed'

const tokenStatusLabel: Record<TokenStatus, string> = {
  unchecked: '未校验',
  valid: '有效',
  refreshed: '已刷新',
}

const emptyProfileForm: ProfileForm = {
  username: '',
  role: '',
  name: '',
  avatar: '',
}

export const AdminSettingsView = () => {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const profileQuery = useAdminProfileQuery()
  const updateProfileMutation = useUpdateAdminProfileMutation()
  const changePasswordMutation = useChangeAdminPasswordMutation()
  const validateTokenMutation = useValidateAdminTokenMutation()
  const refreshTokenMutation = useRefreshAdminTokenMutation()
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    oldPassword: '',
    newPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordForm>>(
    {},
  )
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('unchecked')
  const [tokenError, setTokenError] = useState<string | null>(null)

  useEffect(() => {
    if (!profileQuery.data) {
      return
    }

    setProfileForm({
      username: profileQuery.data.username,
      role: profileQuery.data.role,
      name: profileQuery.data.name,
      avatar: profileQuery.data.avatar ?? '',
    })
  }, [profileQuery.data])

  const tokenStatusClass = `admin-token-status admin-token-status--${tokenStatus}`

  const setProfileValue = (field: keyof ProfileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }))
    setProfileError(null)
    setProfileSuccess(null)
  }

  const setPasswordValue = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [field]: value }))
    setPasswordErrors((current) => ({ ...current, [field]: undefined }))
    setPasswordError(null)
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const username = profileForm.username.trim()
    const name = profileForm.name.trim()

    if (!username) {
      setProfileError('管理员用户名不能为空')
      return
    }

    if (!name) {
      setProfileError('管理员名称不能为空')
      return
    }

    try {
      const updated = await updateProfileMutation.mutateAsync({
        username,
        name,
        avatar: profileForm.avatar.trim() || null,
      })
      setProfileForm({
        username: updated.username,
        role: updated.role,
        name: updated.name,
        avatar: updated.avatar ?? '',
      })
      setProfileSuccess('资料已保存')
      setProfileError(null)
    } catch (error) {
      setProfileError(toApiError(error).message)
      setProfileSuccess(null)
    }
  }

  const validatePassword = () => {
    const errors: Partial<PasswordForm> = {}

    if (!passwordForm.oldPassword) {
      errors.oldPassword = '旧密码不能为空'
    }

    if (
      passwordForm.newPassword.length < 6 ||
      passwordForm.newPassword.length > 50
    ) {
      errors.newPassword = '新密码长度必须为 6-50 位'
    }

    return errors
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors = validatePassword()

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    try {
      await changePasswordMutation.mutateAsync(passwordForm)
      navigate('/admin/login', { replace: true })
    } catch (error) {
      setPasswordError(toApiError(error).message)
    }
  }

  const handleSessionFailure = (error: unknown) => {
    setTokenError(toApiError(error).message)
    clearAuth()
    navigate('/admin/login', { replace: true })
  }

  const handleValidateToken = async () => {
    try {
      const result = await validateTokenMutation.mutateAsync()
      setTokenStatus(result.valid ? 'valid' : 'unchecked')
      setTokenError(result.valid ? null : 'Token 校验未通过')
    } catch (error) {
      handleSessionFailure(error)
    }
  }

  const handleRefreshToken = async () => {
    try {
      await refreshTokenMutation.mutateAsync()
      setTokenStatus('refreshed')
      setTokenError(null)
    } catch (error) {
      handleSessionFailure(error)
    }
  }

  if (profileQuery.isLoading) {
    return <LoadingState description="正在读取管理员资料。" />
  }

  if (profileQuery.isError) {
    return (
      <ErrorState
        description={toApiError(profileQuery.error).message}
        onRetry={() => void profileQuery.refetch()}
      />
    )
  }

  return (
    <section className="admin-page admin-page--settings">
      <PageHeader
        title="管理员设置"
        description="维护当前管理员资料、密码和 Token 登录状态。"
      />

      <form onSubmit={handleProfileSubmit}>
        <DataSection
          title="管理员资料"
          footer={
            <Button loading={updateProfileMutation.isPending} type="submit">
              保存资料
            </Button>
          }
        >
          <div className="admin-profile-editor">
            <div className="admin-avatar-editor">
              <AdminAvatar
                label="当前头像预览"
                size="md"
                src={profileForm.avatar}
              />
              <span className="admin-avatar-editor__caption">头像预览</span>
            </div>
            <div className="admin-form-grid admin-form-grid--two">
              <FormField
                label="用户名"
                htmlFor="admin-profile-username"
                required
                error={
                  profileError === '管理员用户名不能为空'
                    ? profileError
                    : undefined
                }
              >
                <Input
                  id="admin-profile-username"
                  value={profileForm.username}
                  error={profileError === '管理员用户名不能为空'}
                  onChange={(event) =>
                    setProfileValue('username', event.target.value)
                  }
                />
              </FormField>
              <FormField label="角色" htmlFor="admin-profile-role">
                <Input
                  id="admin-profile-role"
                  readOnly
                  value={profileForm.role}
                />
              </FormField>
              <FormField
                label="管理员名称"
                htmlFor="admin-profile-name"
                required
                error={
                  profileError === '管理员名称不能为空'
                    ? profileError
                    : undefined
                }
              >
                <Input
                  id="admin-profile-name"
                  value={profileForm.name}
                  error={profileError === '管理员名称不能为空'}
                  onChange={(event) =>
                    setProfileValue('name', event.target.value)
                  }
                />
              </FormField>
              <FormField label="头像地址" htmlFor="admin-profile-avatar">
                <Input
                  id="admin-profile-avatar"
                  placeholder="为空时使用默认灰色头像"
                  value={profileForm.avatar}
                  onChange={(event) =>
                    setProfileValue('avatar', event.target.value)
                  }
                />
              </FormField>
            </div>
          </div>
          {profileSuccess ? (
            <Alert type="success">{profileSuccess}</Alert>
          ) : null}
          {profileError && profileError !== '管理员名称不能为空' ? (
            <Alert type="error">{profileError}</Alert>
          ) : null}
        </DataSection>
      </form>

      <form onSubmit={handlePasswordSubmit}>
        <input
          aria-hidden="true"
          autoComplete="username"
          className="admin-visually-hidden"
          name="username"
          readOnly
          tabIndex={-1}
          type="text"
          value={profileForm.username}
        />
        <DataSection
          title="修改密码"
          description="修改成功后将清理登录态，需要重新登录。"
          footer={
            <Button loading={changePasswordMutation.isPending} type="submit">
              修改密码
            </Button>
          }
        >
          <div className="admin-form-grid admin-form-grid--two">
            <FormField
              label="旧密码"
              htmlFor="admin-password-old"
              required
              error={passwordErrors.oldPassword}
            >
              <Input
                id="admin-password-old"
                autoComplete="current-password"
                type="password"
                value={passwordForm.oldPassword}
                error={Boolean(passwordErrors.oldPassword)}
                onChange={(event) =>
                  setPasswordValue('oldPassword', event.target.value)
                }
              />
            </FormField>
            <FormField
              label="新密码"
              htmlFor="admin-password-new"
              required
              error={passwordErrors.newPassword}
            >
              <Input
                id="admin-password-new"
                autoComplete="new-password"
                type="password"
                value={passwordForm.newPassword}
                error={Boolean(passwordErrors.newPassword)}
                onChange={(event) =>
                  setPasswordValue('newPassword', event.target.value)
                }
              />
            </FormField>
          </div>
          {passwordError ? <Alert type="error">{passwordError}</Alert> : null}
        </DataSection>
      </form>

      <DataSection
        title="登录状态"
        description="Token 校验和刷新失败时会清理登录态，并回到登录页。"
        footer={
          <>
            <Button
              loading={validateTokenMutation.isPending}
              onClick={handleValidateToken}
              variant="secondary"
            >
              校验 Token
            </Button>
            <Button
              loading={refreshTokenMutation.isPending}
              onClick={handleRefreshToken}
              variant="secondary"
            >
              刷新 Token
            </Button>
          </>
        }
      >
        <div className="admin-token-row">
          <span>Token 状态</span>
          <span className={tokenStatusClass}>
            {tokenStatusLabel[tokenStatus]}
          </span>
        </div>
        {tokenError ? <Alert type="error">{tokenError}</Alert> : null}
      </DataSection>
    </section>
  )
}
