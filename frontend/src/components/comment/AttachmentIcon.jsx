// src/components/comment/AttachmentIcon.jsx
// ─── Drop-in file-type icon + comment attachment renderer ────────────────────
//
// EXPORTS:
//   <FileTypeIcon mime={string} fileName={string} size={number} />
//   <AttachmentList attachments={array} />
//   <CommentBubble comment={object} />
//   formatFileSize(bytes) → string
//
// Each attachment object expected shape:
//   { id, file_name, file_path, mime_type, file_size, url }
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Classify a file into a display category using mime_type first,
 * then falling back to the file extension.
 */
const getFileCategory = (mimeType = '', fileName = '') => {
  const mime = (mimeType || '').toLowerCase()
  const ext  = (fileName || '').split('.').pop().toLowerCase()

  if (mime.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext))
    return 'image'

  if (mime === 'application/pdf' || ext === 'pdf')
    return 'pdf'

  if (
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ['doc','docx'].includes(ext)
  ) return 'word'

  if (
    mime === 'application/zip' ||
    mime === 'application/x-rar-compressed' ||
    mime === 'application/x-zip-compressed' ||
    mime === 'application/octet-stream' && ['zip','rar'].includes(ext) ||
    ['zip','rar','7z','tar','gz'].includes(ext)
  ) return 'archive'

  if (mime === 'text/plain' || ext === 'txt')
    return 'text'

  return 'generic'
}

// ─── SVG icons (no external dependency) ─────────────────────────────────────

const IconPDF = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#FEE2E2"/>
    <path d="M6 2h8l4 4v16H6V2z" fill="#EF4444" opacity=".15"/>
    <path d="M14 2l4 4h-4V2z" fill="#EF4444" opacity=".4"/>
    <path d="M14 2v4h4" stroke="#EF4444" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M6 2h8v0M6 2v18h12V6" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="8" y="16" fontSize="5" fontWeight="800" fill="#EF4444" fontFamily="Arial,sans-serif">PDF</text>
  </svg>
)

const IconWord = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#DBEAFE"/>
    <path d="M6 2h8l4 4v16H6V2z" fill="#3B82F6" opacity=".15"/>
    <path d="M14 2l4 4h-4V2z" fill="#3B82F6" opacity=".4"/>
    <path d="M6 2h8v0M6 2v18h12V6" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="7.5" y="16" fontSize="4.5" fontWeight="800" fill="#3B82F6" fontFamily="Arial,sans-serif">DOC</text>
  </svg>
)

const IconImage = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#DCFCE7"/>
    <rect x="4" y="6" width="16" height="12" rx="2" stroke="#22C55E" strokeWidth="1.3"/>
    <circle cx="8.5" cy="10.5" r="1.5" fill="#22C55E"/>
    <path d="M4 16l4-4 3 3 2-2 4 4" stroke="#22C55E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconArchive = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#FEF9C3"/>
    <rect x="3" y="5" width="18" height="4" rx="1" stroke="#EAB308" strokeWidth="1.3"/>
    <path d="M5 9v10h14V9" stroke="#EAB308" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M10 12h4M10 15h4" stroke="#EAB308" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const IconText = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#F0FDF4"/>
    <path d="M6 2h8l4 4v16H6V2z" fill="#6B7280" opacity=".1"/>
    <path d="M6 2h8v0M6 2v18h12V6" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 10h6M9 13h6M9 16h4" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const IconGeneric = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#F3F4F6"/>
    <path d="M6 2h8l4 4v16H6V2z" fill="#9CA3AF" opacity=".15"/>
    <path d="M14 2l4 4h-4V2z" fill="#9CA3AF" opacity=".4"/>
    <path d="M6 2h8v0M6 2v18h12V6" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── Public: FileTypeIcon ─────────────────────────────────────────────────────

export const FileTypeIcon = ({ mimeType = '', fileName = '', size = 28 }) => {
  const category = getFileCategory(mimeType, fileName)
  switch (category) {
    case 'pdf':     return <IconPDF     size={size} />
    case 'word':    return <IconWord    size={size} />
    case 'image':   return <IconImage   size={size} />
    case 'archive': return <IconArchive size={size} />
    case 'text':    return <IconText    size={size} />
    default:        return <IconGeneric size={size} />
  }
}

// ─── Public: AttachmentList ───────────────────────────────────────────────────
// Renders a row of attachment chips with icon, name, size, and link.

export const AttachmentList = ({ attachments = [] }) => {
  if (!attachments || attachments.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    }}>
      {attachments.map((att, idx) => {
        const name     = att.file_name || att.name || 'Attachment'
        const mime     = att.mime_type || ''
        const size     = att.file_size ?? att.size ?? null
        const category = getFileCategory(mime, name)

        // Colour accent per type
        const accent = {
          pdf:     { color: '#EF4444', bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.2)'   },
          word:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.2)'  },
          image:   { color: '#22C55E', bg: 'rgba(34,197,94,0.07)',   border: 'rgba(34,197,94,0.2)'   },
          archive: { color: '#EAB308', bg: 'rgba(234,179,8,0.07)',   border: 'rgba(234,179,8,0.2)'   },
          text:    { color: '#6B7280', bg: 'rgba(107,114,128,0.07)', border: 'rgba(107,114,128,0.2)' },
          generic: { color: '#6B7280', bg: 'rgba(107,114,128,0.07)', border: 'rgba(107,114,128,0.2)' },
        }[category]

        return (
          <a
            key={att.id || idx}
            href={att.url || att.file_path}
            target="_blank"
            rel="noopener noreferrer"
            title={`Download ${name}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 8,
              textDecoration: 'none',
              background: accent.bg,
              border: `1px solid ${accent.border}`,
              transition: 'opacity 0.15s, transform 0.15s',
              maxWidth: 240,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.8'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <FileTypeIcon mimeType={mime} fileName={name} size={22} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: accent.color,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 160,
              }}>
                {name}
              </div>
              {size !== null && (
                <div style={{
                  fontSize: '0.62rem',
                  color: accent.color,
                  opacity: 0.7,
                }}>
                  {formatFileSize(size)}
                </div>
              )}
            </div>
          </a>
        )
      })}
    </div>
  )
}

// ─── Public: CommentBubble ────────────────────────────────────────────────────
// Full comment card with avatar, author, text, and attachments.
// Accepts a comment object from either the web or mobile API shape.

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export const CommentBubble = ({ comment: c, style = {} }) => {
  const authorName = c.user?.name || c.author?.name || 'Unknown'
  const initials   = authorName.charAt(0).toUpperCase()
  const text       = c.content || c.text || c.body || ''
  const attachments = c.attachments || []

  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 8,
      background: 'var(--cui-secondary-bg, #f8f9fa)',
      border: '1px solid var(--cui-border-color, #dee2e6)',
      ...style,
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: text || attachments.length ? 8 : 0,
      }}>
        {/* Avatar */}
        <div style={{
          width: 28, height: 28,
          borderRadius: '50%',
          background: 'var(--cui-primary, #0d6efd)',
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>

        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{authorName}</span>

        <span style={{
          fontSize: '0.7rem',
          color: 'var(--cui-secondary-color, #6c757d)',
          marginLeft: 'auto',
          whiteSpace: 'nowrap',
        }}>
          {formatDate(c.created_at)}
        </span>
      </div>

      {/* Comment text */}
      {text ? (
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--cui-secondary-color, #6c757d)',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          marginBottom: attachments.length ? 4 : 0,
        }}>
          {text}
        </div>
      ) : null}

      {/* Attachments */}
      <AttachmentList attachments={attachments} />
    </div>
  )
}

export default AttachmentList