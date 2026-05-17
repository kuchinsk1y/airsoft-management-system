import { getTemplatePageEditorConfig } from '../../shared/pageRegistry'
import TemplatePageEditorPage from '../../shared/template-editor/TemplatePageEditorPage'

const config = getTemplatePageEditorConfig('privacy')

export default function PrivacyPageEditor() {
  return <TemplatePageEditorPage config={config} />
}