import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CAlert, CBadge, CButton, CCard, CCardBody, CFormTextarea, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCommentSquare, cilPaperclip, cilSend } from '@coreui/icons'
import api from '../../api'

const normalizeList = (response) => {
  if (!response || !response.data) return []
  const data = response.data?.data || response.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const ClientMessages = () => {
  const [threads, setThreads] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(null)

  const fetchThreads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/client/projects?with=comments')
      const projects = normalizeList(response)
      
      const threads = projects.map(p => ({
        id: p.id,
        title: p.name,
        project: p,
        messages: p.comments || [],
        last_message: p.comments?.[p.comments.length - 1]?.content || '',
        attachments_count: p.attachments_count || 0,
      }))
      
      setThreads(threads)
      setSelectedId(threads[0]?.id || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages.')
      setThreads([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  const selected = useMemo(
    () => threads.find((thread) => thread.id === selectedId) || threads[0],
    [selectedId, threads],
  )

  const messages = useMemo(() => {
    if (!selected) return []
    return selected.messages || []
  }, [selected])

  const handleReply = async () => {
    if (!reply.trim() || !selected) return
    setPosting(true)
    try {
      const response = await api.post(`/api/client/projects/${selected.id}/comments`, {
        content: reply.trim(),
      })
      const created = response.data?.data || response.data
      setThreads((current) =>
        current.map((thread) =>
          thread.id === selected.id
            ? {
                ...thread,
                messages: [...thread.messages, created],
                last_message: created.content || created.message,
              }
            : thread,
        ),
      )
      setReply('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="pb-5">
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Messages</h4>
        <p className="text-body-secondary mb-0">Project discussion threads and shared context.</p>
      </div>

      {error && <CAlert color="danger" dismissible onClose={() => setError(null)}>{error}</CAlert>}

      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      ) : threads.length === 0 ? (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5 text-body-secondary">
            <CIcon icon={cilCommentSquare} size="xl" className="mb-3 opacity-25" />
            <div>No message threads yet.</div>
          </CCardBody>
        </CCard>
      ) : (
        <div className="d-flex gap-4" style={{ alignItems: 'flex-start' }}>
          <div style={{ width: 320, flexShrink: 0 }}>
            <CCard className="border-0 shadow-sm">
              <CCardBody className="d-flex flex-column gap-2">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    className="text-start border-0 rounded-3 p-3"
                    style={{
                      background:
                        selected?.id === thread.id
                          ? 'var(--cui-primary-bg-subtle)'
                          : 'var(--cui-secondary-bg)',
                      color: 'var(--cui-body-color)',
                    }}
                    onClick={() => setSelectedId(thread.id)}
                  >
                    <div className="fw-semibold small">
                      {thread.project?.name || thread.title || 'Project thread'}
                    </div>
                    <div className="text-body-secondary" style={{ fontSize: 12 }}>
                      {thread.last_message || 'Open discussion'}
                    </div>
                  </button>
                ))}
              </CCardBody>
            </CCard>
          </div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <CCard className="border-0 shadow-sm">
              <CCardBody>
                <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
                  <div>
                    <h5 className="fw-bold mb-1">
                      {selected?.project?.name || selected?.title || 'Discussion'}
                    </h5>
                    <div className="text-body-secondary small">{messages.length} messages</div>
                  </div>
                  {selected?.attachments_count > 0 && (
                    <CBadge color="secondary">
                      <CIcon icon={cilPaperclip} className="me-1" />
                      {selected.attachments_count}
                    </CBadge>
                  )}
                </div>
                <div className="d-flex flex-column gap-3 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-body-secondary py-4">
                      No messages in this thread.
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div key={message.id || index} className="rounded-3 p-3 bg-body-tertiary">
                        <div className="d-flex justify-content-between gap-3 mb-1">
                          <span className="fw-semibold small">
                            {message.user?.name || message.author?.name || 'Team'}
                          </span>
                          <span className="text-body-secondary" style={{ fontSize: 12 }}>
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <div className="small">{message.content || message.message}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="d-flex gap-2">
                  <CFormTextarea
                    rows={2}
                    placeholder="Write a reply..."
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                  />
                  <CButton
                    color="primary"
                    disabled={posting || !reply.trim()}
                    onClick={handleReply}
                  >
                    {posting ? <CSpinner size="sm" /> : <CIcon icon={cilSend} />}
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientMessages