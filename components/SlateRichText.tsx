import React, { useCallback, useMemo, useState } from 'react'
import isHotkey from 'is-hotkey'
import { Editable, withReact, useSlate, Slate } from 'slate-react'
import { Editor, Transforms, createEditor, Descendant, Element as SlateElement } from 'slate'
import { withHistory } from 'slate-history'
import { Button, Icon, Toolbar } from './SlateComponents.tsx'

import { fade, makeStyles, useTheme } from '@material-ui/core/styles'
import { green } from '@material-ui/core/colors'
import Grid from '@material-ui/core/Grid'
import IconButton from '@material-ui/core/IconButton'
import FormatBoldIcon from '@material-ui/icons/FormatBold'
import FormatItalicIcon from '@material-ui/icons/FormatItalic'
import FormatUnderlinedIcon from '@material-ui/icons/FormatUnderlined'
import CodeIcon from '@material-ui/icons/Code'
import FormatColorFillIcon from '@material-ui/icons/FormatColorFill'
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown'
import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import FormatSizeIcon from '@material-ui/icons/FormatSize'
import FormatQuoteIcon from '@material-ui/icons/FormatQuote'
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered'
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted'
import Filter1Icon from '@material-ui/icons/Filter1'
import Filter2Icon from '@material-ui/icons/Filter2'

const useStyles = makeStyles(theme => ({
  editable: {
    backgroundColor: green[500],
    '&:hover': {
      backgroundColor: green[700],
    },
    border: '1px solid red',
  },
}))

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']

const RichTextExample = () => {
  const [value, setValue] = useState<Descendant[]>(initialValue)
  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const [formats, setFormats] = React.useState(() => ['bold', 'italic'])
  const classes = useStyles()

  const handleFormat = (event, newFormats) => {
    setFormats(newFormats)
    console.log(newFormats)
  }

  return (
    <Slate editor={editor} value={value} onChange={value => setValue(value)}>
      <ToggleButtonGroup size='large' style={{ borderRadius: 2 }}>
        <MarkToggleButton format='bold' icon={<FormatBoldIcon />} />
        <MarkToggleButton format='italic' icon={<FormatItalicIcon />} />
        <MarkToggleButton format='underline' icon={<FormatUnderlinedIcon />} />
        <MarkToggleButton format='code' icon={<CodeIcon />} />
        <BlockToggleButton format='heading-one' icon={<Filter1Icon />} />
        <BlockToggleButton format='heading-two' icon={<Filter2Icon />} />
        <BlockToggleButton format='block-quote' icon={<FormatQuoteIcon />} />
        <BlockToggleButton format='numbered-list' icon={<FormatListNumberedIcon />} />
        <BlockToggleButton format='bulleted-list' icon={<FormatListBulletedIcon />} />
      </ToggleButtonGroup>
      <Editable
        style={{ border: '1px solid #CCC', padding: 5 }}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder='Enter some rich text…'
        spellCheck
        autoFocus
        onKeyDown={event => {
          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event as any)) {
              event.preventDefault()
              const mark = HOTKEYS[hotkey]
              toggleMark(editor, mark)
            }
          }
        }}
      />
    </Slate>
  )
}

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n => LIST_TYPES.includes(!Editor.isEditor(n) && SlateElement.isElement(n) && n.type),
    split: true,
  })
  const newProperties: Partial<SlateElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  }
  Transforms.setNodes(editor, newProperties)

  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  })

  return !!match
}

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'block-quote':
      return (
        <blockquote class='slate-blockquote' {...attributes}>
          {children}
        </blockquote>
      )
    case 'bulleted-list':
      return (
        <ul class='slate-ul' {...attributes}>
          {children}
        </ul>
      )
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'numbered-list':
      return (
        <ol class='slate-ol' {...attributes}>
          {children}
        </ol>
      )
    default:
      return <p {...attributes}>{children}</p>
  }
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = <code>{children}</code>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}

const BlockToggleButton = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <ToggleButton
      style={{ borderRadius: 0 }}
      selected={isBlockActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      {icon}
    </ToggleButton>
  )
}
const MarkToggleButton = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <ToggleButton
      style={{ borderRadius: 0 }}
      selected={isMarkActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      {icon}
    </ToggleButton>
  )
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      { text: 'This is editable ' },
      { text: 'rich', bold: true },
      { text: ' text, ' },
      { text: 'much', italic: true },
      { text: ' better than a ' },
      { text: '<textarea>', code: true },
      { text: '!' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: "Since it's rich text, you can do things like turn a selection of text ",
      },
      { text: 'bold', bold: true },
      {
        text: ', or add a semantically rendered block quote in the middle of the page, like this:',
      },
    ],
  },
  {
    type: 'block-quote',
    children: [{ text: 'A wise quote.' }],
  },
  {
    type: 'paragraph',
    children: [{ text: 'Try it out for yourself!' }],
  },
]

export default RichTextExample
