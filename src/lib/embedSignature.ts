const SIGN_LINE =
  /Podpis Najemcy|Podpis Zamawiającego|\(Podpis Najemcy\)/gi

export function insertSignaturePlaceholder(regulationText: string): {
  before: string
  after: string
} {
  let lastIdx = -1
  let match: RegExpExecArray | null
  const re = new RegExp(SIGN_LINE.source, 'gi')
  while ((match = re.exec(regulationText)) !== null) {
    lastIdx = match.index
  }
  if (lastIdx === -1) {
    return {
      before: regulationText.trimEnd() + '\n\n',
      after: '\nPodpis Najemcy: ____________________\n',
    }
  }
  return {
    before: regulationText.slice(0, lastIdx).trimEnd() + '\n\n',
    after: '\n' + regulationText.slice(lastIdx).trimStart(),
  }
}
