import { getTemplatePageEditorConfig } from '../../shared/pageRegistry'
import TemplatePageEditorPage from '../../shared/template-editor/TemplatePageEditorPage'

const config = getTemplatePageEditorConfig('game-types')

export default function GameTypesPageEditor() {
  return <TemplatePageEditorPage config={config} />
}