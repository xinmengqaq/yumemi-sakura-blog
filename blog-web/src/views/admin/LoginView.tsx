import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert, Button, FormField, Input } from '@/components/ui'
import { useLoginMutation } from '@/queries/auth'
import { toApiError } from '@/utils/request'

import './adminPages.css'

type LoginForm = {
  username: string
  password: string
}

type LoginFieldErrors = Partial<Record<keyof LoginForm, string>>

const initialForm: LoginForm = {
  username: '',
  password: '',
}

export const LoginView = () => {
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const [form, setForm] = useState<LoginForm>(initialForm)
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const setFieldValue = (field: keyof LoginForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitError(null)
  }

  const validate = () => {
    const errors: LoginFieldErrors = {}

    if (!form.username.trim()) {
      errors.username = '用户名不能为空'
    }

    if (!form.password) {
      errors.password = '密码不能为空'
    }

    return errors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors = validate()

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      await loginMutation.mutateAsync({
        username: form.username.trim(),
        password: form.password,
      })
      navigate('/admin', { replace: true })
    } catch (error) {
      setSubmitError(toApiError(error).message)
    }
  }

  return (
    <section className="admin-login-page">
      <div className="admin-login-brand">
        <strong>个人博客后台</strong>
      </div>

      <div className="admin-login-form-pane">
        <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
          <header className="admin-login-form__header">
            <h1>后台登录</h1>
          </header>

          {submitError ? <Alert type="error">{submitError}</Alert> : null}

          <FormField
            label="用户名"
            htmlFor="admin-login-username"
            error={fieldErrors.username}
          >
            <Input
              id="admin-login-username"
              name="username"
              autoComplete="username"
              value={form.username}
              error={Boolean(fieldErrors.username)}
              onChange={(event) =>
                setFieldValue('username', event.target.value)
              }
            />
          </FormField>

          <FormField
            label="密码"
            htmlFor="admin-login-password"
            error={fieldErrors.password}
          >
            <Input
              id="admin-login-password"
              name="password"
              autoComplete="current-password"
              type="password"
              value={form.password}
              error={Boolean(fieldErrors.password)}
              onChange={(event) =>
                setFieldValue('password', event.target.value)
              }
            />
          </FormField>

          <Button
            className="admin-login-form__submit"
            loading={loginMutation.isPending}
            type="submit"
          >
            {loginMutation.isPending ? '登录中' : '登录后台'}
          </Button>
        </form>
      </div>
    </section>
  )
}
