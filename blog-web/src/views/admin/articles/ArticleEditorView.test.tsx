import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createArticle,
  deleteArticle,
  getArticleDetail,
  updateArticle,
} from '@/api/article'
import type { ArticleVO } from '@/types/article'

import { ArticleEditorView } from './ArticleEditorView'

vi.mock('@/api/article', () => ({
  createArticle: vi.fn(),
  deleteArticle: vi.fn(),
  getArticleDetail: vi.fn(),
  getArticlePage: vi.fn(),
  updateArticle: vi.fn(),
}))

vi.mock('@/components/editor/block-markdown-editor', () => ({
  BlockMarkdownEditor: ({
    value,
    onChange,
    onSaveShortcut,
  }: {
    value: string
    onChange: (value: string) => void
    onSaveShortcut?: () => void
  }) => (
    <textarea
      aria-label="文章正文"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.ctrlKey && event.key.toLowerCase() === 's') {
          event.preventDefault()
          onSaveShortcut?.()
        }
      }}
    />
  ),
}))

const article: ArticleVO = {
  id: 7,
  title: '已有文章',
  summary: '已有摘要',
  content: '# 已有正文',
  coverUrl: 'https://example.com/cover.png',
  status: 'published',
  viewCount: 3,
  commentCount: 1,
  publishedAt: '2026-07-09T08:00:00Z',
  createdAt: '2026-07-09T08:00:00Z',
  updatedAt: '2026-07-10T08:00:00Z',
}

const Location = () => {
  const location = useLocation()
  return <output aria-label="当前路由">{location.pathname}</output>
}

const renderEditor = (mode: 'create' | 'edit', path?: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })
  const route =
    mode === 'create' ? '/admin/articles/new' : '/admin/articles/:id/edit'
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          path ??
            (mode === 'create'
              ? '/admin/articles/new'
              : '/admin/articles/7/edit'),
        ]}
      >
        <Routes>
          <Route
            path={route}
            element={
              <>
                <ArticleEditorView mode={mode} />
                <Location />
              </>
            }
          />
          <Route path="/admin/articles/:id/edit" element={<Location />} />
          <Route path="/admin/articles" element={<Location />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText('标题'), {
    target: { value: '新文章' },
  })
  fireEvent.change(screen.getByLabelText('文章正文'), {
    target: { value: '正文内容' },
  })
}

