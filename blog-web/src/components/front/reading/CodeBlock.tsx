import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { copyText } from '@/utils/clipboard'

export const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await copyText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="reading-code">
      <pre>
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? '已复制' : '复制代码'}
        title={copied ? '已复制' : '复制代码'}
      >
        {copied ? <Check /> : <Copy />}
      </button>
    </div>
  )
}
