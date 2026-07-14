import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import {
  changeAdminPassword,
  getAdminProfile,
  refreshAdminToken,
  updateAdminProfile,
  validateAdminToken,
} from '@/api/admin'
import { useAuthStore } from '@/store/auth'
import type {
  AdminVO,
  ChangeAdminPasswordParams,
  RefreshTokenResult,
  UpdateAdminProfileParams,
  ValidateTokenResult,
} from '@/types/auth'

import { toCurrentUser } from './auth'

export const adminQueryKeys = {
  profile: ['admin', 'profile'] as const,
}

export const useAdminProfileQuery = (options?: { enabled?: boolean }) => {
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)

  const query = useQuery({
    queryKey: adminQueryKeys.profile,
    queryFn: () => getAdminProfile(),
    enabled: options?.enabled ?? true,
  })

  useEffect(() => {
    if (query.data) {
      setCurrentUser(toCurrentUser(query.data))
    }
  }, [query.data, setCurrentUser])

  return query
}

export const useUpdateAdminProfileMutation = () => {
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)

  return useMutation<AdminVO, unknown, UpdateAdminProfileParams>({
    mutationFn: (params) => updateAdminProfile(params),
    onSuccess: (admin) => setCurrentUser(toCurrentUser(admin)),
  })
}

export const useChangeAdminPasswordMutation = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth)

  return useMutation<void, unknown, ChangeAdminPasswordParams>({
    mutationFn: (params) => changeAdminPassword(params),
    onSuccess: clearAuth,
  })
}

export const useValidateAdminTokenMutation = () =>
  useMutation<ValidateTokenResult, unknown, void>({
    mutationFn: () => validateAdminToken(),
  })

export const useRefreshAdminTokenMutation = () => {
  const setToken = useAuthStore((state) => state.setToken)

  return useMutation<RefreshTokenResult, unknown, void>({
    mutationFn: () => refreshAdminToken(),
    onSuccess: (result) => setToken(result.token),
  })
}
