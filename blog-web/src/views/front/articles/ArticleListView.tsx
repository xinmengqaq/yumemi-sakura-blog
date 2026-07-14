import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import {
  FrontArticleBadges,
  FrontArticleImage,
  FrontArticleMeta,
} from '@/components/front/article'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { FrontSceneBanner } from '@/components/front/layout/FrontSceneBanner'
import { frontSite } from '@/config/frontSite'
import {
  usePublicArticlePageQuery,
  useArticleFilterMetaQuery,
  usePublicCategoriesQuery,
  usePublicTagsQuery,
} from '@/queries/publicContent'
import {
  normalizePublicArticleFilters,
  parsePublicArticleFilters,
  serializePublicArticleFilters,
  updatePublicArticleFilters,
  type PublicArticleFilters,
} from '@/utils/publicArticleFilters'

const setParams = (
  setSearchParams: (
    params: URLSearchParams,
    options?: { replace?: boolean },
  ) => void,
  filters: PublicArticleFilters,
) => setSearchParams(serializePublicArticleFilters(filters), { replace: true })

const TagDialog = ({
  open,
  tags,
  selected,
  onClose,
  onChange,
}: {
  open: boolean
  tags: { id: number; name: string }[]
  selected: number[]
  onClose: () => void
  onChange: (ids: number[]) => void
}) => {
  const [query, setQuery] = useState('')
  const filtered = tags.filter((tag) =>
    tag.name.toLowerCase().includes(query.trim().toLowerCase()),
  )
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])
  if (!open) return null
  return (
    <div
      className="tag-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="选择标签"
    >
      <button
        className="tag-dialog__backdrop"
        onClick={onClose}
        type="button"
        aria-label="关闭标签弹窗"
      />
      <div className="tag-dialog__panel">
        <header>
          <h2>选择标签</h2>
          <button
            className="icon-button"
            onClick={onClose}
            type="button"
            aria-label="关闭"
          >
            <X />
          </button>
        </header>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索标签"
          aria-label="搜索标签"
        />
        <div className="tag-dialog__selected">
          {selected.length ? (
            selected.map((id) => {
              const tag = tags.find((item) => item.id === id)
              return tag ? (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    onChange(selected.filter((value) => value !== id))
                  }
                >
                  {tag.name} ×
                </button>
              ) : null
            })
          ) : (
            <span>已选标签会显示在这里</span>
          )}
        </div>
        <div className="tag-dialog__list">
          {filtered.map((tag) => {
            const active = selected.includes(tag.id)
            return (
              <button
                className={active ? 'is-active' : ''}
                key={tag.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange(
                    active
                      ? selected.filter((id) => id !== tag.id)
                      : [...selected, tag.id],
                  )
                }
              >
                {tag.name}
              </button>
            )
          })}
        </div>
        <footer>
          <button
            type="button"
            className="front-button front-button--quiet"
            onClick={() => onChange([])}
          >
            清空已选
          </button>
          <button
            type="button"
            className="front-button front-button--dark"
            onClick={onClose}
          >
            完成
          </button>
        </footer>
      </div>
    </div>
  )
}

