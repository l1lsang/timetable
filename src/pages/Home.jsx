import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="center-wrap">
        <div className="card home-card">
          <h1 className="home-title">⏰ 언제모임</h1>
          <p className="home-desc">
            방을 만들거나, 이미 있는 방에 참여하세요
          </p>

          <button
            className="btn-primary"
            onClick={() => navigate("/create")}
          >
            ➕ 새 약속 만들기
          </button>

          <button
            className="btn-outline"
            onClick={() => navigate("/join")}
          >
            🔑 방 참여하기
          </button>
        </div>
      </div>
    </div>
  );
}
