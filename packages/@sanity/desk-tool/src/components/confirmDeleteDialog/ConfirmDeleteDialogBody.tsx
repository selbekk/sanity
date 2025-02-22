import React from 'react'
import {
  WarningOutlineIcon,
  DocumentsIcon,
  ClipboardIcon,
  UnknownIcon,
  ChevronDownIcon,
} from '@sanity/icons'
import {useToast, Text, Box, Button, Flex, Label, Card} from '@sanity/ui'
import {SanityPreview, SanityDefaultPreview} from '@sanity/base/preview'
import {CopyToClipboard} from 'react-copy-to-clipboard'
import {SchemaType} from '@sanity/types'
import {ReferringDocuments} from './useReferringDocuments'
import {
  ReferencesCard,
  InternalReferences,
  OtherReferenceCount,
  CrossDatasetReferencesDetails,
  CrossDatasetReferencesSummary,
  TableContainer,
  Table,
  ChevronWrapper,
} from './ConfirmDeleteDialogBody.styles'

type DeletionConfirmationDialogBodyProps = Required<ReferringDocuments> & {
  documentTitle: React.ReactNode
  action: string
}

function getSchemaType(typeName: string): SchemaType | null {
  const schemaMod = require('part:@sanity/base/schema')
  const schema = schemaMod.default || schemaMod
  return schema.get(typeName) || null
}

/**
 * The inner part of the `ConfirmDeleteDialog`. This is ran when both the
 * `crossDatasetReferences` and `internalReferences` are loaded.
 */
export function ConfirmDeleteDialogBody({
  crossDatasetReferences,
  internalReferences,
  documentTitle,
  totalCount,
  action,
  projectIds,
}: DeletionConfirmationDialogBodyProps) {
  const toast = useToast()

  if (internalReferences?.totalCount === 0 && crossDatasetReferences?.totalCount === 0) {
    return (
      <Text as="p">
        Are you sure you want to delete <strong>“{documentTitle}”</strong>?
      </Text>
    )
  }

  const documentCount =
    crossDatasetReferences.totalCount === 1
      ? '1 document'
      : `${crossDatasetReferences.totalCount.toLocaleString()} documents`
  const projectCount = projectIds.length === 1 ? 'another project' : `${projectIds.length} projects`
  const projectIdList = `Project ID${projectIds.length === 1 ? '' : 's'}: ${projectIds.join(', ')}`

  return (
    <>
      <Card padding={3} radius={2} tone="caution" marginBottom={4} flex="none">
        <Flex>
          <Text aria-hidden="true" size={1}>
            <WarningOutlineIcon />
          </Text>
          <Box flex={1} marginLeft={3}>
            <Text size={1}>
              {totalCount === 1 ? (
                <>1 document refers to “{documentTitle}”</>
              ) : (
                <>
                  {totalCount.toLocaleString()} documents refer to “{documentTitle}”
                </>
              )}
            </Text>
          </Box>
        </Flex>
      </Card>

      <Box flex="none" marginBottom={4}>
        <Text>
          You may not be able to {action} “{documentTitle}” because the following documents refer to
          it:
        </Text>
      </Box>

      <ReferencesCard>
        <Flex direction="column" height="fill">
          {internalReferences.totalCount > 0 && (
            <InternalReferences data-testid="internal-references">
              {internalReferences.references.map((internalReference) => {
                const type = getSchemaType(internalReference._type)

                return (
                  <Box as="li" key={internalReference._id} paddingX={3} paddingY={3}>
                    {type ? (
                      <SanityPreview type={type} value={internalReference} layout="default" />
                    ) : (
                      <SanityDefaultPreview
                        value={{
                          title: 'Preview Unavailable',
                          subtitle: `ID: ${internalReference._id}`,
                          media: <UnknownIcon />,
                        }}
                        layout="default"
                      />
                    )}
                  </Box>
                )
              })}
              {internalReferences.totalCount > internalReferences.references.length && (
                <Box as="li" padding={3}>
                  <OtherReferenceCount {...internalReferences} />
                </Box>
              )}
            </InternalReferences>
          )}

          {crossDatasetReferences.totalCount > 0 && (
            <CrossDatasetReferencesDetails
              data-testid="cross-dataset-references"
              style={{
                // only add the border if needed
                borderTop:
                  internalReferences.totalCount > 0
                    ? '1px solid var(--card-shadow-outline-color)'
                    : undefined,
              }}
            >
              <CrossDatasetReferencesSummary>
                <Flex padding={4} align="center">
                  <Box marginRight={4}>
                    <Text size={3}>
                      <DocumentsIcon />
                    </Text>
                  </Box>
                  <Flex marginRight={4} direction="column">
                    <Box marginBottom={2}>
                      <Text>
                        {documentCount} in {projectCount}
                      </Text>
                    </Box>
                    <Box>
                      <Text title={projectIdList} textOverflow="ellipsis" size={1} muted>
                        {projectIdList}
                      </Text>
                    </Box>
                  </Flex>
                  <ChevronWrapper>
                    <Text muted>
                      <ChevronDownIcon />
                    </Text>
                  </ChevronWrapper>
                </Flex>
              </CrossDatasetReferencesSummary>

              <TableContainer>
                <Table>
                  <thead>
                    <tr>
                      <th>
                        <Label muted size={0}>
                          Project ID
                        </Label>
                      </th>
                      <th>
                        <Label muted size={0}>
                          Dataset
                        </Label>
                      </th>
                      <th>
                        <Label muted size={0}>
                          Document ID
                        </Label>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossDatasetReferences.references
                      .filter((reference): reference is Required<typeof reference> => {
                        return (
                          'projectId' in reference &&
                          'datasetName' in reference &&
                          'documentId' in reference
                        )
                      })
                      .map(({projectId, datasetName, documentId}, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <tr key={`${documentId}-${index}`}>
                          <td>
                            <Text size={1}>{projectId}</Text>
                          </td>
                          <td>
                            <Text size={1}>{datasetName}</Text>
                          </td>
                          <td>
                            <Flex align="center" gap={2} justify="flex-end">
                              <Text textOverflow="ellipsis" size={1}>
                                {documentId}
                              </Text>
                              <CopyToClipboard
                                text={documentId}
                                // eslint-disable-next-line react/jsx-no-bind
                                onCopy={() => {
                                  // TODO: this isn't visible with the dialog open
                                  toast.push({
                                    title: 'Copied document ID to clipboard!',
                                    status: 'success',
                                  })
                                }}
                              >
                                <Button
                                  title="Copy ID to clipboard"
                                  mode="bleed"
                                  icon={ClipboardIcon}
                                  fontSize={0}
                                />
                              </CopyToClipboard>
                            </Flex>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
                <Box padding={2}>
                  <OtherReferenceCount {...crossDatasetReferences} />
                </Box>
              </TableContainer>
            </CrossDatasetReferencesDetails>
          )}
        </Flex>
      </ReferencesCard>

      <Box flex="none">
        <Text>
          If you {action} this document, documents that refer to it will no longer be able to access
          it.
        </Text>
      </Box>
    </>
  )
}
