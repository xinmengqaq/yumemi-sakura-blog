export type AdminVO = {
  id: number
  username: string
  name: string
  role: string
  avatar?: string | null
  token?: string
}

export type CurrentUser = {
  id: number
  username: string
  name: string
  role: string
  avatar?: string | null
}

export type LoginParams = {
  username: string
  password: string
}

export type UpdateAdminProfileParams = {
  username: string
  name: string
  avatar?: string | null
}

export type ChangeAdminPasswordParams = {
  oldPassword: string
  newPassword: string
}

export type ValidateTokenResult = {
  valid: boolean
}

export type RefreshTokenResult = {
  token: string
}
