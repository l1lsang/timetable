import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { db } from "../firebase";
import { hashPassword } from "../utils/hash";

export default function JoinRoom() {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔒 중복 실행 방지
  const lockedRef = useRef(false);

  const handleJoin = async () => {
    if (loading || lockedRef.current) return;

    if (!roomId.trim() || !nickname.trim()) {
      alert("방 코드랑 닉네임은 꼭 입력해줘요 🙂");
      return;
    }

    lockedRef.current = true;
    setLoading(true);

    try {
      const upperRoomId = roomId.trim().toUpperCase();
      const roomRef = doc(db, "rooms", upperRoomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        alert("앗… 그런 방은 없는 것 같아요 🥲");
        lockedRef.current = false;
        setLoading(false);
        return;
      }

      const room = roomSnap.data();

      /* =========================
         🔐 비밀번호 검증
      ========================= */
      if (room.passwordHash) {
        const inputHash = hashPassword(password);
        if (inputHash !== room.passwordHash) {
          alert("비밀번호가 맞지 않아요 😢");
          lockedRef.current = false;
          setLoading(false);
          return;
        }
      }

      /* =========================
         👤 멤버 등록
      ========================= */
      const userId = uuidv4();
      const batch = writeBatch(db);

      batch.set(
        doc(db, "rooms", upperRoomId, "members", userId),
        {
          nickname: nickname.trim(),
          joinedAt: serverTimestamp(),
        }
      );

      await batch.commit();

      /* =========================
         🔑 로컬 저장
      ========================= */
      localStorage.setItem("roomId", upperRoomId);
      localStorage.setItem("userId", userId);
      localStorage.setItem("nickname", nickname.trim());

      navigate(`/room/${upperRoomId}`);
    } catch (error) {
      console.error("❌ 방 참여 오류:", error);

      if (error?.code === "resource-exhausted") {
        alert(
          "요청이 잠시 많아요 🥲\n조금만 기다렸다가 다시 시도해주세요!"
        );
      } else {
        alert("방에 들어가는 데 실패했어요 🥲");
      }

      lockedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleJoin();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">🔑 초대받은 방 들어가기</h2>
        <p className="auth-desc">
          친구한테 받은 방 코드로 바로 들어갈 수 있어요
        </p>

        <input
          className="auth-input"
          placeholder="방 코드 (예: AB3KQ9)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="방 코드"
        />

        <input
          className="auth-input"
          placeholder="내 닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="닉네임"
        />

        <input
          className="auth-input"
          type="password"
          placeholder="비밀번호 (있다면)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="비밀번호"
        />

        <button
          className="auth-btn auth-btn-primary"
          onClick={handleJoin}
          disabled={loading}
        >
          {loading ? "들어가는 중이에요…" : "방 들어가기"}
        </button>
      </div>
    </div>
  );
}
