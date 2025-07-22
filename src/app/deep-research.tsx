// Path: deep-research-main/src/app/deep-research.tsx
import { useState } from "react";
import DeepResearch from "@/utils/deep-research";

export default function DeepResearchPage() {
    const [query, setQuery] = useState("");
    const [report, setReport] = useState("");

    const handleStartResearch = async () => {
        const deepResearch = new DeepResearch({
            AIProvider: {
                baseURL: "https://api.example.com",
                provider: "openai",
                thinkingModel: "text-davinci-003",
                taskModel: "text-davinci-003",
            },
            searchProvider: {
                baseURL: "https://api.example.com",
                provider: "google",
                maxResult: 5,
            },
        });

        try {
            const finalReport = await deepResearch.start(query);
            setReport(finalReport.finalReport);
        } catch (error) {
            console.error("深度研究失败：", error);
        }
    };

    return (
        <div>
            <h1>深度研究</h1>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入研究主题"
            />
            <button onClick={handleStartResearch}>开始研究</button>
            {report && <div>{report}</div>}
        </div>
    );
}
