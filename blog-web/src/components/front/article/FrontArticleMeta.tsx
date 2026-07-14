import { CalendarDays, Eye, Heart, MessageCircle, Tag } from 'lucide-react'

type Props = {
  publishedAt?: string | null
  categoryName?: string | null
  viewCount?: number | null
  commentCount?: number | null
  likeCount?: number | null
  showCategory?: boolean
}

const date = (value?: string | null) => {
  if (!value) return '未发布'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? '未发布'
    : parsed.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
}

export const FrontArticleMeta = ({
  publishedAt,
  categoryName,
  viewCount,
  commentCount,
  likeCount,
  showCategory = true,
}: Props) => (
  <div className="front-meta">
    {showCategory && categoryName ? (
      <span>
        <Tag aria-hidden="true" />
        {categoryName}
      </span>
    ) : null}
    <span>
      <CalendarDays aria-hidden="true" />
      {date(publishedAt)}
    </span>
    {viewCount != null ? (
      <span>
        <Eye aria-hidden="true" />
        {viewCount.toLocaleString()}
      </span>
    ) : null}
    {commentCount != null ? (
      <span>
        <MessageCircle aria-hidden="true" />
        {commentCount.toLocaleString()}
      </span>
    ) : null}
    {likeCount != null ? (
      <span>
        <Heart aria-hidden="true" />
        {likeCount.toLocaleString()}
      </span>
    ) : null}
  </div>
)
