'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Mic, MicOff, Minus, Plus, Trash2,
  ShoppingBag, ChevronRight, MapPin, Clock
} from 'lucide-react';
import { usePlateStore, useAuthStore, useLocationStore } from '@/lib/store';
import { ChatMessage, DELIVERY_CHARGE, ORDER_STATUS_LABELS } from '@/types';
import { formatDate } from '@/lib/utils';
import { MENU_ITEMS } from '@/lib/menu-data';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChatView = 'chat' | 'plate' | 'confirm' | 'success';

export function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const router = useRouter();
  const { items, addItem, removeItem, updateQuantity, getSubtotal, getFinalAmount, clearPlate } = usePlateStore();
  const { session } = useAuthStore();
  const { location } = useLocationStore();

  const [view, setView] = useState<ChatView>('plate');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hello ${session?.user.name?.split(' ')[0] ?? 'there'}! 👋 I'm your Vakulaa ordering assistant. You can chat with me to add items, ask questions, or place your order. What would you like today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Stop voice on close / unmount
  useEffect(() => {
    if (!isOpen) stopVoice();
    return () => stopVoice();
  }, [isOpen]);

  // ── Voice Recognition ────────────────────────────────────────────
  function startVoice() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice ordering not supported in this browser. Try Chrome!');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => { setIsVoiceActive(true); setVoiceTranscript(''); };

        recognition.onresult = (e: SpeechRecognitionEvent) => {
          const transcript = Array.from(e.results)
            .map(r => r[0].transcript)
            .join(' ');
          setVoiceTranscript(transcript);
          if (e.results[e.results.length - 1].isFinal) {
            setInput(transcript);
            stopVoice();
          }
        };

        recognition.onerror = () => { stopVoice(); };
        recognition.onend = () => { setIsVoiceActive(false); };

        recognitionRef.current = recognition;
        recognition.start();
      })
      .catch(() => {
        toast.error('Microphone access denied');
      });
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsVoiceActive(false);
    setVoiceTranscript('');
  }

  // ── Send chat message ────────────────────────────────────────────
  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          currentPlate: items,
          conversationHistory: messages.slice(-6), // Last 6 messages for context
        }),
      });
      const data = await res.json();

      // Apply any item actions returned by AI
      if (data.actions) {
        for (const action of data.actions) {
          const menuItem = MENU_ITEMS.find(
            m => m.id === action.itemId || m.name.toLowerCase() === action.itemName?.toLowerCase()
          );
          if (!menuItem) continue;

          if (action.type === 'add') {
            for (let i = 0; i < (action.quantity ?? 1); i++) addItem(menuItem);
          } else if (action.type === 'remove') {
            removeItem(menuItem.id);
          } else if (action.type === 'set_quantity') {
            updateQuantity(menuItem.id, action.quantity ?? 1);
          }
        }
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "I've updated your order!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  }

  // ── Place Order ──────────────────────────────────────────────────
  async function handlePlaceOrder() {
    if (!session) { toast.error('Please login first'); return; }
    if (items.length === 0) { toast.error('Your plate is empty!'); return; }

    const deliveryAddress = location?.address ||
      sessionStorage.getItem('deliveryLocation')
        ? JSON.parse(sessionStorage.getItem('deliveryLocation') || '{}').address
        : null;

    if (!deliveryAddress) {
      toast.error('Please set your delivery address first');
      router.push('/menu?setAddress=1');
      onClose();
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          userName: session.user.name,
          userPhone: session.user.phone,
          items,
          totalAmount: getSubtotal(),
          deliveryCharge: DELIVERY_CHARGE,
          finalAmount: getFinalAmount(),
          deliveryAddress,
          deliveryLat: location?.lat,
          deliveryLng: location?.lng,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      clearPlate();
      setPlacedOrderId(data.orderId);
      setView('success');
      toast.success('Order placed successfully! 🎉');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  }

  const subtotal = getSubtotal();
  const finalAmount = getFinalAmount();
  const locationData = location ||
    (() => {
      try { return JSON.parse(sessionStorage.getItem('deliveryLocation') || 'null'); }
      catch { return null; }
    })();

  // ────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Chatbot window */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 flex flex-col chatbot-window"
          >
            {/* Header */}
            <div className="bg-brand-forest text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-gold rounded-full flex items-center justify-center text-brand-forest font-bold text-lg">
                  V
                </div>
                <div>
                  <p className="font-semibold text-sm">Vakulaa Assistant</p>
                  <p className="text-xs text-green-300">● Online</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-gray-100 flex-shrink-0">
              {[
                { id: 'chat', label: '💬 Chat' },
                { id: 'plate', label: `🛍 Plate${items.length > 0 ? ` (${items.reduce((s, i) => s + i.quantity, 0)})` : ''}` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id as ChatView)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    view === tab.id
                      ? 'text-brand-forest border-b-2 border-brand-forest'
                      : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {/* ── Chat View ───────────────────────────────────── */}
                {view === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col flex-1 overflow-hidden"
                  >
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.role === 'assistant' && (
                            <div className="w-7 h-7 bg-brand-gold rounded-full flex items-center justify-center text-brand-forest text-xs font-bold flex-shrink-0 mt-1 mr-2">
                              V
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed ${
                              msg.role === 'user'
                                ? 'message-bubble-user text-white'
                                : 'message-bubble-ai text-gray-800'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}

                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="w-7 h-7 bg-brand-gold rounded-full flex items-center justify-center text-brand-forest text-xs font-bold flex-shrink-0 mt-1 mr-2">V</div>
                          <div className="message-bubble-ai px-4 py-3 flex gap-1">
                            {[0, 1, 2].map(i => (
                              <div
                                key={i}
                                className="w-2 h-2 bg-brand-forest/40 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Voice transcript */}
                      {isVoiceActive && (
                        <div className="flex justify-center">
                          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-600 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            {voiceTranscript || 'Listening…'}
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* Quick actions */}
                    <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                      {['Show my plate 🛍', 'Add plain dosa', 'Remove last item', 'Place order'].map(action => (
                        <button
                          key={action}
                          onClick={() => { setInput(action); setTimeout(() => handleSend(), 50); }}
                          className="text-xs bg-brand-mist text-brand-forest px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-brand-leaf/20 transition-colors flex-shrink-0"
                        >
                          {action}
                        </button>
                      ))}
                    </div>

                    {/* Input bar */}
                    <div className="px-3 pb-3 flex gap-2 flex-shrink-0 border-t border-gray-100 pt-2">
                      <button
                        onClick={isVoiceActive ? stopVoice : startVoice}
                        className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${
                          isVoiceActive
                            ? 'bg-red-500 text-white voice-pulse'
                            : 'bg-brand-mist text-brand-forest hover:bg-brand-mist/80'
                        }`}
                      >
                        {isVoiceActive ? <MicOff size={18} /> : <Mic size={18} />}
                      </button>
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Type or speak your order…"
                        className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none border border-gray-100 focus:border-brand-forest/30 focus:bg-white transition-all"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="p-2.5 bg-brand-forest text-white rounded-xl hover:bg-brand-leaf transition-colors disabled:opacity-40 flex-shrink-0"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Plate View ──────────────────────────────────── */}
                {view === 'plate' && !['confirm', 'success'].includes(view) && (
                  <motion.div
                    key="plate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 overflow-y-auto px-4 py-3 flex flex-col"
                  >
                    {items.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <div className="text-6xl mb-4">🍽️</div>
                        <h3 className="font-display text-xl text-brand-forest mb-2">Your Plate is Empty</h3>
                        <p className="text-sm text-gray-400 mb-6">
                          Browse the menu and add your favourite tiffins
                        </p>
                        <button
                          onClick={onClose}
                          className="bg-brand-forest text-white rounded-xl px-6 py-2.5 text-sm font-semibold"
                        >
                          Browse Menu →
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Items list */}
                        <div className="space-y-3 mb-4">
                          {items.map(plateItem => (
                            <motion.div
                              key={plateItem.menuItem.id}
                              layout
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="flex items-center gap-3 bg-brand-mist/50 rounded-xl p-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-brand-charcoal truncate">
                                  {plateItem.menuItem.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ₹{plateItem.menuItem.price} each
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    if (plateItem.quantity === 1) removeItem(plateItem.menuItem.id);
                                    else updateQuantity(plateItem.menuItem.id, plateItem.quantity - 1);
                                  }}
                                  className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm font-bold w-5 text-center">{plateItem.quantity}</span>
                                <button
                                  onClick={() => addItem(plateItem.menuItem)}
                                  className="w-7 h-7 rounded-lg bg-brand-forest flex items-center justify-center"
                                >
                                  <Plus size={12} className="text-white" />
                                </button>
                              </div>
                              <span className="text-sm font-bold text-brand-forest w-14 text-right">
                                ₹{plateItem.menuItem.price * plateItem.quantity}
                              </span>
                            </motion.div>
                          ))}
                        </div>

                        {/* Bill summary */}
                        <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>₹{subtotal}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Delivery charge</span>
                            <span>₹{DELIVERY_CHARGE}</span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-brand-forest">
                            <span>Total Payable</span>
                            <span>₹{finalAmount}</span>
                          </div>
                          <p className="text-xs text-gray-400 text-center">Cash on Delivery (COD)</p>
                        </div>

                        {/* Delivery address */}
                        {locationData && (
                          <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3 mb-4 text-xs text-blue-700">
                            <MapPin size={14} className="mt-0.5 flex-shrink-0 text-blue-500" />
                            <p className="line-clamp-2">{locationData.address}</p>
                          </div>
                        )}

                        {/* Place order button */}
                        <button
                          onClick={() => setView('confirm')}
                          className="w-full bg-brand-forest text-white rounded-xl py-3.5 font-semibold text-sm btn-plate flex items-center justify-center gap-2"
                        >
                          Proceed to Place Order
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {/* ── Confirm View ─────────────────────────────────── */}
                {view === 'confirm' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 overflow-y-auto px-4 py-4 flex flex-col"
                  >
                    <button
                      onClick={() => setView('plate')}
                      className="text-brand-leaf text-sm font-medium mb-4 flex items-center gap-1"
                    >← Back</button>

                    <h3 className="font-display text-xl text-brand-forest mb-4">Confirm Order</h3>

                    <div className="space-y-2 mb-4">
                      {items.map(i => (
                        <div key={i.menuItem.id} className="flex justify-between text-sm py-1 border-b border-gray-100">
                          <span className="text-gray-700">{i.menuItem.name} × {i.quantity}</span>
                          <span className="font-medium">₹{i.menuItem.price * i.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-brand-mist rounded-xl p-3 mb-4 space-y-1.5 text-sm">
                      <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                      <div className="flex justify-between"><span>Delivery</span><span>₹{DELIVERY_CHARGE}</span></div>
                      <div className="flex justify-between font-bold text-brand-forest text-base pt-1 border-t border-brand-leaf/20">
                        <span>Total</span><span>₹{finalAmount}</span>
                      </div>
                    </div>

                    {locationData && (
                      <div className="flex items-start gap-2 text-sm mb-4 bg-gray-50 rounded-xl p-3">
                        <MapPin size={16} className="text-brand-forest flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-700 mb-0.5">Delivery to:</p>
                          <p className="text-gray-500 text-xs">{locationData.address}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3 mb-4 text-xs text-amber-700">
                      <span>💵</span>
                      <p>Payment: <strong>Cash on Delivery</strong> — pay when your order arrives.</p>
                    </div>

                    <button
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder}
                      className="w-full bg-brand-forest text-white rounded-xl py-3.5 font-semibold text-sm btn-plate flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isPlacingOrder ? <div className="spinner" /> : '🎉'}
                      {isPlacingOrder ? 'Placing Order…' : 'Confirm & Place Order'}
                    </button>
                  </motion.div>
                )}

                {/* ── Success View ─────────────────────────────────── */}
                {view === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center px-4 text-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-6xl mb-4"
                    >🎉</motion.div>
                    <h3 className="font-display text-2xl text-brand-forest mb-2">Order Placed!</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      We've received your order. The kitchen team will start preparing it shortly!
                    </p>
                    <div className="flex items-center gap-2 text-sm text-brand-forest mb-8">
                      <Clock size={16} />
                      <span>Estimated delivery: 20–35 minutes</span>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        if (placedOrderId) router.push(`/track/${placedOrderId}`);
                        else router.push('/orders');
                      }}
                      className="w-full bg-brand-forest text-white rounded-xl py-3 text-sm font-semibold mb-3"
                    >
                      Track My Order →
                    </button>
                    <button
                      onClick={() => { onClose(); setView('plate'); }}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      Back to Menu
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
