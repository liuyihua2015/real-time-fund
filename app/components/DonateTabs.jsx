import React, { useState } from "react";
import zhifubaoImg from "../assets/zhifubao.png";
import weixinImg from "../assets/weixin.png";

export default function DonateTabs() {
  const [method, setMethod] = useState("alipay"); // alipay, wechat

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        className="tabs glass"
        style={{ padding: 4, borderRadius: 12, width: "100%", display: "flex" }}
      >
        <button
          onClick={() => setMethod("alipay")}
          style={{
            flex: 1,
            padding: "8px 0",
            border: "none",
            background:
              method === "alipay" ? "rgba(34, 211, 238, 0.15)" : "transparent",
            color: method === "alipay" ? "var(--primary)" : "var(--muted)",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            transition: "all 0.2s ease",
          }}
        >
          支付宝
        </button>
        <button
          onClick={() => setMethod("wechat")}
          style={{
            flex: 1,
            padding: "8px 0",
            border: "none",
            background:
              method === "wechat" ? "rgba(34, 211, 238, 0.15)" : "transparent",
            color: method === "wechat" ? "var(--primary)" : "var(--muted)",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            transition: "all 0.2s ease",
          }}
        >
          微信支付
        </button>
      </div>

      <div
        style={{
          width: 200,
          height: 200,
          background: "white",
          borderRadius: 12,
          padding: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {method === "alipay" ? (
          <img
            src={zhifubaoImg.src}
            alt="支付宝收款码"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <img
            src={weixinImg.src}
            alt="微信收款码"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}
      </div>
    </div>
  );
}
