import { ArrowLeft, ArrowUp, Heart, List, Settings2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  FrontArticleBadges,
  FrontArticleImage,
  FrontArticleMeta,
} from '@/components/front/article'
import { ArticleContent } from '@/components/front/reading/articleContent'
import { parseArticleContent } from '@/components/front/reading/articleContentModel'
import {
  getLikeErrorMessage,
  getScrollBehavior,
} from '@/utils/publicArticleInteraction'
import {
  useReadingPreferences,
  readingPreferenceStyles,
  type ReadingPreferences,
} from '@/hooks/front/readingPreferences'
import { useReadingProgress } from '@/hooks/front/readingProgress'
import {
  useLikePublicArticleMutation,
  usePublicArticleDetailQuery,
} from '@/queries/publicContent'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { FrontSceneBanner } from '@/components/front/layout/FrontSceneBanner'

const ReadingSettings = ({
  preferences,
  update,
  showTitle = false,
}: {
  preferences: ReadingPreferences
  update: (next: Partial<ReadingPreferences>) => void
  showTitle?: boolean
}) => (
  <div className="reading-settings">
    {showTitle ? <h3>阅读设置</h3> : null}
    <label>
      字号
      <span>
        <button
          type="button"
          onClick={() =>
            update({ fontSize: Math.max(15, preferences.fontSize - 1) })
          }
        >
          A-
        </button>
        <b>{preferences.fontSize}</b>
        <button
          type="button"
          onClick={() =>
            update({ fontSize: Math.min(21, preferences.fontSize + 1) })
          }
        >
          A+
        </button>
      </span>
    </label>
    <label>
      行高
      <span>
        {[1.7, 1.9, 2.1].map((lineHeight) => (
          <button
            type="button"
            className={preferences.lineHeight === lineHeight ? 'is-active' : ''}
            key={lineHeight}
            onClick={() => update({ lineHeight })}
          >
            {lineHeight === 1.7 ? '紧凑' : lineHeight === 1.9 ? '标准' : '舒展'}
          </button>
        ))}
      </span>
    </label>
    <label>
      正文宽度
      <span>
        {[660, 720, 800].map((contentWidth) => (
          <button
            type="button"
            className={
              preferences.contentWidth === contentWidth ? 'is-active' : ''
            }
            key={contentWidth}
            onClick={() => update({ contentWidth })}
          >
            {contentWidth === 660 ? '窄' : contentWidth === 720 ? '标准' : '宽'}
          </button>
        ))}
      </span>
    </label>
  </div>
)

const Toc = ({
  headings,
  progress,
  activeId,
  preferences,
  update,
  onBackTop,
}: {
  headings: { id: string; level: 2 | 3; text: string }[]
  progress: number
  activeId: string
  preferences: ReadingPreferences
  update: (next: Partial<ReadingPreferences>) => void
  onBackTop: () => void
}) => (
  <aside className="reading-rail">
    <h2>文章目录</h2>
    <div className="reading-toc">
      {headings.map((heading) => (
        <a
          className={`reading-toc__item reading-toc__item--${heading.level} ${activeId === heading.id ? 'is-active' : ''}`}
          key={heading.id}
          href={`#${heading.id}`}
        >
          {heading.text}
        </a>
      ))}
    </div>
    <div className="reading-progress">
      <div>
        <span>阅读进度</span>
        <strong>{Math.round(progress)}%</strong>
      </div>
      <span className="reading-progress__track">
        <i style={{ width: `${progress}%` }} />
      </span>
    </div>
    <ReadingSettings preferences={preferences} update={update} showTitle />
    <button className="reading-back-top" type="button" onClick={onBackTop}>
      <ArrowUp />
      返回顶部
    </button>
  </aside>
)