export const ArticleListView = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(
    () => parsePublicArticleFilters(searchParams),
    [searchParams],
  )
  const [keyword, setKeyword] = useState(filters.keyword)
  const [tagOpen, setTagOpen] = useState(false)
  const resultRef = useRef<HTMLElement>(null)
  const articles = usePublicArticlePageQuery(filters)
  const tags = usePublicTagsQuery()
  const categories = usePublicCategoriesQuery()
  const meta = useArticleFilterMetaQuery()
  useEffect(() => setKeyword(filters.keyword), [filters.keyword])
  useEffect(() => {
    if (articles.isSuccess)
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [articles.data?.page, articles.isSuccess])
  const update = (changes: Partial<PublicArticleFilters>) =>
    setParams(setSearchParams, updatePublicArticleFilters(filters, changes))
  const updatePage = (page: number) =>
    setParams(
      setSearchParams,
      normalizePublicArticleFilters({ ...filters, page }),
    )
  const years = meta.data?.archives ?? []
  const months = years.find((year) => year.year === filters.year)?.months ?? []
  return (
    <div className="front-list">
      <FrontSceneBanner
        className="list-banner"
        stationLabel={frontSite.stationFallback}
      >
        <div className="front-container">
          <p>沿着时间的轨道，寻找想读的那一篇</p>
          <h1>文章</h1>
        </div>
      </FrontSceneBanner>
      <main className="front-container front-list__body">
        <section className="front-article-filters" aria-label="文章筛选">
          <label className="filter-search">
            <Search />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') update({ keyword })
              }}
              placeholder="搜索标题或摘要"
            />
          </label>
          <select
            aria-label="年份"
            value={filters.year ?? ''}
            onChange={(event) =>
              update({
                year: event.target.value
                  ? Number(event.target.value)
                  : undefined,
                month: undefined,
              })
            }
          >
            <option value="">年份</option>
            {years.map((year) => (
              <option key={year.year} value={year.year}>
                {year.year}
              </option>
            ))}
          </select>
          <select
            aria-label="月份"
            value={filters.month ?? ''}
            disabled={!filters.year}
            onChange={(event) =>
              update({
                month: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
          >
            <option value="">月份</option>
            {months.map((month) => (
              <option key={month.month} value={month.month}>
                {month.month} 月
              </option>
            ))}
          </select>
          <button
            className="front-button front-button--quiet filter-tags"
            type="button"
            onClick={() => setTagOpen(true)}
          >
            <SlidersHorizontal />
            更多标签
          </button>
        </section>
        <div className="filter-summary">
          <span>
            当前：
            {filters.categoryId
              ? categories.data?.find((item) => item.id === filters.categoryId)
                  ?.name || `分类 ${filters.categoryId}`
              : '全部文章'}
          </span>
          {filters.keyword ? (
            <button type="button" onClick={() => update({ keyword: '' })}>
              关键词：{filters.keyword} <X />
            </button>
          ) : null}
          {filters.tagIds.map((id) => {
            const tag = tags.data?.find((item) => item.id === id)
            return (
              <button
                key={id}
                type="button"
                onClick={() =>
                  update({
                    tagIds: filters.tagIds.filter((value) => value !== id),
                  })
                }
              >
                标签：{tag?.name || id} <X />
              </button>
            )
          })}
          <button
            type="button"
            onClick={() =>
              setParams(setSearchParams, normalizePublicArticleFilters({}))
            }
          >
            清空条件
          </button>
        </div>
        <section ref={resultRef} className="article-results" aria-live="polite">
          {articles.isLoading ? <LoadingState title="文章正在抵达" /> : null}
          {articles.isError ? (
            <ErrorState onRetry={() => void articles.refetch()} />
          ) : null}
          {articles.isSuccess && articles.data.list.length === 0 ? (
            <div className="front-empty">
              <h2>没有匹配的文章</h2>
              <p>保留你的条件，换一个关键词或清空筛选再试。</p>
            </div>
          ) : null}
          {articles.data?.list.map((article, index) => (
            <Link
              className={`article-result ${index % 2 ? 'is-reverse' : ''}`}
              key={article.id}
              to={`/articles/${article.id}`}
            >
              <div className="article-result__copy">
                <div className="article-result__heading">
                  <h2>{article.title}</h2>
                  <FrontArticleBadges
                    isTop={article.isTop}
                    isRecommend={article.isRecommend}
                  />
                </div>
                <p>
                  {article.summary || '这篇文章还没有摘要，进入正文看看吧。'}
                </p>
                <FrontArticleMeta {...article} />
              </div>
              <div className="article-result__image">
                <FrontArticleImage src={article.coverUrl} alt={article.title} />
              </div>
            </Link>
          ))}
        </section>
        {articles.data && articles.data.pages > 1 ? (
          <nav className="pagination" aria-label="文章分页">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => updatePage(filters.page - 1)}
              aria-label="上一页"
            >
              <ChevronLeft />
            </button>
            {Array.from(
              { length: articles.data.pages },
              (_, index) => index + 1,
            )
              .slice(0, 7)
              .map((page) => (
                <button
                  className={page === filters.page ? 'is-active' : ''}
                  type="button"
                  key={page}
                  onClick={() => updatePage(page)}
                >
                  {page}
                </button>
              ))}
            <button
              type="button"
              disabled={filters.page >= articles.data.pages}
              onClick={() => updatePage(filters.page + 1)}
              aria-label="下一页"
            >
              <ChevronRight />
            </button>
          </nav>
        ) : null}
      </main>
      <TagDialog
        open={tagOpen}
        tags={tags.data ?? []}
        selected={filters.tagIds}
        onClose={() => setTagOpen(false)}
        onChange={(ids) => update({ tagIds: ids })}
      />
    </div>
  )
}
