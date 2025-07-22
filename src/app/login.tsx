// Path: deep-research-main/src/app/login.tsx
import { useState } from "react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        // 在这里添加验证逻辑
        console.log("登录信息：", username, password);
        // 登录成功后，跳转到深度研究页面
    };

    return (
        <div>
            <h1>登录</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>用户名：</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div>
                    <label>密码：</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button type="submit">登录</button>
            </form>
        </div>
    );
}
