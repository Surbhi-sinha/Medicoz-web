'use client';

import { AlertTriangle, FileText } from 'lucide-react';
import { Btn } from '@/components/ui/ClinicalPrimitives';

export function ChatInfoPanel() {
  return (
    <div className="chat-info-panel">
      <h2 className="chat-info-panel__title">Patient information</h2>
      <dl className="chat-info-dl">
        <div>
          <dt>Full name</dt>
          <dd>Sarah Johnson</dd>
        </div>
        <div>
          <dt>DOB</dt>
          <dd>Mar 14, 1985</dd>
        </div>
        <div>
          <dt>Blood type</dt>
          <dd>O+</dd>
        </div>
      </dl>

      <h3 className="chat-info-panel__subtitle">Recent vitals</h3>
      <div className="chat-vitals-mini">
        <div><span>BP</span><strong>120/80</strong></div>
        <div><span>HR</span><strong>72 bpm</strong></div>
      </div>

      <h3 className="chat-info-panel__subtitle">Shared files</h3>
      <ul className="chat-files-list">
        {[
          { name: 'Cardiology_Report_May.pdf', date: 'Oct 20' },
          { name: 'ECG_Results_May.jpg', date: 'Oct 18' },
        ].map((f) => (
          <li key={f.name}>
            <FileText size={16} aria-hidden />
            <div>
              <span>{f.name}</span>
              <small>{f.date}</small>
            </div>
          </li>
        ))}
      </ul>
      <Btn variant="outline" style={{ width: '100%', marginTop: 12, textTransform: 'none' }}>
        View all documents
      </Btn>

      <div className="chat-alert-box" role="alert">
        <AlertTriangle size={18} aria-hidden />
        <div>
          <strong>Active alerts</strong>
          <p>Medication non-adherence flagged for follow-up during next visit.</p>
        </div>
      </div>

      <style>{`
        .chat-info-panel__title { font-size: 16px; margin: 0 0 16px; color: var(--teal-900); }
        .chat-info-panel__subtitle {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--stone-600);
          margin: 20px 0 10px;
        }
        .chat-info-dl { margin: 0; }
        .chat-info-dl div { margin-bottom: 12px; }
        .chat-info-dl dt { font-size: 11px; color: var(--stone-600); margin-bottom: 2px; }
        .chat-info-dl dd { margin: 0; font-weight: 600; font-size: 14px; }
        .chat-vitals-mini {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .chat-vitals-mini div {
          padding: 12px;
          border-radius: var(--radius-sm);
          background: var(--surface-card);
          border: 1px solid var(--border-default);
        }
        .chat-vitals-mini span { display: block; font-size: 11px; color: var(--stone-600); }
        .chat-vitals-mini strong { color: var(--teal-800); font-size: 16px; }
        .chat-files-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .chat-files-list li {
          display: flex;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-default);
          font-size: 13px;
        }
        .chat-files-list small { display: block; color: var(--stone-600); font-size: 11px; }
        .chat-alert-box {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding: 14px;
          border-radius: var(--radius-sm);
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #991B1B;
          font-size: 13px;
        }
        .chat-alert-box p { margin: 4px 0 0; font-weight: 400; }
      `}</style>
    </div>
  );
}
