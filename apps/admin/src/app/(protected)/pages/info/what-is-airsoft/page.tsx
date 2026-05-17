import { getTemplatePageEditorConfig } from '../../shared/pageRegistry'
import TemplatePageEditorPage from '../../shared/template-editor/TemplatePageEditorPage'

const config = getTemplatePageEditorConfig('what-is-airsoft')

export default function WhatIsAirsoftPageEditor() {
  return <TemplatePageEditorPage config={config} />
}