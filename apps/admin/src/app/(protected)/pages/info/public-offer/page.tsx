import { getTemplatePageEditorConfig } from '../../shared/pageRegistry'
import TemplatePageEditorPage from '../../shared/template-editor/TemplatePageEditorPage'

const config = getTemplatePageEditorConfig('public-offer')

export default function PublicOfferPageEditor() {
  return <TemplatePageEditorPage config={config} />
}
