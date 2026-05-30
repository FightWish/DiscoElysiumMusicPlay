import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, RadioReceiver, X } from "lucide-react";
import { submitMessage, getMessages } from "./supabase";

interface Message {
  id: number;
  created_at: string;
  usercode: string;
  content: string;
}

export function PagerPanel({ isLight }: { isLight: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showFullBoard, setShowFullBoard] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewingHistoryIdx, setViewingHistoryIdx] = useState<number | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} ${d.getMonth() + 1}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear().toString().slice(-2)}`,
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      getMessages()
        .then((data) => {
          setMessages(data as Message[]);
        })
        .catch(console.error);
    }
  }, [isOpen, messages.length]);

  const isViewingHistory = viewingHistoryIdx !== null;
  let currentScreenContent = content;
  let historyInfo = "";
  if (isViewingHistory && messages[viewingHistoryIdx]) {
    const msg = messages[viewingHistoryIdx];
    const d = new Date(msg.created_at);
    const ts = `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    historyInfo = `[#${msg.id}] ${ts}`;
    currentScreenContent = msg.content;
  }

  const handleScrollUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (textareaRef.current) textareaRef.current.scrollTop -= 20;
  };

  const handleScrollDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (textareaRef.current) textareaRef.current.scrollTop += 20;
  };

  const handleSend = async () => {
    if (!content.trim() || isViewingHistory) return;
    setIsSending(true);
    try {
      await submitMessage(content);
      setContent("");
      setIsOpen(false);
    } catch (e: any) {
      console.error(e);
      alert(`发送失败 / Send failed: ${e.message || "Unknown error"}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Invisible Overlay for closing */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Pager Panel sliding out from the bottom edge */}
      <div
        className={`fixed bottom-0 left-4 md:left-[10%] lg:left-[33%] w-[348px] origin-bottom transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-50 flex flex-col ${isOpen ? `translate-y-[-24px] scale-100 ${isLight ? "drop-shadow-[0_-4px_16px_rgba(0,0,0,0.15)]" : "drop-shadow-[0_-4px_16px_rgba(0,0,0,0.4)]"}` : `translate-y-[calc(100%-36px)] scale-95 cursor-pointer ${isLight ? "drop-shadow-[0_-2px_6px_rgba(0,0,0,0.1)]" : "drop-shadow-[0_-2px_6px_rgba(0,0,0,0.3)]"}`}`}
        onClick={() => !isOpen && setIsOpen(true)}
      >
        {/* Pager Device */}
        <div
          className={`h-[255px] flex flex-col justify-between ${isLight ? "bg-[#d8d3c1] border-[#b5af9f] shadow-[inset_0_4px_12px_rgba(255,255,255,0.2),inset_0_-4px_12px_rgba(0,0,0,0.4)]" : "bg-[#181a1f] border-t-[#2d3036] border-l-[#2d3036] border-r-[#0c0d10] border-b-[#0c0d10] shadow-[inset_0_2px_8px_rgba(255,255,255,0.05),inset_0_-8px_20px_rgba(0,0,0,0.8),0_10px_20px_rgba(0,0,0,0.6)]"} border-[2px] sm:border-[4px] rounded-[32px] sm:rounded-[40px] p-4 sm:p-5 pb-6 sm:pb-8 relative overflow-hidden`}
        >
          {/* Top edge grip (visible when closed) */}
          <div
            className={`absolute top-0 left-0 w-full h-[40px] flex justify-center items-start pt-2 ${isOpen ? "cursor-pointer hover:bg-black/5 transition-colors z-20" : "pointer-events-none"}`}
            onClick={(e) => {
              if (isOpen) {
                e.stopPropagation();
                setIsOpen(false);
              }
            }}
            title={isOpen ? "CLOSE" : ""}
          >
            <div className="flex gap-2">
              <div
                className={`w-8 h-1 rounded-full ${isLight ? "bg-[#b5af9f]" : "bg-[#000]"} transition-opacity duration-300 ${isOpen ? "opacity-30" : "opacity-80"}`}
              ></div>
              <div
                className={`w-8 h-1 rounded-full ${isLight ? "bg-[#b5af9f]" : "bg-[#000]"} transition-opacity duration-300 ${isOpen ? "opacity-30" : "opacity-80"}`}
              ></div>
            </div>
          </div>

          {/* Main internal wrapper */}
          <div
            className={`flex flex-col flex-1 mt-1 ${!isOpen ? "pointer-events-none" : ""}`}
          >
            {/* Silver panel */}
            <div
              className={`relative ${isLight ? "bg-[#e8e4db] border-[#9c9484]" : "bg-[#2a2c31] border-[#111]"} rounded-xl rounded-br-[32px] p-2 pb-3 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.2)] border flex flex-col gap-2`}
            >
              <div className="flex gap-2">
                {/* LCD Screen container */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isViewingHistory) {
                      setViewingHistoryIdx(null);
                    }
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  onWheel={(e) => {
                    if (messages.length === 0) return;
                    e.stopPropagation();
                    if (e.deltaY > 0) {
                      let nextIdx = isViewingHistory
                        ? viewingHistoryIdx! + 1
                        : 0;
                      if (nextIdx >= messages.length) nextIdx = 0;
                      setViewingHistoryIdx(nextIdx);
                    } else if (e.deltaY < 0) {
                      let nextIdx = isViewingHistory
                        ? viewingHistoryIdx! - 1
                        : messages.length - 1;
                      if (nextIdx < 0) nextIdx = messages.length - 1;
                      setViewingHistoryIdx(nextIdx);
                    }
                  }}
                  className={`flex-1 ${isLight ? "bg-[#a3b293] border-[#556943] shadow-[inset_0_3px_6px_rgba(0,0,0,0.3)]" : "bg-[#7eb063] border-[#222] shadow-[inset_0_3px_8px_rgba(0,0,0,0.5)]"} border-[3px] rounded-[8px] h-[80px] p-2 flex flex-col relative overflow-hidden cursor-text`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.06)_50%,transparent_50%)] bg-[length:100%_4px] mix-blend-multiply pointer-events-none z-20"></div>

                  {/* Top Status line */}
                  <div
                    className={`flex justify-between items-center text-[10px] font-mono font-bold ${isLight ? "text-[#2a361e]" : "text-[#1b5011]"} mb-1 z-10 w-full tracking-tighter`}
                  >
                    {isViewingHistory ? (
                      <div className="text-[13px] font-black tracking-normal">
                        {historyInfo}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span>TX</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {/* Battery */}
                      <div
                        className={`w-4 h-[9px] border-[1.5px] ${isLight ? "text-[#2a361e] border-[#2a361e]" : "text-[#1b5011] border-[#1b5011]"} rounded-[2px] relative flex items-center p-[1px]`}
                      >
                        <div
                          className={`w-full h-full ${isLight ? "bg-[#2a361e]" : "bg-[#1b5011]"}`}
                        ></div>
                        <div
                          className={`absolute -right-[3px] w-[1.5px] h-[4px] ${isLight ? "bg-[#2a361e]" : "bg-[#1b5011]"}`}
                        ></div>
                      </div>
                      <span>{currentTime}</span>
                    </div>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={currentScreenContent}
                    onChange={(e) => {
                      if (!isViewingHistory) setContent(e.target.value);
                    }}
                    readOnly={isViewingHistory}
                    placeholder={isViewingHistory ? "" : "INPUT MESSAGE..."}
                    maxLength={120}
                    className={`w-full flex-1 bg-transparent ${isLight ? "text-[#1c2414] placeholder:text-[#455c32]" : "text-[#143d0d] placeholder:text-[#236618]"} font-mono text-[13px] font-black focus:outline-none resize-none relative z-10 leading-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${isViewingHistory ? "pointer-events-none" : ""}`}
                  />
                </div>

                {/* Up/Down buttons container */}
                <div
                  className={`w-[32px] flex flex-col justify-between py-1 px-[2px] ${isLight ? "bg-[#d8d3c1] border-[#b5af9f]" : "bg-[#1a1b1e] border-[#111]"} rounded-[16px] border shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]`}
                >
                  <button
                    onClick={handleScrollUp}
                    className="flex-1 flex justify-center items-center group active:translate-y-px"
                  >
                    <div
                      className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] ${isLight ? "border-b-[#666] group-active:border-b-[#333]" : "border-b-[#444] group-active:border-b-[#111]"} transition-colors`}
                    ></div>
                  </button>
                  <div
                    className={`w-2/3 h-px ${isLight ? "bg-[#b5af9f]" : "bg-[#333]"} mx-auto my-1`}
                  ></div>
                  <button
                    onClick={handleScrollDown}
                    className="flex-1 flex justify-center items-center group active:translate-y-px"
                  >
                    <div
                      className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${isLight ? "border-t-[#666] group-active:border-t-[#333]" : "border-t-[#444] group-active:border-t-[#111]"} transition-colors`}
                    ></div>
                  </button>
                </div>
              </div>

              {/* Bottom inner buttons */}
              <div
                className={`flex ${isLight ? "bg-[#d8d3c1] border-[#b5af9f] divide-[#b5af9f]" : "bg-[#1a1b1e] border-[#111] divide-[#111]"} w-[60%] h-7 rounded-[14px] border shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] divide-x`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (messages.length === 0) return;
                    let nextIdx = isViewingHistory
                      ? viewingHistoryIdx! - 1
                      : messages.length - 1;
                    if (nextIdx < 0) nextIdx = messages.length - 1;
                    setViewingHistoryIdx(nextIdx);
                  }}
                  className="flex-1 flex justify-center items-center group active:bg-black/5 active:shadow-inner rounded-l-[14px]"
                  title="Previous Message"
                >
                  <div
                    className={`w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] ${isLight ? "border-r-[#666] group-active:border-r-[#333]" : "border-r-[#444] group-active:border-r-[#111]"} transition-colors`}
                  ></div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (messages.length === 0) return;
                    let nextIdx = isViewingHistory ? viewingHistoryIdx! + 1 : 0;
                    if (nextIdx >= messages.length) nextIdx = 0;
                    setViewingHistoryIdx(nextIdx);
                  }}
                  className="flex-1 flex justify-center items-center group active:bg-black/5 active:shadow-inner"
                  title="Next Message"
                >
                  <div
                    className={`w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] ${isLight ? "border-l-[#666] group-active:border-l-[#333]" : "border-l-[#444] group-active:border-l-[#111]"} transition-colors`}
                  ></div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingHistoryIdx(null);
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  className="flex-1 flex justify-center items-center hover:bg-black/5 active:shadow-inner rounded-r-[14px] group"
                  title="Return to Input"
                >
                  <div className="w-[8px] h-[8px] rounded-full bg-[#8f2112] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] group-active:bg-[#ff3b22] group-active:shadow-[0_0_8px_#ff3b22] transition-all duration-200 group-active:duration-75"></div>
                </button>
              </div>
            </div>

            {/* Bottom Controls Area (Outside Silver Panel) */}
            <div className="flex justify-between items-center w-full px-2 mt-auto">
              {/* Logs / Left pill button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullBoard(true);
                }}
                className={`w-[110px] h-[20px] ${isLight ? "bg-[#9c9484] border-[#8a8375] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_1px_1px_rgba(255,255,255,0.5)] hover:bg-[#8f8879]" : "bg-[#111] border-[#000] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.1)] hover:bg-[#1a1a1a]"} rounded-full active:translate-y-px transition-all`}
                title="Logs"
              ></button>

              {/* Transmit / Right oval button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSend();
                }}
                disabled={isSending || !content.trim() || isViewingHistory}
                className={`w-[70px] h-[36px] ${isLight ? "bg-[#618029] border-[#445c1a]" : "bg-[#4b5e28] border-[#2c3816]"} rounded-[18px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_6px_rgba(0,0,0,0.4)] flex justify-center items-center active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] disabled:opacity-50 transition-all group`}
                title="TRANSMIT"
              >
                <div className="w-[30px] h-[6px] rounded-full bg-[#afcfa6] group-active:bg-[#9aba91] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFullBoard && <FullBoard onClose={() => setShowFullBoard(false)} />}
      </AnimatePresence>
    </>
  );
}

function FullBoard({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMessages();
        if (active && data) setMessages(data as Message[]);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#08090a] font-mono text-[#e3e0d7]"
    >
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50"></div>

      <div className="flex items-center justify-between p-4 border-b-2 border-[#1a1c22] bg-[#0c0d10] relative z-40">
        <div>
          <h2 className="text-xl font-bold tracking-widest text-[#b0351b]">
            AMATEUR RADIO LOGS
          </h2>
          <p className="text-[#666] text-xs">
            FREQUENCY 144.000 MHz - TX/RX RECORD
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#1a1c22] transition-colors rounded text-[#888] hover:text-[#b0351b]"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 relative z-40 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#08090a] [&::-webkit-scrollbar-thumb]:bg-[#1a1c22] hover:[&::-webkit-scrollbar-thumb]:bg-[#2a2c31] [scrollbar-width:thin] [scrollbar-color:#1a1c22_#08090a]">
        {loading ? (
          <div className="text-[#b0351b] font-bold animate-pulse text-sm tracking-widest">
            RECEIVING...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-[#666] font-bold text-sm tracking-widest">
            NO SIGNALS DETECTED.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="border-l-4 border-[#b0351b]/30 pl-4 py-2 font-mono"
            >
              <div className="text-[#b0351b] text-xs mb-1 tracking-widest flex items-center gap-2">
                <span>[#{msg.id}]</span>
                <span className="text-[#666]">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-[#e3e0d7] text-sm break-words whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-2 border-t-2 border-[#1a1c22] bg-[#0c0d10] text-[#666] text-[10px] text-center tracking-widest relative z-40">
        END OF LOG - PLEASE RETURN TO RECEIVER TO TRANSMIT NEW SIGNAL
      </div>
    </motion.div>
  );
}
