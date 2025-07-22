// src/app/newpage/page.tsx
import Link from 'next/link';
export default function NewPage() {
    return (
        <div>
            <h1>这是一个新界面</h1>
            <p>欢迎来到新界面！</p>
            <Link href="http://localhost:3000/">
                <button>跳转到首页</button>
            </Link>
        </div>

    );
}