export const ArticleDetailView = () => {
  const { id: rawId } = useParams()
  const id = Number(rawId)
  const valid = Number.isInteger(id) && id > 0
  const article = usePublicArticleDetailQuery(id, { enabled: valid })
  const contentRef = useRef<HTMLElement>(null)
  const progress = useReadingProgress(contentRef)
  const { preferences, update } = useReadingPreferences()
  const like = useLikePublicArticleMutation()
  const [likeError, setLikeError] = useState('')
  const [activeId, setActiveId] = useState('')
  const [mobilePanel, setMobilePanel] = useState<'toc' | 'settings' | null>(
    null,
  )
  const parsed = useMemo(
    () => parseArticleContent(article.data?.content ?? '', article.data?.title),
    [article.data?.content, article.data?.title],
  )
  useEffect(() => {
    setLikeError('')
  }, [id])
  useEffect(() => {
    if (!parsed.headings.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0]
        if (current) setActiveId(current.target.id)
      },
      { rootMargin: '-15% 0px -65% 0px' },
    )
    parsed.headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [parsed.headings])
  if (!valid)
    return (
      <div className="front-container detail-state">
        <ErrorState title="文章地址无效" />
      </div>
    )
  if (article.isLoading)
    return (
      <div className="front-container detail-state">
        <LoadingState title="正在打开文章" />
      </div>
    )
  if (article.isError || !article.data)
    return (
      <div className="front-container detail-state">
        <ErrorState
          title="这篇文章暂时无法公开阅读"
          onRetry={() => void article.refetch()}
        />
      </div>
    )
  const data = article.data
  const submitLike = async () => {
    setLikeError('')
    try {
      await like.mutateAsync(id)
    } catch (error) {
      setLikeError(getLikeErrorMessage(error))
    }
  }
  const backToTop = () =>
    window.scrollTo({
      top: 0,
      behavior: getScrollBehavior(
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      ),
    })
  return (
    <div className="front-detail">
      <FrontSceneBanner
        className="detail-banner"
        media={
          data.coverUrl ? (
            <FrontArticleImage src={data.coverUrl} alt={data.title} />
          ) : (
            <div
              className="detail-banner__placeholder"
              role="img"
              aria-label={`${data.title}图片占位`}
            />
          )
        }
      />
      <div className="front-container detail-body">
        <Link to="/articles" className="detail-back">
          <ArrowLeft />
          返回文章列表
        </Link>
        <div className="detail-layout">
          <article
            ref={contentRef}
            className="detail-article"
            style={readingPreferenceStyles(preferences)}
          >
            <div className="detail-kicker">
              {data.categoryName || '沿途随笔'}{' '}
              <FrontArticleBadges
                isTop={data.isTop}
                isRecommend={data.isRecommend}
              />
            </div>
            <h1>{data.title}</h1>
            <FrontArticleMeta {...data} />
            <div className="detail-tags">
              {data.tags.map((tag) => (
                <span key={tag.id}>{tag.name}</span>
              ))}
            </div>
            {data.content ? (
              <ArticleContent parsed={parsed} />
            ) : (
              <p className="detail-empty">这篇文章还没有正文。</p>
            )}
            <div className="detail-like">
              <button
                className="like-button"
                type="button"
                disabled={like.isPending}
                onClick={() => void submitLike()}
              >
                <Heart />
                {like.isSuccess ? '已喜欢' : '喜欢'}{' '}
                <strong>{like.data?.likeCount ?? data.likeCount ?? 0}</strong>
              </button>
              {likeError ? <span role="alert">{likeError}</span> : null}
            </div>
          </article>
          <Toc
            headings={parsed.headings}
            progress={progress}
            activeId={activeId}
            preferences={preferences}
            update={update}
            onBackTop={backToTop}
          />
        </div>
      </div>
      <div className="detail-toolbar">
        <button
          type="button"
          onClick={() => setMobilePanel('toc')}
          aria-label="打开文章目录"
          title="文章目录"
        >
          <List />
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel('settings')}
          aria-label="打开阅读设置"
          title="阅读设置"
        >
          <Settings2 />
        </button>
        <button type="button" onClick={backToTop} aria-label="返回顶部">
          <ArrowUp />
        </button>
      </div>
      {mobilePanel ? (
        <div className="mobile-reading-panel">
          <button
            className="mobile-reading-panel__backdrop"
            type="button"
            aria-label="关闭阅读面板"
            onClick={() => setMobilePanel(null)}
          />
          <div className="mobile-reading-panel__sheet">
            <header>
              <strong>{mobilePanel === 'toc' ? '文章目录' : '阅读设置'}</strong>
              <button
                type="button"
                onClick={() => setMobilePanel(null)}
                aria-label="关闭"
              >
                <X />
              </button>
            </header>
            {mobilePanel === 'toc' ? (
              <nav className="mobile-toc">
                {parsed.headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    onClick={() => setMobilePanel(null)}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            ) : (
              <ReadingSettings preferences={preferences} update={update} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
