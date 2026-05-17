import { getTemplatePageEditorConfig } from '../../shared/pageRegistry'
import TemplatePageEditorPage from '../../shared/template-editor/TemplatePageEditorPage'

const config = getTemplatePageEditorConfig('about')

export default function AboutPageEditor() {
  return <TemplatePageEditorPage config={config} />
}
