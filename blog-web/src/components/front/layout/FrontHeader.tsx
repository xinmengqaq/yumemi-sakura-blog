import { ChevronDown, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import { usePublicCategoriesQuery } from '@/queries/publicContent'

export const FrontHeader = () => {
  const [open, setOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const { pathname } = useLocation()
  const categories = usePublicCategoriesQuery()
  const articleActive = pathname.startsWith('/articles')

  return (
    <header className="front-header">
      <div className="front-header__inner">
        <Link className="front-brand" to="/" onClick={() => setOpen(false)}>
          <span className="front-brand__mark">✦</span>
          <span>春日轨迹</span>
        </Link>
        <button
          className="front-header__menu"
          aria-label={open ? '关闭导航' : '打开导航'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          className={`front-nav ${open ? 'front-nav--open' : ''}`}
          aria-label="前台导航"
        >
          <NavLink
            className={({ isActive }) =>
              `front-nav__link ${isActive ? 'is-active' : ''}`
            }
            to="/"
            onClick={() => setOpen(false)}
          >
            首页
          </NavLink>
          <div
            className={`front-nav__group ${articleActive ? 'is-active' : ''}`}
          >
            <Link
              className="front-nav__link front-nav__link--articles"
              to="/articles"
              onClick={() => setOpen(false)}
            >
              文章 <ChevronDown aria-hidden="true" />
            </Link>
            <button
              className="front-nav__category-toggle"
              aria-label="展开文章分类"
              aria-expanded={categoriesOpen}
              onClick={() => setCategoriesOpen((value) => !value)}
              type="button"
            >
              <ChevronDown aria-hidden="true" />
            </button>
            <div
              className={`front-nav__dropdown ${categoriesOpen ? 'is-open' : ''}`}
            >
              {categories.isError ? (
                <span className="front-nav__dropdown-empty">
                  分类暂时不可用
                </span>
              ) : categories.isLoading ? (
                <span className="front-nav__dropdown-empty">分类加载中</span>
              ) : categories.data?.length ? (
                categories.data.map((category) => (
                  <Link
                    key={category.id}
                    to={`/articles?categoryId=${category.id}`}
                    onClick={() => {
                      setCategoriesOpen(false)
                      setOpen(false)
                    }}
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                <span className="front-nav__dropdown-empty">暂无分类</span>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