describe('后台文章编辑页', () => {
  afterEach(() => vi.clearAllMocks())

  it('新建页默认字段为空且状态为草稿', () => {
    renderEditor('create')

    expect(screen.getByLabelText('标题')).toHaveValue('')
    expect(screen.getByLabelText('摘要')).toHaveValue('')
    expect(screen.getByLabelText('封面 URL')).toHaveValue('')
    expect(screen.getByLabelText('文章正文')).toHaveValue('')
    expect(screen.getByRole('radio', { name: '草稿' })).toBeChecked()
    expect(
      screen.queryByRole('button', { name: '删除文章' }),
    ).not.toBeInTheDocument()
    expect(getArticleDetail).not.toHaveBeenCalled()
  })

  it('编辑页应请求详情并填充信息栏和正文', async () => {
    vi.mocked(getArticleDetail).mockResolvedValue(article)
    renderEditor('edit')

    expect(await screen.findByDisplayValue('已有文章')).toBeInTheDocument()
    expect(screen.getByLabelText('摘要')).toHaveValue('已有摘要')
    expect(screen.getByLabelText('封面 URL')).toHaveValue(article.coverUrl)
    expect(screen.getByLabelText('文章正文')).toHaveValue('# 已有正文')
    expect(screen.getByRole('radio', { name: '已发布' })).toBeChecked()
    expect(getArticleDetail).toHaveBeenCalledWith(7)
  })

  it('编辑页 ID 非数字时应显示错误并提供返回入口', () => {
    renderEditor('edit', '/admin/articles/not-a-number/edit')

    expect(screen.getByRole('alert')).toHaveTextContent('文章 ID 无效')
    expect(
      screen.getByRole('button', { name: '返回文章列表' }),
    ).toBeInTheDocument()
    expect(getArticleDetail).not.toHaveBeenCalled()
  })

  it.each([
    ['标题', '', '标题不能为空'],
    ['标题', 'a'.repeat(121), '标题最多 120 个字符'],
    ['摘要', 'a'.repeat(301), '摘要最多 300 个字符'],
    ['封面 URL', 'a'.repeat(501), '封面 URL 最多 500 个字符'],
  ])('%s 校验失败时不应发送保存请求', (label, value, message) => {
    renderEditor('create')
    fillValidForm()
    fireEvent.change(screen.getByLabelText(label), { target: { value } })

    fireEvent.click(screen.getByRole('button', { name: '保存文章' }))

    expect(screen.getByText(message)).toBeInTheDocument()
    expect(createArticle).not.toHaveBeenCalled()
  })

  it('正文为空时不应发送保存请求', () => {
    renderEditor('create')
    fireEvent.change(screen.getByLabelText('标题'), {
      target: { value: '新文章' },
    })

    fireEvent.click(screen.getByRole('button', { name: '保存文章' }))

    expect(screen.getByText('正文不能为空')).toBeInTheDocument()
    expect(createArticle).not.toHaveBeenCalled()
  })

  it('新建成功后应进入文章编辑路由', async () => {
    vi.mocked(createArticle).mockResolvedValue({ id: 23 })
    renderEditor('create')
    fillValidForm()

    fireEvent.click(screen.getByRole('button', { name: '保存文章' }))

    await waitFor(() => expect(createArticle).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(screen.getByLabelText('当前路由')).toHaveTextContent(
        '/admin/articles/23/edit',
      ),
    )
  })

  it('保存请求进行中应禁用保存按钮并显示保存中', async () => {
    vi.mocked(createArticle).mockReturnValue(new Promise(() => undefined))
    renderEditor('create')
    fillValidForm()

    fireEvent.click(screen.getByRole('button', { name: '保存文章' }))

    expect(screen.getByRole('button', { name: '保存中' })).toBeDisabled()
    expect(screen.getByText('保存状态：保存中')).toBeInTheDocument()
  })

  it('修改成功后应显示已保存', async () => {
    vi.mocked(getArticleDetail).mockResolvedValue(article)
    vi.mocked(updateArticle).mockResolvedValue({ ...article, title: '修改后' })
    renderEditor('edit')
    await screen.findByDisplayValue('已有文章')
    fireEvent.change(screen.getByLabelText('标题'), {
      target: { value: '修改后' },
    })

    fireEvent.click(screen.getByRole('button', { name: '保存文章' }))

    expect(await screen.findByText('保存状态：已保存')).toBeInTheDocument()
    await waitFor(() => expect(updateArticle).toHaveBeenCalledOnce())
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.getByText('保存状态：已保存')).toBeInTheDocument()
    expect(updateArticle).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ title: '修改后' }),
    )
  })

  it('保存失败时应显示后端 msg', async () => {
    vi.mocked(createArticle).mockRejectedValue({
      code: '500',
      message: '后端保存失败',
    })
    renderEditor('create')
    fillValidForm()

    fireEvent.click(screen.getByRole('button', { name: '保存文章' }))

    expect(await screen.findByText('后端保存失败')).toBeInTheDocument()
    expect(screen.getByText('保存状态：保存失败')).toBeInTheDocument()
  })

  it('编辑页删除文章应确认并在成功后返回列表', async () => {
    vi.mocked(getArticleDetail).mockResolvedValue(article)
    vi.mocked(deleteArticle).mockResolvedValue(undefined)
    renderEditor('edit')
    await screen.findByDisplayValue('已有文章')

    fireEvent.click(screen.getByRole('button', { name: '删除文章' }))
    expect(
      screen.getByText('确认删除“已有文章”吗？此操作无法撤销。'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: '删除文章' }).at(-1)!)

    await waitFor(() => expect(deleteArticle).toHaveBeenCalledWith(7))
    expect(screen.getByLabelText('当前路由')).toHaveTextContent(
      '/admin/articles',
    )
  })

  it('删除失败时应留在编辑页并显示后端 msg', async () => {
    vi.mocked(getArticleDetail).mockResolvedValue(article)
    vi.mocked(deleteArticle).mockRejectedValue({
      code: '500',
      message: '后端删除失败',
    })
    renderEditor('edit')
    await screen.findByDisplayValue('已有文章')
    fireEvent.click(screen.getByRole('button', { name: '删除文章' }))

    fireEvent.click(screen.getAllByRole('button', { name: '删除文章' }).at(-1)!)

    expect(await screen.findByText('后端删除失败')).toBeInTheDocument()
    expect(screen.getByLabelText('当前路由')).toHaveTextContent(
      '/admin/articles/7/edit',
    )
  })

  it('Ctrl + S 应触发保存文章', async () => {
    vi.mocked(createArticle).mockResolvedValue({ id: 31 })
    renderEditor('create')
    fillValidForm()

    const allowed = fireEvent.keyDown(screen.getByLabelText('文章正文'), {
      key: 's',
      ctrlKey: true,
    })

    expect(allowed).toBe(false)
    await waitFor(() => expect(createArticle).toHaveBeenCalledOnce())
  })
})
