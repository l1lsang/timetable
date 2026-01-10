import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { db } from "../firebase";
import { hashPassword } from "../utils/hash";

export default function CreateRoom() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔒 중복 실행 완전 차단용
  const lockedRef = useRef(false);

  const createRoomId = () =>
    Math.random().toString(36).slice(2, 8).toUpperCase();

  const handleCreateRoom = async () => {
    // 🔥 중복 실행 방지
    if (loading || lockedRef.current) return;

    if (!title.trim() || !nickname.trim()) {
      alert("방 이름이랑 닉네임은 꼭 필요해요 🙂");
      return;
    }

    lockedRef.current = true;
    setLoading(true);

    try {
      const roomId = createRoomId();
      const userId = uuidv4();
      const passwordHash = password ? hashPassword(password) : null;

      const batch = writeBatch(db);

      // 📁 rooms/{roomId}
      batch.set(doc(db, "rooms", roomId), {
        title: title.trim(),
        passwordHash,
        createdAt: serverTimestamp(),
      });

      // 📁 rooms/{roomId}/members/{userId}
      batch.set(
        doc(db, "rooms", roomId, "members", userId),
        {
          nickname: nickname.trim(),
          joinedAt: serverTimestamp(),
        }
      );

      // 🔥 write 1번으로 처리
      await batch.commit();

      // 🔑 로컬 저장
      localStorage.setItem("roomId", roomId);
      localStorage.setItem("userId", userId);
      localStorage.setItem("nickname", nickname.trim());

      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("❌ 방 생성 오류:", error);

      // 🔔 quota 에러 UX
      if (error?.code === "resource-exhausted") {
        alert(
          "요청이 잠시 많아요 🥲\n잠깐만 기다렸다가 다시 시도해주세요!"
        );
      } else {
        alert("앗… 방을 만드는 데 실패했어요 🥲");
      }

      lockedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateRoom();
    }
  };

  return (
    <div className="page">
      <div className="center-wrap">
        <div className="card">
          <h2 className="title">➕ 새 약속 만들기</h2>
          <p className="desc">
            친구들이랑 가능한 시간을 <br />
            천천히 골라보세요 🙂
          </p>

          <input
            className="input"
            placeholder="방 이름 (예: 스터디, 회식)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="방 이름"
          />

          <input
            className="input"
            placeholder="내 닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="닉네임"
          />

          <input
            className="input"
            type="password"
            placeholder="비밀번호 (선택)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="비밀번호"
          />

          <button
            className="btn-primary"
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading ? "방 만드는 중이에요…" : "방 만들기"}
          </button>
        </div>
      </div>
    </div>
  );
}
