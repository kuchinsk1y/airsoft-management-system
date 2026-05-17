import { getTemplatePageEditorConfig } from '../../shared/pageRegistry'
import TemplatePageEditorPage from '../../shared/template-editor/TemplatePageEditorPage'

const config = getTemplatePageEditorConfig('legal')

export default function LegalPageEditor() {
  return <TemplatePageEditorPage config={config} />
}
