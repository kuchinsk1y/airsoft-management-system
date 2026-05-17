import { getTemplatePageEditorConfig } from '../../shared/pageRegistry'
import TemplatePageEditorPage from '../../shared/template-editor/TemplatePageEditorPage'

const config = getTemplatePageEditorConfig('weekend-game')

export default function WeekendGamePageEditor() {
  return <TemplatePageEditorPage config={config} />
}