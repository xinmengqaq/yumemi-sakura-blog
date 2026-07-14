import { ArrowRight, Clock3, RotateCw, TrainFront } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  FrontArticleBadges,
  FrontArticleImage,
  FrontArticleMeta,
} from '@/components/front/article'
import { frontSite } from '@/config/frontSite'
import { FrontSceneBanner } from '@/components/front/layout/FrontSceneBanner'
import { usePublicHomeQuery } from '@/queries/publicContent'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'

export const HomeView = () => {
  const home = usePublicHomeQuery()
  const [line, setLine] = useState(0)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const greeting =
    now.getHours() < 12
      ? '早安，下一站是春天'
      : now.getHours() < 18
        ? '午后好，慢慢走就好'
        : '晚上好，欢迎回到站台'
  const featured = home.data?.featuredArticles ?? []
  const latest = home.data?.latestArticles ?? []
  const noArticles =
    home.isSuccess && featured.length === 0 && latest.length === 0
  const time = useMemo(
    () =>
      now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    [now],
  )

  return (
    <div className="front-home">
      <FrontSceneBanner
        className="station-hero"
        stationLabel={frontSite.stationFallback}
      >
        <div className="front-container station-hero__content">
          <p className="station-hero__kicker">个人文字站台 · PUBLIC JOURNAL</p>
          <h1>{frontSite.name}</h1>
          <p>{frontSite.welcome}</p>
          <div className="station-hero__widgets">
            <div className="station-board">
              <Clock3 aria-hidden="true" />
              <strong>{time}</strong>
              <span>{greeting}</span>
            </div>
            <button
              className="station-sign"
              type="button"
              onClick={() =>
                setLine((value) => (value + 1) % frontSite.stationLines.length)
              }
            >
              <span>{frontSite.stationLines[line]}</span>
              <RotateCw aria-hidden="true" />
            </button>
          </div>
        </div>
        <TrainFront className="station-train" aria-hidden="true" />
      </FrontSceneBanner>

      <main className="front-container front-home__body">
        {home.isLoading ? (
          <LoadingState title="列车进站中" description="正在读取公开文章。" />
        ) : null}
        {home.isError ? (
          <ErrorState
            title="站台暂时没有回应"
            onRetry={() => void home.refetch()}
          />
        ) : null}
        {noArticles ? (
          <div className="front-empty">
            <h2>今天还没有文章抵达</h2>
            <p>等一等，新的文字会沿着轨道过来。</p>
          </div>
        ) : null}
        {home.isSuccess && featured.length > 0 ? (
          <section className="home-featured">
            <h2 className="front-section-title">
              本期精选 <small>精选</small>
            </h2>
            <div className="home-featured__grid">
              <Link
                className="home-featured__lead"
                to={`/articles/${featured[0].id}`}
              >
                <div className="home-featured__lead-image">
                  <FrontArticleImage
                    src={featured[0].coverUrl}
                    alt={featured[0].title}
                  />
                </div>
                <div className="home-featured__copy">
                  <div>
                    <h3>{featured[0].title}</h3>
                    <FrontArticleBadges
                      isTop={featured[0].isTop}
                      isRecommend={featured[0].isRecommend}
                    />
                  </div>
                  <p>
                    {featured[0].summary ||
                      '沿着春天的铁轨，读一段慢慢抵达的文字。'}
                  </p>
                  <FrontArticleMeta {...featured[0]} showCategory={false} />
                </div>
              </Link>
              <div className="home-featured__rail">
                {featured.slice(1, 4).map((article) => (
                  <Link
                    key={article.id}
                    to={`/articles/${article.id}`}
                    className="home-featured__minor"
                  >
                    <div className="home-featured__minor-image">
                      <FrontArticleImage
                        src={article.coverUrl}
                        alt={article.title}
                      />
                    </div>
                    <div className="home-featured__minor-copy">
                      <h3>{article.title}</h3>
                      <FrontArticleMeta {...article} showCategory={false} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        {home.isSuccess && latest.length > 0 ? (
          <section className="home-latest">
            <h2 className="front-section-title">最近抵达</h2>
            <div className="home-latest__list">
              {latest.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/articles/${article.id}`}
                  className={`home-latest__row ${index % 2 ? 'is-reverse' : ''}`}
                >
                  <div className="home-latest__image">
                    <FrontArticleImage
                      src={article.coverUrl}
                      alt={article.title}
                    />
                  </div>
                  <div className="home-latest__copy">
                    <h3>{article.title}</h3>
                    <p>
                      {article.summary ||
                        '把沿途的风景写下来，留给下一站的自己。'}
                    </p>
                    <FrontArticleMeta {...article} showCategory={false} />
                  </div>
                </Link>
              ))}
            </div>
            <Link className="home-latest__all front-link" to="/articles">
              查看全部文章 <ArrowRight aria-hidden="true" />
            </Link>
          </section>
        ) : null}
      </main>
    </div>
  )
}
