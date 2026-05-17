'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const TinyEditor = dynamic(
  () => import('@tinymce/tinymce-react').then((module) => module.Editor),
  { ssr: false },
)

interface TinyMceEditorProps {
  value: string
  onChange: (value: string) => void
  onImageUpload?: (file: File) => Promise<string>
  disabled?: boolean
  placeholder?: string
}

export default function TinyMceEditor({
  value,
  onChange,
  onImageUpload,
  disabled = false,
  placeholder,
}: TinyMceEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="news-editor-shell">
        <div className="flex min-h-115 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-gray-400">
          Завантаження редактора...
        </div>
      </div>
    )
  }

  const pickAndUploadImage = async () => {
    if (!onImageUpload) {
      throw new Error('Image upload handler is not configured')
    }

    const file = await new Promise<File | null>((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/png,image/jpeg,image/jpg,image/webp'
      input.onchange = () => resolve(input.files?.[0] || null)
      input.click()
    })

    if (!file) {
      throw new Error('Вибір файлу скасовано')
    }

    return onImageUpload(file)
  }

  return (
    <div className="news-editor-shell">
      <TinyEditor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        scriptLoading={{ async: true, defer: true }}
        licenseKey="gpl"
        value={value}
        disabled={disabled}
        onEditorChange={onChange}
        init={{
          branding: false,
          promotion: false,
          menubar: false,
          statusbar: false,
          min_height: 460,
          resize: false,
          automatic_uploads: true,
          paste_data_images: true,
          paste_as_text: false,
          paste_merge_formats: true,
          paste_remove_styles_if_webkit: false,
          paste_webkit_styles: 'font-weight font-style text-decoration text-align',
          invalid_styles: {
            '*': 'color background background-color',
          },
          skin: 'oxide-dark',
          content_css: 'dark',
          placeholder,
          browser_spellcheck: true,
          contextmenu: false,
          file_picker_types: 'image',
          plugins: 'autolink image link lists charmap preview searchreplace visualblocks code table wordcount',
          toolbar:
            'undo redo | blocks | bold italic underline strikethrough | bullist numlist blockquote | alignleft aligncenter alignright | link image table | removeformat code preview',
          block_formats: 'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4',
          image_title: true,
          images_upload_handler: onImageUpload
            ? async (blobInfo) => {
                const file = new File([blobInfo.blob()], blobInfo.filename(), {
                  type: blobInfo.blob().type || 'image/png',
                })
                return onImageUpload(file)
              }
            : undefined,
          file_picker_callback: onImageUpload
            ? async (callback) => {
                try {
                  const url = await pickAndUploadImage()
                  callback(url, { alt: 'Inserted image' })
                } catch (error) {
                  if (error instanceof Error && error.message === 'Вибір файлу скасовано') {
                    return
                  }
                  console.error('Failed to upload editor image', error)
                }
              }
            : undefined,
          content_style: `
            body {
              background: #0f0f10;
              color: #f3f4f6;
              font-family: ui-sans-serif, system-ui, sans-serif;
              font-size: 15px;
              line-height: 1.75;
              padding: 18px;
            }
            p { margin: 0 0 1em; }
            h2, h3, h4 {
              color: #ffffff;
              line-height: 1.3;
              margin: 1.2em 0 0.55em;
            }
            a {
              color: #fb923c;
              text-decoration: underline;
              text-decoration-thickness: 2px;
              text-underline-offset: 2px;
            }
            u {
              text-decoration: underline;
              text-decoration-thickness: 2px;
              text-underline-offset: 2px;
            }
            blockquote {
              border-left: 3px solid #ea580c;
              color: #d1d5db;
              margin: 1rem 0;
              padding-left: 1rem;
            }
            ul, ol { padding-left: 1.25rem; }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1rem 0;
            }
            table td, table th {
              border: 1px solid rgba(255,255,255,0.15);
              padding: 0.5rem;
            }
            img {
              display: block;
              height: auto;
              max-width: 100%;
              border-radius: 0.75rem;
              margin: 1rem 0;
            }
          `,
        }}
      />
    </div>
  )
}