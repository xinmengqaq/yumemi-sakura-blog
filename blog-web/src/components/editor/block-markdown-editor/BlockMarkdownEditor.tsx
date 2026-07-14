import { Keyboard, Plus } from 'lucide-react'
import {
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import { CodeBlock } from './blocks/CodeBlock'
import { DividerBlock } from './blocks/DividerBlock'
import { HeadingBlock } from './blocks/HeadingBlock'
import { ImageBlock } from './blocks/ImageBlock'
import { ListBlock } from './blocks/ListBlock'
import { ParagraphBlock } from './blocks/ParagraphBlock'
import { QuoteBlock } from './blocks/QuoteBlock'
import { TableBlock } from './blocks/TableBlock'
import {
  convertBlockType,
  createBlockByType,
  duplicateBlock,
  exitListItem,
  insertBlockAfter,
  moveBlock,
  removeBlock,
  updateBlock,
} from './core/commands'
import { createParagraphBlock, isBlockEmpty } from './core/blockModel'
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from './core/history'
import { parseMarkdownToBlocks } from './markdown/parseMarkdown'
import { serializeBlocksToMarkdown } from './markdown/serializeMarkdown'
import {
  BlockInsertMenu,
  type BlockInsertChoice,
} from './toolbars/BlockInsertMenu'
import { BlockToolbar } from './toolbars/BlockToolbar'
import { ShortcutDrawer } from './toolbars/ShortcutDrawer'
import { TextToolbar } from './toolbars/TextToolbar'
import type { BlockMarkdownEditorProps, EditorBlock } from './types'
import {
  clearSelectionFormatting,
  commitEditorSelection,
  getEditorSelection,
  normalizeEditorLink,
  removeSelectionLink,
  resolveEditorSelection,
  setSelectionLink,
  setSelectionStyle,
  toggleInlineTag,
  type EditorSelection,
} from './utils/dom'
import { getMarkdownBlockShortcut } from './utils/keyboard'
import { getClipboardBlocks } from './utils/clipboard'
import './blockMarkdownEditor.css'

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(' ')

export const BlockMarkdownEditor = ({
  value,
  onChange,
  readOnly = false,
  placeholder = '输入正文，或按 / 插入内容块',
  className,
  onSaveShortcut,
}: BlockMarkdownEditorProps) => {
  const [blocks, setBlocks] = useState(() => parseMarkdownToBlocks(value))
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null)
  const [toolbarBlockId, setToolbarBlockId] = useState<string | null>(null)
  const [shortcutDrawerOpen, setShortcutDrawerOpen] = useState(false)
  const [textSelection, setTextSelection] = useState<EditorSelection | null>(
    null,
  )
  const editorRef = useRef<HTMLDivElement>(null)
  const blocksRef = useRef(blocks)
  const historyRef = useRef(createHistory(blocks))
  const focusedRef = useRef(false)
  const lastEmittedValue = useRef<string | null>(null)

  useEffect(() => {
    if (value === lastEmittedValue.current || focusedRef.current) {
      return
    }
    const parsed = parseMarkdownToBlocks(value)
    blocksRef.current = parsed
    historyRef.current = createHistory(parsed)
    setBlocks(parsed)
  }, [value])

  useEffect(() => {
    if (readOnly) {
      setTextSelection(null)
      return
    }
    const updateTextSelection = () => {
      const next = getEditorSelection(editorRef.current)
      setTextSelection(next)
      if (next) {
        setInsertAfterId(null)
        setToolbarBlockId(null)
      }
    }
    document.addEventListener('selectionchange', updateTextSelection)
    return () =>
      document.removeEventListener('selectionchange', updateTextSelection)
  }, [readOnly])

  const emit = (next: EditorBlock[]) => {
    blocksRef.current = next
    setBlocks(next)
    const markdown = serializeBlocksToMarkdown(next)
    lastEmittedValue.current = markdown
    onChange(markdown)
  }

  const commit = (next: EditorBlock[]) => {
    historyRef.current = pushHistory(historyRef.current, next)
    emit(next)
  }

  const applyHistory = (direction: 'undo' | 'redo') => {
    const current = historyRef.current
    const next =
      direction === 'undo' ? undoHistory(current) : redoHistory(current)
    if (next === current) return
    historyRef.current = next
    emit(next.present)
  }

  const replaceBlock = (block: EditorBlock) => {
    commit(updateBlock(blocksRef.current, block.id, block))
  }

  const focusBlock = (blockId: string) => {
    requestAnimationFrame(() => {
      Array.from(
        editorRef.current?.querySelectorAll<HTMLElement>('[data-block-id]') ??
          [],
      )
        .find((element) => element.dataset.blockId === blockId)
        ?.querySelector<HTMLElement>('[data-editor-input]')
        ?.focus()
    })
  }

  const insertBlock = (choice: BlockInsertChoice) => {
    if (!insertAfterId) {
      return
    }
    let block = createBlockByType(choice.type)
    if (block.type === 'heading' && choice.level) {
      block = { ...block, level: choice.level }
    }
    commit(insertBlockAfter(blocksRef.current, insertAfterId, block))
    setInsertAfterId(null)
    focusBlock(block.id)
  }

  const insertToolbarBlock = (blockId: string, type: EditorBlock['type']) => {
    const block = createBlockByType(type)
    commit(insertBlockAfter(blocksRef.current, blockId, block))
    focusBlock(block.id)
  }

  const convertToolbarBlock = (blockId: string, choice: BlockInsertChoice) => {
    let next = convertBlockType(blocksRef.current, blockId, choice.type)
    if (choice.type === 'heading' && choice.level) {
      next = updateBlock(next, blockId, { level: choice.level })
    }
    commit(next)
    focusBlock(blockId)
  }

  const moveToolbarBlock = (blockId: string, direction: 'up' | 'down') => {
    commit(moveBlock(blocksRef.current, blockId, direction))
    focusBlock(blockId)
  }

  const duplicateToolbarBlock = (blockId: string) => {
    commit(duplicateBlock(blocksRef.current, blockId))
    focusBlock(blockId)
  }

  const deleteToolbarBlock = (blockId: string) => {
    const current = blocksRef.current
    const index = current.findIndex((block) => block.id === blockId)
    const focusId = current[index + 1]?.id ?? current[index - 1]?.id
    commit(removeBlock(current, blockId))
    if (focusId) {
      focusBlock(focusId)
    }
  }

  const exitListBlockItem = (blockId: string, itemId: string) => {
    const paragraph = createParagraphBlock()
    commit(exitListItem(blocksRef.current, blockId, itemId, paragraph))
    focusBlock(paragraph.id)
  }

  const pasteBlocks = (event: ClipboardEvent<HTMLDivElement>) => {
    if (readOnly) return
    const target = event.target as HTMLElement
    const blockId =
      target.closest<HTMLElement>('[data-block-id]')?.dataset.blockId
    if (!blockId) return
    const pasted = getClipboardBlocks(event.clipboardData)
    if (!pasted.length) return
    event.preventDefault()
    const current = blocksRef.current
    const index = current.findIndex((block) => block.id === blockId)
    if (index < 0) return
    commit([
      ...current.slice(0, index + 1),
      ...pasted,
      ...current.slice(index + 1),
    ])
    focusBlock(pasted[0].id)
  }

  const runTextCommand = (command: (selection: EditorSelection) => void) => {
    if (!textSelection) return
    const currentSelection = resolveEditorSelection(textSelection)
    command(currentSelection)
    commitEditorSelection(currentSelection)
    setTextSelection(null)
  }

  const setTextLink = (value: string) => {
    const href = normalizeEditorLink(value)
    if (!href) return false
    runTextCommand((selection) => setSelectionLink(selection, href))
    return true
  }

  const convertShortcut = (blockId: string, text: string) => {
    const shortcut = getMarkdownBlockShortcut(text)
    if (!shortcut) {
      return
    }
    let next = convertBlockType(blocksRef.current, blockId, shortcut.type)
    if (shortcut.type === 'heading' && shortcut.level) {
      next = updateBlock(next, blockId, { level: shortcut.level, html: '' })
    } else if (shortcut.type !== 'divider') {
      next = updateBlock(next, blockId, { html: '', code: '' })
    }
    commit(next)
    focusBlock(blockId)
  }

  const blockKeyDown =
    (block: EditorBlock) => (event: KeyboardEvent<HTMLElement>) => {
      const modifier = event.ctrlKey || event.metaKey
      if (modifier && !event.altKey && textSelection) {
        const key = event.key.toLowerCase()
        const format =
          key === 'b'
            ? 'strong'
            : key === 'i'
              ? 'em'
              : key === 'u'
                ? 'u'
                : key === 'e'
                  ? 'code'
                  : key === 'x' && event.shiftKey
                    ? 'del'
                    : null
        if (format) {
          event.preventDefault()
          runTextCommand((selection) => toggleInlineTag(selection, format))
          return
        }
        if (key === 'k') {
          event.preventDefault()
          const value = window.prompt('输入链接地址')
          if (value !== null && !setTextLink(value)) {
            window.alert('链接仅支持 http、https、mailto、站内路径或锚点')
          }
          return
        }
      }
      if (
        !readOnly &&
        event.key === '/' &&
        block.type === 'paragraph' &&
        isBlockEmpty(block)
      ) {
        event.preventDefault()
        setInsertAfterId(block.id)
        return
      }
      if (
        !readOnly &&
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        (block.type === 'paragraph' ||
          block.type === 'heading' ||
          block.type === 'quote')
      ) {
        event.preventDefault()
        const paragraph = createParagraphBlock()
        commit(insertBlockAfter(blocksRef.current, block.id, paragraph))
        focusBlock(paragraph.id)
      }
    }

  const editorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return
    if (event.key === 'Escape' && shortcutDrawerOpen) {
      event.preventDefault()
      setShortcutDrawerOpen(false)
      return
    }
    const modifier = event.ctrlKey || event.metaKey
    const key = event.key.toLowerCase()
    if (modifier && key === 's' && !event.altKey && !event.shiftKey) {
      event.preventDefault()
      onSaveShortcut?.()
      return
    }
    if (modifier && !event.altKey && key === 'z') {
      event.preventDefault()
      applyHistory(event.shiftKey ? 'redo' : 'undo')
      return
    }
    if (modifier && !event.altKey && key === 'y' && !event.shiftKey) {
      event.preventDefault()
      applyHistory('redo')
      return
    }
    const target = event.target as HTMLElement
    const blockId =
      target.closest<HTMLElement>('[data-block-id]')?.dataset.blockId
    if (!blockId) return
    if (
      event.altKey &&
      !modifier &&
      (event.key === 'ArrowUp' || event.key === 'ArrowDown')
    ) {
      event.preventDefault()
      commit(
        moveBlock(
          blocksRef.current,
          blockId,
          event.key === 'ArrowUp' ? 'up' : 'down',
        ),
      )
      focusBlock(blockId)
      return
    }
    if (modifier && event.shiftKey && key === 'd' && !event.altKey) {
      event.preventDefault()
      const current = blocksRef.current
      const index = current.findIndex((block) => block.id === blockId)
      const next = duplicateBlock(current, blockId)
      commit(next)
      const duplicateId = next[index + 1]?.id
      if (duplicateId) focusBlock(duplicateId)
      return
    }
    if (modifier && key === 'backspace' && !event.altKey && !event.shiftKey) {
      const block = blocksRef.current.find((item) => item.id === blockId)
      if (block && isBlockEmpty(block)) {
        event.preventDefault()
        deleteToolbarBlock(blockId)
      }
    }
  }

  const renderBlock = (block: EditorBlock) => {
    const onKeyDown = blockKeyDown(block)
    switch (block.type) {
      case 'paragraph':
        return (
          <ParagraphBlock
            block={block}
            placeholder={blocks[0]?.id === block.id ? placeholder : undefined}
            readOnly={readOnly}
            onChange={replaceBlock}
            onKeyDown={onKeyDown}
            onTextChange={(text) => convertShortcut(block.id, text)}
          />
        )
      case 'heading':
        return (
          <HeadingBlock
            block={block}
            readOnly={readOnly}
            onChange={replaceBlock}
            onKeyDown={onKeyDown}
          />
        )
      case 'quote':
        return (
          <QuoteBlock
            block={block}
            readOnly={readOnly}
            onChange={replaceBlock}
            onKeyDown={onKeyDown}
          />
        )
      case 'unordered-list':
      case 'ordered-list':
      case 'task-list':
        return (
          <ListBlock
            block={block}
            readOnly={readOnly}
            onChange={replaceBlock}
            onExitItem={(itemId) => exitListBlockItem(block.id, itemId)}
            onKeyDown={onKeyDown}
          />
        )
      case 'code':
        return (
          <CodeBlock
            block={block}
            readOnly={readOnly}
            onChange={replaceBlock}
          />
        )
      case 'image':
        return (
          <ImageBlock
            block={block}
            readOnly={readOnly}
            onChange={replaceBlock}
          />
        )
      case 'table':
        return (
          <TableBlock
            block={block}
            readOnly={readOnly}
            onChange={replaceBlock}
            onDelete={() => deleteToolbarBlock(block.id)}
            onKeyDown={onKeyDown}
          />
        )
      case 'divider':
        return <DividerBlock />
    }
  }

  return (
    <div
      ref={editorRef}
      aria-label="块状 Markdown 编辑器"
      className={cx(
        'block-editor',
        readOnly && 'block-editor--readonly',
        className,
      )}
      onBlur={() => {
        requestAnimationFrame(() => {
          focusedRef.current = Boolean(
            editorRef.current?.contains(document.activeElement),
          )
        })
      }}
      onFocus={() => {
        focusedRef.current = true
      }}
      onKeyDown={editorKeyDown}
      onPaste={pasteBlocks}
    >
      {!readOnly ? (
        <div className="block-editor__utility-bar">
          <button
            aria-expanded={shortcutDrawerOpen}
            aria-label="打开快捷键概览"
            title="快捷键概览"
            type="button"
            onClick={() => setShortcutDrawerOpen(true)}
          >
            <Keyboard aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <div className="block-editor__document">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className="block-editor__block"
            data-block-id={block.id}
          >
            {!readOnly ? (
              <>
                <BlockToolbar
                  block={block}
                  disableDelete={blocks.length === 1 && isBlockEmpty(block)}
                  disableMoveDown={index === blocks.length - 1}
                  disableMoveUp={index === 0}
                  open={toolbarBlockId === block.id}
                  onClose={() => setToolbarBlockId(null)}
                  onConvert={(choice) => convertToolbarBlock(block.id, choice)}
                  onDelete={() => deleteToolbarBlock(block.id)}
                  onDuplicate={() => duplicateToolbarBlock(block.id)}
                  onInsert={(type) => insertToolbarBlock(block.id, type)}
                  onMove={(direction) => moveToolbarBlock(block.id, direction)}
                  onToggle={() => {
                    setInsertAfterId(null)
                    setTextSelection(null)
                    setToolbarBlockId((current) =>
                      current === block.id ? null : block.id,
                    )
                  }}
                />
                <button
                  aria-expanded={insertAfterId === block.id}
                  aria-label="在此块后插入"
                  className="block-editor__insert-button"
                  title="插入内容块"
                  type="button"
                  onClick={() => {
                    setToolbarBlockId(null)
                    setInsertAfterId((current) =>
                      current === block.id ? null : block.id,
                    )
                  }}
                >
                  <Plus aria-hidden="true" />
                </button>
              </>
            ) : null}
            <div className="block-editor__block-content">
              {renderBlock(block)}
            </div>
            {insertAfterId === block.id ? (
              <BlockInsertMenu
                onClose={() => {
                  setInsertAfterId(null)
                  focusBlock(block.id)
                }}
                onSelect={insertBlock}
              />
            ) : null}
          </div>
        ))}
      </div>
      {!readOnly && textSelection ? (
        <TextToolbar
          selection={textSelection}
          onClearFormat={() => runTextCommand(clearSelectionFormatting)}
          onClose={() => setTextSelection(null)}
          onRemoveLink={() => runTextCommand(removeSelectionLink)}
          onSetLink={setTextLink}
          onSetStyle={(property, color) =>
            runTextCommand((selection) =>
              setSelectionStyle(selection, property, color),
            )
          }
          onToggleFormat={(format) =>
            runTextCommand((selection) => toggleInlineTag(selection, format))
          }
        />
      ) : null}
      {!readOnly && shortcutDrawerOpen ? (
        <ShortcutDrawer onClose={() => setShortcutDrawerOpen(false)} />
      ) : null}
    </div>
  )
}
