import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MockMate · AI 智能面试教练",
  description: "面向应届生的 AI 模拟面试训练与复盘工具"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
