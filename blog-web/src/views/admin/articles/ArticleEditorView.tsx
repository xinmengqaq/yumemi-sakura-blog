import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { BlockMarkdownEditor } from '@/components/editor/block-markdown-editor'
import {
  Alert,
  Button,
  ConfirmDialog,
  ErrorState,
  FormField,
  Input,
  LoadingState,
} from '@/components/ui'
import {
  useArticleDetailQuery,
  useCreateArticleMutation,
  useDeleteArticleMutation,
  useUpdateArticleMutation,
} from '@/queries/article'
import type { ArticleSaveParams, ArticleStatus } from '@/types/article'
import { toApiError } from '@/utils/request'

import { ArticleCover } from './ArticleCover'
import { ArticlePublishFields } from './ArticlePublishFields'
import { ArticleSaveStatus, type ArticleSaveState } from './ArticleSaveStatus'
import { ArticleTaxonomyFields } from './ArticleTaxonomyFields'
import './articlePages.css'

type ArticleEditorViewProps = {
  mode: 'create' | 'edit'
}

type ArticleForm = {
  title: string
  summary: string
  coverUrl: string
  status: ArticleStatus
  content: string
  categoryId: number | null
  tagIds: number[]
  isTop: boolean
  isRecommend: boolean
}

type ArticleFormErrors = Partial<Record<keyof ArticleForm, string>>

const emptyArticleForm: ArticleForm = {
  title: '',
  summary: '',
  coverUrl: '',
  status: 'draft',
  content: '',
  categoryId: null,
  tagIds: [],
  isTop: false,
  isRecommend: false,
}

const validateArticleForm = (form: ArticleForm) => {
  const errors: ArticleFormErrors = {}
  if (!form.title.trim()) errors.title = '标题不能为空'
  else if (form.title.length > 120) errors.title = '标题最多 120 个字符'
  if (form.summary.length > 300) errors.summary = '摘要最多 300 个字符'
  if (form.coverUrl.length > 500) {
    errors.coverUrl = '封面 URL 最多 500 个字符'
  }
  if (!form.content.trim()) errors.content = '正文不能为空'
  return errors
}

