import {useTimeAgo} from '@sanity/base/hooks'
import {Chunk} from '@sanity/field/diff'
import {SelectIcon} from '@sanity/icons'
import {useClickOutside, Button, Popover, useGlobalKeyDown} from '@sanity/ui'
import {upperFirst} from 'lodash'
import React, {useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useDocumentPane} from '../useDocumentPane'
import {sinceTimelineProps, revTimelineProps, formatTimelineEventLabel} from './helpers'
import {Timeline} from './timeline'

interface TimelineMenuProps {
  chunk: Chunk | null
  mode: 'rev' | 'since'
}

const Root = styled(Popover)`
  & > div {
    display: flex;
    flex-direction: column;

    & > [data-ui='Card'] {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;

      /* This is the scrollable container rendered by <Timeline /> */
      & > div {
        flex: 1;
        min-height: 0;
      }
    }
  }
`

export function TimelineMenu({chunk, mode}: TimelineMenuProps) {
  const {historyController, setTimelineRange, setTimelineMode, timeline, ready} = useDocumentPane()
  const [open, setOpen] = useState(false)
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null)
  const [menuContent, setMenuContent] = useState<HTMLDivElement | null>(null)

  const handleOpen = useCallback(() => {
    setTimelineMode(mode)
    setOpen(true)
  }, [mode, setTimelineMode])

  const handleClose = useCallback(() => {
    setTimelineMode('closed')
    setOpen(false)
  }, [setTimelineMode])

  const handleClickOutside = useCallback(() => {
    handleClose()
  }, [handleClose])

  useClickOutside(handleClickOutside, [menuContent, buttonRef])
  useGlobalKeyDown((e) => {
    if (e.key === 'Escape' && open) {
      handleClose()
      buttonRef?.focus()
    }
  })

  const selectRev = useCallback(
    (revChunk: Chunk) => {
      const [sinceId, revId] = historyController.findRangeForNewRev(revChunk)
      setTimelineMode('closed')
      setOpen(false)
      setTimelineRange(sinceId, revId)
    },
    [historyController, setTimelineMode, setTimelineRange]
  )

  const selectSince = useCallback(
    (sinceChunk: Chunk) => {
      const [sinceId, revId] = historyController.findRangeForNewSince(sinceChunk)
      setTimelineMode('closed')
      setOpen(false)
      setTimelineRange(sinceId, revId)
    },
    [historyController, setTimelineMode, setTimelineRange]
  )

  const loadMoreHistory = useCallback(
    (state: boolean) => {
      historyController.setLoadMore(state)
    },
    [historyController]
  )

  const content = open && (
    <div ref={setMenuContent}>
      {mode === 'rev' ? (
        <Timeline
          onSelect={selectRev}
          onLoadMore={loadMoreHistory}
          timeline={timeline}
          {...revTimelineProps(historyController.realRevChunk)}
        />
      ) : (
        <Timeline
          onSelect={selectSince}
          onLoadMore={loadMoreHistory}
          timeline={timeline}
          {...sinceTimelineProps(historyController.sinceTime!, historyController.realRevChunk)}
        />
      )}
    </div>
  )

  const timeAgo = useTimeAgo(chunk?.endTimestamp || '', {agoSuffix: true})

  const revLabel = useMemo(
    () =>
      chunk ? `${upperFirst(formatTimelineEventLabel(chunk.type))} ${timeAgo}` : 'Current version',
    [chunk, timeAgo]
  )

  const sinceLabel = useMemo(
    () =>
      chunk ? `Since ${formatTimelineEventLabel(chunk.type)} ${timeAgo}` : 'Since unknown version',
    [chunk, timeAgo]
  )

  const openLabel = useMemo(() => (mode === 'rev' ? 'Select version' : 'Review changes since'), [
    mode,
  ])

  const buttonLabel = useMemo(() => (mode === 'rev' ? revLabel : sinceLabel), [
    mode,
    revLabel,
    sinceLabel,
  ])

  return (
    <Root
      constrainSize
      content={content}
      data-ui="versionMenu"
      open={open}
      portal
      referenceElement={buttonRef}
    >
      <Button
        disabled={!ready}
        mode="bleed"
        fontSize={1}
        padding={2}
        iconRight={SelectIcon}
        onClick={open ? handleClose : handleOpen}
        ref={setButtonRef}
        selected={open}
        text={open ? openLabel : buttonLabel}
      />
    </Root>
  )
}
