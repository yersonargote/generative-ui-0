'use client'

import { Editor } from '@monaco-editor/react'
import { useRef, useState } from 'react'

interface Props {
  code: string
  language: string
}

export function CodeEditor({ code, language }: Props) {
  const editorRef = useRef()
  const [value, setValue] = useState<string>('')

  const onMount = (editor: any) => {
    editorRef.current = editor
    editor.focus()
  }
  return (
    <Editor
      height="20vh"
      theme="vs-dark"
      defaultLanguage={language}
      onMount={onMount}
      defaultValue={code}
      value={value}
      onChange={value => setValue(value ? value : '')}
    />
  )
}
