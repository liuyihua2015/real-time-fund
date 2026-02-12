"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const ANNOUNCEMENT_SEEN_KEY = "hasSeenAnnouncement_v7";

export default function Announcement() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(ANNOUNCEMENT_SEEN_KEY);
    setHasNew(!hasSeen);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isMounted) return;
    if (!isOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen, isMounted]);

  const handleOpen = () => {
    setIsOpen(true);
    if (hasNew) {
      localStorage.setItem(ANNOUNCEMENT_SEEN_KEY, "true");
      setHasNew(false);
    }
  };

  const overlay = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            padding: "20px",
            paddingTop: "calc(20px + env(safe-area-inset-top))",
            paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="公告"
            className="glass"
            style={{
              width: "100%",
              maxWidth: 420,
              maxHeight: "calc(100vh - 40px)",
              overflow: "auto",
              padding: "24px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div
                className="title"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontWeight: 700,
                  fontSize: "18px",
                  color: "var(--accent)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>公告</span>
              </div>
              <button
                className="icon-button"
                onClick={() => setIsOpen(false)}
                title="关闭"
                aria-label="关闭"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div
              style={{
                color: "var(--text)",
                lineHeight: "1.6",
                fontSize: "15px",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                首版上线 v1.0.0（02/12）
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <li>核心功能：实时基金估值与重仓数据展示，新增基金详情页。</li>
                <li>分组管理：支持分组整理基金，并提供分组汇总与持仓统计。</li>
                <li>
                  交易与持仓：交易记录与导入/导出、收益计算优化，新增“昨日收益”。
                </li>
                <li>添加与搜索：本地基金搜索更快，支持批量添加与交互优化。</li>
                <li>
                  OCR 录入：支持图片识别（OCR）提取基金信息，配合持仓操作弹窗。
                </li>
                <li>
                  主题与布局：支持深色/浅色主题切换，布局与视觉一致性优化。
                </li>
                <li>
                  部署：静态导出 + GitHub Pages，已配置自动化构建与部署流程。
                </li>
                <li>反馈与捐赠：集成 Web3Forms 反馈渠道与底部捐赠入口。</li>
                <li>
                  修复与优化：排序刷新、移动端输入缩放等问题修复，性能与细节完善。
                </li>
              </ul>
              <div
                style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}
              >
                详细使用说明与免责声明见
                README。若有建议/问题，欢迎继续反馈，我会持续迭代。
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "8px",
              }}
            >
              <button
                className="button"
                onClick={() => setIsOpen(false)}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                关闭
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        className="icon-button"
        onClick={handleOpen}
        title="公告"
        aria-label="公告"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={{ position: "relative" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        {hasNew && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--danger)",
              boxShadow: "0 0 0 2px #0b1220",
            }}
          />
        )}
      </button>

      {isMounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
