import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../../store';
import { buildQuoteTemplateHtml } from '../../utils/documentTemplates';

export const QuotePrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    quotes,
    customers,
    contacts,
    users,
    companySettings,
    documentTemplates,
  } = useStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoPrintTriggered = useRef(false);
  const [frameReady, setFrameReady] = useState(false);

  const quote = quotes.find((entry) => entry.id === id);
  const customer = quote ? customers.find((entry) => entry.id === quote.customerId) || null : null;
  const primaryContact = quote
    ? contacts.find((entry) => entry.customerId === quote.customerId && entry.isPrimary)
      || contacts.find((entry) => entry.customerId === quote.customerId)
      || null
    : null;
  const assignedUser = quote ? users.find((entry) => entry.id === quote.csrId) || null : null;

  const renderedHtml = useMemo(() => {
    if (!quote) {
      return '';
    }

    return buildQuoteTemplateHtml({
      template: documentTemplates.quote,
      company: companySettings,
      quote,
      customer,
      contact: primaryContact,
      assignedUser,
    });
  }, [assignedUser, companySettings, customer, documentTemplates.quote, primaryContact, quote]);

  useEffect(() => {
    document.title = quote ? `Quote ${quote.number} - QuikQuote` : 'Quote';
  }, [quote]);

  useEffect(() => {
    setFrameReady(false);
    autoPrintTriggered.current = false;
  }, [renderedHtml]);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.focus();
    iframeRef.current?.contentWindow?.print();
  };

  const handleFrameLoad = () => {
    setFrameReady(true);

    if (autoPrintTriggered.current) {
      return;
    }

    autoPrintTriggered.current = true;
    window.setTimeout(() => {
      handlePrint();
    }, 150);
  };

  if (!quote) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        Quote not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="no-print fixed right-4 top-4 z-50 flex gap-2">
        <button
          onClick={handlePrint}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-blue-700"
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-lg transition-colors hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      {!frameReady && (
        <div className="no-print px-6 pt-6 text-sm text-gray-500">
          Preparing quote template for print...
        </div>
      )}

      <iframe
        ref={iframeRef}
        title={`Quote ${quote.number}`}
        srcDoc={renderedHtml}
        onLoad={handleFrameLoad}
        className="min-h-screen w-full border-0 bg-white"
        sandbox="allow-modals allow-same-origin"
      />
    </div>
  );
};
