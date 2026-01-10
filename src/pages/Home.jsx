import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={wrapper}>
      <h1 style={{ marginBottom: 12 }}>⏰ 되는 시간 알려줘!!</h1>
      <p style={{ marginBottom: 32, color: "#64748b" }}>
        방을 만들거나, 이미 있는 방에 참여하세요
      </p>

      <button
        style={{ ...button, background: "#6366f1" }}
        onClick={() => navigate("/create")}
      >
        <h2
  className="title"
  style={{ color: "#f5f5f5", fontSize: "20px" }}
>
  ➕ 새 약속 만들기
</h2>

      </button>

      <button
        style={{
          ...button,
          background: "#ffffff",
          color: "#6366f1",
          border: "2px solid #6366f1",
        }}
        onClick={() => navigate("/join")}
      >
        🔑 방 참여하기
      </button>
    </div>
  );
}

const wrapper = {
  maxWidth: 420,
  margin: "120px auto",
  padding: 32,
  textAlign: "center",
  borderRadius: 16,
  background: "#efdcf4",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const button = {
  width: "100%",
  padding: "14px",
  borderRadius: 10,
  border: "none",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: 12,
};
