import { getTemplatePageEditorConfig } from '../../shared/pageRegistry'
import TemplatePageEditorPage from '../../shared/template-editor/TemplatePageEditorPage'

const config = getTemplatePageEditorConfig('payment')

export default function PaymentPageEditor() {
  return <TemplatePageEditorPage config={config} />
}