export const ArticleEditorView = ({ mode }: ArticleEditorViewProps) => {
  const navigate = useNavigate()
  const params = useParams()
  const parsedId = mode === 'edit' ? Number(params.id) : null
  const articleId =
    parsedId !== null && Number.isInteger(parsedId) && parsedId > 0
      ? parsedId
      : null
  const invalidArticleId = mode === 'edit' && articleId === null
  const articleQuery = useArticleDetailQuery(articleId ?? 0, {
    enabled: mode === 'edit' && articleId !== null,
  })
  const createMutation = useCreateArticleMutation()
  const updateMutation = useUpdateArticleMutation()
  const deleteMutation = useDeleteArticleMutation()
  const [form, setForm] = useState<ArticleForm>(emptyArticleForm)
  const [errors, setErrors] = useState<ArticleFormErrors>({})
  const [saveState, setSaveState] = useState<ArticleSaveState>('clean')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [taxonomyAvailable, setTaxonomyAvailable] = useState(true)
  const hydratedArticleId = useRef<number | null>(null)

  useEffect(() => {
    const article = articleQuery.data
    if (
      !article ||
      mode !== 'edit' ||
      hydratedArticleId.current === article.id
    ) {
      return
    }
    hydratedArticleId.current = article.id
    setForm({
      title: article.title,
      summary: article.summary ?? '',
      coverUrl: article.coverUrl ?? '',
      status: article.status,
      content: article.content ?? '',
      categoryId: article.categoryId ?? null,
      tagIds: article.tags?.map((tag) => tag.id) ?? [],
      isTop: Boolean(article.isTop),
      isRecommend: Boolean(article.isRecommend),
    })
    setErrors({})
    setSaveState('clean')
  }, [articleQuery.data, mode])

  const updateField = <Key extends keyof ArticleForm>(
    key: Key,
    value: ArticleForm[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setRequestError(null)
    setSaveState('dirty')
  }

  const saveArticle = async () => {
    if (createMutation.isPending || updateMutation.isPending) return
    const nextErrors = validateArticleForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSaveState('dirty')
      return
    }
    if (!taxonomyAvailable) {
      setRequestError('分类或标签加载失败，请恢复连接后再保存文章')
      return
    }
    const payload: ArticleSaveParams = {
      title: form.title.trim(),
      summary: form.summary.trim() || undefined,
      content: form.content,
      coverUrl: form.coverUrl.trim() || undefined,
      status: form.status,
      categoryId: form.categoryId,
      tagIds: form.tagIds,
      isTop: form.isTop,
      isRecommend: form.isRecommend,
    }
    setRequestError(null)
    setSaveState('saving')
    try {
      if (mode === 'create') {
        const result = await createMutation.mutateAsync(payload)
        setSaveState('saved')
        navigate(`/admin/articles/${result.id}/edit`, { replace: true })
      } else if (articleId !== null) {
        const article = await updateMutation.mutateAsync({
          id: articleId,
          params: payload,
        })
        setForm({
          title: article.title,
          summary: article.summary ?? '',
          coverUrl: article.coverUrl ?? '',
          status: article.status,
          content: article.content ?? '',
          categoryId: article.categoryId ?? payload.categoryId ?? null,
          tagIds:
            article.tags?.map((tag) => tag.id) ?? payload.tagIds ?? [],
          isTop: article.isTop ?? payload.isTop ?? false,
          isRecommend:
            article.isRecommend ?? payload.isRecommend ?? false,
        })
        setSaveState('saved')
      }
    } catch (error) {
      setRequestError(toApiError(error).message)
      setSaveState('failed')
    }
  }

  const deleteCurrentArticle = async () => {
    if (articleId === null) return
    setRequestError(null)
    try {
      await deleteMutation.mutateAsync(articleId)
      setDeleteOpen(false)
      navigate('/admin/articles', { replace: true })
    } catch (error) {
      setRequestError(toApiError(error).message)
    }
  }

  if (invalidArticleId) {
    return (
      <section className="admin-page article-page">
        <ErrorState
          title="文章 ID 无效"
          description="当前编辑地址中的文章 ID 不是有效数字。"
          actionText="返回文章列表"
          onRetry={() => navigate('/admin/articles')}
        />
      </section>
    )
  }

  if (mode === 'edit' && articleQuery.isError) {
    return (
      <section className="admin-page article-page">
        <ErrorState
          description={toApiError(articleQuery.error).message}
          onRetry={() => void articleQuery.refetch()}
        />
      </section>
    )
  }

  if (mode === 'edit' && !articleQuery.data) {
    return (
      <section className="admin-page article-page">
        <LoadingState description="正在加载文章详情。" />
      </section>
    )
  }

  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <section className="admin-page article-page article-editor-page">
      <header className="article-editor-topline">
        <Button
          icon={<ArrowLeft />}
          size="sm"
          variant="link"
          onClick={() => navigate('/admin/articles')}
        >
          返回文章列表
        </Button>
        <h1>{mode === 'create' ? '新建文章' : '编辑文章'}</h1>
        <ArticleSaveStatus state={saveState} />
      </header>

      {requestError ? <Alert type="error">{requestError}</Alert> : null}

      <div className="article-editor-layout">
        <main className="article-editor-content" aria-label="文章正文区域">
          {errors.content ? (
            <span className="article-editor-inline-error" role="alert">
              {errors.content}
            </span>
          ) : null}
          <BlockMarkdownEditor
            value={form.content}
            onChange={(content) => updateField('content', content)}
            onSaveShortcut={() => void saveArticle()}
          />
        </main>

        <aside className="article-editor-sidebar" aria-label="文章信息">
          <div className="article-editor-panel">
            <header>
              <h2>文章信息</h2>
              <p>设置标题、摘要和封面。</p>
            </header>

            <FormField
              required
              error={errors.title}
              htmlFor="article-title"
              label="标题"
              hint={`${form.title.length}/120`}
            >
              <Input
                aria-label="标题"
                id="article-title"
                maxLength={121}
                value={form.title}
                error={Boolean(errors.title)}
                onChange={(event) => updateField('title', event.target.value)}
              />
            </FormField>

            <FormField
              error={errors.summary}
              htmlFor="article-summary"
              label="摘要"
              hint={`${form.summary.length}/300`}
            >
              <textarea
                aria-label="摘要"
                id="article-summary"
                className="article-editor-textarea"
                maxLength={301}
                value={form.summary}
                aria-invalid={Boolean(errors.summary) || undefined}
                onChange={(event) => updateField('summary', event.target.value)}
              />
            </FormField>

            <FormField
              error={errors.coverUrl}
              htmlFor="article-cover-url"
              label="封面 URL"
              hint={`${form.coverUrl.length}/500`}
            >
              <Input
                aria-label="封面 URL"
                id="article-cover-url"
                maxLength={501}
                placeholder="https://example.com/cover.png"
                value={form.coverUrl}
                error={Boolean(errors.coverUrl)}
                onChange={(event) =>
                  updateField('coverUrl', event.target.value)
                }
              />
            </FormField>

            <ArticleCover coverUrl={form.coverUrl} alt={form.title} />

            <section className="article-editor-group">
              <header>
                <h2>内容关联</h2>
                <p>选择文章分类和标签。</p>
              </header>
              <ArticleTaxonomyFields
                categoryId={form.categoryId}
                tagIds={form.tagIds}
                onAvailabilityChange={setTaxonomyAvailable}
                onCategoryChange={(categoryId) =>
                  updateField('categoryId', categoryId)
                }
                onTagIdsChange={(tagIds) => updateField('tagIds', tagIds)}
              />
            </section>

            <section className="article-editor-group">
              <header>
                <h2>发布设置</h2>
                <p>控制文章状态和内容优先级。</p>
              </header>
              <ArticlePublishFields
                status={form.status}
                isTop={form.isTop}
                isRecommend={form.isRecommend}
                onStatusChange={(status) => updateField('status', status)}
                onTopChange={(isTop) => updateField('isTop', isTop)}
                onRecommendChange={(isRecommend) =>
                  updateField('isRecommend', isRecommend)
                }
              />
            </section>

            <Button
              icon={<Save />}
              loading={saving}
              onClick={() => void saveArticle()}
            >
              {saving ? '保存中' : '保存文章'}
            </Button>
          </div>

          {mode === 'edit' ? (
            <div className="article-editor-danger-zone">
              <div>
                <h2>危险区</h2>
                <p>删除后无法恢复，请确认文章不再需要。</p>
              </div>
              <Button
                icon={<Trash2 />}
                variant="danger"
                onClick={() => setDeleteOpen(true)}
              >
                删除文章
              </Button>
            </div>
          ) : null}
        </aside>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="删除文章"
        description={`确认删除“${form.title}”吗？此操作无法撤销。`}
        confirmText="删除文章"
        danger
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteCurrentArticle()}
      />
    </section>
  )
}
