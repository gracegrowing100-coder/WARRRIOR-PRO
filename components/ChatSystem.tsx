import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  CornerUpLeft,
  Flag,
  ImagePlus,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Send,
  ShieldCheck,
  SmilePlus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';

/**
 * Community channels: shared Firestore chat rooms (chats/{id}/messages) that every
 * signed-in warrior can read and post to. Nothing here is simulated: no seeded people,
 * member counts, online dots or calls. Channels start empty until people post.
 */

interface Channel {
  id: string;
  name: string;
  desc: string;
  initials: string;
  custom?: boolean;
}

const CHANNELS: Channel[] = [
  {
    id: 'lagos-warriors',
    name: 'Lagos Warriors',
    desc: 'Warriors in and around Lagos: daily tips, encouragement and local updates.',
    initials: 'LW',
  },
  {
    id: 'global-scd-network',
    name: 'Global SCD Network',
    desc: 'Warriors and advocates everywhere sharing news and experiences.',
    initials: 'GS',
  },
  {
    id: 'caregivers-circle',
    name: 'Caregivers Circle',
    desc: 'A safe space for parents, partners and family supporting a warrior.',
    initials: 'CC',
  },
];

const REACTIONS = ['❤️', '🙏', '💪', '👏', '💧'];

const QUICK_STARTERS = [
  'Hello everyone! Glad to be here.',
  'Hydration check: I am drinking water and logging it today.',
  'Cold weather check: I am keeping warm today.',
];

// Peer chat is not medical advice. Messages that suggest stopping or changing treatment,
// or promise cures, get a visible note and can be hidden with Guardian mode.
const UNVERIFIED_MEDICAL_PATTERNS = [
  /stop(ped|ping)?\s+(taking\s+)?(hydroxyurea|hydroxycarbamide|folic|penicillin|medication|meds|my drugs)/i,
  /(cure[sd]?|heal[sd]?)\s+(sickle|scd)/i,
  /(miracle|herbal|natural)\s+(cure|remedy|treatment)/i,
  /instead of (hydroxyurea|your medication|your drugs|the hospital)/i,
  /don'?t (go|need) (to )?(the )?hospital/i,
];
const hasUnverifiedClaim = (text?: string | null) => Boolean(text) && UNVERIFIED_MEDICAL_PATTERNS.some(p => p.test(String(text)));

const readList = (key: string): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const writeList = (key: string, value: string[]) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Preference only. */ }
};

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTime = (value: any) => {
  const date = toDate(value);
  if (!date) return '';
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';

/** Shrinks a photo before upload so chat documents stay small. */
const compressImage = (file: File): Promise<Blob> => new Promise((resolve) => {
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob || file); }, 'image/jpeg', 0.8);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  } catch {
    resolve(file);
  }
});

