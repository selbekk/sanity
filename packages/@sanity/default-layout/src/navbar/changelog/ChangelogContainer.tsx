import React, {useCallback, useMemo, useState} from 'react'
import {useModuleStatus} from '@sanity/base/hooks'
import {PackageIcon} from '@sanity/icons'
import {DialogProps} from '@sanity/ui'
import {StatusButton} from '../components'
import {ChangelogDialog, UpgradeAccordion} from '../../update'

declare const __DEV__: boolean

export function ChangelogContainer() {
  const [open, setOpen] = useState<boolean>(false)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const {value, error, isLoading} = useModuleStatus()
  const {changelog, currentVersion, latestVersion, isUpToDate} = value || {}

  const handleToggleOpen = useCallback(
    () =>
      setOpen((prev) => {
        if (prev) {
          buttonElement?.focus()
        }

        return !prev
      }),
    [buttonElement]
  )

  const dialogProps: Omit<DialogProps, 'id'> = useMemo(
    () => ({
      footer: <UpgradeAccordion defaultOpen={__DEV__} />,
      onClickOutside: handleToggleOpen,
      onClose: handleToggleOpen,
      scheme: 'light',
    }),
    [handleToggleOpen]
  )

  if (error || isLoading || isUpToDate) {
    return null
  }

  return (
    <>
      <StatusButton
        icon={PackageIcon}
        mode="bleed"
        onClick={handleToggleOpen}
        ref={setButtonElement}
        selected={open}
        statusTone="primary"
      />
      {open && (
        <ChangelogDialog
          changelog={changelog}
          currentVersion={currentVersion}
          dialogProps={dialogProps}
          latestVersion={latestVersion}
        />
      )}
    </>
  )
}
