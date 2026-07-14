import { AxiosError, type AxiosAdapter } from 'axios'
import { afterEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/store/auth'

import { apiClient, request } from './request'

const makeAdapter =
  (data: unknown, status = 200): AxiosAdapter =>
  (config) =>
    Promise.resolve({
      data,
      status,
      statusText: String(status),
      headers: {},
      config,
    })

describe('request', () => {
  afterEach(() => {
    apiClient.defaults.adapter = undefined
    localStorage.clear()
    useAuthStore.getState().clearAuth()
  })

  it('有 Token 时自动添加 Authorization 请求头并返回后端 data', async () => {
    useAuthStore.getState().setAuth('token-1', {
      id: 1,
      username: 'admin',
      name: '管理员',
      role: 'admin',
    })
    apiClient.defaults.adapter = (config) => {
      expect(config.headers?.Authorization).toBe('Bearer token-1')
      return makeAdapter({ code: '0', msg: '成功', data: { ok: true } })(config)
    }

    await expect(request.get<{ ok: boolean }>('/ping')).resolves.toEqual({
      ok: true,
    })
  })

  it('后端业务失败时抛出统一错误对象', async () => {
    apiClient.defaults.adapter = makeAdapter({
      code: '400',
      msg: '参数错误',
      data: null,
    })

    await expect(request.get('/bad')).rejects.toMatchObject({
      code: '400',
      message: '参数错误',
      status: 200,
    })
  })

  it('后端业务失败时保留结构化错误详情', async () => {
    // Given 后端返回带等待秒数的点赞限频错误
    apiClient.defaults.adapter = makeAdapter({
      code: '429',
      msg: '点赞过于频繁',
      data: { retryAfterSeconds: 45 },
    })

    // When 前端请求公开点赞接口
    const response = request.post('/articles/9/like')

    // Then 统一错误对象应保留后端结构化详情供页面展示
    await expect(response).rejects.toMatchObject({
      code: '429',
      message: '点赞过于频繁',
      details: { retryAfterSeconds: 45 },
    })
  })

  it('未登录响应会清理登录态', async () => {
    useAuthStore.getState().setAuth('token-1', {
      id: 1,
      username: 'admin',
      name: '管理员',
      role: 'admin',
    })
    apiClient.defaults.adapter = makeAdapter({
      code: '401',
      msg: '登录已失效',
      data: null,
    })

    await expect(request.get('/expired')).rejects.toMatchObject({ code: '401' })
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('支持 PATCH 请求并传递请求体', async () => {
    apiClient.defaults.adapter = (config) => {
      expect(config.method).toBe('patch')
      expect(config.url).toBe('/admin/profile/password')
      expect(config.data).toBe(JSON.stringify({ oldPassword: 'old-pass' }))

      return makeAdapter({ code: '0', msg: '成功', data: undefined })(config)
    }

    await expect(
      request.patch<void>('/admin/profile/password', {
        oldPassword: 'old-pass',
      }),
    ).resolves.toBeUndefined()
  })

  it('网络错误能转换成后端未启动提示', async () => {
    apiClient.defaults.adapter = () =>
      Promise.reject(new AxiosError('Network Error'))

    await expect(request.get('/down')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: '无法连接后端服务，请确认服务是否已启动',
    })
  })
})
