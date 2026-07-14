import type { ReactNode } from 'react'

import { CodeBlock } from './CodeBlock'
import type {
  ArticleContentNode as Node,
  ParsedArticleContent,
} from './articleContentModel'

const safeUrl = (url?: string) => {
  if (!url) return '#'
  return /^(https?:|mailto:|\/|#)/i.test(url) ? url : '#'
}

const renderNodes = (
  nodes: Node[] = [],
  parsed: ParsedArticleContent,
  path = 'n',
): ReactNode[] =>
  nodes.map((node, index) => {
    const key = `${path}-${index}`
    const children = renderNodes(node.children, parsed, key)
    switch (node.type) {
      case 'text':
        return node.value
      case 'paragraph':
        return <p key={key}>{children}</p>
      case 'heading': {
        const Tag = `h${node.depth}` as 'h1' | 'h2' | 'h3' | 'h4'
        return (
          <Tag id={parsed.headingIds.get(node)} key={key}>
            {children}
          </Tag>
        )
      }
      case 'strong':
        return <strong key={key}>{children}</strong>
      case 'emphasis':
        return <em key={key}>{children}</em>
      case 'delete':
        return <s key={key}>{children}</s>
      case 'inlineCode':
        return <code key={key}>{node.value}</code>
      case 'blockquote':
        return <blockquote key={key}>{children}</blockquote>
      case 'list': {
        const Tag = node.ordered ? 'ol' : 'ul'
        return <Tag key={key}>{children}</Tag>
      }
      case 'listItem':
        return <li key={key}>{children}</li>
      case 'link':
        return (
          <a
            key={key}
            href={safeUrl(node.url)}
            target={node.url?.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
          >
            {children}
          </a>
        )
      case 'image':
        return (
          <img
            key={key}
            src={safeUrl(node.url)}
            alt={node.alt ?? ''}
            loading="lazy"
          />
        )
      case 'code':
        return <CodeBlock key={key} code={node.value ?? ''} />
      case 'thematicBreak':
        return <hr key={key} />
      case 'table':
        return (
          <div className="reading-table" key={key}>
            <table>
              <tbody>{children}</tbody>
            </table>
          </div>
        )
      case 'tableRow':
        return <tr key={key}>{children}</tr>
      case 'tableCell':
        return <td key={key}>{children}</td>
      case 'break':
        return <br key={key} />
      case 'html':
        return null
      default:
        return <span key={key}>{children}</span>
    }
  })

export const ArticleContent = ({
  parsed,
}: {
  parsed: ParsedArticleContent
}) => (
  <div className="reading-content">
    {renderNodes(parsed.root.children as unknown as Node[], parsed)}
  </div>
)
