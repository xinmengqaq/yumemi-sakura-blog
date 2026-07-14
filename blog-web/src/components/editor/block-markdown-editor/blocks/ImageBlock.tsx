import { ImageOff } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { ImageBlock as ImageBlockType } from '../types'

type ImageBlockProps = {
  block: ImageBlockType
  readOnly: boolean
  onChange: (block: ImageBlockType) => void
}

export const ImageBlock = ({ block, readOnly, onChange }: ImageBlockProps) => {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [block.url])

  return (
    <figure className="block-editor__image">
      {!block.url || failed ? (
        <div className="block-editor__image-placeholder">
          <ImageOff aria-hidden="true" />
          <span>{failed ? '图片加载失败' : '输入图片 URL'}</span>
          {failed ? <code>{block.url}</code> : null}
        </div>
      ) : (
        <img
          src={block.url}
          alt={block.alt ?? ''}
          onError={() => setFailed(true)}
        />
      )}
      {!readOnly ? (
        <figcaption>
          <input
            aria-label="图片 URL"
            placeholder="https://example.com/image.png"
            value={block.url}
            onChange={(event) =>
              onChange({ ...block, url: event.target.value })
            }
          />
          <input
            aria-label="图片替代文本"
            placeholder="替代文本，可为空"
            value={block.alt ?? ''}
            onChange={(event) =>
              onChange({ ...block, alt: event.target.value })
            }
          />
        </figcaption>
      ) : null}
    </figure>
  )
}
