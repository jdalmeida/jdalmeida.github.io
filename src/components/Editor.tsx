'use client'

import { useEffect, useState } from 'react'
import '@mdxeditor/editor/style.css'
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  MDXEditorProps,
} from '@mdxeditor/editor'

export interface EditorProps {
  markdown: string
  onChange: (markdown: string) => void
}

export default function Editor({ markdown, onChange }: EditorProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <MDXEditor
      className={isDark ? 'dark-theme dark-editor' : ''}
      markdown={markdown}
      onChange={onChange}
      contentEditableClassName="prose prose-lg dark:prose-invert max-w-none focus:outline-none"
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin(),
        tablePlugin(),
        codeBlockPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <BlockTypeSelect />
              <CreateLink />
            </>
          )
        })
      ]}
    />
  )
}
