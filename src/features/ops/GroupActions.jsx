import { useState } from 'react';
import { Download, Handshake, MessageSquare, NotebookPen } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { useGroupExport, useGroupLog, useGroupMessage, useIntroduce } from './hooks.js';

const KINDS = ['Call', 'Meeting', 'Email', 'Message', 'Other'];
const area = 'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none';

// The bar that appears when members are ticked: one message, one logged touchpoint, a spreadsheet, or an introduction (exactly two).
// `selected` is a list of { id, name }. `onDone` clears the ticks after something was sent.
export default function GroupActions({ selected, onDone, defaultLog = 'Meeting' }) {
  const [open, setOpen] = useState(null); // 'message' | 'log' | 'intro'
  const message = useGroupMessage();
  const log = useGroupLog();
  const exportCsv = useGroupExport();
  const intro = useIntroduce();
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [kind, setKind] = useState(defaultLog);
  const [note, setNote] = useState('');
  const ids = selected.map((s) => s.id);
  const busy = message.isPending || log.isPending || intro.isPending;
  const close = () => !busy && setOpen(null);
  const finish = () => {
    setOpen(null);
    setSubject('');
    setText('');
    setNote('');
    onDone();
  };
  if (selected.length === 0) return null;

  return (
    <>
      <div role="region" aria-label="Actions for the chosen members" className="sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-ilc-purple/30 bg-white p-3 shadow-lg">
        <p className="mr-auto text-sm font-bold text-ilc-ink">{selected.length} chosen</p>
        <Button className="w-auto" onClick={() => setOpen('message')}>
          <MessageSquare className="h-4 w-4" aria-hidden="true" /> Message
        </Button>
        <Button variant="ghost" className="w-auto border border-gray-300" onClick={() => setOpen('log')}>
          <NotebookPen className="h-4 w-4" aria-hidden="true" /> Log a contact
        </Button>
        <Button variant="ghost" className="w-auto border border-gray-300" loading={exportCsv.isPending} onClick={() => exportCsv.mutate(ids)}>
          <Download className="h-4 w-4" aria-hidden="true" /> Download list
        </Button>
        <Button variant="ghost" className="w-auto border border-gray-300" disabled={selected.length !== 2} title={selected.length === 2 ? '' : 'Choose exactly two members to introduce them'} onClick={() => setOpen('intro')}>
          <Handshake className="h-4 w-4" aria-hidden="true" /> Introduce
        </Button>
      </div>

      {open === 'message' && (
        <Modal
          title="Message the chosen members"
          subtitle={`${selected.length} member${selected.length === 1 ? '' : 's'} get a bell notice and an email from you.`}
          onClose={close}
          busy={busy}
          footer={
            <>
              <Button variant="ghost" className="sm:w-auto" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button className="sm:w-auto" loading={message.isPending} disabled={!subject.trim() || !text.trim()} onClick={() => message.mutate({ member_ids: ids, subject, message: text }, { onSuccess: finish })}>
                Send
              </Button>
            </>
          }
        >
          <TextField label="Subject" value={subject} maxLength={100} onChange={(e) => setSubject(e.target.value)} />
          <div>
            <label htmlFor="grp-msg" className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">
              Message
            </label>
            <textarea id="grp-msg" rows={5} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} className={area} />
            <p className="mt-1 text-xs text-gray-700">Each member sees it as a personal note from their relationship manager.</p>
          </div>
        </Modal>
      )}

      {open === 'log' && (
        <Modal
          title="Log a contact for the chosen members"
          subtitle="The same note is saved for each member, and counts as a touchpoint today."
          onClose={close}
          busy={busy}
          footer={
            <>
              <Button variant="ghost" className="sm:w-auto" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button className="sm:w-auto" loading={log.isPending} disabled={!note.trim()} onClick={() => log.mutate({ member_ids: ids, kind, note }, { onSuccess: finish })}>
                Save for {selected.length}
              </Button>
            </>
          }
        >
          <SelectField label="What was it" value={kind} onChange={(e) => setKind(e.target.value)} options={KINDS.map((k) => ({ value: k, label: k }))} />
          <TextField label="Note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Thanked everyone for coming" />
        </Modal>
      )}

      {open === 'intro' && selected.length === 2 && (
        <Modal
          title="Introduce two members"
          subtitle={`${selected[0].name} and ${selected[1].name}`}
          onClose={close}
          busy={busy}
          footer={
            <>
              <Button variant="ghost" className="sm:w-auto" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button className="sm:w-auto" loading={intro.isPending} onClick={() => intro.mutate({ member_a: ids[0], member_b: ids[1], note: note.trim() || null }, { onSuccess: finish })}>
                Introduce them
              </Button>
            </>
          }
        >
          <p className="text-sm text-gray-700">Both get a message about each other (no email addresses are shared). &quot;First introduction made&quot; is ticked for both and a note is saved.</p>
          <TextField label="Why these two? (optional)" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="e.g. You both build ships" />
        </Modal>
      )}
    </>
  );
}