const ChatSystem: React.FC = () => {
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid || '';
  const currentUserName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Warrior';

  const [channels, setChannels] = useState<Channel[]>(CHANNELS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; text: string } | null>(null);
  const [actionsFor, setActionsFor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [notice, setNotice] = useState('');
  const [guardianMode, setGuardianMode] = useState(() => {
    try { return localStorage.getItem('warrior_guardian_safe_mode') === 'true'; } catch { return false; }
  });
  const [hiddenSenders, setHiddenSenders] = useState<string[]>(() => readList('warrior_hidden_senders'));
  const [reportedIds, setReportedIds] = useState<string[]>(() => readList('warrior_flagged_messages'));
  const [lightbox, setLightbox] = useState<string | null>(null);

  const listEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeChannel = channels.find(c => c.id === activeChatId) ?? null;

  // Groups made in older builds were saved on this device only; keep showing them.
  useEffect(() => {
    try {
      const result: any = firebaseService.getCustomGroups(currentUserId);
      const apply = (groups: any) => {
        if (!Array.isArray(groups) || !groups.length) return;
        const extra: Channel[] = groups
          .filter((g: any) => g && typeof g.id === 'string' && !CHANNELS.some(c => c.id === g.id))
          .map((g: any) => ({ id: g.id, name: String(g.name || 'My group'), desc: String(g.desc || ''), initials: initialsOf(String(g.name || 'G')), custom: true }));
        if (extra.length) setChannels([...CHANNELS, ...extra]);
      };
      if (result && typeof result.then === 'function') result.then(apply).catch(() => undefined);
      else apply(result);
    } catch { /* Optional local groups. */ }
  }, [currentUserId]);

  useEffect(() => {
    if (!activeChatId) return;
    setLoadingMessages(true);
    setMessages([]);
    const unsubscribe = firebaseService.subscribeToMessages(activeChatId, (next: any[]) => {
      setMessages(Array.isArray(next) ? next : []);
      setLoadingMessages(false);
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId || !currentUserId) return;
    const unsubscribe = firebaseService.subscribeToTypingStatus(activeChatId, currentUserId, (names: string[]) => setTypingUsers(names || []));
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [activeChatId, currentUserId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages.length, activeChatId]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(id);
  }, [notice]);

  const visibleMessages = useMemo(() => messages.filter(m =>
    !hiddenSenders.includes(m.senderId)
    && !reportedIds.includes(m.id)
    && !(guardianMode && hasUnverifiedClaim(m.text))
  ), [messages, hiddenSenders, reportedIds, guardianMode]);

  const openChannel = (id: string) => {
    setActiveChatId(id);
    setReplyingTo(null);
    setActionsFor(null);
    setSendError('');
    setText('');
  };

  const closeChannel = () => {
    if (activeChatId && currentUserId) firebaseService.setTypingStatus(activeChatId, currentUserId, currentUserName, false);
    setActiveChatId(null);
  };

  const handleTyping = (value: string) => {
    setText(value);
    if (!activeChatId || !currentUserId) return;
    firebaseService.setTypingStatus(activeChatId, currentUserId, currentUserName, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      firebaseService.setTypingStatus(activeChatId, currentUserId, currentUserName, false);
    }, 2500);
  };

  const send = async (body: string, mediaUrl: string | null = null) => {
    if (!activeChatId || sending) return;
    const trimmed = body.trim();
    if (!trimmed && !mediaUrl) return;
    setSending(true);
    setSendError('');
    try {
      await firebaseService.sendMessage(activeChatId, trimmed, mediaUrl, mediaUrl ? 'image' : null, replyingTo);
      setText('');
      setReplyingTo(null);
      if (currentUserId) firebaseService.setTypingStatus(activeChatId, currentUserId, currentUserName, false);
    } catch {
      setSendError("Your message wasn't sent. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeChatId) return;
    if (!file.type.startsWith('image/')) {
      setSendError('Only photos can be shared here.');
      return;
    }
    setSending(true);
    setSendError('');
    try {
      const blob = await compressImage(file);
      const url = await firebaseService.uploadChatMedia(activeChatId, blob, 'photo');
      setSending(false);
      if (!url) throw new Error('upload failed');
      await send(text, url);
    } catch {
      setSending(false);
      setSendError("The photo wasn't sent. Please try again.");
    }
  };

  const react = async (messageId: string, emoji: string) => {
    if (!activeChatId) return;
    setActionsFor(null);
    setMessages(current => current.map(m => {
      if (m.id !== messageId) return m;
      const reactions = { ...(m.reactions || {}) };
      const list: string[] = reactions[emoji] || [];
      reactions[emoji] = list.includes(currentUserId) ? list.filter(u => u !== currentUserId) : [...list, currentUserId];
      if (!reactions[emoji].length) delete reactions[emoji];
      return { ...m, reactions };
    }));
    await firebaseService.toggleMessageReaction(activeChatId, messageId, emoji, currentUserId);
  };

  const removeOwn = async (messageId: string) => {
    if (!activeChatId) return;
    setActionsFor(null);
    setMessages(current => current.filter(m => m.id !== messageId));
    await firebaseService.deleteChatMessage(activeChatId, messageId);
    setNotice('Message deleted.');
  };

  const report = (messageId: string) => {
    const next = [...reportedIds, messageId];
    setReportedIds(next);
    writeList('warrior_flagged_messages', next);
    setActionsFor(null);
    setNotice('Reported and hidden from your view.');
  };

  const hideSender = (senderId: string, name: string) => {
    const next = [...hiddenSenders, senderId];
    setHiddenSenders(next);
    writeList('warrior_hidden_senders', next);
    setActionsFor(null);
    setNotice(`Messages from ${name} are hidden.`);
  };

  const toggleGuardian = () => {
    const next = !guardianMode;
    setGuardianMode(next);
    try { localStorage.setItem('warrior_guardian_safe_mode', String(next)); } catch { /* Preference only. */ }
  };

  const resetHidden = () => {
    setHiddenSenders([]);
    setReportedIds([]);
    writeList('warrior_hidden_senders', []);
    writeList('warrior_flagged_messages', []);
    setNotice('Hidden people and messages are visible again.');
  };

  const channelList = (
    <section aria-labelledby="channels-heading" className="space-y-3">
      <div className="flex items-start gap-2.5 rounded-[18px] border border-wa-line bg-wa-ground/70 p-3.5 text-[13px] text-wa-plum dark:bg-white/5">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
        <p>
          Peer support from other warriors, not medical advice. Messages are visible to everyone signed in.
          In an emergency, call <a href="tel:112" className="font-bold underline">112</a>.
        </p>
      </div>

      <h2 id="channels-heading" className="px-1 text-xs font-bold uppercase tracking-wider text-wa-plum-muted">Chat rooms</h2>
      <ul className="space-y-2.5">
        {channels.map(channel => (
          <li key={channel.id}>
            <button
              type="button"
              onClick={() => openChannel(channel.id)}
              aria-label={`Open ${channel.name}`}
              className="flex w-full items-center gap-3 rounded-[22px] border border-wa-line bg-wa-surface p-3.5 text-left transition-colors hover:border-wa-crimson/40 hover:bg-wa-rose/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
            >
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wa-rose text-sm font-bold text-wa-crimson">
                {channel.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[15px] font-bold text-wa-plum">{channel.name}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-wa-plum-muted">
                  {channel.custom ? 'Your group, saved on this phone. ' : ''}{channel.desc}
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-wa-plum-muted" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2 px-1 pt-1">
        <button
          type="button"
          role="switch"
          aria-checked={guardianMode}
          onClick={toggleGuardian}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-wa-line bg-wa-surface px-4 text-[13px] font-bold text-wa-plum transition-colors hover:bg-wa-ground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
        >
          <span className={`relative block h-5 w-9 rounded-full transition-colors ${guardianMode ? 'bg-wa-crimson' : 'bg-wa-line'}`}>
            <span className={`absolute top-0.5 block h-4 w-4 rounded-full bg-white transition-transform ${guardianMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </span>
          Guardian mode
        </button>
        <span className="text-xs text-wa-plum-muted">Hides posts that suggest stopping treatment or promise cures.</span>
        {(hiddenSenders.length > 0 || reportedIds.length > 0) && (
          <button type="button" onClick={resetHidden} className="inline-flex min-h-11 items-center text-[13px] font-bold text-wa-crimson underline-offset-2 hover:underline">
            Show hidden ({hiddenSenders.length + reportedIds.length})
          </button>
        )}
      </div>
    </section>
  );

  const renderMessage = (m: any) => {
    const mine = Boolean(currentUserId) && m.senderId === currentUserId;
    const name = String(m.senderName || 'Warrior');
    const reactions = Object.entries((m.reactions || {}) as Record<string, string[]>).filter(([, users]) => Array.isArray(users) && users.length > 0);
    const flagged = hasUnverifiedClaim(m.text);
    const open = actionsFor === m.id;

    return (
      <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex max-w-[85%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
          {!mine && <span className="mb-1 px-1 text-xs font-bold text-wa-plum-muted">{name}</span>}
          <div className={`rounded-[20px] px-3.5 py-2.5 ${mine ? 'rounded-br-md bg-wa-rose text-wa-plum' : 'rounded-bl-md border border-wa-line bg-wa-surface text-wa-plum'}`}>
            {m.replyTo?.text && (
              <div className="mb-1.5 border-l-2 border-wa-crimson/50 pl-2 text-xs text-wa-plum-muted">
                <span className="font-bold">{m.replyTo.senderName}</span>
                <span className="block line-clamp-2">{m.replyTo.text}</span>
              </div>
            )}
            {m.mediaUrl && m.mediaType === 'image' && (
              <button type="button" onClick={() => setLightbox(m.mediaUrl)} className="mb-1.5 block overflow-hidden rounded-xl" aria-label="Open photo">
                <img src={m.mediaUrl} alt="Shared photo" className="max-h-64 w-full object-cover" loading="lazy" />
              </button>
            )}
            {m.text && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{m.text}</p>}
            {flagged && (
              <p className="mt-1.5 rounded-lg bg-wa-sun-soft px-2 py-1 text-xs text-wa-plum">
                Check with your care team before changing any treatment.
              </p>
            )}
          </div>

          <div className={`mt-1 flex items-center gap-1 ${mine ? 'flex-row-reverse' : ''}`}>
            <span className="px-1 text-xs text-wa-plum-muted">{formatTime(m.timestamp)}</span>
            {reactions.map(([emoji, users]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => void react(m.id, emoji)}
                aria-label={`${emoji} ${users.length}`}
                className={`inline-flex h-7 items-center gap-0.5 rounded-full border px-2 text-xs ${users.includes(currentUserId) ? 'border-wa-crimson/40 bg-wa-rose' : 'border-wa-line bg-wa-surface'}`}
              >
                {emoji} <span className="font-semibold text-wa-plum">{users.length}</span>
              </button>
            ))}
            <button
              type="button"
              aria-label={`Message options for ${mine ? 'your message' : name}`}
              aria-expanded={open}
              onClick={() => setActionsFor(open ? null : m.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-wa-plum-muted hover:bg-wa-ground hover:text-wa-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
            >
              <MoreHorizontal size={16} aria-hidden="true" />
            </button>
          </div>

          {open && (
            <div className="mt-1 w-64 max-w-full space-y-1 rounded-2xl border border-wa-line bg-wa-surface p-2 shadow-md">
              <div className="flex justify-between gap-1 border-b border-wa-line-soft pb-1.5" role="group" aria-label="React">
                {REACTIONS.map(emoji => (
                  <button key={emoji} type="button" onClick={() => void react(m.id, emoji)} aria-label={`React ${emoji}`} className="flex h-10 w-10 items-center justify-center rounded-full text-lg hover:bg-wa-ground">
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo({ id: m.id, senderName: name, text: String(m.text || 'Photo').slice(0, 140) });
                  setActionsFor(null);
                  inputRef.current?.focus();
                }}
                className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-[13px] font-semibold text-wa-plum hover:bg-wa-ground"
              >
                <CornerUpLeft size={16} aria-hidden="true" /> Reply
              </button>
              {mine ? (
                <button type="button" onClick={() => void removeOwn(m.id)} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-[13px] font-semibold text-wa-crimson hover:bg-wa-rose/40">
                  <Trash2 size={16} aria-hidden="true" /> Delete message
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => report(m.id)} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-[13px] font-semibold text-wa-plum hover:bg-wa-ground">
                    <Flag size={16} aria-hidden="true" /> Report and hide
                  </button>
                  <button type="button" onClick={() => hideSender(m.senderId, name)} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-[13px] font-semibold text-wa-plum hover:bg-wa-ground">
                    <X size={16} aria-hidden="true" /> Hide messages from {name}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </li>
    );
  };

  const chatView = activeChannel && (
    <section aria-label={activeChannel.name} className="flex h-[calc(100dvh-21.5rem)] min-h-[20rem] flex-col overflow-hidden rounded-[24px] border border-wa-line bg-wa-surface md:h-[calc(100dvh-16rem)]">
      <header className="flex items-center gap-2 border-b border-wa-line-soft px-2 py-2">
        <button type="button" onClick={closeChannel} aria-label="Back to channels" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-wa-plum hover:bg-wa-ground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wa-rose text-xs font-bold text-wa-crimson">{activeChannel.initials}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-[15px] font-bold text-wa-plum">{activeChannel.name}</h2>
          <p className="truncate text-xs text-wa-plum-muted">
            {typingUsers.length > 0 ? `${typingUsers.slice(0, 2).join(', ')} typing…` : 'Peer support · not medical advice'}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-wa-ground/40 px-3 py-3" role="log" aria-live="polite" aria-label={`${activeChannel.name} messages`}>
        {loadingMessages ? (
          <p role="status" className="flex items-center gap-2 px-1 text-[13px] text-wa-plum-muted">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading messages…
          </p>
        ) : visibleMessages.length === 0 ? (
          <div className="mx-auto max-w-sm py-6 text-center">
            <span aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-wa-rose text-wa-crimson">
              <MessageSquare size={20} />
            </span>
            <h3 className="mt-2.5 font-display text-base font-bold text-wa-plum">No messages yet</h3>
            <p className="mt-1 text-[13px] text-wa-plum-muted">Start the conversation. Tap a message to send it, or write your own.</p>
            <div className="mt-3 space-y-2">
              {QUICK_STARTERS.map(starter => (
                <button
                  key={starter}
                  type="button"
                  disabled={sending || !currentUserId}
                  onClick={() => void send(starter)}
                  className="flex min-h-11 w-full items-center rounded-2xl border border-wa-line bg-wa-surface px-4 py-2 text-left text-[13px] font-semibold text-wa-plum transition-colors hover:border-wa-crimson/40 hover:bg-wa-rose/30 disabled:opacity-50"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-3">{visibleMessages.map(renderMessage)}</ul>
        )}
        <div ref={listEndRef} />
      </div>

      {(notice || sendError) && (
        <p role={sendError ? 'alert' : 'status'} className={`border-t border-wa-line-soft px-4 py-2 text-[13px] font-semibold ${sendError ? 'text-status-danger-text' : 'text-wa-plum-muted'}`}>
          {sendError || notice}
        </p>
      )}

      {currentUserId ? (
        <form
          onSubmit={(event) => { event.preventDefault(); void send(text); }}
          className="border-t border-wa-line-soft bg-wa-surface px-2.5 pb-2 pt-2"
        >
          {replyingTo && (
            <div className="mb-2 flex items-start gap-2 rounded-xl bg-wa-ground px-3 py-2 text-xs text-wa-plum">
              <CornerUpLeft size={14} className="mt-0.5 shrink-0 text-wa-crimson" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="font-bold">Replying to {replyingTo.senderName}</span>
                <span className="block truncate text-wa-plum-muted">{replyingTo.text}</span>
              </span>
              <button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply" className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-wa-surface">
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-1.5 rounded-2xl border border-wa-line bg-wa-ground p-1.5 focus-within:border-wa-crimson focus-within:ring-2 focus-within:ring-wa-crimson/20">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handlePhoto(e)} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={sending} aria-label="Share a photo" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-wa-plum hover:bg-wa-surface disabled:opacity-50">
              <ImagePlus size={20} aria-hidden="true" />
            </button>
            <label htmlFor="channel-composer" className="sr-only">Message {activeChannel.name}</label>
            <textarea
              id="channel-composer"
              ref={inputRef}
              rows={1}
              value={text}
              disabled={sending}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(text);
                }
              }}
              placeholder="Write a message"
              className="max-h-32 min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-base text-wa-plum placeholder:text-wa-plum-muted/70 focus:outline-none"
            />
            <button type="submit" disabled={sending || !text.trim()} aria-label="Send message" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wa-crimson text-white transition-colors hover:bg-wa-crimson-press disabled:opacity-40">
              {sending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            </button>
          </div>
        </form>
      ) : (
        <p className="border-t border-wa-line-soft px-4 py-3 text-[13px] text-wa-plum-muted">Sign in to post in community channels.</p>
      )}
    </section>
  );

  return (
    <div className="space-y-3" data-semantic>
      {activeChannel ? chatView : channelList}

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label="Photo" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <button type="button" aria-label="Close photo" className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white">
            <X size={20} aria-hidden="true" />
          </button>
          <img src={lightbox} alt="Shared photo, enlarged" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
};

export default ChatSystem;
