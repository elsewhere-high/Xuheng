import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: '序衡｜制造供应链决策智能体',
  description:
    '看清异常影响，权衡恢复方案，让制造决策有据可依。序衡将异常研判、约束求解、人工审批和执行反馈汇集到一个本地工作台。',
  icons: { icon: '/favicon.svg', apple: '/logo.svg' },
  openGraph: {
    title: '序衡 Xuheng｜制造供应链决策智能体',
    description: '看清异常影响，权衡恢复方案，让制造决策有据可依。',
    images: [
      {
        url: '/social-preview.svg',
        width: 1200,
        height: 630,
        alt: '序衡 Xuheng 制造供应链决策智能体',
      },
    ],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
