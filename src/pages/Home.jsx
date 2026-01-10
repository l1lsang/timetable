import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">⏰ 언제모임</h1>
        <p className="auth-desc">
          방을 만들거나, 이미 있는 방에 참여하세요
        </p>

        <button
          className="auth-btn auth-btn-primary"
          onClick={() => navigate("/create")}
        >
          ➕ 새 약속 만들기
        </button>

        <button
          className="auth-btn auth-btn-outline"
          onClick={() => navigate("/join")}
        >
          🔑 방 참여하기
        </button>
      </div>
    </div>
  );
}
