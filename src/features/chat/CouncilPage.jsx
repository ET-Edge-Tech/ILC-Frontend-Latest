import { useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import ConversationView from './ConversationView.jsx';
import DirectoryTab from './DirectoryTab.jsx';
import ThreadList from './ThreadList.jsx';
import { useUnread } from './hooks.js';

// The Council: the member directory and the chat inbox.
// The address says where you are: /council?tab=inbox&chat=<member id>
export default function CouncilPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'inbox' ? 'inbox' : 'directory';
  const chat = params.get('chat');
  const { data: unread = 0 } = useUnread();

  const go = (next) => setParams(next, { replace: false });
  const openChat = (id) => go({ tab: 'inbox', chat: id });
  const closeChat = () => go({ tab: 'inbox' });

  const tabs = [
    { value: 'directory', label: 'Directory' },
    { value: 'inbox', label: 'Inbox', badge: unread },
  ];

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="The Council"
        className="inline-flex rounded-lg border border-gray-200 bg-white p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => go({ tab: t.value })}
            className={`inline-flex min-h-9 items-center gap-2 rounded-md px-4 text-xs font-bold tracking-widest uppercase transition ${tab === t.value ? 'bg-ilc-purple text-white' : 'text-gray-700 hover:text-ilc-purple'}`}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {t.badge > 9 ? '9+' : t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'directory' ? (
        <DirectoryTab onMessage={openChat} />
      ) : (
        // Wide screens: list and conversation side by side. Phones: one at a time.
        <div className="glass-card grid h-[calc(100dvh-14rem)] min-h-[26rem] overflow-hidden rounded-2xl lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div
            className={`min-h-0 overflow-y-auto border-gray-100 lg:border-r ${chat ? 'hidden lg:block' : ''}`}
          >
            <ThreadList
              activeId={chat}
              onOpen={openChat}
              onFindMembers={() => go({ tab: 'directory' })}
            />
          </div>
          <div className={`min-h-0 ${chat ? '' : 'hidden lg:block'}`}>
            {chat ? (
              <ConversationView key={chat} partnerId={chat} onBack={closeChat} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-600">
                <MessageSquare className="h-10 w-10 text-gray-300" aria-hidden="true" />
                <p className="mt-3 text-sm">Choose a conversation to start reading.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
