import { getTemplatePageEditorConfig } from '../../shared/pageRegistry'
import TemplatePageEditorPage from '../../shared/template-editor/TemplatePageEditorPage'

const config = getTemplatePageEditorConfig('terms')

export default function TermsPageEditor() {
  return <TemplatePageEditorPage config={config} />
}
