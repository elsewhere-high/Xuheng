import Image from 'next/image';
import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="not-found">
      <Image width={64} height={64} src="/logo.svg" alt="序衡" />
      <h1>这条路径还没有安排。</h1>
      <p>页面不存在或地址已变更。回到序衡工作台，继续处理你的决策。</p>
      <Link className="button primary" href="/">
        返回决策工作台
      </Link>
    </main>
  );
}
